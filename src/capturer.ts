import type { CapturerEvent, DecodeResult } from 'trbr'
import type vscode from 'vscode'
import type { ArduinoContext } from 'vscode-arduino-api'

import type { BoardLabContextExt } from './boardLabExt'
import { capturerConfigStateKey } from './capturer/constants'
import {
  CapturerManager as CapturerManagerImpl,
  __tests as __testsImpl,
  registerCapturer as registerCapturerImpl,
} from './capturer/crashCaptureManager'
import type {
  CapturerConfig,
  CapturerConfigDraft,
  CapturerConfigValidationResult,
  CapturerDecodedEventPayload,
  CapturerEventSummary,
  CapturerNode,
  CapturerRemovedCapturerMeta,
  CapturerRemovedEventMeta,
  CapturerRuntime,
  CompileBuildOptionsInfo,
} from './capturer/model'

export type {
  CapturerDecodedEventMeta,
  CapturerDecodedEventPayload,
  CapturerEventNode,
  CapturerFrameNode,
  CapturerNode,
  CapturerRemovedCapturerMeta,
  CapturerRemovedEventMeta,
  CapturerRootNode,
} from './capturer/model'

type EvaluateDecodedEvent = (
  payload: CapturerDecodedEventPayload
) => Promise<void>

type OnDecodedEvent = (
  payload: CapturerDecodedEventPayload
) => Promise<void> | void

type OnRemovedDecodedEvent = (
  payload: CapturerRemovedEventMeta
) => Promise<void> | void

type OnRemovedCapturer = (
  payload: CapturerRemovedCapturerMeta
) => Promise<void> | void

export interface CapturerManagerApi
  extends vscode.Disposable, vscode.TreeDataProvider<CapturerNode> {
  readonly onDidChangeTreeData: vscode.Event<CapturerNode | undefined>
  bindTreeView(treeView: vscode.TreeView<CapturerNode>): void
  addUsingBoardLabPickers(): Promise<void>
  addConfig(draft: CapturerConfigDraft): Promise<CapturerConfig | undefined>
  removeConfig(
    target?: CapturerNode,
    options?: { force?: boolean }
  ): Promise<void>
  startCapturer(target?: CapturerNode): Promise<void>
  stopCapturer(target?: CapturerNode): Promise<void>
  refresh(target?: CapturerNode): Promise<void>
  compileSketch(target?: CapturerNode): Promise<void>
  compileSketchWithDebugSymbols(target?: CapturerNode): Promise<void>
  copyToClipboard(arg?: unknown): Promise<void>
  replayRecording(
    target?: CapturerNode,
    recordingUri?: vscode.Uri
  ): Promise<void>
  replayEvent(target?: CapturerNode): Promise<void>
  deleteEvent(target?: CapturerNode): Promise<void>
  deleteAllEvents(target?: CapturerNode): Promise<void>
  dumpCapturerState(target?: CapturerNode): Promise<void>
  showEvent(target?: CapturerNode): Promise<void>
  getTreeItem(element: CapturerNode): vscode.TreeItem
  getChildren(element?: CapturerNode): CapturerNode[]
  getParent(element: CapturerNode): CapturerNode | undefined
}

type CapturerManagerCtor = new (
  context: vscode.ExtensionContext,
  arduinoContext: ArduinoContext & BoardLabContextExt,
  crashReportProvider?: unknown,
  evaluateDecodedEvent?: EvaluateDecodedEvent,
  onDecodedEvent?: OnDecodedEvent,
  onRemovedDecodedEvent?: OnRemovedDecodedEvent,
  onRemovedCapturer?: OnRemovedCapturer
) => CapturerManagerApi

type RegisterCapturer = (
  context: vscode.ExtensionContext,
  arduinoContext: ArduinoContext,
  options?: {
    evaluateDecodedEvent?: EvaluateDecodedEvent
    onDecodedEvent?: OnDecodedEvent
    onRemovedDecodedEvent?: OnRemovedDecodedEvent
    onRemovedCapturer?: OnRemovedCapturer
  }
) => vscode.Disposable

