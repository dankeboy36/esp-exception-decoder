import path from 'node:path'

import markdownEscape from 'markdown-escape'
import {
  type Capturer,
  type DecodeResult,
  isGDBLine,
  isParsedGDBLine,
  stringifyDecodeResult,
} from 'trbr'
import vscode from 'vscode'

import {
  statusCapturing,
  statusDisconnected,
  statusError,
  statusInvalidFqbn,
  statusNoElf,
  statusNoSketch,
  statusNotCompiled,
  statusNotEspBoard,
  statusReady,
  statusSuspended,
  statusWarning,
} from './constants'
import type { CapturerEventSummary, CapturerRuntime } from './model'
import {
  collectRuntimeProblems,
  getRuntimeStatus,
  hasRuntimeQuickFix,
} from './runtimeModel'

interface EventReportMarkdownOptions {
  headingLevel?: number
  headingText?: string
  includeRuntimeSection?: boolean
  includePayloadSections?: boolean
  compact?: boolean
}

export type DecodedStackFrame = DecodeResult['stacktraceLines'][number]

export function toCapturerStateDumpMarkdown(
  runtime: CapturerRuntime,
  rawState: ReturnType<Capturer['getRawState']>,
  distinctEvents: CapturerEventSummary[]
): string {
  const compileOptions = runtime.readiness.buildOptions
  const lines: string[] = []
  lines.push('# ESP Crash Capturer State Dump')
  lines.push('')
  lines.push('## Runtime')
  lines.push(`- Generated At: ${toInlineCode(new Date().toISOString())}`)
  lines.push(
    `- Runtime: ${toInlineCode(`${runtime.config.port.protocol}://${runtime.config.port.address}`)} | ${toInlineCode(runtime.config.fqbn)}`
  )
  lines.push(`- Sketch: ${toInlineCode(runtime.config.sketchPath)}`)
  lines.push(
    `- Distinct Events: ${toInlineCode(String(distinctEvents.length))}`
  )
  lines.push(`- Raw Line Count: ${toInlineCode(String(rawState.lines.length))}`)
  lines.push(
    `- Raw Byte Count: ${toInlineCode(formatBytes(rawState.byteLength))}`
  )
  lines.push(
    `- Processed Data: ${toInlineCode(formatBytes(runtime.processedBytes))}`
  )
  lines.push(
    `- Bandwidth: ${toInlineCode(
      formatBandwidth(transferBandwidthBytesPerSecond(runtime))
    )}`
  )
  lines.push(
    `- ELF Path: ${
      runtime.readiness.elfPath
        ? toInlineCode(runtime.readiness.elfPath)
        : '_not available_'
    }`
  )
  if (runtime.elfIdentity) {
    lines.push(`- ELF SHA256: ${toInlineCode(runtime.elfIdentity.sha256Short)}`)
    lines.push(
      `- ELF Modified: ${toInlineCode(
        formatLocalTimestamp(runtime.elfIdentity.mtimeMs)
      )}`
    )
    lines.push(
      `- Capture Session: ${toInlineCode(runtime.elfIdentity.sessionId)}`
    )
  }
  lines.push(
    `- Optimization Flags: ${
      compileOptions?.optimizationFlags
        ? toInlineCode(compileOptions.optimizationFlags)
        : '_not available_'
    }`
  )
  if (compileOptions?.fqbn) {
    lines.push(`- Build FQBN: ${toInlineCode(compileOptions.fqbn)}`)
  }
  lines.push('')
  lines.push('## Distinct Events')
  if (distinctEvents.length === 0) {
    lines.push('_No crash events were detected._')
    return lines.join('\n')
  }
  lines.push('')

  for (const [index, event] of distinctEvents.entries()) {
    appendEventReportMarkdown(lines, runtime, event, {
      headingLevel: 3,
      headingText: `${index + 1}. ${markdownEscape(eventDisplayLabel(event))}`,
      includeRuntimeSection: true,
    })
  }
  return lines.join('\n')
}

