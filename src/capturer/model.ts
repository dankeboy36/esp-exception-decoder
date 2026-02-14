import type { Capturer, DecodeResult } from 'trbr'
import type vscode from 'vscode'
import type { Port } from 'vscode-arduino-api'

import type { MonitorClient, MonitorRuntimeState } from '../boardLabExt'
import type { DecodeParams } from '../decodeParams'

export interface CapturerConfigDraft {
  port: Port
  fqbn: string
  sketchPath: string
}

export interface CapturerConfig extends CapturerConfigDraft {
  id: string
}

export interface CompileBuildOptionsInfo {
  buildPath: string
  optionsPath: string
  fqbn?: string
  sketchLocation?: string
  optimizationFlags?: string
  customBuildProperties?: string
  flags: string[]
  parseError?: string
}

export interface CapturerReadiness {
  sketchExists: boolean
  hasCompileSummary: boolean
  elfPath?: string
  buildPath?: string
  buildOptions?: CompileBuildOptionsInfo
  boardName?: string
  workspaceRelativeSketchPath?: string
  selectedBoardName?: string
  selectedBoardFqbn?: string
  selectedPort?: Port
  configuredPortDetected?: boolean
}

export interface ElfIdentity {
  path: string
  size: number
  mtimeMs: number
  sha256: string
  sha256Short: string
  sessionId: string
}

export interface CapturerEventSummary {
  eventId: string
  signature: string
  reason: string
  kind: string
  createdAt: number
  captureSessionId?: string
  captureSessionLabel?: string
  count: number
  firstSeenAt: number
  lastSeenAt: number
  rawText: string
  programCounter?: number
  faultCode?: number
  decodeState: 'detected' | 'decoding' | 'decoded' | 'evaluating' | 'evaluated'
  decodedResult?: DecodeResult
  decodeError?: string
  decodeTask?: Promise<void>
  lastDecodeDurationMs?: number
  lastEvaluateDurationMs?: number
  lastDecodeHeavyVarsCount?: number
}

export interface CapturerRuntime {
  readonly config: CapturerConfig
  readonly capturer: Capturer
  readonly eventsBySignature: Map<string, CapturerEventSummary>
  readonly eventsById: Map<string, CapturerEventSummary>
  readonly unsubscribeDetected: () => void
  readonly unsubscribeUpdated: () => void
  readonly monitorSubscriptions: vscode.Disposable[]
  readonly sourceAvailabilityByPath: Map<
    string,
    'checking' | 'present' | 'missing'
  >
  monitor?: MonitorClient
  monitorState?: MonitorRuntimeState
  idleFlushTimer?: NodeJS.Timeout
  lastChunkEndedWithLineBreak: boolean
  processedBytes: number
  processedFirstAt?: number
  processedLastAt?: number
  decodeParams?: DecodeParams
  elfIdentity?: ElfIdentity
  readiness: CapturerReadiness
  lastError?: string
}

export type MonitorClientWithClose = MonitorClient & {
  close?: () => Promise<void> | void
  stop?: () => Promise<void> | void
}

export interface CapturerRootNode {
  readonly type: 'root'
  readonly configId: string
}

export interface CapturerEventNode {
  readonly type: 'event'
  readonly configId: string
  readonly signature: string
}

export interface CapturerFrameNode {
  readonly type: 'frame'
  readonly configId: string
  readonly signature: string
  readonly frameIndex: number
}

export type CapturerNode =
  | CapturerRootNode
  | CapturerEventNode
  | CapturerFrameNode

export interface CapturerConfigValidationSuccess {
  ok: true
  value: CapturerConfigDraft
}

export interface CapturerConfigValidationError {
  ok: false
  message: string
}

export type CapturerConfigValidationResult =
  | CapturerConfigValidationSuccess
  | CapturerConfigValidationError

export interface CapturerDecodedEventMeta {
  key: string
  configId: string
  signature: string
  eventId: string
  label: string
  reason: string
  createdAt: number
  captureSessionId?: string
  captureSessionLabel?: string
}

export interface CapturerDecodedEventPayload {
  meta: CapturerDecodedEventMeta
  params: DecodeParams
  result: DecodeResult
}

export interface CapturerRemovedEventMeta {
  key: string
  configId: string
  signature: string
  eventId: string
}

export interface CapturerRemovedCapturerMeta {
  configId: string
}
