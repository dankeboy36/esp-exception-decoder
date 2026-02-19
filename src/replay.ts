import path from 'node:path'

import type {
  LoadStackTraceParams,
  LoadVariablesParams,
  ReplayDataSource,
  StackTrace,
  StackTraceFrame,
  VariablePayload,
  Variables,
} from 'error-replay-debug-adapter'
import {
  type DecodeResult,
  type FrameArg,
  type FrameVar,
  type GDBLine,
  type ParsedGDBLine,
  isGDBLine,
  isParsedGDBLine,
} from 'trbr'
import vscode from 'vscode'

import type { DecodeParams } from './decodeParams'

export interface ReplayLocation {
  sourcePath: string
  line: number
  functionName?: string
}

export interface ReplaySnapshot {
  id: string
  sourceKey?: string
  params: {
    fqbn: string
    sketchPath: string
    targetArch: string
  }
  stackTrace: StackTrace
  variables: Map<string, Variables>
  location?: ReplayLocation
  title: string
  createdAt: number
  eventCreatedAt?: number
  captureSessionLabel?: string
}

export interface ReplaySnapshotMeta {
  sourceKey?: string
  reason?: string
  createdAt?: number
  captureSessionLabel?: string
}

export interface ReplayLocationEntry {
  sourcePath: string
  line: number
  snapshots: ReplaySnapshot[]
}

export class ReplayStore implements vscode.Disposable {
  private snapshotId?: string
  private snapshotSequence = 0
  private readonly snapshotsById = new Map<string, ReplaySnapshot>()
  private readonly snapshotIdBySourceKey = new Map<string, string>()
  private readonly snapshotIdsByDocumentLine = new Map<
    string,
    Map<number, Set<string>>
  >()

  private readonly onDidChangeEmitter = new vscode.EventEmitter<
    ReplaySnapshot | undefined
  >()

  readonly onDidChange = this.onDidChangeEmitter.event

  dispose(): void {
    this.onDidChangeEmitter.dispose()
  }

  get current(): ReplaySnapshot | undefined {
    if (!this.snapshotId) {
      return undefined
    }
    return this.snapshotsById.get(this.snapshotId)
  }

  recordDecode(
    params: DecodeParams,
    result: DecodeResult,
    metadata: ReplaySnapshotMeta = {}
  ): ReplaySnapshot {
    const sourceKey = metadata.sourceKey?.trim()
    const existingSnapshotId = sourceKey
      ? this.snapshotIdBySourceKey.get(sourceKey)
      : undefined
    const previousSnapshot = existingSnapshotId
      ? this.snapshotsById.get(existingSnapshotId)
      : undefined
    const snapshot = buildReplaySnapshot(params, result, {
      id: existingSnapshotId ?? this.nextSnapshotId(),
      sourceKey,
      reason: metadata.reason,
      createdAt: metadata.createdAt,
      captureSessionLabel: metadata.captureSessionLabel,
    })
    if (previousSnapshot) {
      this.deindexSnapshot(previousSnapshot)
    }
    this.snapshotsById.set(snapshot.id, snapshot)
    this.indexSnapshot(snapshot)
    if (sourceKey) {
      this.snapshotIdBySourceKey.set(sourceKey, snapshot.id)
    }
    this.snapshotId = snapshot.id
    this.onDidChangeEmitter.fire(snapshot)
    return snapshot
  }

  clear(): void {
    if (this.snapshotsById.size === 0) {
      return
    }
    this.snapshotId = undefined
    this.snapshotsById.clear()
    this.snapshotIdBySourceKey.clear()
    this.snapshotIdsByDocumentLine.clear()
    this.onDidChangeEmitter.fire(undefined)
  }

  clearIfParamsMismatch(params: DecodeParams | Error): void {
    const snapshot = this.current
    if (!snapshot) {
      return
    }
    const next =
      params instanceof Error
        ? extractReplayContextFromError(params)
        : {
            fqbn: params.fqbn.toString(),
            sketchPath: params.sketchPath,
          }
    if (!next) {
      return
    }
    if (
      snapshot.params.fqbn !== next.fqbn ||
      snapshot.params.sketchPath !== next.sketchPath
    ) {
      this.clear()
    }
  }

  getSnapshot(snapshotId: string): ReplaySnapshot | undefined {
    return this.snapshotsById.get(snapshotId)
  }

