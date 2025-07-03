import debug from 'debug';
import path from 'node:path';
import { DecodeResult, stringifyDecodeResult, decode } from 'trbr';
import vscode from 'vscode';
import type { ArduinoContext } from 'vscode-arduino-api';
import {
  DecodeParams,
  DecodeParamsError,
  createDecodeParams,
} from './decodeParams';
import { Debug } from './utils';

const terminalDebug: Debug = debug('espExceptionDecoder:terminal');

let _debugOutput: vscode.OutputChannel | undefined;
function debugOutput(): vscode.OutputChannel {
  if (!_debugOutput) {
    _debugOutput = vscode.window.createOutputChannel(
      `${decodeTerminalTitle} (Log)`
    );
  }
  return _debugOutput;
}
function createDebugOutput(): Debug {
  return (message) => debugOutput().appendLine(message);
}

export function activateDecoderTerminal(
  context: vscode.ExtensionContext,
  arduinoContext: ArduinoContext
): void {
  context.subscriptions.push(
    new vscode.Disposable(() => _debugOutput?.dispose()),
    vscode.commands.registerCommand('espExceptionDecoder.showTerminal', () =>
      openTerminal(arduinoContext, decode, {
        show: true,
        debug: createDebugOutput(),
      })
    )
  );
}

function openTerminal(
  arduinoContext: ArduinoContext,
  decoder: typeof decode = decode,
  options: { show: boolean; debug: Debug } = {
    show: true,
    debug: terminalDebug,
  }
): vscode.Terminal {
  const { debug, show } = options;
  const terminal =
    findDecodeTerminal() ??
    createDecodeTerminal(arduinoContext, decoder, debug);
  if (show) {
    terminal.show();
  }
  return terminal;
}

function findDecodeTerminal(): vscode.Terminal | undefined {
  return vscode.window.terminals.find(
    (terminal) =>
      terminal.name === decodeTerminalName && terminal.exitStatus === undefined
  );
}

function createDecodeTerminal(
  arduinoContext: ArduinoContext,
  decoder: typeof decode,
  debug: Debug
): vscode.Terminal {
  const pty = new DecoderTerminal(arduinoContext, decoder, debug);
  const options: vscode.ExtensionTerminalOptions = {
    name: decodeTerminalName,
    pty,
    iconPath: new vscode.ThemeIcon('debug-console'),
  };
  return vscode.window.createTerminal(options);
}

const decodeTerminalTitle = 'ESP Exception Decoder';
const decodeTerminalName = 'Exception Decoder';
const initializing = 'Initializing...';
const busy = 'Decoding...';
const idle = 'Paste exception to decode...';

interface DecodeTerminalState {
  params: DecodeParams | Error;
  userInput?: string | undefined;
  decoderResult?: DecodeResult | Error | undefined;
  statusMessage?: string | undefined;
}

class DecoderTerminal implements vscode.Pseudoterminal {
  readonly onDidWrite: vscode.Event<string>;
  readonly onDidClose: vscode.Event<number | void>;

  private readonly onDidWriteEmitter: vscode.EventEmitter<string>;
  private readonly onDidCloseEmitter: vscode.EventEmitter<number | void>;
  private readonly toDispose: vscode.Disposable[];

  private state: DecodeTerminalState;
  private abortController: AbortController | undefined;

  constructor(
    private readonly arduinoContext: ArduinoContext,
    private readonly decoder: typeof decode = decode,
    private readonly debug: Debug = terminalDebug
  ) {
    this.onDidWriteEmitter = new vscode.EventEmitter<string>();
    this.onDidCloseEmitter = new vscode.EventEmitter<number | void>();
    this.toDispose = [
      this.onDidWriteEmitter,
      this.onDidCloseEmitter,
      this.arduinoContext.onDidChange('boardDetails')(() =>
        this.updateParams()
      ), // ignore FQBN changes and listen on board details only
      this.arduinoContext.onDidChange('compileSummary')(() =>
        this.updateParams()
      ),
      this.arduinoContext.onDidChange('sketchPath')(() => this.updateParams()), // In the Arduino IDE (2.x), the sketch path does not change
      new vscode.Disposable(() => this.abortController?.abort()),
    ];
    this.onDidWrite = this.onDidWriteEmitter.event;
    this.onDidClose = this.onDidCloseEmitter.event;
    this.state = {
      params: new Error(initializing),
      statusMessage: idle,
    };
  }

  open(): void {
    this.updateParams();
  }

  close(): void {
    vscode.Disposable.from(...this.toDispose).dispose();
  }