export function toEventTreeItemMarkdown(
  runtime: CapturerRuntime,
  event: CapturerEventSummary
): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true)
  const lines: string[] = []
  appendEventReportMarkdown(lines, runtime, event, {
    headingLevel: 3,
    headingText: `$(bug) ${markdownEscape(eventDisplayLabel(event))}`,
    includeRuntimeSection: true,
    includePayloadSections: false,
    compact: true,
  })
  md.appendMarkdown(lines.join('\n'))
  md.appendMarkdown('\n----\n')
  md.appendMarkdown(`_Hold ${mouseOverModifierLabel()} key to mouse over_\n`)
  return md
}

export function toRootTreeItemMarkdown(
  runtime: CapturerRuntime
): vscode.MarkdownString {
  const md = new vscode.MarkdownString(undefined, true)

  const status = getRuntimeStatus(runtime)
  const statusIcon = toStatusCodicon(status)
  const problems = collectRuntimeProblems(runtime)

  md.appendMarkdown(
    `${statusIcon} ${toInlineCode(runtime.config.port.address)} (${markdownEscape(status)}):\n`
  )
  md.appendMarkdown(
    `- Capturer Board: ${toBoardLabel(
      runtime.readiness.boardName,
      runtime.config.fqbn
    )}\n`
  )
  md.appendMarkdown(
    `- Sketch Board: ${toBoardLabel(
      runtime.readiness.selectedBoardName,
      runtime.readiness.selectedBoardFqbn
    )}\n`
  )

  if (problems.length > 0) {
    md.appendMarkdown('\nProblems:\n')
    const visibleProblems = problems.slice(0, 3)
    for (const problem of visibleProblems) {
      const icon = problem.severity === 'error' ? '$(error)' : '$(warning)'
      md.appendMarkdown(`- ${icon} ${markdownEscape(problem.message)}\n`)
    }
    if (problems.length > visibleProblems.length) {
      md.appendMarkdown(
        `- $(info) ${problems.length - visibleProblems.length} more issue(s)\n`
      )
    }
    if (hasRuntimeQuickFix(runtime, problems)) {
      md.appendMarkdown(
        '\n_Use $(light-bulb) `Quick Fixes...` from the view item menu to resolve issues._\n'
      )
    }
  }

  md.appendMarkdown('\n----\n')
  md.appendMarkdown(`_Hold ${mouseOverModifierLabel()} key to mouse over_\n`)

  return md
}

export function toEventReportDocumentMarkdown(
  runtime: CapturerRuntime,
  summary: CapturerEventSummary
): string {
  const lines: string[] = []
  lines.push('# ESP Crash Event Report')
  lines.push('')
  appendEventReportMarkdown(lines, runtime, summary, {
    headingLevel: 2,
    headingText: markdownEscape(eventDisplayLabel(summary)),
    includeRuntimeSection: true,
  })
  return lines.join('\n')
}

export function countHeavyVars(decoded: DecodeResult): number {
  let total = Array.isArray(decoded.globals) ? decoded.globals.length : 0
  for (const line of decoded.stacktraceLines) {
    if (!isParsedGDBLine(line)) {
      continue
    }
    total += Array.isArray(line.locals) ? line.locals.length : 0
    total += Array.isArray(line.globals) ? line.globals.length : 0
  }
  return total
}

export function collectDecodedStackFrames(
  decoded?: DecodeResult
): DecodedStackFrame[] {
  if (!decoded) {
    return []
  }
  return decoded.stacktraceLines.filter(isGDBLine)
}

export function eventDisplayLabel(summary: CapturerEventSummary): string {
  const decoded = summary.decodedResult
  if (!decoded) {
    return summary.reason
  }
  const fault =
    summarizeFaultMessage(decoded.faultInfo?.faultMessage) ??
    summarizeFaultMessage(summary.reason) ??
    summary.reason
  const sourceFile = resolvePrimaryDecodedFile(decoded)
  if (fault && sourceFile) {
    return `${fault} · ${sourceFile}`
  }
  if (fault) {
    return fault
  }
  return summary.reason
}

