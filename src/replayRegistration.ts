import path from 'node:path'

import { ErrorReplaySession } from 'error-replay-debug-adapter'
import vscode from 'vscode'

import {
  ReplayCodeLensProvider,
  type ReplaySnapshot,
  ReplaySnapshotDataSource,
  ReplayStore,
} from './replay'

const replayDebugType = 'esp-crash-replay'
export const replayCrashCommandId = 'espExceptionDecoder.replayCrash'

export function registerReplay(
  context: vscode.ExtensionContext,
  replayStore: ReplayStore
): void {
  let replaySessionActive = false

  const codeLensProvider = new ReplayCodeLensProvider(
    replayStore,
    replayCrashCommandId
  )

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: 'file', pattern: '**/*.{ino,c,cpp,h,hpp,cc,cxx}' },
      codeLensProvider
    ),
    codeLensProvider
  )

  context.subscriptions.push(
    vscode.debug.onDidStartDebugSession((session) => {
      if (session.type === replayDebugType) {
        replaySessionActive = true
      }
    }),
    vscode.debug.onDidTerminateDebugSession((session) => {
      if (session.type === replayDebugType) {
        replaySessionActive = false
      }
    }),
    vscode.debug.onDidChangeActiveDebugSession((session) => {
      if (!session || session.type !== replayDebugType) {
        replaySessionActive = false
      }
    })
  )

  const factory: vscode.DebugAdapterDescriptorFactory = {
    createDebugAdapterDescriptor(session: vscode.DebugSession) {
      const snapshot = replayStore.current
      if (!snapshot) {
        throw new Error('No decoded crash data is available to replay.')
      }
      const dataSource = new ReplaySnapshotDataSource(snapshot)
      return new vscode.DebugAdapterInlineImplementation(
        new ErrorReplaySession(
          dataSource,
          session.workspaceFolder?.uri?.fsPath
        ) as unknown as vscode.DebugAdapter
      )
    },
  }

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(
      replayDebugType,
      factory
    ),
    vscode.commands.registerCommand(
      replayCrashCommandId,
      async (args?: ReplayCommandArgs) => {
        if (replaySessionActive) {
          vscode.window.showWarningMessage(
            'A crash replay session is already running.'
          )
          return
        }
        const snapshot = await resolveReplaySnapshotFromArgs(replayStore, args)
        if (!snapshot) {
          vscode.window.showWarningMessage('Decode a crash to start replay.')
          return
        }
        replayStore.setCurrentSnapshot(snapshot.id)

        const location = snapshot.location
        const config: vscode.DebugConfiguration = {
          type: replayDebugType,
          name: 'ESP Crash Replay',
          request: 'launch',
          errorTitle: snapshot.title,
        }
        if (location) {
          config.startLine = location.line
          config.startSourcePath = location.sourcePath
        }

        const workspaceFolder =
          vscode.workspace.workspaceFolders?.find((folder) =>
            path
              .normalize(snapshot.params.sketchPath)
              .startsWith(path.normalize(folder.uri.fsPath))
          ) ?? vscode.workspace.workspaceFolders?.[0]

        await vscode.commands.executeCommand('workbench.view.debug')
        await vscode.debug.startDebugging(workspaceFolder, config)
      }
    )
  )
}

type ReplayCommandArgs = {
  snapshotId?: string
  sourcePath?: string
  line?: number
}

async function resolveReplaySnapshotFromArgs(
  replayStore: ReplayStore,
  args?: ReplayCommandArgs
): Promise<ReplaySnapshot | undefined> {
  if (typeof args?.snapshotId === 'string' && args.snapshotId.trim()) {
    return replayStore.getSnapshot(args.snapshotId)
  }
  if (
    typeof args?.sourcePath === 'string' &&
    args.sourcePath.trim().length > 0 &&
    typeof args?.line === 'number'
  ) {
    const snapshots = replayStore.getSnapshotsAtLocation(
      args.sourcePath,
      args.line
    )
    if (snapshots.length === 1) {
      return snapshots[0]
    }
    if (snapshots.length > 1) {
      const selected = await vscode.window.showQuickPick(
        snapshots.map((snapshot) => ({
          label: snapshot.title
            ? `Replay Crash: ${snapshot.title}`
            : 'Replay Crash',
          description: new Date(
            snapshot.eventCreatedAt ?? snapshot.createdAt
          ).toLocaleString(),
          detail: snapshot.captureSessionLabel,
          snapshotId: snapshot.id,
        })),
        {
          placeHolder: 'Select a crash event to replay',
        }
      )
      return selected ? replayStore.getSnapshot(selected.snapshotId) : undefined
    }
    return undefined
  }
  return undefined
}
