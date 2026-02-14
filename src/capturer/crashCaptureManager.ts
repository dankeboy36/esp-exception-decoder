// @ts-nocheck
import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import path from 'node:path'

import { FQBN } from 'fqbn'
import { createCapturer, decode } from 'trbr'
import vscode from 'vscode'

import { isBoardLabContextExt } from '../boardLabExt'
import { createDecodeParams } from '../decodeParams'
import { findElfPath, resolveBuildPathFromSketchPath } from '../findElfPath'
import {
  capturerCompileSketchCommandId,
  capturerCompileSketchDebugCommandId,
  capturerConfigStateKey,
  capturerCopyToClipboardCommandId,
  capturerCreateCommandId,
  capturerDeleteAllEventsCommandId,
  capturerDeleteEventCommandId,
  capturerRefreshCommandId,
  capturerRemoveCommandId,
  capturerReplayCrashCommandId,
  capturerShowEventCommandId,
  capturerStartCommandId,
  capturerStopCommandId,
  capturerViewId,
  dumpCapturerStateCommandId,
  idleFlushDelayMs,
  replayFileStateKey,
  splitMarker,
  supportedCapturerArchitectures,
} from './constants'
import {
  CrashReportContentProvider,
  ReadonlyFsProvider,
  crashReportScheme,
  readonlyLibraryScheme,
  toReadonlyLibraryUri,
} from './fsProviders'
import {
  collectDecodedStackFrames,
  countHeavyVars,
  eventDisplayLabel,
  formatLocalTimestamp,
  frameToDescription,
  frameToLabel,
  toCapturerStateDumpMarkdown,
  toEventReportDocumentMarkdown,
  toEventTreeItemMarkdown,
  toParsedFrameLocation,
  toRootTreeItemMarkdown,
} from './markdown'
import {
  collectRuntimeProblems,
  eventContextValue,
  isReadyToRecord,
  isRuntimeConnected,
  resolveRootDescription,
  rootContextValue,
  sanitizeFqbn,
  toRootLabel,
} from './runtimeModel'
import { CapturerTreeModel } from './treeModel'

export type {
  CapturerDecodedEventMeta,
  CapturerDecodedEventPayload,
  CapturerEventNode,
  CapturerFrameNode,
  CapturerNode,
  CapturerRemovedCapturerMeta,
  CapturerRemovedEventMeta,
  CapturerRootNode,
} from './model'
export class CapturerManager {
  constructor(
    context,
    arduinoContext,
    crashReportProvider,
    evaluateDecodedEvent,
    onDecodedEvent,
    onRemovedDecodedEvent,
    onRemovedCapturer
  ) {
    this.context = context
    this.arduinoContext = arduinoContext
    this.evaluateDecodedEvent = evaluateDecodedEvent
    this.onDecodedEvent = onDecodedEvent
    this.onRemovedDecodedEvent = onRemovedDecodedEvent
    this.onRemovedCapturer = onRemovedCapturer
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter()
    this.runtimes = new Map()
    this.treeModel = new CapturerTreeModel()
    this.toDispose = []
    this.configs = []
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event
    this.ownsCrashReportProvider = !crashReportProvider
    this.crashReportProvider =
      crashReportProvider ?? new CrashReportContentProvider()
    const boardsListWatcher = this.arduinoContext.boardsListWatcher
    this.configs = loadPersistedConfigs(
      this.context.workspaceState.get(capturerConfigStateKey, [])
    )
    for (const config of this.configs) {
      this.ensureRuntime(config)
      this.refreshReadiness(config.id)
    }
    this.toDispose.push(
      this.onDidChangeTreeDataEmitter,
      this.arduinoContext.onDidChangeSketch((event) => {
        const sketchPath = event.object?.sketchPath
        if (!sketchPath) {
          return
        }
        const targets = this.configs.filter((config) =>
          pathEquals(config.sketchPath, sketchPath)
        )
        for (const target of targets) {
          this.refreshReadiness(target.id)
        }
      }),
      this.arduinoContext.onDidChangeCurrentSketch((sketch) => {
        if (!sketch?.sketchPath) {
          return
        }
        const targets = this.configs.filter((config) =>
          pathEquals(config.sketchPath, sketch.sketchPath)
        )
        for (const target of targets) {
          this.refreshReadiness(target.id)
        }
      })
    )
    if (boardsListWatcher) {
      this.toDispose.push(
        boardsListWatcher.onDidChangeDetectedPorts(() => {
          for (const config of this.configs) {
            this.refreshReadiness(config.id)
          }
        })
      )
    }
  }

  dispose() {
    for (const runtime of this.runtimes.values()) {
      this.disposeRuntime(runtime)
    }
    this.runtimes.clear()
    if (this.ownsCrashReportProvider) {
      this.crashReportProvider.dispose()
    }
    vscode.Disposable.from(...this.toDispose).dispose()
  }

  bindTreeView(treeView) {
    this.treeView = treeView
  }

  async addUsingBoardLabPickers() {
    const sketch = await vscode.commands.executeCommand('boardlab.pickSketch')
    if (!sketch) return
    const board = await vscode.commands.executeCommand('boardlab.pickBoard')
    if (!board) return
    const port = await vscode.commands.executeCommand('boardlab.pickPort')
    if (!port) return
    const sketchPath = sketch.uri.fsPath
    const draftFromSketch = toDraftFromSketch({ sketchPath, board, port })
    if (draftFromSketch) {
      await this.addConfig(draftFromSketch)
    }
  }

  async addConfig(draft) {
    const validated = validateCapturerConfig(draft)
    if (!validated.ok) {
      vscode.window.showErrorMessage(validated.message)
      return undefined
    }
    const exists = await pathExists(validated.value.sketchPath)
    if (!exists) {
      vscode.window.showErrorMessage(
        `Sketch path does not exist: ${validated.value.sketchPath}`
      )
      return undefined
    }
    const id = buildCapturerId(validated.value)
    const config = { id, ...validated.value }
    const previousIndex = this.configs.findIndex((entry) => entry.id === id)
    if (previousIndex >= 0) {
      this.configs[previousIndex] = config
    } else {
      this.configs = [...this.configs, config]
    }
    await this.context.workspaceState.update(
      capturerConfigStateKey,
      this.configs
    )
    this.ensureRuntime(config)
    await this.refreshReadiness(config.id)
    this.refreshTree()
    return config
  }