export function frameToLabel(frame: DecodedStackFrame | undefined): string {
  if (!frame) {
    return 'Unknown frame'
  }
  const address = frame.regAddr
  if (isParsedGDBLine(frame)) {
    const fileName = path.basename(frame.file)
    return `${address}: ${formatFrameMethod(frame)} at ${fileName}:${frame.lineNumber}`
  }
  return `${address}: ?? () at ??:${frame.lineNumber}`
}

export function frameToDescription(
  frame: DecodedStackFrame | undefined
): string | undefined {
  if (!frame) {
    return undefined
  }
  if (!isParsedGDBLine(frame)) {
    return undefined
  }
  return `${path.basename(frame.file)}:${frame.lineNumber}`
}

export function toParsedFrameLocation(
  frame: DecodedStackFrame | undefined
): { file: string; line: number } | undefined {
  if (!frame || !isParsedGDBLine(frame)) {
    return undefined
  }
  const line = Number(frame.lineNumber)
  if (!Number.isFinite(line) || line <= 0) {
    return undefined
  }
  return {
    file: frame.file,
    line,
  }
}

export function formatLocalTimestamp(atMs: number): string {
  return new Date(atMs).toLocaleString()
}

function appendEventReportMarkdown(
  lines: string[],
  runtime: CapturerRuntime,
  event: CapturerEventSummary,
  options: EventReportMarkdownOptions = {}
): void {
  const headingLevel = Math.min(6, Math.max(1, options.headingLevel ?? 3))
  const headingText =
    options.headingText ?? markdownEscape(eventDisplayLabel(event))
  const includeRuntimeSection = options.includeRuntimeSection ?? true
  const includePayloadSections = options.includePayloadSections ?? true
  const compact = options.compact ?? false
  const errorSummary = toSingleLine(event.reason) ?? event.reason.trim()
  const compileOptions = runtime.readiness.buildOptions
  const capturerBoardLabel = toBoardLabel(
    runtime.readiness.boardName,
    runtime.config.fqbn
  )
  const sketchBoardLabel = toBoardLabel(
    runtime.readiness.selectedBoardName,
    runtime.readiness.selectedBoardFqbn
  )
  const decodedException = resolveDecodedExceptionSummary(event)
  const decodedLocation = resolveDecodedLocationSummary(event.decodedResult)

  lines.push(`${'#'.repeat(headingLevel)} ${headingText}`)
  lines.push('#### Crash Summary')
  lines.push(
    `- Error: ${toInlineCode(errorSummary.length > 0 ? errorSummary : 'Unknown error')}`
  )
  lines.push(`- Count: ${toInlineCode(String(event.count))}`)
  if (decodedException) {
    lines.push(`- Decoded Exception: ${toInlineCode(decodedException)}`)
  }
  if (decodedLocation) {
    lines.push(`- Decoded Location: ${toInlineCode(decodedLocation)}`)
  }
  if (!compact) {
    lines.push(
      `- Decode Task: ${toInlineCode(formatTaskDuration(event.lastDecodeDurationMs))}`
    )
    lines.push(
      `- Decode Vars (locals/globals): ${toInlineCode(formatTaskCount(event.lastDecodeHeavyVarsCount))}`
    )
    lines.push(
      `- Evaluate Task (replay): ${toInlineCode(formatTaskDuration(event.lastEvaluateDurationMs))}`
    )
  }
  if (event.decodeError) {
    lines.push(`- Decode Error: ${toInlineCode(event.decodeError)}`)
  }
  lines.push('')

  lines.push('#### Build Context')
  lines.push(`- Capturer Board: ${capturerBoardLabel}`)
  lines.push(`- Sketch Board: ${sketchBoardLabel}`)
  lines.push(
    `- Sketch: ${toInlineCode(path.basename(runtime.config.sketchPath))}`
  )
  lines.push(
    `- ELF Path: ${
      runtime.readiness.elfPath
        ? toInlineCode(runtime.readiness.elfPath)
        : '_not available_'
    }`
  )
  if (runtime.elfIdentity) {
    lines.push(`- ELF SHA256: ${toInlineCode(runtime.elfIdentity.sha256Short)}`)
    lines.push(
      `- ELF Modified: ${toInlineCode(formatEventTimestamp(runtime.elfIdentity.mtimeMs))}`
    )
  }
  if (!compact) {
    lines.push(`- Sketch Folder: ${toInlineCode(runtime.config.sketchPath)}`)
    lines.push(
      `- Build FQBN: ${
        compileOptions?.fqbn
          ? toInlineCode(compileOptions.fqbn)
          : '_not available_'
      }`
    )
    lines.push(
      `- Optimization Flags: ${
        compileOptions?.optimizationFlags
          ? toInlineCode(compileOptions.optimizationFlags)
          : '_not available_'
      }`
    )
  }
  lines.push('')

  if (includePayloadSections) {
    lines.push('#### Captured Crash')
    if (event.rawText.trim().length > 0) {
      lines.push(toCodeBlock(event.rawText))
    } else {
      lines.push('_No captured crash payload available._')
      lines.push('')
    }

    const decodedStacktrace = toDecodedStacktraceText(event)
    lines.push('#### Decoded Stacktrace')
    if (decodedStacktrace) {
      lines.push(toCodeBlock(decodedStacktrace))
    } else {
      lines.push('_Not decoded yet._')
      lines.push('')
    }
  }

  if (!compact) {
    lines.push('#### Session Details')
    lines.push(`- State: ${toInlineCode(event.decodeState)}`)
    lines.push(`- Kind: ${toInlineCode(event.kind)}`)
    lines.push(
      `- Created At: ${toInlineCode(formatEventTimestamp(event.createdAt))}`
    )
    lines.push(
      `- First Seen: ${toInlineCode(formatEventTimestamp(event.firstSeenAt))}`
    )
    lines.push(
      `- Last Seen: ${toInlineCode(formatEventTimestamp(event.lastSeenAt))}`
    )
    if (includeRuntimeSection) {
      lines.push(`- Runtime ID: ${toInlineCode(runtime.config.id)}`)
      lines.push(
        `- Port: ${toInlineCode(`${runtime.config.port.protocol}://${runtime.config.port.address}`)}`
      )
      lines.push(`- Status: ${toInlineCode(getRuntimeStatus(runtime))}`)
    }
    if (event.captureSessionLabel) {
      lines.push(
        `- Capture Session: ${toInlineCode(event.captureSessionLabel)}`
      )
    }
    if (event.captureSessionId) {
      lines.push(
        `- Capture Session ID: ${toInlineCode(event.captureSessionId)}`
      )
    }
    if (typeof event.programCounter === 'number') {
      lines.push(
        `- Program Counter: ${toInlineCode(`0x${event.programCounter.toString(16)}`)}`
      )
    }
    if (typeof event.faultCode === 'number') {
      lines.push(`- Fault Code: ${toInlineCode(String(event.faultCode))}`)
    }
    lines.push(`- Signature: ${toInlineCode(event.signature)}`)
    lines.push(`- Event ID: ${toInlineCode(event.eventId)}`)
    lines.push('')
  }
}