  handleInput(data: string): void {
    this.debug(`handleInput: ${data}`);
    if (data.trim().length < 2) {
      this.debug(`handleInput, skip: ${data}`);
      // ignore single keystrokes
      return;
    }
    if (this.state.params instanceof Error) {
      this.debug(`handleInput, skip: ${this.state.params.message}, ${data}`);
      // ignore any user input if the params is invalid
      return;
    }
    const params = this.state.params;
    this.updateState({
      userInput: toTerminalEOL(data),
      statusMessage: busy,
      decoderResult: undefined,
    });
    setTimeout(() => this.decode(params, data), 0);
  }

  private async decode(params: DecodeParams, data: string): Promise<void> {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    let decoderResult: DecodeTerminalState['decoderResult'];
    try {
      const result = await this.decoder(params, data, {
        signal,
        debug: this.debug,
      });
      if (Array.isArray(result)) {
        throw new Error(
          'Unexpectedly received a coredump result from the decoder.'
        );
      }
      decoderResult = result;
    } catch (err) {
      this.abortController.abort();
      decoderResult = err instanceof Error ? err : new Error(String(err));
    }
    this.updateState({ decoderResult, statusMessage: idle });
  }

  private async updateParams(): Promise<void> {
    let params: DecodeTerminalState['params'];
    try {
      params = await createDecodeParams(this.arduinoContext);
    } catch (err) {
      params = err instanceof Error ? err : new Error(String(err));
    }
    this.updateState({ params });
  }

  private updateState(partial: Partial<DecodeTerminalState>): void {
    this.debug(`updateState: ${JSON.stringify(partial)}`);
    const shouldDiscardUserInput =
      !(this.state.params instanceof Error) && partial.params instanceof Error;
    const shouldDiscardDecoderResult = shouldDiscardUserInput;
    this.state = {
      ...this.state,
      ...partial,
    };
    if (shouldDiscardUserInput) {
      this.state.userInput = undefined;
    }
    if (shouldDiscardDecoderResult) {
      this.state.decoderResult = undefined;
    }
    this.debug(`newState: ${JSON.stringify(partial)}`);
    this.redrawTerminal();
  }

  private redrawTerminal(): void {
    const output = stringifyTerminalState(this.state);
    this.debug(`redrawTerminal: ${output}`);
    this.onDidWriteEmitter.fire(clear);
    this.onDidWriteEmitter.fire(output);
  }
}

function stringifyTerminalState(state: DecodeTerminalState): string {
  const lines = [decodeTerminalTitle];
  const { params, userInput, decoderResult } = state;
  let { statusMessage } = state;
  if (params instanceof Error && !(params instanceof DecodeParamsError)) {
    lines.push(red(toTerminalEOL(params.message)));
  } else {
    const { fqbn, sketchPath } = params;
    lines.push(
      `Sketch: ${green(path.basename(sketchPath))} FQBN: ${green(
        fqbn.toString()
      )}`
    );
    if (params instanceof DecodeParamsError) {
      // error overrules any status message
      statusMessage = red(toTerminalEOL(params.message));
    } else {
      if (userInput) {
        lines.push('', userInput);
      }
      if (decoderResult) {
        lines.push('');
        if (decoderResult instanceof Error) {
          lines.push(red(toTerminalEOL(decoderResult.message)));
        } else {
          lines.push(
            ...stringifyDecodeResult(decoderResult).split(terminalEOL)
          );
        }
      }
    }
    if (statusMessage) {
      lines.push('', statusMessage, '');
    }
  }
  return stringifyLines(lines);
}

function stringifyLines(lines: string[]): string {
  return toTerminalEOL(lines.join(terminalEOL));
}

function toTerminalEOL(data: string): string {
  return data.split(/\r?\n|\r/g).join(terminalEOL);
}

const terminalEOL = '\r\n';
const clear = '\x1b[2J\x1b[3J\x1b[;H';
const resetStyle = '\x1b[0m';
enum ANSIStyle {
  'bold' = 1,
  'red' = 31,
  'green' = 32,
  'blue' = 34,
}
function red(text: string): string {
  return color(text, ANSIStyle.red);
}
function green(text: string, isBold = false): string {
  return color(text, ANSIStyle.green, isBold);
}
function blue(text: string, isBold = false): string {
  return color(text, ANSIStyle.blue, isBold);
}
function bold(text: string): string {
  return `\x1b[${ANSIStyle.bold}m${text}${resetStyle}`;
}
function color(
  text: string,
  foregroundColor: ANSIStyle,
  isBold = false
): string {
  return `\x1b[${foregroundColor}${
    isBold ? `;${ANSIStyle.bold}` : ''
  }m${text}${resetStyle}`;
}

/**
 * (non-API)
 */
export const __tests = {
  openTerminal,
  stringifyLines,
  stringifyTerminalState,
  decodeTerminalTitle,
  DecoderTerminal,
  red,
  green,
  blue,
  bold,
} as const;
