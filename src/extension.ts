import vscode from 'vscode'
import type { ArduinoContext } from 'vscode-arduino-api'

import { registerCapturer } from './capturer'
import { ReplayStore } from './replay'
import { registerReplay, replayCrashCommandId } from './replayRegistration'
import { activateDecoderTerminal } from './terminal'

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const replayStore = new ReplayStore()
  context.subscriptions.push(replayStore)
  registerReplay(context, replayStore)

  await activateWithBoardLab(context, replayStore)
}

async function activateWithBoardLab(
  context: vscode.ExtensionContext,
  replayStore: ReplayStore
): Promise<void> {
  try {
    const arduinoContext = await findArduinoContext()
    if (!arduinoContext) {
      return
    }
    activateDecoderTerminal(context, arduinoContext, replayStore)
    context.subscriptions.push(
      registerCapturer(context, arduinoContext, {
        onDecodedEvent: async ({ meta, params, result }) => {
          replayStore.recordDecode(params, result, {
            sourceKey: meta.key,
            reason: meta.label,
            createdAt: meta.createdAt,
            captureSessionLabel: meta.captureSessionLabel,
          })
        },
        onRemovedDecodedEvent: ({ key }) => {
          replayStore.deleteSnapshotBySourceKey(key)
        },
        onRemovedCapturer: ({ configId }) => {
          replayStore.deleteSnapshotsBySourceKeyPrefix(`${configId}:`)
        },
        evaluateDecodedEvent: async ({ meta, params, result }) => {
          const snapshot = replayStore.recordDecode(params, result, {
            sourceKey: meta.key,
            reason: meta.label,
            createdAt: meta.createdAt,
            captureSessionLabel: meta.captureSessionLabel,
          })
          await vscode.commands.executeCommand(replayCrashCommandId, {
            snapshotId: snapshot.id,
          })
        },
      })
    )
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to activate extension: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
}

async function findArduinoContext(): Promise<ArduinoContext | undefined> {
  const extension = findExtensionApi()
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

function findExtensionApi(): vscode.Extension<any> | undefined {
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