function toDecodedStacktraceText(
  event: CapturerEventSummary
): string | undefined {
  if (!event.decodedResult) {
    return undefined
  }
  try {
    return stringifyDecodeResult(event.decodedResult, {
      color: 'disable',
      lineSeparator: '\n',
    })
  } catch (err) {
    return `Failed to stringify decoded stacktrace: ${
      err instanceof Error ? err.message : String(err)
    }`
  }
}

function toCodeBlock(value: string): string {
  const normalized = value.trimEnd()
  const escaped = normalized.replace(/```/g, '``\\`')
  return `\`\`\`text\n${escaped}\n\`\`\`\n`
}

function formatEventTimestamp(atMs: number): string {
  return `${formatLocalTimestamp(atMs)} (${new Date(atMs).toISOString()})`
}

function formatDecodeDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${Math.round(durationMs)} ms`
  }
  return `${(durationMs / 1000).toFixed(2)} s`
}

function formatTaskDuration(durationMs: number | undefined): string {
  if (typeof durationMs !== 'number') {
    return 'not run'
  }
  return formatDecodeDuration(durationMs)
}

function formatTaskCount(value: number | undefined): string {
  if (typeof value !== 'number') {
    return 'not run'
  }
  return String(value)
}

function resolveDecodedExceptionSummary(
  event: CapturerEventSummary
): string | undefined {
  return (
    toSingleLine(event.decodedResult?.faultInfo?.faultMessage) ??
    toSingleLine(event.reason)
  )
}

function resolveDecodedLocationSummary(
  decoded?: DecodeResult
): string | undefined {
  const firstParsed = collectDecodedStackFrames(decoded).find(isParsedGDBLine)
  if (firstParsed) {
    return `${path.basename(firstParsed.file)}:${firstParsed.lineNumber} in ${formatFrameMethod(
      firstParsed
    )}`
  }
  const pcLocation = decoded?.faultInfo?.programCounter?.location
  if (pcLocation && isParsedGDBLine(pcLocation)) {
    return `${path.basename(pcLocation.file)}:${pcLocation.lineNumber} in ${formatFrameMethod(
      pcLocation
    )}`
  }
  return undefined
}

function toSingleLine(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : undefined
}

function toStatusCodicon(status: string): string {
  switch (status) {
    case statusCapturing:
      return '$(pulse)'
    case statusSuspended:
      return '$(sync~spin)'
    case statusReady:
      return '$(pass)'
    case statusDisconnected:
      return '$(circle-slash)'
    case statusWarning:
      return '$(warning)'
    case statusNoSketch:
    case statusInvalidFqbn:
    case statusNotEspBoard:
    case statusNotCompiled:
    case statusNoElf:
    case statusError:
      return '$(error)'
    default:
      return '$(info)'
  }
}

function toInlineCode(value: unknown): string {
  const normalized = normalizeInlineCodeValue(value)
  const escaped = normalized.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
  return `\`${escaped}\``
}

