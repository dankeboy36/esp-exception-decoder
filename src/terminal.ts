import path from 'node:path'

import debug from 'debug'
import { DecodeResult, decode, stringifyDecodeResult } from 'trbr'
import vscode from 'vscode'
import type {
  ArduinoContext,
  ChangeEvent,
  SketchFolder,
  SketchFoldersChangeEvent,
} from 'vscode-arduino-api'

import {
  DecodeParams,
  DecodeParamsError,
  createDecodeParams,
} from './decodeParams'
import type { ReplayStore } from './replay'
import { Debug } from './utils'

const terminalDebug: Debug = debug('espExceptionDecoder:terminal')

let _debugOutput: vscode.OutputChannel | undefined
function debugOutput(): vscode.OutputChannel {
  if (!_debugOutput) {
    _debugOutput = vscode.window.createOutputChannel(
      `${decodeTerminalTitle} (Log)`
    )
  }
  return _debugOutput
}
function createDebugOutput(): Debug {
  return (message) => debugOutput().appendLine(message)
}

export function activateDecoderTerminal(
  context: vscode.ExtensionContext,
  arduinoContext: ArduinoContext,
  replayStore?: ReplayStore
): void {
  context.subscriptions.push(
    new vscode.Disposable(() => _debugOutput?.dispose()),
    vscode.commands.registerCommand('espExceptionDecoder.showTerminal', () =>
      openTerminal(arduinoContext, {
        show: true,
        debug: createDebugOutput(),
        replayStore,
      })
    )
  )
}

function openTerminal(
  arduinoContext: ArduinoContext,
  options: { show: boolean; debug: Debug; replayStore?: ReplayStore } = {
    show: true,
    debug: terminalDebug,
  }
): vscode.Terminal {
  const { debug, show } = options
  const terminal =
    findDecodeTerminal() ??
    createDecodeTerminal(arduinoContext, debug, options.replayStore)
  if (show) {
    terminal.show()
  }
  return terminal
}

function findDecodeTerminal(): vscode.Terminal | undefined {
  return vscode.window.terminals.find(
    (terminal) =>
      terminal.name === decodeTerminalName && terminal.exitStatus === undefined
  )
}

function createDecodeTerminal(
  arduinoContext: ArduinoContext,
  debug: Debug,
  replayStore?: ReplayStore
): vscode.Terminal {
  const pty = new DecoderTerminal(arduinoContext, debug, replayStore)
  const options: vscode.ExtensionTerminalOptions = {
    name: decodeTerminalName,
    pty,
    iconPath: new vscode.ThemeIcon('debug-console'),
  }
  return vscode.window.createTerminal(options)
}

const decodeTerminalTitle = 'ESP Exception Decoder'
const decodeTerminalName = 'Crash Decoder'
const initializing = 'Initializing...'
const busy = 'Decoding...'
const idle = 'Paste crash to decode...'

const relevantSketchChanges = new Set<keyof SketchFolder>([
  'board',
  'compileSummary',
  'configOptions',
])

interface DecodeTerminalState {
  params: DecodeParams | Error
  userInput?: string | undefined
  decoderResult?: DecodeResult | Error | undefined
  statusMessage?: string | undefined
}

class DecoderTerminal implements vscode.Pseudoterminal {
  readonly onDidWrite: vscode.Event<string>
  readonly onDidClose: vscode.Event<number | void>

  private readonly onDidWriteEmitter: vscode.EventEmitter<string>
  private readonly onDidCloseEmitter: vscode.EventEmitter<number | void>
  private readonly toDispose: vscode.Disposable[]

  private state: DecodeTerminalState
  private abortController: AbortController | undefined
  private currentSketchPath: string | undefined

  constructor(
    private readonly arduinoContext: ArduinoContext,
    private readonly debug: Debug = terminalDebug,
    private readonly replayStore?: ReplayStore
  ) {
    this.onDidWriteEmitter = new vscode.EventEmitter<string>()
    this.onDidCloseEmitter = new vscode.EventEmitter<number | void>()
    this.toDispose = [
      this.onDidWriteEmitter,
      this.onDidCloseEmitter,
      this.arduinoContext.onDidChangeCurrentSketch((sketch) =>
        this.handleCurrentSketchDidChange(sketch)
      ),
      this.arduinoContext.onDidChangeSketch((event) =>
        this.handleSketchDidChange(event)
      ),
      this.arduinoContext.onDidChangeSketchFolders((event) =>
        this.handleSketchFoldersDidChange(event)
      ),
      new vscode.Disposable(() => this.abortController?.abort()),
    ]
    this.onDidWrite = this.onDidWriteEmitter.event
    this.onDidClose = this.onDidCloseEmitter.event
    this.state = {
      params: new Error(initializing),
      statusMessage: idle,
    }
    this.currentSketchPath = this.arduinoContext.currentSketch?.sketchPath
  }

  open(): void {
    this.updateParams()
  }

  close(): void {
    vscode.Disposable.from(...this.toDispose).dispose()
  }

  handleInput(data: string): void {
    this.debug(`handleInput: ${data}`)
    if (data.trim().length < 2) {
      this.debug(`handleInput, skip: ${data}`)
      // ignore single keystrokes
      return
    }
    if (this.state.params instanceof Error) {
      this.debug(`handleInput, skip: ${this.state.params.message}, ${data}`)
      // ignore any user input if the params is invalid
      return
    }
    const params = this.state.params
    this.updateState({
      userInput: toTerminalEOL(data),
      statusMessage: busy,
      decoderResult: undefined,
    })
    setTimeout(() => this.decode(params, data), 0)
  }

