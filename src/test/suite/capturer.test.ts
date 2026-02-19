import assert from 'node:assert/strict'
import { promises as fs, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { CapturerEvent, DecodeResult } from 'trbr'
import vscode from 'vscode'

import type {
  BoardLabContextExt,
  MonitorClient,
  MonitorRuntimeState,
  MonitorSuspensionResult,
} from '../../boardLabExt'
import {
  type CapturerNode,
  type CapturerRootNode,
  CapturerManager,
  __tests,
} from '../../capturer'
import {
  mockArduinoContext,
  mockBoardDetails,
  mockCompileSummary,
  mockSketchFolder,
} from './mock'

class TestMemento implements vscode.Memento {
  constructor(private readonly store = new Map<string, unknown>()) {}

  get<T>(key: string): T | undefined
  get<T>(key: string, defaultValue: T): T
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.store.has(key)) {
      return defaultValue
    }
    return this.store.get(key) as T
  }

  keys(): readonly string[] {
    return Array.from(this.store.keys())
  }

  async update(key: string, value: unknown): Promise<void> {
    this.store.set(key, value)
  }
}

class FakeMonitorClient implements MonitorClient {
  readonly onDidReceiveData: vscode.Event<Uint8Array>
  readonly onDidChangeState: vscode.Event<MonitorRuntimeState>
  private readonly receiveEmitter = new vscode.EventEmitter<Uint8Array>()
  private readonly stateEmitter = new vscode.EventEmitter<MonitorRuntimeState>()
  private _state: MonitorRuntimeState = 'running'
  disposed = false

  constructor(
    readonly port: { protocol: string; address: string },
    state: MonitorRuntimeState = 'running'
  ) {
    this._state = state
    this.onDidReceiveData = this.receiveEmitter.event
    this.onDidChangeState = this.stateEmitter.event
  }

  get state(): MonitorRuntimeState {
    return this._state
  }

  emitData(chunk: Uint8Array): void {
    this.receiveEmitter.fire(chunk)
  }

  emitState(state: MonitorRuntimeState): void {
    this._state = state
    this.stateEmitter.fire(state)
  }

  async send(_message: string | Uint8Array): Promise<void> {
    // noop
  }

  dispose(): void {
    this.disposed = true
    this.receiveEmitter.dispose()
    this.stateEmitter.dispose()
  }
}

class FakeTreeView<T> {
  badge: vscode.ViewBadge | undefined

  async reveal(
    _element: T,
    _options?: {
      select?: boolean
      focus?: boolean
      expand?: boolean | number
    }
  ): Promise<void> {
    // noop
  }

  dispose(): void {
    // noop
  }
}

function mkdtempInSystemTmp(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), prefix))
}