  setCurrentSnapshot(snapshotId: string): ReplaySnapshot | undefined {
    const snapshot = this.snapshotsById.get(snapshotId)
    if (!snapshot) {
      return undefined
    }
    this.snapshotId = snapshotId
    this.onDidChangeEmitter.fire(snapshot)
    return snapshot
  }

  deleteSnapshotBySourceKey(sourceKey: string): boolean {
    const key = sourceKey.trim()
    if (!key) {
      return false
    }
    const snapshotId = this.snapshotIdBySourceKey.get(key)
    if (!snapshotId) {
      return false
    }
    const removed = this.deleteSnapshotById(snapshotId)
    if (removed) {
      this.onDidChangeEmitter.fire(this.current)
    }
    return removed
  }

  deleteSnapshotsBySourceKeyPrefix(sourceKeyPrefix: string): number {
    const prefix = sourceKeyPrefix.trim()
    if (!prefix) {
      return 0
    }
    const snapshotIds = new Set(
      [...this.snapshotIdBySourceKey.entries()]
        .filter(([sourceKey]) => sourceKey.startsWith(prefix))
        .map(([, snapshotId]) => snapshotId)
    )
    if (snapshotIds.size === 0) {
      return 0
    }
    let removedCount = 0
    for (const snapshotId of snapshotIds) {
      if (this.deleteSnapshotById(snapshotId)) {
        removedCount += 1
      }
    }
    if (removedCount > 0) {
      this.onDidChangeEmitter.fire(this.current)
    }
    return removedCount
  }

  getSnapshotsAtLocation(sourcePath: string, line: number): ReplaySnapshot[] {
    const normalizedSourcePath = normalizePathForLookup(sourcePath)
    const byLine = this.snapshotIdsByDocumentLine.get(normalizedSourcePath)
    if (!byLine) {
      return []
    }
    const snapshotIds = byLine.get(line)
    if (!snapshotIds) {
      return []
    }
    return [...snapshotIds]
      .map((snapshotId) => this.snapshotsById.get(snapshotId))
      .filter((snapshot): snapshot is ReplaySnapshot => Boolean(snapshot))
      .sort(sortSnapshotsNewestFirst)
  }

  getLocationsForDocument(sourcePath: string): ReplayLocationEntry[] {
    const normalizedSourcePath = normalizePathForLookup(sourcePath)
    const byLine = this.snapshotIdsByDocumentLine.get(normalizedSourcePath)
    if (!byLine) {
      return []
    }
    return [...byLine.entries()]
      .sort(([leftLine], [rightLine]) => leftLine - rightLine)
      .map(([line]) => ({
        sourcePath: normalizedSourcePath,
        line,
        snapshots: this.getSnapshotsAtLocation(normalizedSourcePath, line),
      }))
      .filter((entry) => entry.snapshots.length > 0)
  }

  private nextSnapshotId(): string {
    this.snapshotSequence += 1
    return `esp-exception-${Date.now()}-${this.snapshotSequence}`
  }

  private indexSnapshot(snapshot: ReplaySnapshot): void {
    if (!snapshot.location) {
      return
    }
    const normalizedSourcePath = normalizePathForLookup(
      snapshot.location.sourcePath
    )
    let byLine = this.snapshotIdsByDocumentLine.get(normalizedSourcePath)
    if (!byLine) {
      byLine = new Map<number, Set<string>>()
      this.snapshotIdsByDocumentLine.set(normalizedSourcePath, byLine)
    }
    let snapshotIds = byLine.get(snapshot.location.line)
    if (!snapshotIds) {
      snapshotIds = new Set<string>()
      byLine.set(snapshot.location.line, snapshotIds)
    }
    snapshotIds.add(snapshot.id)
  }