  private async decode(params: DecodeParams, data: string): Promise<void> {
    this.abortController?.abort()
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    let decoderResult: DecodeTerminalState['decoderResult']
    try {
      const result = await decode(params, data, {
        signal,
        debug: this.debug,
      })
      if (Array.isArray(result)) {
        throw new Error(
          'Unexpectedly received a coredump result from the decoder.'
        )
      }
      decoderResult = result
    } catch (err) {
      this.abortController.abort()
      decoderResult = err instanceof Error ? err : new Error(String(err))
    }
    if (!(decoderResult instanceof Error)) {
      this.replayStore?.recordDecode(params, decoderResult)
    }
    this.updateState({ decoderResult, statusMessage: idle })
  }

  private async updateParams(sketch?: SketchFolder): Promise<void> {
    let params: DecodeTerminalState['params']
    try {
      const resolvedSketch = this.resolveCurrentSketch(sketch)
      if (!resolvedSketch) {
        throw new Error('Select a sketch folder to decode crashes')
      }
      params = await createDecodeParams(resolvedSketch)
    } catch (err) {
      params = err instanceof Error ? err : new Error(String(err))
    }
    this.replayStore?.clearIfParamsMismatch(params)
    this.updateState({ params })
  }

  private updateState(partial: Partial<DecodeTerminalState>): void {
    this.debug(`updateState: ${JSON.stringify(partial)}`)
    const shouldDiscardUserInput =
      !(this.state.params instanceof Error) && partial.params instanceof Error
    const shouldDiscardDecoderResult = shouldDiscardUserInput
    this.state = {
      ...this.state,
      ...partial,
    }
    if (shouldDiscardUserInput) {
      this.state.userInput = undefined
    }
    if (shouldDiscardDecoderResult) {
      this.state.decoderResult = undefined
    }
    this.debug(`newState: ${JSON.stringify(partial)}`)
    this.redrawTerminal()
  }

  private redrawTerminal(): void {
    const output = stringifyTerminalState(this.state)
    this.debug(`redrawTerminal: ${output}`)
    this.onDidWriteEmitter.fire(clear)
    this.onDidWriteEmitter.fire(output)
  }

  private handleCurrentSketchDidChange(sketch: SketchFolder | undefined): void {
    this.updateParams(sketch)
  }

  private handleSketchDidChange(event: ChangeEvent<SketchFolder>): void {
    const sketch = event.object
    if (
      !sketch ||
      !this.currentSketchPath ||
      sketch.sketchPath !== this.currentSketchPath
    ) {
      return
    }
    const { changedProperties } = event
    if (
      changedProperties &&
      !changedProperties.some((property) => relevantSketchChanges.has(property))
    ) {
      return
    }
    this.updateParams(sketch)
  }

  private handleSketchFoldersDidChange(event: SketchFoldersChangeEvent): void {
    if (
      this.currentSketchPath &&
      event.removedPaths.includes(this.currentSketchPath)
    ) {
      this.updateParams(this.arduinoContext.currentSketch)
    }
  }

  private resolveCurrentSketch(
    sketch?: SketchFolder
  ): SketchFolder | undefined {
    const resolved =
      sketch ??
      this.arduinoContext.currentSketch ??
      this.arduinoContext.openedSketches.find(
        (candidate) => candidate.sketchPath === this.currentSketchPath
      )
    this.currentSketchPath = resolved?.sketchPath
    return resolved
  }
}

function stringifyTerminalState(state: DecodeTerminalState): string {
  const lines = [decodeTerminalTitle]
  const { params, userInput, decoderResult } = state
  let { statusMessage } = state
  if (params instanceof Error && !(params instanceof DecodeParamsError)) {
    lines.push(red(toTerminalEOL(params.message)))
  } else {
    const { fqbn, sketchPath } = params
    lines.push(
      `Sketch: ${green(path.basename(sketchPath))} FQBN: ${green(
        fqbn.toString()
      )}`
    )
    if (params instanceof DecodeParamsError) {
      // error overrules any status message
      statusMessage = red(toTerminalEOL(params.message))
    } else {
      if (userInput) {
        lines.push('', userInput)
      }
      if (decoderResult) {
        lines.push('')
        if (decoderResult instanceof Error) {
          lines.push(red(toTerminalEOL(decoderResult.message)))
        } else {
          lines.push(
            ...stringifyDecodeResult(decoderResult, {
              lineSeparator: terminalEOL,
              color: 'force',
            }).split(terminalEOL)
          )
        }
      }
    }
    if (statusMessage) {
      lines.push('', statusMessage, '')
    }
  }
  return stringifyLines(lines)
}

function stringifyLines(lines: string[]): string {
  return toTerminalEOL(lines.join(terminalEOL))
}

function toTerminalEOL(data: string): string {
  return data.split(/\r?\n|\r/g).join(terminalEOL)
}

const terminalEOL = '\r\n'
const clear = '\x1b[2J\x1b[3J\x1b[;H'
const resetFgColorStyle = '\x1b[39m'
enum ANSIStyle {
  red = 31,
  green = 32,
  blue = 34,
}
function red(text: string): string {
  return color(text, ANSIStyle.red)
}
function green(text: string): string {
  return color(text, ANSIStyle.green)
}
function blue(text: string): string {
  return color(text, ANSIStyle.blue)
}
function color(text: string, foregroundColor: ANSIStyle): string {
  return `\x1b[${foregroundColor}m${text}${resetFgColorStyle}`
}

/** (non-API) */
export const __tests = {
  openTerminal,
  stringifyLines,
  stringifyTerminalState,
  decodeTerminalTitle,
  DecoderTerminal,
  red,
  green,
  blue,
} as const