describe('capturer', () => {
  it('validates capturer config input', () => {
    const invalid = __tests.validateCapturerConfig({})
    assert.strictEqual(invalid.ok, false)

    const unsupportedArch = __tests.validateCapturerConfig({
      port: { protocol: 'serial', address: '/dev/mock0' },
      fqbn: 'arduino:avr:uno',
      sketchPath: '/tmp/sketch-a',
    })
    assert.strictEqual(unsupportedArch.ok, false)

    const valid = __tests.validateCapturerConfig({
      port: { protocol: 'serial', address: '/dev/mock0' },
      fqbn: 'esp32:esp32:esp32c3',
      sketchPath: '/tmp/sketch-a',
    })
    assert.strictEqual(valid.ok, true)
    assert.strictEqual(valid.ok && valid.value.fqbn, 'esp32:esp32:esp32c3')

    const validWithOptions = __tests.validateCapturerConfig({
      port: { protocol: 'serial', address: '/dev/mock0' },
      fqbn: 'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app',
      sketchPath: '/tmp/sketch-a',
    })
    assert.strictEqual(validWithOptions.ok, true)
    assert.strictEqual(
      validWithOptions.ok && validWithOptions.value.fqbn,
      'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app'
    )
  })

  it('covers config/runtime helper utilities', () => {
    assert.strictEqual(__tests.pathEquals('/tmp/a/../b', '/tmp/b'), true)
    assert.strictEqual(__tests.isPortIdentifierLike({}), false)
    assert.strictEqual(
      __tests.isPortIdentifierLike({ protocol: 'serial', address: '/dev/1' }),
      true
    )
    assert.deepStrictEqual(__tests.extractDetectedPorts(undefined), undefined)
    assert.strictEqual(
      __tests.arePortsEqual(
        { protocol: 'serial', address: '/dev/1' },
        { protocol: 'serial', address: '/dev/1' }
      ),
      true
    )
    assert.strictEqual(
      __tests.isPortDetected([{ protocol: 'serial', address: '/dev/1' }], {
        protocol: 'serial',
        address: '/dev/1',
      }),
      true
    )
    assert.strictEqual(__tests.pickNonEmptyString({ k: '  v  ' }, 'k'), 'v')
    assert.strictEqual(__tests.pickNonEmptyString({ k: '   ' }, 'k'), undefined)
    assert.strictEqual(__tests.isRecord({}), true)
    assert.strictEqual(__tests.isRecord(null), false)
    assert.strictEqual(
      __tests.resolveSketchBoardName(
        { board: { name: 'ESP', fqbn: 'esp32:esp32:esp32c3' } },
        'esp32:esp32:esp32c3'
      ),
      'ESP'
    )
    assert.strictEqual(
      __tests.resolveSketchBoardName(
        { board: { name: 'ESP', fqbn: 'esp32:esp32:esp32da' } },
        'esp32:esp32:esp32c3'
      ),
      undefined
    )
    assert.strictEqual(
      __tests.resolveConfiguredFqbn({
        configOptions: 'CPUFreq=240,PartitionScheme=huge_app',
        board: { fqbn: 'esp32:esp32:esp32da' },
      }),
      'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app'
    )
    assert.deepStrictEqual(
      __tests.toDraftFromSketch({
        sketchPath: '/tmp/sketch-with-options',
        configOptions: 'CPUFreq=240,PartitionScheme=huge_app',
        board: { fqbn: 'esp32:esp32:esp32da' },
        port: { protocol: 'serial', address: '/dev/ttyUSB0' },
      }),
      {
        sketchPath: path.resolve('/tmp/sketch-with-options'),
        fqbn: 'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app',
        port: { protocol: 'serial', address: '/dev/ttyUSB0' },
      }
    )
  })

  it('covers transfer/readiness/source helpers', () => {
    assert.strictEqual(__tests.areStringArraysEqual(['a'], ['a']), true)
    assert.strictEqual(__tests.areStringArraysEqual(['a'], ['b']), false)
    assert.strictEqual(
      __tests.chunkEndsWithLineBreak(new Uint8Array([0x41, 0x0a])),
      true
    )
    assert.strictEqual(
      __tests.chunkEndsWithLineBreak(new Uint8Array([0x41])),
      false
    )

    const runtime: {
      processedBytes: number
      processedFirstAt?: number
      processedLastAt?: number
    } = {
      processedBytes: 10,
      processedFirstAt: 1,
      processedLastAt: 2,
    }
    __tests.resetTransferMetrics(runtime)
    assert.deepStrictEqual(runtime, {
      processedBytes: 0,
      processedFirstAt: undefined,
      processedLastAt: undefined,
    })
    __tests.recordTransfer(runtime, 0, 10)
    assert.strictEqual(runtime.processedBytes, 0)
    __tests.recordTransfer(runtime, 4, 10)
    __tests.recordTransfer(runtime, 8, 20)
    assert.strictEqual(runtime.processedBytes, 12)
    assert.strictEqual(runtime.processedFirstAt, 10)
    assert.strictEqual(runtime.processedLastAt, 20)

    const leftReadiness = {
      sketchExists: true,
      hasCompileSummary: true,
      elfPath: '/tmp/elf',
      buildPath: '/tmp/build',
      buildOptions: {
        buildPath: '/tmp/build',
        optionsPath: '/tmp/build/build.options.json',
        fqbn: 'esp32:esp32:esp32c3',
        flags: [],
      },
      boardName: 'ESP',
      selectedBoardName: 'ESP',
      selectedBoardFqbn: 'esp32:esp32:esp32c3',
      selectedPort: { protocol: 'serial', address: '/dev/1' },
      configuredPortDetected: true,
      workspaceRelativeSketchPath: 'sketch',
    }
    assert.strictEqual(
      __tests.isReadinessEqual(leftReadiness, { ...leftReadiness }),
      true
    )
    assert.strictEqual(
      __tests.isBuildOptionsEqual(leftReadiness.buildOptions, {
        ...leftReadiness.buildOptions,
      }),
      true
    )
    assert.strictEqual(
      __tests.isBuildOptionsEqual(leftReadiness.buildOptions, undefined),
      false
    )
    assert.strictEqual(
      __tests.isElfIdentityEqual(
        {
          path: '/tmp/elf',
          size: 1,
          mtimeMs: 2,
          sha256: 'abc',
          sessionId: 'x',
        },
        {
          path: '/tmp/elf',
          size: 1,
          mtimeMs: 2,
          sha256: 'abc',
          sessionId: 'x',
        }
      ),
      true
    )
    assert.strictEqual(
      __tests.classifyDecodedSource('/tmp/sketch/main.cpp', '/tmp/sketch'),
      'sketch'
    )
    assert.strictEqual(
      __tests.classifyDecodedSource('/tmp/lib/main.cpp', '/tmp/sketch'),
      'library'
    )
    assert.strictEqual(
      __tests.classifyDecodedSource(undefined, '/tmp/sketch'),
      'missing'
    )
    assert.strictEqual(
      __tests.isPathInside('/tmp/sketch', '/tmp/sketch/a'),
      true
    )
  })

  it('ignores single-line crash fragments without decode anchors', () => {
    const truncatedEvent: CapturerEvent = {
      id: 'event-fragment',
      signature:
        "xtensa|guru meditation error: core 1 panic'ed (storeprohibited). exception|fc:na|nopc",
      kind: 'xtensa',
      lines: [
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception",
      ],
      rawText:
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception",
      firstSeenAt: 10,
      lastSeenAt: 10,
      count: 1,
      lightweight: {
        reasonLine:
          "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception",
        programCounter: undefined,
        faultCode: undefined,
        faultAddr: undefined,
        regs: {},
        backtraceAddrs: [],
      },
      fastFrames: undefined,
      evaluated: undefined,
    }

    assert.strictEqual(__tests.shouldIgnoreCapturerEvent(truncatedEvent), true)

    const completeEnoughEvent: CapturerEvent = {
      ...truncatedEvent,
      id: 'event-complete',
      signature: 'sig-complete',
      lightweight: {
        ...truncatedEvent.lightweight,
        programCounter: 0x400d1234,
      },
    }
    assert.strictEqual(
      __tests.shouldIgnoreCapturerEvent(completeEnoughEvent),
      false
    )

    const multiLineEvent: CapturerEvent = {
      ...truncatedEvent,
      id: 'event-multi',
      signature: 'sig-multi',
      lines: [
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception",
        'Core 1 register dump:',
      ],
      rawText:
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception\nCore 1 register dump:",
    }
    assert.strictEqual(__tests.shouldIgnoreCapturerEvent(multiLineEvent), false)
  })

  it('resolves ELF identity with stable short hash prefix', async () => {
    const buildPath = await mkdtempInSystemTmp('capturer-elf-identity-')
    const elfPath = path.join(buildPath, 'sample.elf')
    try {
      await fs.writeFile(elfPath, 'elf-content')
      const identity = await __tests.resolveElfIdentity(elfPath)
      assert.ok(identity)
      assert.strictEqual(identity.sha256Short, identity.sha256.slice(0, 8))
      assert.strictEqual(identity.sha256Short.length, 8)
      assert.ok(identity.sessionId.startsWith(`${identity.sha256Short}-`))

      const reused = await __tests.resolveElfIdentity(elfPath, identity)
      assert.strictEqual(reused, identity)
    } finally {
      await fs.rm(buildPath, { recursive: true, force: true })
    }
  })

  it('deduplicates summaries by event signature', () => {
    const cache = new Map<string, ReturnType<typeof __tests.toEventSummary>>()
    const event: CapturerEvent = {
      id: '1',
      signature: 'sig-1',
      kind: 'xtensa',
      lines: ['StoreProhibited'],
      rawText: 'panic',
      firstSeenAt: 10,
      lastSeenAt: 10,
      count: 1,
      lightweight: {
        reasonLine: 'StoreProhibited',
        programCounter: 0x1234,
        faultCode: 29,
        faultAddr: undefined,
        regs: {},
        backtraceAddrs: [],
      },
      fastFrames: undefined,
      evaluated: undefined,
    }
    __tests.upsertEventSummary(cache, event)
    __tests.upsertEventSummary(cache, {
      ...event,
      id: '2',
      count: 2,
      lastSeenAt: 20,
    })

    assert.strictEqual(cache.size, 1)
    const summary = cache.get('sig-1')
    assert.ok(summary)
    assert.strictEqual(summary.createdAt, 10)
    assert.strictEqual(summary.count, 2)
    assert.strictEqual(summary.lastSeenAt, 20)
  })

  it('replaces raw text with latest data for same-signature updates', () => {
    const cache = new Map<string, ReturnType<typeof __tests.toEventSummary>>()
    const event: CapturerEvent = {
      id: 'event-1',
      signature: 'sig-1',
      kind: 'xtensa',
      lines: ['Guru Meditation Error'],
      rawText:
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled.\n\nBacktrace: 0x1 0x2",
      firstSeenAt: 10,
      lastSeenAt: 10,
      count: 1,
      lightweight: {
        reasonLine:
          "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled.",
        programCounter: 0x1234,
        faultCode: 29,
        faultAddr: undefined,
        regs: {},
        backtraceAddrs: [],
      },
      fastFrames: undefined,
      evaluated: undefined,
    }
    __tests.upsertEventSummary(cache, event)
    __tests.upsertEventSummary(cache, {
      ...event,
      id: 'event-2',
      lastSeenAt: 20,
      rawText:
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled.",
    })

    const summary = cache.get('sig-1')
    assert.ok(summary)
    assert.strictEqual(
      summary.rawText,
      "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled."
    )
  })

  it('formats decoded event label with source location', () => {
    const summary = __tests.toEventSummary({
      id: 'event-1',
      signature: 'sig',
      kind: 'xtensa',
      lines: ['Guru Meditation Error'],
      rawText: 'Guru Meditation Error',
      firstSeenAt: 10,
      lastSeenAt: 20,
      count: 1,
      lightweight: {
        reasonLine: 'Guru Meditation Error',
        programCounter: 0x1234,
        faultCode: undefined,
        faultAddr: undefined,
        regs: {},
        backtraceAddrs: [],
      },
      fastFrames: undefined,
      evaluated: undefined,
    })
    assert.strictEqual(
      __tests.eventDisplayLabel(summary),
      'Guru Meditation Error'
    )

    const decoded: DecodeResult = {
      stacktraceLines: [
        {
          regAddr: '0x400d1234',
          lineNumber: '4',
          file: '/tmp/main.ino',
          method: 'loop',
        },
      ],
    }
    summary.decodedResult = decoded
    assert.strictEqual(
      __tests.eventDisplayLabel(summary),
      'Guru Meditation Error · main.ino'
    )
  })

  it('loads compile options from build.options.json', async () => {
    const buildPath = await mkdtempInSystemTmp('capturer-build-options-')
    try {
      await fs.writeFile(
        path.join(buildPath, 'build.options.json'),
        JSON.stringify(
          {
            fqbn: 'esp32:esp32:esp32da',
            sketchLocation: '/tmp/sketch',
            'compiler.optimization_flags': '-Os',
            'compiler.c.extra_flags': '-Og -g3',
            'compiler.cpp.extra_flags': '-Og -g3',
            customBuildProperties: '',
          },
          null,
          2
        )
      )
      const compileOptions = await __tests.loadCompileBuildOptions(buildPath)
      assert.ok(compileOptions)
      assert.strictEqual(compileOptions.buildPath, buildPath)
      assert.strictEqual(compileOptions.fqbn, 'esp32:esp32:esp32da')
      assert.strictEqual(compileOptions.optimizationFlags, '-Os')
      assert.deepStrictEqual(compileOptions.flags, [
        'compiler.c.extra_flags=-Og -g3',
        'compiler.cpp.extra_flags=-Og -g3',
        'compiler.optimization_flags=-Os',
      ])
    } finally {
      await fs.rm(buildPath, { recursive: true, force: true })
    }
  })

  it('loads and persists configs', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-load-')
    const state = new TestMemento(
      new Map<string, unknown>([
        [
          __tests.capturerConfigStateKey,
          [
            {
              sketchPath,
              fqbn: 'esp32:esp32:esp32c3',
              port: { protocol: 'serial', address: '/dev/load0' },
            },
            {
              sketchPath: '',
              fqbn: 'invalid',
            },
          ],
        ],
      ])
    )
    const context = {
      workspaceState: state,
      subscriptions: [],
    } as unknown as vscode.ExtensionContext

    const arduino = createBoardLabArduinoContext()
    const manager = new CapturerManager(context, arduino)
    const roots = manager.getChildren()
    assert.strictEqual(roots.length, 1)

    await manager.addConfig({
      sketchPath: await mkdtempInSystemTmp('capturer-save-'),
      fqbn: 'esp32:esp32:esp32c3',
      port: { protocol: 'serial', address: '/dev/save0' },
    })
    const persisted = state.get<unknown[]>(__tests.capturerConfigStateKey, [])
    assert.strictEqual(persisted.length, 2)
    manager.dispose()
  })

  it('replays monitor recording and updates tree nodes', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-replay-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    const arduino = createBoardLabArduinoContext({
      sketchPath,
      portAddress: '/dev/replay0',
    })
    const manager = new CapturerManager(context, arduino)

    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32c3',
      port: { protocol: 'serial', address: '/dev/replay0' },
    })
    assert.ok(config)
    const root = {
      type: 'root',
      configId: config.id,
    } as const

    let treeRefreshes = 0
    const disposeChange = manager.onDidChangeTreeData(() => {
      treeRefreshes += 1
    })
    try {
      const fixturePath = path.resolve(
        __dirname,
        '../../../src/test/fixtures/monitor.txt'
      )
      await manager.replayRecording(root, vscode.Uri.file(fixturePath))

      const children = manager.getChildren(root)
      assert.ok(children.length >= 1)
      const childItems = children.map((child) => manager.getTreeItem(child))
      assert.ok(
        childItems.every(
          (item) =>
            typeof item.description === 'string' &&
            item.description.startsWith('Created ')
        )
      )
      const firstEventItem = childItems[0]
      assert.ok(firstEventItem.tooltip instanceof vscode.MarkdownString)
      const firstEventTooltip = firstEventItem.tooltip.value
      assert.ok(firstEventTooltip.includes('- Crash:'))
      assert.ok(firstEventTooltip.includes('- Location:'))
      assert.ok(!firstEventTooltip.includes('- Count:'))
      assert.ok(firstEventTooltip.includes('- Build:'))
      assert.ok(!firstEventTooltip.includes('#### Crash Summary'))
      assert.ok(!firstEventTooltip.includes('#### Build Context'))
      assert.ok(!firstEventTooltip.includes('- ELF Path:'))
      const rootItem = manager.getTreeItem(root)
      assert.ok(rootItem.tooltip instanceof vscode.MarkdownString)
      assert.ok(treeRefreshes > 0)
    } finally {
      disposeChange.dispose()
      manager.dispose()
    }
  })

  it('shows problems when sketch is not compiled', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-not-compiled-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    const arduino = createBoardLabArduinoContext({
      sketchPath,
      portAddress: '/dev/notcompiled0',
      includeCompileSummary: false,
      detectedPort: false,
    })
    const manager = new CapturerManager(context, arduino)

    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32da',
      port: { protocol: 'serial', address: '/dev/notcompiled0' },
    })
    assert.ok(config)
    const root: CapturerRootNode = {
      type: 'root',
      configId: config.id,
    }
    const item = manager.getTreeItem(root)
    assert.strictEqual(item.description, 'Not connected')
    assert.ok(item.iconPath instanceof vscode.ThemeIcon)
    assert.strictEqual(item.iconPath.id, 'error')
    assert.ok(item.tooltip instanceof vscode.MarkdownString)
    const markdown = item.tooltip.value
    assert.ok(markdown.includes('Problems:'))
    assert.ok(
      markdown.includes('Compile summary is not available for the sketch')
    )
    assert.ok(!markdown.includes('Quick Fixes:'))
    manager.dispose()
  })

  it('uses warning icon and mismatch description for fqbn mismatches', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-fqbn-mismatch-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    const arduino = createBoardLabArduinoContext({
      sketchPath,
      portAddress: '/dev/fqbn0',
      detectedPort: true,
      sketchBoardFqbn: 'esp32:esp32:esp32c3',
      buildOptionsFqbn: 'esp32:esp32:esp32c3',
      includeElf: true,
    })
    const manager = new CapturerManager(context, arduino)
    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32da',
      port: { protocol: 'serial', address: '/dev/fqbn0' },
    })
    assert.ok(config)
    const root: CapturerRootNode = {
      type: 'root',
      configId: config.id,
    }
    const item = manager.getTreeItem(root)
    assert.strictEqual(item.description, 'Sketch FQBN mismatch')
    assert.ok(item.iconPath instanceof vscode.ThemeIcon)
    assert.strictEqual(item.iconPath.id, 'warning')
    manager.dispose()
  })

  it('starts and stops monitor lifecycle', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-monitor-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    let createdMonitor: FakeMonitorClient | undefined

    const arduino = createBoardLabArduinoContext(
      {
        sketchPath,
        portAddress: '/dev/monitor0',
        detectedPort: true,
      },
      async (port) => {
        createdMonitor = new FakeMonitorClient(port, 'running')
        return createdMonitor
      }
    )

    const manager = new CapturerManager(context, arduino)
    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32c3',
      port: { protocol: 'serial', address: '/dev/monitor0' },
    })
    assert.ok(config)
    const root: CapturerRootNode = {
      type: 'root',
      configId: config.id,
    }

    await manager.startCapturer(root)
    assert.ok(createdMonitor)
    const runningItem = manager.getTreeItem(root)
    assert.strictEqual(runningItem.description, 'Capturing crashes')
    assert.ok(runningItem.iconPath instanceof vscode.ThemeIcon)
    assert.strictEqual(runningItem.iconPath.id, 'pulse')

    await manager.stopCapturer(root)
    assert.strictEqual(createdMonitor.disposed, true)
    const stoppedItem = manager.getTreeItem(root)
    assert.strictEqual(stoppedItem.description, 'Ready')

    manager.dispose()
  })

  it('updates view badge based on active capture sessions', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-badge-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    const arduino = createBoardLabArduinoContext({
      sketchPath,
      portAddress: '/dev/badge0',
      detectedPort: true,
    })
    const manager = new CapturerManager(context, arduino)
    const treeView = new FakeTreeView<CapturerNode>()
    manager.bindTreeView(treeView as unknown as vscode.TreeView<CapturerNode>)

    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32c3',
      port: { protocol: 'serial', address: '/dev/badge0' },
    })
    assert.ok(config)
    const root: CapturerRootNode = {
      type: 'root',
      configId: config.id,
    }

    assert.strictEqual(treeView.badge, undefined)

    await manager.startCapturer(root)
    assert.deepStrictEqual(treeView.badge, {
      value: 1,
      tooltip: '1 active crash capture session',
    })

    await manager.stopCapturer(root)
    assert.strictEqual(treeView.badge, undefined)

    await manager.startCapturer(root)
    await manager.removeConfig(root, { force: true })
    assert.strictEqual(treeView.badge, undefined)

    manager.dispose()
  })

  it('returns no child nodes when no exceptions are detected', async () => {
    const sketchPath = await mkdtempInSystemTmp('capturer-empty-child-')
    const context = {
      workspaceState: new TestMemento(),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext
    const arduino = createBoardLabArduinoContext({
      sketchPath,
      portAddress: '/dev/empty0',
      detectedPort: true,
    })
    const manager = new CapturerManager(context, arduino)
    const config = await manager.addConfig({
      sketchPath,
      fqbn: 'esp32:esp32:esp32c3',
      port: { protocol: 'serial', address: '/dev/empty0' },
    })
    assert.ok(config)
    const root: CapturerRootNode = {
      type: 'root',
      configId: config.id,
    }

    const children = manager.getChildren(root)
    assert.strictEqual(children.length, 0)

    manager.dispose()
  })
})

