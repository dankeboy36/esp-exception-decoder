import type { DetectedPorts } from 'boards-list'
import type { Event } from 'vscode'
import type { Port } from 'vscode-arduino-api'

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

// https://github.com/dankeboy36/vscode-arduino-api/issues/19
export interface BoardLabContextExt {
  createMonitorClient(
    port: Port,
    options?: { autoStart?: boolean; baudrate?: string }
  ): Promise<MonitorClient>
  withMonitorSuspended<T extends MonitorSuspensionResult>(
    port: Port,
    run: (options?: MonitorSuspensionOptions) => Promise<T>,
    options?: MonitorSuspensionOptions
  ): Promise<T>
  readonly boardsListWatcher?: BoardsListWatcher
}

export function isBoardLabContextExt(arg: unknown): arg is BoardLabContextExt {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    typeof (<BoardLabContextExt>arg).createMonitorClient === 'function' &&
    typeof (<BoardLabContextExt>arg).withMonitorSuspended === 'function'
  )
}
