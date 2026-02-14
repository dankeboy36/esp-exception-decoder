import path from 'node:path'

import { FQBN } from 'fqbn'

const statusNoElf = 'No ELF'
const statusReady = 'Ready'
const statusCapturing = 'Capturing crashes'
const statusSuspended = 'Suspended'
const statusNotCompiled = 'Not compiled'
const statusDisconnected = 'Disconnected'
const statusInvalidFqbn = 'Invalid FQBN'
const statusNotEspBoard = 'Not ESP board'
const statusError = 'Error'
const statusWarning = 'Warning'
const statusNoSketch = 'Missing Sketch'
const supportedCapturerArchitectures = new Set(['esp32', 'esp8266'])

export type RuntimeProblemSeverity = 'error' | 'warning'

export interface RuntimeProblem {
  severity: RuntimeProblemSeverity
  code: string
  message: string
}

export interface RuntimePortLike {
  protocol: string
  address: string
}

export interface RuntimeBuildOptionsLike {
  fqbn?: string
}

export interface RuntimeReadinessLike {
  sketchExists: boolean
  hasCompileSummary: boolean
  elfPath?: string
  buildOptions?: RuntimeBuildOptionsLike
  boardName?: string
  selectedBoardName?: string
  selectedBoardFqbn?: string
  configuredPortDetected?: boolean
}

export interface RuntimeConfigLike {
  id: string
  fqbn: string
  sketchPath: string
  port: RuntimePortLike
}

export interface RuntimeLike {
  config: RuntimeConfigLike
  readiness: RuntimeReadinessLike
  monitor?: unknown
  monitorState?: 'running' | 'connected' | 'suspended' | 'disconnected'
  lastError?: string
  eventsBySignature: Map<string, unknown>
}

export interface EventSummaryLike {
  decodeState: 'detected' | 'decoding' | 'decoded' | 'evaluating' | 'evaluated'
}

export function getRuntimeStatus(runtime: RuntimeLike): string {
  const problems = collectRuntimeProblems(runtime)
  const firstError = problems.find((problem) => problem.severity === 'error')
  if (firstError) {
    switch (firstError.code) {
      case 'missing-sketch':
        return statusNoSketch
      case 'invalid-fqbn':
        return statusInvalidFqbn
      case 'unsupported-board':
        return statusNotEspBoard
      case 'not-connected':
        return statusDisconnected
      case 'not-compiled':
        return statusNotCompiled
      case 'no-elf':
        return statusNoElf
      default:
        return statusError
    }
  }
  if (problems.some((problem) => problem.severity === 'warning')) {
    return statusWarning
  }
  if (runtime.monitorState === 'running') {
    return statusCapturing
  }
  if (runtime.monitorState === 'suspended' && isRuntimeConnected(runtime)) {
    return statusSuspended
  }
  if (isReadyToRecord(runtime, problems)) {
    return statusReady
  }
  return statusError
}

export function resolveRootDescription(runtime: RuntimeLike): string {
  if (runtime.monitorState === 'running') {
    return 'Capturing crashes'
  }
  const problems = collectRuntimeProblems(runtime)
  if (!isReadyToRecord(runtime, problems) && problems.length > 0) {
    if (problems.some((problem) => problem.code === 'invalid-fqbn')) {
      return statusInvalidFqbn
    }
    if (problems.some((problem) => problem.code === 'unsupported-board')) {
      return statusNotEspBoard
    }
    if (problems.some((problem) => problem.code === 'not-connected')) {
      return 'Not connected'
    }
    if (problems.some((problem) => problem.code === 'not-compiled')) {
      return 'Not compiled'
    }
    if (problems.some((problem) => problem.code.startsWith('fqbn-mismatch'))) {
      return 'FQBN mismatch'
    }
    return problems[0].message
  }
  if (runtime.monitorState === 'suspended' && isRuntimeConnected(runtime)) {
    return statusSuspended
  }
  if (isReadyToRecord(runtime, problems)) {
    return statusReady
  }
  return getRuntimeStatus(runtime)
}

export function toRootLabel(runtime: RuntimeLike): string {
  const sketchName = path.basename(runtime.config.sketchPath)
  const boardName =
    runtime.readiness.boardName ?? runtime.readiness.selectedBoardName
  const boardPart = boardName
    ? `${boardName} (${runtime.config.fqbn})`
    : runtime.config.fqbn
  return `${runtime.config.port.address} · ${sketchName} · ${boardPart}`
}