function toBoardLabel(
  name: string | undefined,
  fqbn: string | undefined
): string {
  if (!fqbn) {
    return '_not available_'
  }
  const fqbnInline = toInlineCode(fqbn)
  return name ? `${markdownEscape(name)} (${fqbnInline})` : fqbnInline
}

function normalizeInlineCodeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function mouseOverModifierLabel(): string {
  return process.platform === 'darwin' ? 'Option' : 'Alt'
}

function resolvePrimaryDecodedFile(decoded?: DecodeResult): string | undefined {
  const firstParsed = collectDecodedStackFrames(decoded).find(isParsedGDBLine)
  if (!firstParsed) {
    const pcLocation = decoded?.faultInfo?.programCounter?.location
    return pcLocation && isParsedGDBLine(pcLocation)
      ? path.basename(pcLocation.file)
      : undefined
  }
  return path.basename(firstParsed.file)
}

function formatFrameMethod(frame: DecodedStackFrame): string {
  if (!isParsedGDBLine(frame)) {
    return '?? ()'
  }
  const args = Array.isArray(frame.args)
    ? frame.args.map((arg) => arg.name).filter((name) => name.length > 0)
    : []
  return `${frame.method} (${args.join(', ')})`
}

function summarizeFaultMessage(
  faultMessage: string | undefined
): string | undefined {
  if (typeof faultMessage !== 'string') {
    return undefined
  }
  const trimmed = faultMessage.trim()
  if (!trimmed) {
    return undefined
  }
  const colonIndex = trimmed.indexOf(':')
  if (colonIndex < 0) {
    return trimmed
  }
  return trimmed.slice(0, colonIndex).trim()
}

function transferBandwidthBytesPerSecond(
  runtime: CapturerRuntime,
  nowMs: number = Date.now()
): number {
  if (
    runtime.processedBytes <= 0 ||
    runtime.processedFirstAt === undefined ||
    runtime.processedLastAt === undefined
  ) {
    return 0
  }
  const referenceNow =
    runtime.monitorState === 'running' ? nowMs : runtime.processedLastAt
  const elapsedMs = Math.max(1, referenceNow - runtime.processedFirstAt)
  return (runtime.processedBytes * 1000) / elapsedMs
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KiB`
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MiB`
}

function formatBandwidth(value: number): string {
  return `${formatBytes(Math.max(0, Math.floor(value)))}/s`
}