  private deindexSnapshot(snapshot: ReplaySnapshot): void {
    if (snapshot.sourceKey) {
      const currentSnapshotId = this.snapshotIdBySourceKey.get(
        snapshot.sourceKey
      )
      if (currentSnapshotId === snapshot.id) {
        this.snapshotIdBySourceKey.delete(snapshot.sourceKey)
      }
    }
    if (!snapshot.location) {
      return
    }
    const normalizedSourcePath = normalizePathForLookup(
      snapshot.location.sourcePath
    )
    const byLine = this.snapshotIdsByDocumentLine.get(normalizedSourcePath)
    if (!byLine) {
      return
    }
    const snapshotIds = byLine.get(snapshot.location.line)
    if (!snapshotIds) {
      return
    }
    snapshotIds.delete(snapshot.id)
    if (snapshotIds.size === 0) {
      byLine.delete(snapshot.location.line)
    }
    if (byLine.size === 0) {
      this.snapshotIdsByDocumentLine.delete(normalizedSourcePath)
    }
  }

  private deleteSnapshotById(snapshotId: string): boolean {
    const snapshot = this.snapshotsById.get(snapshotId)
    if (!snapshot) {
      return false
    }
    this.deindexSnapshot(snapshot)
    this.snapshotsById.delete(snapshotId)
    if (this.snapshotId === snapshotId) {
      this.snapshotId = this.selectMostRecentSnapshotId()
    }
    return true
  }

  private selectMostRecentSnapshotId(): string | undefined {
    let selectedId: string | undefined
    let selectedTime = Number.NEGATIVE_INFINITY
    for (const snapshot of this.snapshotsById.values()) {
      const snapshotTime = snapshot.eventCreatedAt ?? snapshot.createdAt
      if (snapshotTime > selectedTime) {
        selectedTime = snapshotTime
        selectedId = snapshot.id
      }
    }
    return selectedId
  }
}

export class ReplayCodeLensProvider implements vscode.CodeLensProvider {
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>()
  readonly onDidChangeCodeLenses = this.onDidChangeEmitter.event
  private readonly storeListener: vscode.Disposable

  constructor(
    private readonly replayStore: ReplayStore,
    private readonly commandId: string
  ) {
    this.storeListener = replayStore.onDidChange(() =>
      this.onDidChangeEmitter.fire()
    )
  }

  dispose(): void {
    this.storeListener.dispose()
    this.onDidChangeEmitter.dispose()
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const entries = this.replayStore.getLocationsForDocument(
      document.uri.fsPath
    )
    if (entries.length === 0) {
      return []
    }
    return entries.map((entry) => {
      const position = new vscode.Position(Math.max(0, entry.line - 1), 0)
      const singleSnapshot =
        entry.snapshots.length === 1 ? entry.snapshots[0] : undefined
      const command: vscode.Command = {
        title: singleSnapshot
          ? toSingleReplayCodeLensTitle(singleSnapshot)
          : 'Replay Crash',
        command: this.commandId,
        arguments: [
          singleSnapshot
            ? { snapshotId: singleSnapshot.id }
            : { sourcePath: entry.sourcePath, line: entry.line },
        ],
      }
      return new vscode.CodeLens(new vscode.Range(position, position), command)
    })
  }
}

export class ReplaySnapshotDataSource implements ReplayDataSource {
  constructor(private readonly snapshot: ReplaySnapshot) {}

  async loadStackTrace(_params: LoadStackTraceParams): Promise<StackTrace> {
    return this.snapshot.stackTrace
  }

  async loadVariables(
    params: LoadVariablesParams
  ): Promise<Variables | undefined> {
    return this.snapshot.variables.get(params.snapshotId)
  }
}

function buildReplaySnapshot(
  params: DecodeParams,
  result: DecodeResult,
  metadata: {
    id: string
    sourceKey?: string
    reason?: string
    createdAt?: number
    captureSessionLabel?: string
  }
): ReplaySnapshot {
  const createdAt = Date.now()
  const entries = collectFrameEntries(result)
  const variables = new Map<string, Variables>()
  const frames = entries.map((entry, index) => {
    variables.set(entry.snapshotId, buildVariables(entry.line, result))
    return buildStackTraceFrame(entry, index, params.sketchPath)
  })

  const stackTrace: StackTrace = {
    id: `esp-exception-${createdAt}`,
    frames,
    eventId: `esp-exception-${createdAt}`,
    traceId: `esp-exception-${createdAt}`,
    timestamp: createdAt,
    source: 'esp-exception-decoder',
    snapshotCount: frames.length,
    symbolicated: true,
    architecture: params.targetArch,
    registers: result.regs ? stringifyRegisters(result.regs) : undefined,
    exception: buildException(result),
  }

  return {
    id: metadata.id,
    sourceKey: metadata.sourceKey,
    params: {
      fqbn: params.fqbn.toString(),
      sketchPath: params.sketchPath,
      targetArch: params.targetArch,
    },
    stackTrace,
    variables,
    location: resolveReplayLocation(entries, params.sketchPath),
    title: metadata.reason?.trim() || buildReplayTitle(result),
    createdAt,
    eventCreatedAt: metadata.createdAt,
    captureSessionLabel: metadata.captureSessionLabel,
  }
}

