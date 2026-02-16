import type {
  BoardIdentifier,
  BoardsListItemWithBoard,
  DetectedPorts,
  PortIdentifier,
} from 'boards-list'
import type { FQBN } from 'fqbn'
import type { Event } from 'vscode'
import type { BoardDetails, Port, SketchFolder } from 'vscode-arduino-api'

export type MonitorRuntimeState =
  | 'disconnected'
  | 'connected'
  | 'running'
  | 'suspended'

export interface MonitorClient {
  readonly port: Port
  readonly state: MonitorRuntimeState
  readonly onDidReceiveData: Event<Uint8Array>
  readonly onDidChangeState: Event<MonitorRuntimeState>
  send(message: string | Uint8Array): Promise<void>
  dispose(): void
}

export interface MonitorSuspensionOptions {
  retry?: number
}

export interface MonitorSuspensionResult {
  result: Promise<Port | undefined>
}

export interface BoardsListWatcher {
  readonly detectedPorts: DetectedPorts
  readonly onDidChangeDetectedPorts: Event<DetectedPorts>
}

export type ApiBoardDetails = BoardDetails

export type PickBoardResult = BoardIdentifier | BoardsListItemWithBoard

export interface BoardPickCandidate {
  readonly board: BoardIdentifier
  readonly port?: PortIdentifier
  readonly selection: PickBoardResult
}

export type QuickPickFilter<T> = (candidate: T) => boolean | Promise<boolean>

export interface QuickPickConstraints<T> {
  readonly filters?: ReadonlyArray<QuickPickFilter<T>>
}

export interface SketchPickOptions extends QuickPickConstraints<SketchFolder> {}

export interface BoardPickOptions extends QuickPickConstraints<BoardPickCandidate> {}

export type SketchPort =
  | Readonly<Port>
  | PortIdentifier
  | { readonly port: PortIdentifier }
  | undefined

export interface PortPickCandidate {
  readonly port: PortIdentifier
  readonly selection: SketchPort
}

export interface PortPickOptions extends QuickPickConstraints<PortPickCandidate> {}

type SketchOrPromise = SketchFolder | Promise<SketchFolder | undefined>

// https://github.com/dankeboy36/vscode-arduino-api/issues/19
export interface BoardLabContextExt {
  pickSketch(options?: SketchPickOptions): Promise<SketchFolder | undefined>
  selectSketch(options?: SketchPickOptions): Promise<SketchFolder | undefined>
  pickBoard(
    currentSketchOrOptions?: SketchFolder | BoardPickOptions | undefined,
    options?: BoardPickOptions
  ): Promise<PickBoardResult | undefined>
  selectBoard(
    currentSketchOrOptions?: SketchOrPromise | BoardPickOptions | undefined,
    options?: BoardPickOptions
  ): Promise<PickBoardResult | undefined>
  setBoardByFqbn(
    fqbn: string | FQBN,
    currentSketch?: SketchOrPromise | undefined
  ): Promise<ApiBoardDetails | undefined>
  pickPort(
    currentSketchOrOptions?: SketchFolder | PortPickOptions | undefined,
    options?: PortPickOptions
  ): Promise<SketchPort>
  selectPort(
    currentSketchOrOptions?: SketchOrPromise | PortPickOptions | undefined,
    options?: PortPickOptions
  ): Promise<SketchPort>
  createMonitorClient(
    port: Port,
    options?: { autoStart?: boolean; baudrate?: string }
  ): Promise<MonitorClient>
  withMonitorSuspended<T extends MonitorSuspensionResult>(
    port: Port,
    run: (options?: MonitorSuspensionOptions) => Promise<T>,
    options?: MonitorSuspensionOptions
  ): Promise<T>
  readonly boardsListWatcher: BoardsListWatcher
}

export function isBoardLabContextExt(arg: unknown): arg is BoardLabContextExt {
  if (typeof arg !== 'object' || arg === null) {
    return false
  }
  const context = arg as Partial<BoardLabContextExt>
  if (
    typeof context.pickSketch !== 'function' ||
    typeof context.selectSketch !== 'function' ||
    typeof context.pickBoard !== 'function' ||
    typeof context.selectBoard !== 'function' ||
    typeof context.setBoardByFqbn !== 'function' ||
    typeof context.pickPort !== 'function' ||
    typeof context.selectPort !== 'function' ||
    typeof context.createMonitorClient !== 'function' ||
    typeof context.withMonitorSuspended !== 'function'
  ) {
    return false
  }
  const watcher = context.boardsListWatcher as
    | Partial<BoardsListWatcher>
    | undefined
  return (
    typeof watcher === 'object' &&
    watcher !== null &&
    'detectedPorts' in watcher &&
    typeof watcher.onDidChangeDetectedPorts === 'function'
  )
}