  async removeConfig(target, options = { force: false }) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer to remove'
    )
    if (!configId) return
    const configToRemove = this.configs.find((config) => config.id === configId)
    if (!configToRemove) return
    if (!options.force) {
      const answer = await vscode.window.showInformationMessage(
        'Remove Capturer',
        {
          modal: true,
          detail: `Do you want to remove the capturer created for ${path.basename(configToRemove.sketchPath)} on ${configToRemove.port.address} with ${configToRemove.fqbn}?`,
        },
        'Remove'
      )
      if (answer !== 'Remove') return
    }
    const runtime = this.runtimes.get(configId)
    if (runtime) {
      await this.disposeRuntime(runtime)
      this.runtimes.delete(configId)
    }
    this.treeModel.clearConfig(configId)
    this.configs = this.configs.filter((config) => config.id !== configId)
    await this.context.workspaceState.update(
      capturerConfigStateKey,
      this.configs
    )
    if (this.onRemovedCapturer) {
      try {
        await this.onRemovedCapturer({ configId })
      } catch {
        // ignore replay/codelens cleanup failures
      }
    }
    this.refreshTree()
  }

  async startCapturer(target) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer to start'
    )
    if (!configId) {
      return
    }
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    if (runtime.monitor) {
      return
    }
    const problems = (0, collectRuntimeProblems)(runtime)
    if (!(0, isReadyToRecord)(runtime, problems)) {
      return
    }
    try {
      resetTransferMetrics(runtime)
      runtime.monitor = await this.arduinoContext.createMonitorClient(
        runtime.config.port,
        { autoStart: true }
      )
      runtime.monitorState = runtime.monitor.state
      runtime.lastError = undefined
      runtime.monitorSubscriptions.push(
        runtime.monitor.onDidReceiveData((chunk) => {
          try {
            runtime.capturer.push(chunk)
            const now = Date.now()
            recordTransfer(runtime, chunk.byteLength, now)
            runtime.lastChunkEndedWithLineBreak = chunkEndsWithLineBreak(chunk)
            this.scheduleIdleFlush(configId, runtime)
          } catch (err) {
            runtime.lastError = err instanceof Error ? err.message : String(err)
            this.refreshRoot(configId)
          }
        }),
        runtime.monitor.onDidChangeState((state) => {
          runtime.monitorState = state
          if (state === 'disconnected') {
            this.flushRuntime(configId, runtime)
          }
          this.refreshRoot(configId)
        })
      )
      await this.refreshReadiness(configId)
      this.refreshRoot(configId)
    } catch (err) {
      runtime.lastError = err instanceof Error ? err.message : String(err)
      this.refreshRoot(configId)
      vscode.window.showErrorMessage(
        `Failed to start capturer ${runtime.config.port.address}: ${runtime.lastError}`
      )
    }
  }

  async stopCapturer(target) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer to stop'
    )
    if (!configId) {
      return
    }
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    await this.detachMonitor(runtime)
    this.refreshRoot(configId)
  }

  async refresh(target) {
    if (target) {
      const configId = await this.resolveConfigId(target, 'Select capturer')
      if (!configId) {
        return
      }
      const runtime = this.runtimes.get(configId)
      if (runtime) {
        try {
          runtime.capturer.flush()
        } catch (err) {
          runtime.lastError = err instanceof Error ? err.message : String(err)
        }
      }
      await this.refreshReadiness(configId)
      this.refreshRoot(configId)
      return
    }
    for (const config of this.configs) {
      const runtime = this.runtimes.get(config.id)
      if (runtime) {
        try {
          runtime.capturer.flush()
        } catch (err) {
          runtime.lastError = err instanceof Error ? err.message : String(err)
        }
      }
      await this.refreshReadiness(config.id)
    }
    this.refreshTree()
  }

  async compileSketch(target) {
    await this.runCompileForRuntime(target, 'boardlab.compile')
  }

  async compileSketchWithDebugSymbols(target) {
    await this.runCompileForRuntime(target, 'boardlab.compileWithDebugSymbols')
  }

  async runCompileForRuntime(target, command) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer to compile sketch'
    )
    if (!configId) {
      return
    }
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    const sketchFolder = this.arduinoContext.openedSketches.find(
      ({ sketchPath }) => sketchPath === runtime.config.sketchPath
    )
    if (!sketchFolder) {
      vscode.window.showInformationMessage(
        `Could not find sketch at ${runtime.config.sketchPath}`
      )
      return
    }
    await vscode.commands.executeCommand(command, {
      sketchPath: runtime.config.sketchPath,
    })
    await this.refreshReadiness(configId)
    this.refreshRoot(configId)
  }

  async copyToClipboard(arg) {
    if (typeof arg !== 'string' || arg.length === 0) {
      return
    }
    await vscode.env.clipboard.writeText(arg)
  }

  async replayRecording(target, recordingUri) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer for replay'
    )
    if (!configId) {
      return
    }
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    const selectedUri = recordingUri ?? (await this.pickReplayFile())[0]
    if (!selectedUri) {
      return
    }
    await this.context.workspaceState.update(
      replayFileStateKey,
      selectedUri.fsPath
    )
    const rawText = await fs.readFile(selectedUri.fsPath, 'utf8')
    const encoder = new TextEncoder()
    const segments = splitReplaySegments(rawText)
    resetTransferMetrics(runtime)
    for (const segment of segments) {
      const payload = segment.trim().length > 0 ? segment : ''
      if (!payload) {
        continue
      }
      const chunk = encoder.encode(`${payload}\n`)
      runtime.capturer.push(chunk)
      recordTransfer(runtime, chunk.byteLength, Date.now())
      runtime.capturer.flush()
    }
    this.refreshRoot(configId)
  }

  async replayEvent(target) {
    if (!target || target.type !== 'event') {
      return
    }
    const runtime = this.runtimes.get(target.configId)
    const summary = runtime?.eventsBySignature.get(target.signature)
    if (!runtime || !summary) {
      return
    }
    if (!this.evaluateDecodedEvent) {
      return
    }
    if (
      summary.decodeState === 'decoding' ||
      summary.decodeState === 'evaluating'
    ) {
      return
    }
    if (summary.decodeState === 'evaluated' && summary.decodedResult) {
      try {
        const params = await this.resolveDecodeParams(runtime)
        await this.evaluateDecodedEvent({
          meta: toDecodedEventMeta(target.configId, summary),
          params,
          result: summary.decodedResult,
        })
        summary.decodeError = undefined
      } catch (err) {
        summary.decodeError = err instanceof Error ? err.message : String(err)
      } finally {
        this.refreshEvent(target.configId, target.signature)
      }
      return
    }
    if (summary.decodeState !== 'decoded' || !summary.decodedResult) {
      return
    }
    summary.decodeState = 'evaluating'
    this.refreshEvent(target.configId, target.signature)
    const evaluateStartAt = Date.now()
    try {
      const params = await this.resolveDecodeParams(runtime)
      await this.evaluateDecodedEvent({
        meta: toDecodedEventMeta(target.configId, summary),
        params,
        result: summary.decodedResult,
      })
      summary.decodeState = 'evaluated'
      summary.decodeError = undefined
    } catch (err) {
      summary.decodeState = 'decoded'
      summary.decodeError = err instanceof Error ? err.message : String(err)
    } finally {
      summary.lastEvaluateDurationMs = Math.max(0, Date.now() - evaluateStartAt)
      this.refreshEvent(target.configId, target.signature)
    }
  }

  async deleteEvent(target) {
    if (!target || (target.type !== 'event' && target.type !== 'frame')) {
      return
    }
    const runtime = this.runtimes.get(target.configId)
    if (!runtime) {
      return
    }
    const signature = target.signature
    if (!runtime.eventsBySignature.has(signature)) {
      return
    }
    this.removeSummaryBySignature(runtime, signature)
    this.refreshRoot(target.configId)
  }

  async deleteAllEvents(target) {
    const configId = await this.resolveConfigId(
      target,
      'Select capturer to clear crash events'
    )
    if (!configId) {
      return
    }
    const runtime = this.runtimes.get(configId)
    if (!runtime || runtime.eventsBySignature.size === 0) {
      return
    }
    for (const signature of [...runtime.eventsBySignature.keys()]) {
      this.removeSummaryBySignature(runtime, signature)
    }
    this.refreshRoot(configId)
  }

  async dumpCapturerState(target) {
    const runtime = await this.resolveRuntimeForStateDump(target)
    if (!runtime) {
      return
    }
    const rawState = runtime.capturer.getRawState()
    const distinctEvents = Array.from(runtime.eventsBySignature.values()).sort(
      (left, right) => left.firstSeenAt - right.firstSeenAt
    )
    await this.showMarkdownReportPreview(
      `capturer-state-${path.basename(runtime.config.sketchPath)}`,
      (0, toCapturerStateDumpMarkdown)(runtime, rawState, distinctEvents)
    )
  }

  async resolveRuntimeForStateDump(target) {
    const configIdFromTarget = target?.configId
    if (configIdFromTarget) {
      return this.runtimes.get(configIdFromTarget)
    }
    if (this.configs.length === 0) {
      vscode.window.showInformationMessage('No ESP Crash Capturer created.')
      return undefined
    }
    if (this.configs.length === 1) {
      return this.runtimes.get(this.configs[0].id)
    }
    const pick = await vscode.window.showQuickPick(
      this.configs.map((config) => ({
        label: path.basename(config.sketchPath),
        description: `${config.port.address} | ${config.fqbn}`,
        detail: config.sketchPath,
        configId: config.id,
      })),
      {
        placeHolder: 'Select ESP Crash Capturer state to dump',
      }
    )
    return pick ? this.runtimes.get(pick.configId) : undefined
  }

  async showEvent(target) {
    if (!target || target.type !== 'event') {
      return
    }
    const runtime = this.runtimes.get(target.configId)
    const summary = runtime?.eventsBySignature.get(target.signature)
    if (!runtime || !summary) {
      return
    }
    await this.showMarkdownReportPreview(
      `crash-event-${path.basename(runtime.config.sketchPath)}`,
      (0, toEventReportDocumentMarkdown)(runtime, summary)
    )
  }

  async showMarkdownReportPreview(name, content) {
    const reportUri = this.crashReportProvider.createReportUri(name, content)
    await vscode.commands.executeCommand('markdown.showPreview', reportUri)
  }

  getTreeItem(element) {
    if (element.type === 'root') {
      const runtime = this.runtimes.get(element.configId)
      if (!runtime) {
        return new vscode.TreeItem(element.configId)
      }
      const item = new vscode.TreeItem(
        (0, toRootLabel)(runtime),
        vscode.TreeItemCollapsibleState.Collapsed
      )
      item.id = runtime.config.id
      item.description = (0, resolveRootDescription)(runtime)
      item.tooltip = (0, toRootTreeItemMarkdown)(runtime)
      item.contextValue = (0, rootContextValue)(runtime)
      item.iconPath = toRuntimeIcon(runtime)
      return item
    }
    if (element.type === 'frame') {
      const runtime = this.runtimes.get(element.configId)
      const summary = runtime?.eventsBySignature.get(element.signature)
      const frame = summary
        ? (0, collectDecodedStackFrames)(summary.decodedResult)[
            element.frameIndex
          ]
        : undefined
      const frameLocation = (0, toParsedFrameLocation)(frame)
      const sourceKind = classifyDecodedSource(
        frameLocation?.file,
        runtime?.config.sketchPath
      )
      const sourceAvailability = runtime
        ? this.resolveSourceAvailability(
            element.configId,
            runtime,
            frameLocation?.file,
            sourceKind
          )
        : undefined
      const frameUri =
        frameLocation && runtime
          ? toFrameUri(frameLocation.file, runtime.config.sketchPath)
          : undefined
      const item = new vscode.TreeItem(
        (0, frameToLabel)(frame),
        vscode.TreeItemCollapsibleState.None
      )
      item.id = `frame:${element.configId}:${element.signature}:${element.frameIndex}`
      if (frameUri && frameLocation) {
        item.resourceUri = frameUri
        item.description = true
        item.iconPath = vscode.ThemeIcon.File
        const shouldAttachOpenCommand = !(
          sourceKind === 'library' && sourceAvailability === 'missing'
        )
        if (shouldAttachOpenCommand) {
          const line = Math.max(0, frameLocation.line - 1)
          item.command = {
            command: 'vscode.open',
            title: 'Open Frame',
            arguments: [
              frameUri,
              {
                preview: true,
                preserveFocus: true,
                selection: new vscode.Range(line, 0, line, 0),
              },
            ],
          }
        }
      } else {
        item.description = (0, frameToDescription)(frame)
      }
      item.contextValue = 'espCapturerFrame'
      return item
    }
    const runtime = this.runtimes.get(element.configId)
    const summary = runtime?.eventsBySignature.get(element.signature)
    const label = summary
      ? (0, eventDisplayLabel)(summary)
      : (element.signature.slice.trim() ?? 'Unknown event')
    const decodedFrames = summary
      ? (0, collectDecodedStackFrames)(summary.decodedResult)
      : []
    const collapsibleState =
      decodedFrames.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : summary?.decodeState === 'decoded' ||
            summary?.decodeState === 'evaluated'
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed
    const item = new vscode.TreeItem(label, collapsibleState)
    item.id = `event:${element.configId}:${element.signature}`
    item.description = summary ? toEventDescription(summary) : undefined
    item.tooltip =
      summary && runtime
        ? (0, toEventTreeItemMarkdown)(runtime, summary)
        : undefined
    item.contextValue = (0, eventContextValue)(summary)
    item.iconPath =
      summary?.decodeState === 'decoding' ||
      summary?.decodeState === 'evaluating'
        ? new vscode.ThemeIcon('sync~spin')
        : new vscode.ThemeIcon('bug')
    return item
  }

  getChildren(element) {
    if (!element) {
      return this.treeModel.getRootNodes(this.configs)
    }
    if (element.type === 'frame') {
      return []
    }
    if (element.type === 'event') {
      const runtime = this.runtimes.get(element.configId)
      const summary = runtime?.eventsBySignature.get(element.signature)
      const frames = (0, collectDecodedStackFrames)(summary?.decodedResult)
      return this.treeModel.getFrameNodes(
        element.configId,
        element.signature,
        frames.length
      )
    }
    const runtime = this.runtimes.get(element.configId)
    return this.treeModel.getEventNodes(element.configId, runtime)
  }

  getParent(element) {
    if (element.type === 'root') {
      return undefined
    }
    if (element.type === 'event') {
      return this.treeModel.getRootNode(element.configId)
    }
    return this.treeModel.getEventNode(element.configId, element.signature)
  }

  refreshTree() {
    this.onDidChangeTreeDataEmitter.fire(undefined)
  }

  refreshRoot(configId) {
    this.onDidChangeTreeDataEmitter.fire(this.treeModel.getRootNode(configId))
  }

  refreshEvent(configId, signature) {
    this.onDidChangeTreeDataEmitter.fire(
      this.treeModel.getEventNode(configId, signature)
    )
  }

  ensureRuntime(config) {
    const existing = this.runtimes.get(config.id)
    if (existing) {
      return existing
    }
    const capturerOptions = {}
    const capturer = (0, createCapturer)(capturerOptions)
    const runtime = {
      config,
      capturer,
      eventsBySignature: new Map(),
      eventsById: new Map(),
      unsubscribeDetected: capturer.on('eventDetected', (event) =>
        this.handleCapturerEvent(config.id, event)
      ),
      unsubscribeUpdated: capturer.on('eventUpdated', (event) =>
        this.handleCapturerEvent(config.id, event)
      ),
      monitorSubscriptions: [],
      sourceAvailabilityByPath: new Map(),
      lastChunkEndedWithLineBreak: true,
      processedBytes: 0,
      readiness: { sketchExists: false, hasCompileSummary: false },
    }
    this.runtimes.set(config.id, runtime)
    return runtime
  }

  handleCapturerEvent(configId, event) {
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    const hadSummary = runtime.eventsBySignature.has(event.signature)
    const summary = upsertEventSummary(
      runtime.eventsBySignature,
      event,
      runtime
    )
    runtime.eventsById.set(summary.eventId, summary)
    this.startAutoDecode(configId, runtime, summary)
    if (!hadSummary) {
      this.refreshRoot(configId)
      this.revealEventNode({
        type: 'event',
        configId,
        signature: summary.signature,
      })
    }
  }

  async revealEventNode(node) {
    if (!this.treeView) {
      return
    }
    const rootNode = this.treeModel.getRootNode(node.configId)
    const eventNode = this.getChildren(rootNode).find(
      (child) => child.type === 'event' && child.signature === node.signature
    )
    if (!eventNode) {
      return
    }
    try {
      await this.treeView.reveal(rootNode, {
        focus: false,
        select: false,
        expand: true,
      })
      await this.treeView.reveal(eventNode, {
        focus: false,
        select: false,
        expand: true,
      })
    } catch {
      // ignore reveal failures when the view is not visible or the node is stale
    }
  }

  removeSummaryBySignature(runtime, signature) {
    const removedSummary = runtime.eventsBySignature.get(signature)
    this.treeModel.removeEventNode(runtime.config.id, signature)
    runtime.eventsBySignature.delete(signature)
    for (const [eventId, summary] of runtime.eventsById) {
      if (summary.signature === signature) {
        runtime.eventsById.delete(eventId)
      }
    }
    if (removedSummary && this.onRemovedDecodedEvent) {
      Promise.resolve(
        this.onRemovedDecodedEvent({
          key: `${runtime.config.id}:${signature}`,
          configId: runtime.config.id,
          signature,
          eventId: removedSummary.eventId,
        })
      ).catch(() => {
        // ignore replay/codelens cleanup failures
      })
    }
  }

  resolveSourceAvailability(configId, runtime, filePath, sourceKind) {
    if (!filePath || sourceKind !== 'library') {
      return undefined
    }
    const cached = runtime.sourceAvailabilityByPath.get(filePath)
    if (cached) {
      return cached
    }
    runtime.sourceAvailabilityByPath.set(filePath, 'checking')
    this.probeSourceAvailability(configId, runtime, filePath)
    return 'checking'
  }

  async probeSourceAvailability(configId, runtime, filePath) {
    let next = 'present'
    try {
      await fs.access(filePath)
    } catch {
      next = 'missing'
    }
    runtime.sourceAvailabilityByPath.set(filePath, next)
    this.refreshRoot(configId)
  }

  async refreshReadiness(configId) {
    const runtime = this.runtimes.get(configId)
    if (!runtime) {
      return
    }
    const sketchExists = await pathExists(runtime.config.sketchPath)
    const sketchRuntimeInfo = sketchExists
      ? await findSketchRuntimeInfo(runtime.config, this.arduinoContext)
      : undefined
    const nextReadiness = {
      sketchExists,
      hasCompileSummary: sketchRuntimeInfo?.hasCompileSummary ?? false,
      elfPath: sketchRuntimeInfo?.elfPath,
      buildPath: sketchRuntimeInfo?.buildPath,
      buildOptions: sketchRuntimeInfo?.buildOptions,
      boardName: sketchRuntimeInfo?.boardName,
      selectedBoardName: sketchRuntimeInfo?.selectedBoardName,
      selectedBoardFqbn: sketchRuntimeInfo?.selectedBoardFqbn,
      selectedPort: sketchRuntimeInfo?.selectedPort,
      configuredPortDetected: isPortDetected(
        this.arduinoContext.boardsListWatcher?.detectedPorts,
        runtime.config.port
      ),
      workspaceRelativeSketchPath: workspaceRelativeSketchPath(
        runtime.config.sketchPath
      ),
    }
    const prevReadiness = runtime.readiness
    const prevElfIdentity = runtime.elfIdentity
    const nextElfIdentity = nextReadiness.elfPath
      ? await resolveElfIdentity(nextReadiness.elfPath, prevElfIdentity)
      : undefined
    runtime.readiness = nextReadiness
    runtime.elfIdentity = nextElfIdentity
    if (
      !isReadinessEqual(prevReadiness, nextReadiness) ||
      !isElfIdentityEqual(prevElfIdentity, nextElfIdentity)
    ) {
      runtime.decodeParams = undefined
      this.refreshRoot(configId)
    }
  }

  async detachMonitor(runtime) {
    this.flushRuntime(runtime.config.id, runtime)
    for (const disposable of runtime.monitorSubscriptions) {
      disposable.dispose()
    }
    runtime.monitorSubscriptions.length = 0
    this.clearIdleFlushTimer(runtime)
    const monitor = runtime.monitor
    runtime.monitor = undefined
    runtime.monitorState = undefined
    if (monitor) {
      await this.invokeMonitorMethod(monitor, 'stop')
      await this.invokeMonitorMethod(monitor, 'close')
      try {
        monitor.dispose()
      } catch {
        // ignore monitor disposal failures during teardown
      }
    }
  }

  async disposeRuntime(runtime) {
    await this.detachMonitor(runtime)
    runtime.unsubscribeDetected()
    runtime.unsubscribeUpdated()
    runtime.decodeParams = undefined
    runtime.sourceAvailabilityByPath.clear()
    runtime.eventsById.clear()
    runtime.eventsBySignature.clear()
    this.treeModel.clearConfig(runtime.config.id)
  }

  async invokeMonitorMethod(monitor, methodName) {
    const method = monitor[methodName]
    if (typeof method !== 'function') {
      return
    }
    try {
      await method.call(monitor)
    } catch {
      // ignore monitor method failures during teardown
    }
  }

  async resolveConfigId(target, placeholder) {
    if (target?.type === 'root') {
      return target.configId
    }
    if (target?.type === 'event' || target?.type === 'frame') {
      return target.configId
    }
    if (this.configs.length === 1) {
      return this.configs[0].id
    }
    const quickPickItem = await vscode.window.showQuickPick(
      this.configs.map((config) => ({
        label: `${config.port.address} | ${config.fqbn}`,
        detail: config.sketchPath,
        configId: config.id,
      })),
      { placeHolder: placeholder }
    )
    return quickPickItem?.configId
  }

  async pickReplayFile() {
    const defaultPath = this.context.workspaceState.get(replayFileStateKey)
    const defaultUri = defaultPath
      ? vscode.Uri.file(path.dirname(defaultPath))
      : vscode.workspace.workspaceFolders?.[0]?.uri
    const selected = await vscode.window.showOpenDialog({
      canSelectMany: false,
      openLabel: 'Replay recording',
      defaultUri,
      filters: {
        'Text and logs': ['txt', 'log'],
        All: ['*'],
      },
    })
    return selected ?? []
  }

  flushRuntime(configId, runtime) {
    try {
      runtime.capturer.flush()
    } catch (err) {
      runtime.lastError = err instanceof Error ? err.message : String(err)
      this.refreshRoot(configId)
    }
  }

  scheduleIdleFlush(configId, runtime) {
    this.clearIdleFlushTimer(runtime)
    runtime.idleFlushTimer = setTimeout(() => {
      runtime.idleFlushTimer = undefined
      if (!runtime.lastChunkEndedWithLineBreak) {
        return
      }
      this.flushRuntime(configId, runtime)
    }, idleFlushDelayMs)
  }

  clearIdleFlushTimer(runtime) {
    if (runtime.idleFlushTimer) {
      clearTimeout(runtime.idleFlushTimer)
      runtime.idleFlushTimer = undefined
    }
  }

  startAutoDecode(configId, runtime, summary) {
    if (
      summary.decodeState === 'decoding' ||
      summary.decodeState === 'decoded' ||
      summary.decodeState === 'evaluating' ||
      summary.decodeState === 'evaluated'
    ) {
      return
    }
    if (summary.decodeTask) {
      return
    }
    summary.decodeState = 'decoding'
    this.refreshEvent(configId, summary.signature)
    summary.decodeTask = (async () => {
      try {
        const { params, result } = await this.decodeEventSummary(
          runtime,
          summary,
          {
            includeFrameVars: true,
            trackDurationAs: 'decode',
          }
        )
        summary.lastDecodeHeavyVarsCount = (0, countHeavyVars)(result)
        summary.decodedResult = result
        summary.decodeState = 'decoded'
        summary.decodeError = undefined
        if (this.onDecodedEvent) {
          try {
            await this.onDecodedEvent({
              meta: toDecodedEventMeta(configId, summary),
              params,
              result,
            })
          } catch {
            // ignore replay/codelens publication failures
          }
        }
        this.refreshEvent(configId, summary.signature)
        await this.revealEventNode({
          type: 'event',
          configId,
          signature: summary.signature,
        })
      } catch (err) {
        summary.decodeError = err instanceof Error ? err.message : String(err)
      } finally {
        if (
          summary.decodeState !== 'decoded' &&
          summary.decodeState !== 'evaluated'
        ) {
          summary.decodeState = 'detected'
        }
        summary.decodeTask = undefined
        this.refreshEvent(configId, summary.signature)
      }
    })()
  }

  async decodeEventSummary(runtime, summary, options) {
    const decodeStartAt = Date.now()
    try {
      const params = await this.resolveDecodeParams(runtime)
      const decoded = await (0, decode)(params, summary.rawText, {
        includeFrameVars: options.includeFrameVars,
      })
      if (Array.isArray(decoded)) {
        throw new Error(`Decode returned ${decoded.length} results`)
      }
      return { params, result: decoded }
    } finally {
      if ((options.trackDurationAs ?? 'decode') === 'decode') {
        summary.lastDecodeDurationMs = Math.max(0, Date.now() - decodeStartAt)
      }
    }
  }

  async resolveDecodeParams(runtime) {
    if (runtime.decodeParams) {
      return runtime.decodeParams
    }
    const sketch = this.arduinoContext.openedSketches.find(
      (candidate) =>
        typeof candidate.sketchPath === 'string' &&
        pathEquals(candidate.sketchPath, runtime.config.sketchPath)
    )
    if (!sketch) {
      throw new Error(
        `Could not find opened sketch for ${runtime.config.sketchPath}`
      )
    }
    const configuredSketch = withConfiguredFqbn(sketch, runtime.config.fqbn)
    const compileSummary =
      configuredSketch.compileSummary ??
      (runtime.readiness.buildPath
        ? {
            buildPath: runtime.readiness.buildPath,
          }
        : undefined)
    const params = await (0, createDecodeParams)({
      compileSummary,
      board: configuredSketch.board,
      sketchPath: runtime.config.sketchPath,
    })
    runtime.decodeParams = params
    return params
  }
}
export function registerCapturer(context, arduinoContext, options = {}) {
  const toDispose = []
  if (!(0, isBoardLabContextExt)(arduinoContext)) {
    vscode.window.showInformationMessage(
      'The current BoardLab context does expose the experimental monitor feature. Update BoardLab to the latest version and reload Visual Studio Code.'
    )
    return new vscode.Disposable(() => {
      // noop
    })
  }
  vscode.commands.executeCommand(
    'setContext',
    'espExceptionDecoder.capturerAvailable',
    true
  )
  const crashReportProvider = new CrashReportContentProvider()
  const manager = new CapturerManager(
    context,
    arduinoContext,
    crashReportProvider,
    options.evaluateDecodedEvent,
    options.onDecodedEvent,
    options.onRemovedDecodedEvent,
    options.onRemovedCapturer
  )
  const readonlyLibraryProvider = new ReadonlyFsProvider()
  const treeView = vscode.window.createTreeView(capturerViewId, {
    treeDataProvider: manager,
  })
  manager.bindTreeView(treeView)
  toDispose.push(
    manager,
    treeView,
    readonlyLibraryProvider,
    crashReportProvider,
    vscode.workspace.registerFileSystemProvider(
      readonlyLibraryScheme,
      readonlyLibraryProvider,
      { isReadonly: true }
    ),
    vscode.workspace.registerTextDocumentContentProvider(
      crashReportScheme,
      crashReportProvider
    ),
    vscode.commands.registerCommand(capturerCreateCommandId, () =>
      manager.addUsingBoardLabPickers()
    ),
    vscode.commands.registerCommand(capturerRemoveCommandId, (target) =>
      manager.removeConfig(target)
    ),
    vscode.commands.registerCommand(capturerStartCommandId, (target) =>
      manager.startCapturer(target)
    ),
    vscode.commands.registerCommand(capturerStopCommandId, (target) =>
      manager.stopCapturer(target)
    ),
    vscode.commands.registerCommand(capturerRefreshCommandId, (target) =>
      manager.refresh(target)
    ),
    vscode.commands.registerCommand(capturerCompileSketchCommandId, (target) =>
      manager.compileSketch(target)
    ),
    vscode.commands.registerCommand(
      capturerCompileSketchDebugCommandId,
      (target) => manager.compileSketchWithDebugSymbols(target)
    ),
    vscode.commands.registerCommand(capturerCopyToClipboardCommandId, (arg) =>
      manager.copyToClipboard(arg)
    ),
    vscode.commands.registerCommand(dumpCapturerStateCommandId, (target) =>
      manager.dumpCapturerState(target)
    ),
    vscode.commands.registerCommand(capturerReplayCrashCommandId, (target) =>
      manager.replayEvent(target)
    ),
    vscode.commands.registerCommand(capturerDeleteEventCommandId, (target) =>
      manager.deleteEvent(target)
    ),
    vscode.commands.registerCommand(
      capturerDeleteAllEventsCommandId,
      (target) => manager.deleteAllEvents(target)
    ),
    vscode.commands.registerCommand(capturerShowEventCommandId, (target) =>
      manager.showEvent(target)
    )
  )
  return vscode.Disposable.from(...toDispose)
}
function toRuntimeIcon(runtime) {
  const problems = (0, collectRuntimeProblems)(runtime)
  if (problems.some((problem) => problem.severity === 'error')) {
    return new vscode.ThemeIcon('error')
  }
  if (problems.some((problem) => problem.severity === 'warning')) {
    return new vscode.ThemeIcon('warning')
  }
  if (runtime.monitorState === 'running') {
    return new vscode.ThemeIcon('pulse')
  }
  if (
    runtime.monitorState === 'suspended' &&
    (0, isRuntimeConnected)(runtime)
  ) {
    return new vscode.ThemeIcon('sync~spin')
  }
  if ((0, isReadyToRecord)(runtime, problems)) {
    return new vscode.ThemeIcon('pass')
  }
  return new vscode.ThemeIcon('error')
}
function toEventDescription(summary) {
  const createdLabel = `Created ${(0, formatLocalTimestamp)(summary.createdAt)}`
  if (!summary.captureSessionLabel) {
    return createdLabel
  }
  return `${createdLabel} | ${summary.captureSessionLabel}`
}
function toDraftFromSketch(sketch) {
  if (!sketch?.sketchPath) {
    return undefined
  }
  const fqbn = sketch.board?.fqbn
  const port = sketch.port
  if (!fqbn || !isPortIdentifierLike(port)) {
    return undefined
  }
  return {
    sketchPath: sketch.sketchPath,
    fqbn,
    port: {
      protocol: port.protocol,
      address: port.address,
    },
  }
}
function isPortIdentifierLike(arg) {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    typeof arg.protocol === 'string' &&
    typeof arg.address === 'string'
  )
}
function buildCapturerId(config) {
  return `${config.port.protocol}://${config.port.address}|${config.fqbn}|${path.normalize(config.sketchPath)}`
}
function validateCapturerConfig(value) {
  if (!isPortIdentifierLike(value.port)) {
    return {
      ok: false,
      message: 'Capturer port is missing or invalid',
    }
  }
  if (typeof value.fqbn !== 'string' || value.fqbn.trim().length === 0) {
    return {
      ok: false,
      message: 'Capturer FQBN is required',
    }
  }
  if (
    typeof value.sketchPath !== 'string' ||
    value.sketchPath.trim().length === 0
  ) {
    return {
      ok: false,
      message: 'Capturer sketch path is required',
    }
  }
  try {
    const fqbn = new FQBN(value.fqbn).sanitize()
    if (!supportedCapturerArchitectures.has(fqbn.arch)) {
      return {
        ok: false,
        message: `Unsupported board architecture: '${fqbn.arch}'. Supported architectures: esp32, esp8266`,
      }
    }
    return {
      ok: true,
      value: {
        port: {
          protocol: value.port.protocol.trim(),
          address: value.port.address.trim(),
        },
        fqbn: fqbn.toString(),
        sketchPath: path.resolve(value.sketchPath),
      },
    }
  } catch (err) {
    return {
      ok: false,
      message: `Invalid FQBN: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}
function pathEquals(left, right) {
  return path.normalize(left) === path.normalize(right)
}
async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}
async function resolveElfIdentity(elfPath, previous) {
  let stats
  try {
    stats = await fs.stat(elfPath)
  } catch {
    return undefined
  }
  if (!stats.isFile()) {
    return undefined
  }
  const size = stats.size
  const mtimeMs = Math.floor(stats.mtimeMs)
  if (
    previous &&
    previous.path === elfPath &&
    previous.size === size &&
    previous.mtimeMs === mtimeMs
  ) {
    return previous
  }
  let sha256
  try {
    const content = await fs.readFile(elfPath)
    sha256 = (0, createHash)('sha256').update(content).digest('hex')
  } catch {
    return undefined
  }
  const sha256Short = sha256.slice
  return {
    path: elfPath,
    size,
    mtimeMs,
    sha256,
    sha256Short,
    sessionId: `${sha256Short}-${mtimeMs}`,
  }
}
function isPortDetected(detectedPorts, port) {
  if (!port) {
    return undefined
  }
  const detected = extractDetectedPorts(detectedPorts)
  if (!detected) {
    return undefined
  }
  return detected.some((candidate) => arePortsEqual(candidate, port))
}
function extractDetectedPorts(detectedPorts) {
  if (!detectedPorts || typeof detectedPorts !== 'object') {
    return undefined
  }
  const entries = Array.isArray(detectedPorts)
    ? detectedPorts
    : Object.values(detectedPorts)
  const ports = []
  for (const entry of entries) {
    if (isPortIdentifierLike(entry)) {
      ports.push({ protocol: entry.protocol, address: entry.address })
      continue
    }
    const nested = entry?.port
    if (isPortIdentifierLike(nested)) {
      ports.push({ protocol: nested.protocol, address: nested.address })
    }
  }
  return ports
}
function arePortsEqual(left, right) {
  return left.protocol === right.protocol && left.address === right.address
}
async function loadCompileBuildOptions(buildPath) {
  const optionsPath = path.join(buildPath, 'build.options.json')
  let rawJson
  try {
    rawJson = await fs.readFile(optionsPath, 'utf8')
  } catch {
    return undefined
  }
  let parsed
  try {
    parsed = JSON.parse(rawJson)
  } catch {
    return {
      buildPath,
      optionsPath,
      flags: [],
      parseError: 'Invalid JSON',
    }
  }
  if (!isRecord(parsed)) {
    return {
      buildPath,
      optionsPath,
      flags: [],
      parseError: 'Unexpected JSON shape',
    }
  }
  return {
    buildPath,
    optionsPath,
    fqbn: pickNonEmptyString(parsed, 'fqbn'),
    sketchLocation: pickNonEmptyString(parsed, 'sketchLocation'),
    optimizationFlags: pickNonEmptyString(
      parsed,
      'compiler.optimization_flags'
    ),
    customBuildProperties: pickNonEmptyString(parsed, 'customBuildProperties'),
    flags: collectBuildFlagEntries(parsed),
  }
}
function pickNonEmptyString(record, key) {
  const value = record[key]
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}
function collectBuildFlagEntries(record) {
  return Object.entries(record)
    .flatMap(([key, value]) => {
      if (typeof value !== 'string') {
        return []
      }
      const trimmed = value.trim()
      if (trimmed.length === 0 || !key.toLowerCase().includes('flags')) {
        return []
      }
      return [`${key}=${trimmed}`]
    })
    .sort((left, right) => left.localeCompare(right))
}
function isRecord(value) {
  return typeof value === 'object' && value !== null
}
async function findSketchRuntimeInfo(config, arduinoContext) {
  const sketchName = path.basename(config.sketchPath)
  const matchingSketch = arduinoContext.openedSketches.find((sketch) =>
    pathEquals(sketch.sketchPath, config.sketchPath)
  )
  const compileSummaryBuildPath =
    typeof matchingSketch?.compileSummary?.buildPath === 'string'
      ? matchingSketch.compileSummary.buildPath
      : undefined
  const compileSummaryElfPath = compileSummaryBuildPath
    ? await (0, findElfPath)(sketchName, compileSummaryBuildPath)
    : undefined
  const fallbackBuild = !compileSummaryBuildPath
    ? await (0, resolveBuildPathFromSketchPath)(config.sketchPath, sketchName, {
        sketchRealPath: await resolveRealPath(config.sketchPath),
      })
    : undefined
  const buildPath = compileSummaryBuildPath ?? fallbackBuild?.buildPath
  const elfPath = compileSummaryElfPath ?? fallbackBuild?.elfPath
  const buildOptions = buildPath
    ? await loadCompileBuildOptions(buildPath)
    : undefined
  const hasCompileSummary =
    typeof compileSummaryBuildPath === 'string' ||
    typeof fallbackBuild?.buildPath === 'string'
  return {
    hasCompileSummary,
    elfPath,
    buildPath,
    buildOptions,
    boardName: resolveSketchBoardName(matchingSketch, config.fqbn),
    selectedBoardName:
      typeof matchingSketch?.board?.name === 'string'
        ? matchingSketch.board.name
        : undefined,
    selectedBoardFqbn:
      typeof matchingSketch?.board?.fqbn === 'string'
        ? (0, sanitizeFqbn)(matchingSketch.board.fqbn)
        : undefined,
    selectedPort: isPortIdentifierLike(matchingSketch?.port)
      ? {
          protocol: matchingSketch.port.protocol,
          address: matchingSketch.port.address,
        }
      : undefined,
  }
}
async function resolveRealPath(targetPath) {
  try {
    return await fs.realpath(targetPath)
  } catch {
    return undefined
  }
}
function resolveSketchBoardName(sketch, engineFqbn) {
  const name = sketch?.board?.name
  const sketchFqbn = sketch?.board?.fqbn
  if (typeof name !== 'string' || typeof sketchFqbn !== 'string') {
    return undefined
  }
  const sanitizedSketchFqbn = (0, sanitizeFqbn)(sketchFqbn)
  const sanitizedEngineFqbn = (0, sanitizeFqbn)(engineFqbn)
  if (!sanitizedSketchFqbn || !sanitizedEngineFqbn) {
    return undefined
  }
  if (sanitizedSketchFqbn !== sanitizedEngineFqbn) {
    return undefined
  }
  return name
}
function toEventSummary(event, runtime) {
  const captureSession = runtime?.elfIdentity
  return {
    eventId: event.id,
    signature: event.signature,
    reason:
      event.lightweight.reasonLine ??
      event.lines.find((line) => line.trim().length > 0) ??
      event.kind,
    kind: event.kind,
    createdAt: event.firstSeenAt,
    captureSessionId: captureSession?.sessionId,
    captureSessionLabel: captureSession
      ? `${captureSession.sha256Short} @ ${(0, formatLocalTimestamp)(captureSession.mtimeMs)}`
      : undefined,
    count: event.count,
    firstSeenAt: event.firstSeenAt,
    lastSeenAt: event.lastSeenAt,
    rawText: event.rawText,
    programCounter: event.lightweight.programCounter,
    faultCode: event.lightweight.faultCode,
    decodeState: 'detected',
  }
}
function toDecodedEventMeta(configId, summary) {
  return {
    key: `${configId}:${summary.signature}`,
    configId,
    signature: summary.signature,
    eventId: summary.eventId,
    label: (0, eventDisplayLabel)(summary),
    reason: summary.reason,
    createdAt: summary.createdAt,
    captureSessionId: summary.captureSessionId,
    captureSessionLabel: summary.captureSessionLabel,
  }
}
function upsertEventSummary(cache, event, runtime) {
  const next = toEventSummary(event, runtime)
  const previous = cache.get(event.signature)
  if (!previous) {
    cache.set(event.signature, next)
    return next
  }
  previous.eventId = next.eventId
  previous.reason = next.reason
  previous.kind = next.kind
  previous.captureSessionId = next.captureSessionId
  previous.captureSessionLabel = next.captureSessionLabel
  previous.count = event.count
  previous.firstSeenAt = event.firstSeenAt
  previous.lastSeenAt = event.lastSeenAt
  previous.rawText = event.rawText
  previous.programCounter = next.programCounter
  previous.faultCode = next.faultCode
  cache.set(event.signature, previous)
  return previous
}
function loadPersistedConfigs(values) {
  return values
    .map((raw) =>
      validateCapturerConfig(typeof raw === 'object' && raw !== null ? raw : {})
    )
    .filter((result) => result.ok)
    .map(({ value }) => ({
      id: buildCapturerId(value),
      ...value,
    }))
}
function splitReplaySegments(rawText) {
  const normalized = rawText.replace(/\r\n/g, '\n')
  if (splitMarker.test(normalized)) {
    return normalized
      .split(/^\s*---\s*SNAP\s*---\s*$/gim)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
  }
  return [normalized]
}
function isReadinessEqual(left, right) {
  return (
    left.sketchExists === right.sketchExists &&
    left.hasCompileSummary === right.hasCompileSummary &&
    left.elfPath === right.elfPath &&
    left.buildPath === right.buildPath &&
    isBuildOptionsEqual(left.buildOptions, right.buildOptions) &&
    left.boardName === right.boardName &&
    left.selectedBoardName === right.selectedBoardName &&
    left.selectedBoardFqbn === right.selectedBoardFqbn &&
    arePortsEqualOrUndefined(left.selectedPort, right.selectedPort) &&
    left.configuredPortDetected === right.configuredPortDetected &&
    left.workspaceRelativeSketchPath === right.workspaceRelativeSketchPath
  )
}
function arePortsEqualOrUndefined(left, right) {
  if (!left && !right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  return arePortsEqual(left, right)
}
function isBuildOptionsEqual(left, right) {
  if (!left && !right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  return (
    left.buildPath === right.buildPath &&
    left.optionsPath === right.optionsPath &&
    left.fqbn === right.fqbn &&
    left.sketchLocation === right.sketchLocation &&
    left.optimizationFlags === right.optimizationFlags &&
    left.customBuildProperties === right.customBuildProperties &&
    left.parseError === right.parseError &&
    areStringArraysEqual(left.flags, right.flags)
  )
}
function isElfIdentityEqual(left, right) {
  if (!left && !right) {
    return true
  }
  if (!left || !right) {
    return false
  }
  return (
    left.path === right.path &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.sha256 === right.sha256 &&
    left.sessionId === right.sessionId
  )
}
function areStringArraysEqual(left, right) {
  if (left.length !== right.length) {
    return false
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }
  return true
}
function chunkEndsWithLineBreak(chunk) {
  if (chunk.length === 0) {
    return false
  }
  const last = chunk[chunk.length - 1]
  return last === 0x0a || last === 0x0d
}
function resetTransferMetrics(runtime) {
  runtime.processedBytes = 0
  runtime.processedFirstAt = undefined
  runtime.processedLastAt = undefined
}
function recordTransfer(runtime, byteLength, atMs) {
  if (byteLength <= 0) {
    return
  }
  runtime.processedBytes += byteLength
  if (runtime.processedFirstAt === undefined) {
    runtime.processedFirstAt = atMs
  }
  runtime.processedLastAt = atMs
}
function withConfiguredFqbn(sketch, fqbn) {
  if (!sketch.board || typeof sketch.board !== 'object') {
    return sketch
  }
  return {
    ...sketch,
    board: {
      ...sketch.board,
      fqbn,
    },
  }
}
function toFrameUri(filePath, sketchPath) {
  if (classifyDecodedSource(filePath, sketchPath) === 'library') {
    return (0, toReadonlyLibraryUri)(filePath)
  }
  return vscode.Uri.file(filePath)
}
function classifyDecodedSource(filePath, sketchPath) {
  if (!filePath || !filePath.trim()) {
    return 'missing'
  }
  if (!sketchPath || !sketchPath.trim()) {
    return 'library'
  }
  return isPathInside(sketchPath, filePath) ? 'sketch' : 'library'
}
function isPathInside(parentPath, candidatePath) {
  const normalize = (value) =>
    process.platform === 'win32'
      ? path.resolve(value).toLowerCase()
      : path.resolve(value)
  const parent = normalize(parentPath)
  const candidate = normalize(candidatePath)
  const relative = path.relative(parent, candidate)
  return (
    relative.length === 0 ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  )
}
function workspaceRelativeSketchPath(sketchPath) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.find((folder) => {
    const relative = path.relative(folder.uri.fsPath, sketchPath)
    return !relative.startsWith('..') && !path.isAbsolute(relative)
  })
  if (!workspaceFolder) {
    return undefined
  }
  return path.relative(workspaceFolder.uri.fsPath, sketchPath)
}
/** (non-API) */
export const __tests = {
  capturerConfigStateKey,
  validateCapturerConfig,
  buildCapturerId,
  loadPersistedConfigs,
  pathEquals,
  isPortIdentifierLike,
  isPortDetected,
  extractDetectedPorts,
  arePortsEqual,
  pickNonEmptyString,
  isRecord,
  resolveSketchBoardName,
  toEventSummary,
  upsertEventSummary,
  splitReplaySegments,
  loadCompileBuildOptions,
  collectBuildFlagEntries,
  isReadinessEqual,
  isBuildOptionsEqual,
  isElfIdentityEqual,
  areStringArraysEqual,
  chunkEndsWithLineBreak,
  resetTransferMetrics,
  recordTransfer,
  classifyDecodedSource,
  isPathInside,
  workspaceRelativeSketchPath,
  eventDisplayLabel,
  collectDecodedStackFrames,
}