export function rootContextValue(runtime: RuntimeLike): string {
  const hasEvents = runtime.eventsBySignature.size > 0
  if (runtime.monitor && runtime.monitorState !== 'disconnected') {
    return hasEvents
      ? 'espCapturerRootCapturingHasEvents'
      : 'espCapturerRootCapturing'
  }
  const problems = collectRuntimeProblems(runtime)
  if (isReadyToRecord(runtime, problems)) {
    return hasEvents ? 'espCapturerRootReadyHasEvents' : 'espCapturerRootReady'
  }
  return hasEvents
    ? 'espCapturerRootStoppedHasEvents'
    : 'espCapturerRootStopped'
}

export function eventContextValue(
  summary: EventSummaryLike | undefined
): string {
  if (!summary) {
    return 'espCapturerEvent'
  }
  switch (summary.decodeState) {
    case 'decoded':
      return 'espCapturerEventDecoded'
    case 'evaluated':
      return 'espCapturerEventEvaluated'
    case 'decoding':
      return 'espCapturerEventDecoding'
    case 'evaluating':
      return 'espCapturerEventEvaluating'
    case 'detected':
    default:
      return 'espCapturerEventDetected'
  }
}

export function collectRuntimeProblems(runtime: RuntimeLike): RuntimeProblem[] {
  const problems: RuntimeProblem[] = []
  const sanitizedConfiguredFqbn = sanitizeFqbn(runtime.config.fqbn)
  if (!sanitizedConfiguredFqbn) {
    problems.push({
      severity: 'error',
      code: 'invalid-fqbn',
      message: 'Configured FQBN is invalid',
    })
  } else {
    const configuredArch = new FQBN(sanitizedConfiguredFqbn).arch
    if (!supportedCapturerArchitectures.has(configuredArch)) {
      problems.push({
        severity: 'error',
        code: 'unsupported-board',
        message: `Unsupported board architecture '${configuredArch}'. Supported architectures: esp32, esp8266`,
      })
    }
  }

  if (runtime.lastError) {
    problems.push({
      severity: 'error',
      code: 'runtime-error',
      message: runtime.lastError,
    })
  }
  if (!runtime.readiness.sketchExists) {
    problems.push({
      severity: 'error',
      code: 'missing-sketch',
      message: 'Sketch folder does not exist',
    })
  }
  if (!isRuntimeConnected(runtime)) {
    problems.push({
      severity: 'error',
      code: 'not-connected',
      message: 'No device found. This port is not detected by Arduino CLI',
    })
  }
  if (!runtime.readiness.hasCompileSummary) {
    problems.push({
      severity: 'error',
      code: 'not-compiled',
      message: 'Compile summary is not available for the sketch',
    })
  } else if (!runtime.readiness.elfPath) {
    problems.push({
      severity: 'error',
      code: 'no-elf',
      message: 'ELF not found',
    })
  }

  if (isSelectedFqbnDifferentFromEngine(runtime)) {
    problems.push({
      severity: 'warning',
      code: 'fqbn-mismatch-selected-engine',
      message: 'Selected FQBN differs from configured FQBN',
    })
  }
  if (isSelectedFqbnDifferentFromBuild(runtime)) {
    problems.push({
      severity: 'warning',
      code: 'fqbn-mismatch-selected-build',
      message: 'Selected FQBN differs from build FQBN',
    })
  }

  return problems
}

export function isRuntimeConnected(runtime: RuntimeLike): boolean {
  if (runtime.readiness.configuredPortDetected === true) {
    return true
  }
  if (runtime.readiness.configuredPortDetected === false) {
    return false
  }
  return (
    runtime.monitorState === 'running' ||
    runtime.monitorState === 'connected' ||
    runtime.monitorState === 'suspended'
  )
}

export function isReadyToRecord(
  runtime: RuntimeLike,
  problems: RuntimeProblem[] = collectRuntimeProblems(runtime)
): boolean {
  return (
    problems.length === 0 &&
    isRuntimeConnected(runtime) &&
    runtime.readiness.hasCompileSummary &&
    Boolean(runtime.readiness.elfPath)
  )
}

export function sanitizeFqbn(fqbnValue: string): string | undefined {
  try {
    return new FQBN(fqbnValue).sanitize().toString()
  } catch {
    return undefined
  }
}

function isSelectedFqbnDifferentFromEngine(runtime: RuntimeLike): boolean {
  const selectedFqbn = runtime.readiness.selectedBoardFqbn
  if (!selectedFqbn) {
    return false
  }
  const engineFqbn = sanitizeFqbn(runtime.config.fqbn)
  if (!engineFqbn) {
    return false
  }
  return selectedFqbn !== engineFqbn
}

function isSelectedFqbnDifferentFromBuild(runtime: RuntimeLike): boolean {
  const selectedFqbn = runtime.readiness.selectedBoardFqbn
  if (!selectedFqbn) {
    return false
  }
  const buildFqbn = sanitizeFqbn(runtime.readiness.buildOptions?.fqbn ?? '')
  if (!buildFqbn) {
    return false
  }
  return selectedFqbn !== buildFqbn
}