function createBoardLabArduinoContext(
  options: {
    sketchPath?: string
    portAddress?: string
    sketchBoardFqbn?: string
    buildOptionsFqbn?: string
    includeCompileSummary?: boolean
    includeElf?: boolean
    detectedPort?: boolean
  } = {},
  createMonitorClient?: (port: {
    protocol: string
    address: string
  }) => Promise<FakeMonitorClient>
): ArduinoContextWithBoardLab {
  const sketchPath = options.sketchPath ?? '/tmp/mock-sketch'
  const portAddress = options.portAddress ?? '/dev/mock0'
  const sketchBoardFqbn = options.sketchBoardFqbn ?? 'esp32:esp32:esp32c3'
  const buildOptionsFqbn = options.buildOptionsFqbn ?? sketchBoardFqbn
  const includeCompileSummary = options.includeCompileSummary ?? true
  const includeElf = options.includeElf ?? includeCompileSummary
  const buildPath = path.join(sketchPath, '.build')
  if (includeCompileSummary) {
    mkdirSync(buildPath, { recursive: true })
    writeFileSync(
      path.join(buildPath, 'build.options.json'),
      JSON.stringify({
        fqbn: buildOptionsFqbn,
        'compiler.optimization_flags': '-Os',
      })
    )
  }
  if (includeCompileSummary && includeElf) {
    writeFileSync(
      path.join(buildPath, `${path.basename(sketchPath)}.ino.elf`),
      ''
    )
  }
  const sketchFolder = mockSketchFolder({
    sketchPath,
    port: { protocol: 'serial', address: portAddress },
    board: mockBoardDetails(sketchBoardFqbn),
    compileSummary: includeCompileSummary
      ? mockCompileSummary(buildPath)
      : undefined,
  })
  const base = mockArduinoContext({
    currentSketch: sketchFolder,
    openedSketches: [sketchFolder],
  })
  const boardLab = base as ArduinoContextWithBoardLab
  const detectedPorts =
    options.detectedPort === false
      ? ({} as BoardLabContextExt['boardsListWatcher']['detectedPorts'])
      : ({
          mock: {
            port: { protocol: 'serial', address: portAddress },
          },
        } as unknown as BoardLabContextExt['boardsListWatcher']['detectedPorts'])
  const detectedPortsEmitter = new vscode.EventEmitter<typeof detectedPorts>()
  ;(
    boardLab as unknown as {
      boardsListWatcher: BoardLabContextExt['boardsListWatcher']
    }
  ).boardsListWatcher = {
    detectedPorts,
    onDidChangeDetectedPorts: detectedPortsEmitter.event,
  }
  boardLab.createMonitorClient = async (port) => {
    if (createMonitorClient) {
      return createMonitorClient(port)
    }
    return new FakeMonitorClient(port)
  }
  boardLab.withMonitorSuspended = async <T extends MonitorSuspensionResult>(
    _port: { protocol: string; address: string },
    run: (options?: { retry?: number }) => Promise<T>
  ): Promise<T> => run()
  boardLab.pickSketch = async () => sketchFolder
  boardLab.selectSketch = async () => sketchFolder
  boardLab.pickBoard = async () => sketchFolder.board
  boardLab.selectBoard = async (_currentSketchOrOptions, pickOptions) => {
    const selection = sketchFolder.board
    if (
      pickOptions?.filters &&
      Array.isArray(pickOptions.filters) &&
      selection &&
      'fqbn' in selection
    ) {
      for (const filter of pickOptions.filters) {
        const isVisible = await filter({
          board: selection,
          selection,
        } as never)
        if (!isVisible) {
          return undefined
        }
      }
    }
    return selection
  }
  boardLab.setBoardByFqbn = async (fqbn) => {
    const targetFqbn = typeof fqbn === 'string' ? fqbn : fqbn.toString()
    const updatedBoard = mockBoardDetails(targetFqbn)
    ;(
      sketchFolder as unknown as {
        board: ReturnType<typeof mockBoardDetails>
      }
    ).board = updatedBoard
    return updatedBoard
  }
  boardLab.pickPort = async () => sketchFolder.port
  boardLab.selectPort = async () => sketchFolder.port
  return boardLab
}

type ArduinoContextWithBoardLab = ReturnType<typeof mockArduinoContext> &
  BoardLabContextExt