interface CapturerTestExports {
  capturerConfigStateKey: typeof capturerConfigStateKey
  validateCapturerConfig: (
    value: Partial<CapturerConfigDraft>
  ) => CapturerConfigValidationResult
  buildCapturerId: (config: CapturerConfigDraft) => string
  loadPersistedConfigs: (values: unknown[]) => CapturerConfig[]
  pathEquals: (left: string, right: string) => boolean
  isPortIdentifierLike: (arg: unknown) => boolean
  isPortDetected: (
    detectedPorts: unknown,
    port: { protocol: string; address: string } | undefined
  ) => boolean | undefined
  extractDetectedPorts: (
    detectedPorts: unknown
  ) => Array<{ protocol: string; address: string }> | undefined
  arePortsEqual: (
    left: { protocol: string; address: string },
    right: { protocol: string; address: string }
  ) => boolean
  pickNonEmptyString: (
    record: Record<string, unknown>,
    key: string
  ) => string | undefined
  isRecord: (value: unknown) => value is Record<string, unknown>
  resolveSketchBoardName: (
    sketch: { board?: { name?: string; fqbn?: string } } | undefined,
    engineFqbn: string
  ) => string | undefined
  toEventSummary: (
    event: CapturerEvent,
    runtime?: CapturerRuntime
  ) => CapturerEventSummary
  shouldIgnoreCapturerEvent: (event: CapturerEvent) => boolean
  resolveElfIdentity: (
    elfPath: string,
    previous?:
      | {
          path: string
          size: number
          mtimeMs: number
          sha256: string
          sha256Short: string
          sessionId: string
        }
      | undefined
  ) => Promise<
    | {
        path: string
        size: number
        mtimeMs: number
        sha256: string
        sha256Short: string
        sessionId: string
      }
    | undefined
  >
  upsertEventSummary: (
    cache: Map<string, CapturerEventSummary>,
    event: CapturerEvent,
    runtime?: CapturerRuntime
  ) => CapturerEventSummary
  splitReplaySegments: (rawText: string) => string[]
  loadCompileBuildOptions: (
    buildPath: string
  ) => Promise<CompileBuildOptionsInfo | undefined>
  collectBuildFlagEntries: (record: Record<string, unknown>) => string[]
  isReadinessEqual: (
    left: CapturerRuntime['readiness'],
    right: CapturerRuntime['readiness']
  ) => boolean
  isBuildOptionsEqual: (
    left: CompileBuildOptionsInfo | undefined,
    right: CompileBuildOptionsInfo | undefined
  ) => boolean
  isElfIdentityEqual: (
    left:
      | {
          path: string
          size: number
          mtimeMs: number
          sha256: string
          sessionId: string
        }
      | undefined,
    right:
      | {
          path: string
          size: number
          mtimeMs: number
          sha256: string
          sessionId: string
        }
      | undefined
  ) => boolean
  areStringArraysEqual: (left: string[], right: string[]) => boolean
  chunkEndsWithLineBreak: (chunk: Uint8Array) => boolean
  resetTransferMetrics: (runtime: {
    processedBytes: number
    processedFirstAt?: number
    processedLastAt?: number
  }) => void
  recordTransfer: (
    runtime: {
      processedBytes: number
      processedFirstAt?: number
      processedLastAt?: number
    },
    byteLength: number,
    atMs: number
  ) => void
  classifyDecodedSource: (
    filePath: string | undefined,
    sketchPath: string | undefined
  ) => 'sketch' | 'library' | 'missing'
  isPathInside: (parentPath: string, candidatePath: string) => boolean
  workspaceRelativeSketchPath: (sketchPath: string) => string | undefined
  eventDisplayLabel: (summary: CapturerEventSummary) => string
  collectDecodedStackFrames: (
    decoded?: DecodeResult
  ) => DecodeResult['stacktraceLines']
}

export const CapturerManager =
  CapturerManagerImpl as unknown as CapturerManagerCtor
export const registerCapturer = registerCapturerImpl as RegisterCapturer
export const __tests = __testsImpl as unknown as CapturerTestExports
