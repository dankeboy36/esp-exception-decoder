import vscode from 'vscode'
import type { ArduinoContext } from 'vscode-arduino-api'

import { activateDecoderTerminal } from './terminal'

export function activate(context: vscode.ExtensionContext): void {
  findArduinoContext()
    .then((arduinoContext) => {
      if (arduinoContext) {
        activateDecoderTerminal(context, arduinoContext)
      }
    })
    .catch((err) => {
      vscode.window.showErrorMessage(
        `Failed to activate extension: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    })
}

const runsInCode = typeof process !== 'undefined' && process.env.VSCODE_PID

async function findArduinoContext(): Promise<ArduinoContext | undefined> {
  const extension = runsInCode
    ? findExtensionApiForVSCode()
    : findExtensionApiForArduinoIde2()
  if (!extension) {
    return undefined
  }
  if (!extension.isActive) {
    await extension.activate()
  }
  const exports = extractArduinoContext(extension.exports)
  if (!exports) {
    vscode.window.showErrorMessage(
      `'${extension.id}' did not expose the Arduino context API`
    )
  }
  return exports
}

function findExtensionApiForArduinoIde2(): vscode.Extension<any> | undefined {
  return findExtensionOrLogError('dankeboy36.vscode-arduino-api')
}

function findExtensionApiForVSCode(): vscode.Extension<any> | undefined {
  return findExtensionOrLogError('dankeboy36.boardlab')
}

function findExtensionOrLogError(
  extensionId: string
): vscode.Extension<any> | undefined {
  const extension = vscode.extensions.getExtension(extensionId)
  if (!extension) {
    vscode.window.showErrorMessage(
      `Could not find the '${extensionId}' extension`
    )
  }
  return extension
}

function extractArduinoContext(candidate: any): ArduinoContext | undefined {
  if (isArduinoContext(candidate)) {
    return candidate
  }
  if (
    candidate &&
    typeof candidate === 'object' &&
    isArduinoContext(candidate.arduinoContext)
  ) {
    return candidate.arduinoContext
  }
  return undefined
}

function isArduinoContext(value: unknown): value is ArduinoContext {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as ArduinoContext
  return (
    Array.isArray(candidate.openedSketches) &&
    typeof candidate.onDidChangeCurrentSketch === 'function' &&
    typeof candidate.onDidChangeSketch === 'function'
  )
}