function toSingleReplayCodeLensTitle(snapshot: ReplaySnapshot): string {
  const titleParts = [ellipsize(extractCrashName(snapshot.title), 40)]
  const createdAt = formatReplayTimestamp(
    snapshot.eventCreatedAt ?? snapshot.createdAt
  )
  if (createdAt) {
    titleParts.push(createdAt)
  }
  if (snapshot.captureSessionLabel) {
    titleParts.push(snapshot.captureSessionLabel)
  }
  return `Replay Crash: ${titleParts.join(' · ')}`
}

function extractCrashName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Crash'
  }
  const separatorIndexes = [trimmed.indexOf(':'), trimmed.indexOf('·')]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)
  if (separatorIndexes.length === 0) {
    return trimmed
  }
  return trimmed.slice(0, separatorIndexes[0]).trim() || trimmed
}

function ellipsize(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`
}

function formatReplayTimestamp(value: number): string {
  return new Date(value).toLocaleString()
}

function normalizePathForLookup(value: string): string {
  const normalized = path.normalize(value)
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

function sortSnapshotsNewestFirst(
  left: ReplaySnapshot,
  right: ReplaySnapshot
): number {
  const leftTime = left.eventCreatedAt ?? left.createdAt
  const rightTime = right.eventCreatedAt ?? right.createdAt
  return rightTime - leftTime
}

type FrameLine = GDBLine | ParsedGDBLine

interface FrameEntry {
  line: FrameLine
  snapshotId: string
}

function collectFrameEntries(result: DecodeResult): FrameEntry[] {
  const seen = new Set<string>()
  const lines: FrameLine[] = []
  const pc = result.faultInfo?.programCounter?.location
  if (pc && isGDBLine(pc)) {
    pushUniqueLine(lines, seen, pc)
  }
  for (const line of result.stacktraceLines) {
    if (isGDBLine(line)) {
      pushUniqueLine(lines, seen, line)
    }
  }
  return lines.map((line, index) => ({
    line,
    snapshotId: `frame-${index}`,
  }))
}

function pushUniqueLine(
  lines: FrameLine[],
  seen: Set<string>,
  line: FrameLine
): void {
  const key = `${line.regAddr}:${line.lineNumber}`
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  lines.push(line)
}

function buildStackTraceFrame(
  entry: FrameEntry,
  index: number,
  sketchPath: string
): StackTraceFrame {
  const { line, snapshotId } = entry
  const parsed = isParsedGDBLine(line)
  const file = parsed ? normalizeFilePath(line.file, sketchPath) : undefined
  const lineNumber = parsed ? parseLineNumber(line.lineNumber) : undefined
  const lineZero =
    lineNumber !== undefined ? Math.max(0, lineNumber - 1) : undefined
  const tokens: StackTraceFrame['tokens'] =
    file && lineZero !== undefined
      ? [
          {
            kind: 'runtimeCoordinate',
            value: { uri: { path: file }, location: lineZero },
          },
        ]
      : []
  const content = parsed
    ? `${line.method} @ ${file ?? 'unknown'}:${lineNumber ?? '??'}`
    : `${line.regAddr} ${line.lineNumber}`
  return {
    id: snapshotId,
    content,
    tokens,
    snapshotId,
    snapshotIndex: index + 1,
    ...(file ? { file } : {}),
    ...(parsed ? { function: line.method } : {}),
    ...(lineZero !== undefined ? { line: lineZero, column: 0 } : {}),
  }
}

function buildVariables(line: FrameLine, result: DecodeResult): Variables {
  const locals: Record<string, VariablePayload> = {}
  const args: Record<string, VariablePayload> = {}

  if (isParsedGDBLine(line)) {
    if (line.args) {
      for (const arg of line.args) {
        args[arg.name] = frameArgToPayload(arg)
      }
    }
    if (line.locals) {
      Object.assign(locals, mapFrameVars(line.locals))
    }
  }

  const globals = isParsedGDBLine(line)
    ? (line.globals ?? result.globals)
    : result.globals
  if (globals && globals.length) {
    locals.globals = {
      type: 'globals',
      fields: mapFrameVars(globals),
    }
  }

  if (result.regs) {
    locals.registers = {
      type: 'registers',
      fields: mapRegisterVars(result.regs),
    }
  }

  return { locals, arguments: args }
}

function frameArgToPayload(arg: FrameArg): VariablePayload {
  return {
    ...(arg.type ? { type: arg.type } : {}),
    ...(arg.value !== undefined ? { value: arg.value } : {}),
  }
}

function mapFrameVars(vars: FrameVar[]): Record<string, VariablePayload> {
  const record: Record<string, VariablePayload> = {}
  for (const variable of vars) {
    record[variable.name] = frameVarToPayload(variable)
  }
  return record
}

function frameVarToPayload(variable: FrameVar): VariablePayload {
  const childFields =
    variable.children && variable.children.length
      ? mapFrameVars(variable.children)
      : undefined
  const fields = variable.address
    ? {
        ...(childFields ?? {}),
        address: {
          type: 'address',
          value: variable.address,
        },
      }
    : childFields
  const value =
    variable.value !== undefined
      ? variable.value
      : variable.address && !variable.children?.length
        ? variable.address
        : undefined
  return {
    ...(variable.type ? { type: variable.type } : {}),
    ...(value !== undefined ? { value } : {}),
    ...(fields ? { fields } : {}),
  }
}

function mapRegisterVars(
  regs: Record<string, number>
): Record<string, VariablePayload> {
  const record: Record<string, VariablePayload> = {}
  for (const [name, value] of Object.entries(regs)) {
    record[name] = { type: 'number', value: toHex(value) }
  }
  return record
}

function stringifyRegisters(
  regs: Record<string, number>
): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [name, value] of Object.entries(regs)) {
    record[name] = toHex(value)
  }
  return record
}

function toHex(value: number): string {
  return `0x${value.toString(16)}`
}

function buildException(result: DecodeResult): StackTrace['exception'] {
  if (!result.faultInfo) {
    return undefined
  }
  const fault = result.faultInfo
  const message = fault.faultMessage
    ? fault.faultMessage
    : typeof fault.faultCode === 'number'
      ? `Fault ${fault.faultCode}`
      : undefined
  return {
    name: 'Guru Meditation',
    message,
  }
}

function buildReplayTitle(result: DecodeResult): string {
  if (result.faultInfo?.faultMessage) {
    return result.faultInfo.faultMessage
  }
  if (typeof result.faultInfo?.faultCode === 'number') {
    return `Fault ${result.faultInfo.faultCode}`
  }
  if (result.allocInfo) {
    return 'Memory allocation failed'
  }
  return 'ESP Crash'
}

function resolveReplayLocation(
  entries: FrameEntry[],
  sketchPath: string
): ReplayLocation | undefined {
  for (const entry of entries) {
    if (!isParsedGDBLine(entry.line)) {
      continue
    }
    const file = normalizeFilePath(entry.line.file, sketchPath)
    const lineNumber = parseLineNumber(entry.line.lineNumber)
    if (!file || lineNumber === undefined) {
      continue
    }
    return {
      sourcePath: file,
      line: lineNumber,
      functionName: entry.line.method,
    }
  }
  return undefined
}

function parseLineNumber(value: string): number | undefined {
  if (!value || value === '??') {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function normalizeFilePath(
  file: string,
  sketchPath: string
): string | undefined {
  if (!file || file === '??') {
    return undefined
  }
  if (path.isAbsolute(file)) {
    return path.normalize(file)
  }
  return path.normalize(path.join(sketchPath, file))
}

function extractReplayContextFromError(
  error: Error
): { fqbn: string; sketchPath: string } | undefined {
  const candidate = error as { fqbn?: unknown; sketchPath?: unknown }
  if (
    typeof candidate.fqbn === 'string' &&
    typeof candidate.sketchPath === 'string'
  ) {
    return { fqbn: candidate.fqbn, sketchPath: candidate.sketchPath }
  }
  return undefined
}
