import assert from 'node:assert/strict'

import type { DecodeResult } from 'trbr'

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
} from '../../capturer/markdown'
import type {
  CapturerEventSummary,
  CapturerReadiness,
  CapturerRuntime,
} from '../../capturer/model'

function createReadiness(
  overrides: Partial<CapturerReadiness> = {}
): CapturerReadiness {
  return {
    sketchExists: true,
    hasCompileSummary: true,
    elfPath: '/tmp/sketch/build/sketch.ino.elf',
    buildOptions: {
      buildPath: '/tmp/sketch/build',
      optionsPath: '/tmp/sketch/build/build.options.json',
      fqbn: 'esp32:esp32:esp32c3',
      optimizationFlags: '-Og -g3',
      flags: [],
    },
    boardName: 'ESP32C3 Dev Module',
    selectedBoardName: 'ESP32C3 Dev Module',
    selectedBoardFqbn: 'esp32:esp32:esp32c3',
    configuredPortDetected: true,
    ...overrides,
  }
}

function createRuntime(
  overrides: Partial<CapturerRuntime> = {},
  readinessOverrides: Partial<CapturerReadiness> = {}
): CapturerRuntime {
  return {
    config: {
      id: 'serial:///dev/mock0|esp32:esp32:esp32c3|/tmp/sketch',
      fqbn: 'esp32:esp32:esp32c3',
      sketchPath: '/tmp/sketch',
      port: {
        protocol: 'serial',
        address: '/dev/mock0',
      },
    },
    capturer: {} as any,
    eventsBySignature: new Map<string, CapturerEventSummary>(),
    eventsById: new Map<string, CapturerEventSummary>(),
    unsubscribeDetected: () => {
      // noop
    },
    unsubscribeUpdated: () => {
      // noop
    },
    monitorSubscriptions: [],
    sourceAvailabilityByPath: new Map(),
    lastChunkEndedWithLineBreak: true,
    processedBytes: 0,
    readiness: createReadiness(readinessOverrides),
    ...overrides,
  } as CapturerRuntime
}

function createDecoded(): DecodeResult {
  return {
    faultInfo: {
      faultMessage:
        "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled.",
      coreId: 1,
      programCounter: {
        location: {
          regAddr: '0x400d1111',
          lineNumber: '7',
          file: '/tmp/sketch/pc.cpp',
          method: 'pc',
        } as any,
      },
    },
    globals: [{ name: 'g', value: '1' }] as any,
    stacktraceLines: [
      {
        regAddr: '0x400d1234',
        lineNumber: '4',
        file: '/tmp/sketch/main.ino',
        method: 'loop',
        args: [{ name: 'a' }, { name: 'b' }],
        locals: [{ name: 'l' }],
        globals: [{ name: 'gg' }],
      } as any,
      {
        regAddr: '0x400d0000',
        lineNumber: '0',
      } as any,
    ],
  } as any
}

function createEvent(
  overrides: Partial<CapturerEventSummary> = {}
): CapturerEventSummary {
  return {
    eventId: 'event-1',
    signature: 'sig-1',
    reason:
      "Guru Meditation Error: Core  1 panic'ed (StoreProhibited). Exception was unhandled.",
    kind: 'xtensa',
    createdAt: 1_000,
    captureSessionId: 'session-1',
    captureSessionLabel: 'abcd1234 @ 1/1/2026',
    count: 2,
    firstSeenAt: 1_000,
    lastSeenAt: 2_000,
    rawText: 'Guru Meditation Error\n```raw```',
    programCounter: 0x400d1234,
    faultCode: 29,
    decodeState: 'decoded',
    decodedResult: createDecoded(),
    lastDecodeDurationMs: 1234,
    lastEvaluateDurationMs: 321,
    lastDecodeHeavyVarsCount: 7,
    ...overrides,
  }
}

describe('markdown', () => {
  it('renders root markdown with quick fixes when compile output is missing', () => {
    const runtime = createRuntime(
      {},
      {
        hasCompileSummary: false,
        elfPath: undefined,
        configuredPortDetected: false,
      }
    )
    const markdown = toRootTreeItemMarkdown(runtime).value
    assert.equal(markdown.includes('Quick Fixes:'), true)
    assert.equal(markdown.includes('Compile Sketch with Debug Symbols'), true)
    assert.equal(markdown.includes('Compile Sketch'), true)
    assert.equal(markdown.includes('Problems:'), true)
    assert.equal(markdown.includes('No device found.'), true)
  })

  it('renders root markdown with compile details and status icons', () => {
    const ready = createRuntime()
    assert.equal(toRootTreeItemMarkdown(ready).value.includes('$(pass)'), true)

    const capturing = createRuntime({
      monitor: {} as any,
      monitorState: 'running',
    })
    assert.equal(
      toRootTreeItemMarkdown(capturing).value.includes('$(pulse)'),
      true
    )

    const suspended = createRuntime({
      monitor: {} as any,
      monitorState: 'suspended',
    })
    assert.equal(
      toRootTreeItemMarkdown(suspended).value.includes('$(sync~spin)'),
      true
    )

    const warning = createRuntime(
      {},
      { selectedBoardFqbn: 'esp32:esp32:esp32da' }
    )
    assert.equal(
      toRootTreeItemMarkdown(warning).value.includes('$(warning)'),
      true
    )
    assert.equal(
      toRootTreeItemMarkdown(ready).value.includes('Optimization Flags'),
      true
    )
    assert.equal(
      toRootTreeItemMarkdown(ready).value.includes('Quick Fixes:'),
      false
    )
  })

  it('renders compact event markdown tooltip', () => {
    const runtime = createRuntime()
    const summary = createEvent()
    const markdown = toEventTreeItemMarkdown(runtime, summary).value
    assert.equal(markdown.includes('#### Crash Summary'), true)
    assert.equal(markdown.includes('#### Captured Crash'), false)
    assert.equal(markdown.includes('Decoded Exception'), true)
  })

  it('renders full event report markdown with payload and session details', () => {
    const runtime = createRuntime()
    const summary = createEvent({ decodeError: 'decode fail' })
    const markdown = toEventReportDocumentMarkdown(runtime, summary)
    assert.equal(markdown.includes('# ESP Crash Event Report'), true)
    assert.equal(markdown.includes('#### Captured Crash'), true)
    assert.equal(markdown.includes('#### Decoded Stacktrace'), true)
    assert.equal(markdown.includes('Decode Error'), true)
    assert.equal(markdown.includes('Session Details'), true)
    assert.equal(markdown.includes('Program Counter'), true)
    assert.equal(markdown.includes('``\\`raw``\\`'), true)
  })

  it('escapes backslashes and backticks in inline code spans', () => {
    const runtime = createRuntime(
      {
        config: {
          id: 'serial://C:\\tmp\\runtime`id',
          fqbn: 'esp32:esp32:esp32c3',
          sketchPath: 'C:\\tmp\\sketch`name',
          port: {
            protocol: 'serial',
            address: 'COM5',
          },
        } as any,
      },
      {
        elfPath: 'C:\\tmp\\build\\sketch`name.ino.elf',
      }
    )
    const summary = createEvent({
      signature: 'sig\\path`tick',
      captureSessionId: 'session\\id`1',
    })

    const markdown = toEventReportDocumentMarkdown(runtime, summary)
    assert.equal(
      markdown.includes('`C:\\\\tmp\\\\build\\\\sketch\\`name.ino.elf`'),
      true
    )
    assert.equal(markdown.includes('`sig\\\\path\\`tick`'), true)
    assert.equal(markdown.includes('`session\\\\id\\`1`'), true)
  })

  it('renders capturer state dump for empty and populated events', () => {
    const runtime = createRuntime({
      processedBytes: 16 * 1024,
      processedFirstAt: 1_000,
      processedLastAt: 3_000,
      monitorState: 'running',
      elfIdentity: {
        path: '/tmp/sketch/build/sketch.ino.elf',
        size: 123,
        mtimeMs: 2_000,
        sha256: 'abcdef',
        sha256Short: 'abcdef',
        sessionId: 'session',
      },
    })
    const emptyDump = toCapturerStateDumpMarkdown(
      runtime,
      { lines: [], bytes: [], byteLength: 32 } as any,
      []
    )
    assert.equal(emptyDump.includes('_No crash events were detected._'), true)

    const fullDump = toCapturerStateDumpMarkdown(
      runtime,
      { lines: ['a', 'b'], bytes: [], byteLength: 2 * 1024 * 1024 } as any,
      [createEvent()]
    )
    assert.equal(fullDump.includes('MiB'), true)
    assert.equal(fullDump.includes('KiB'), true)
    assert.equal(fullDump.includes('Bandwidth:'), true)
    assert.equal(fullDump.includes('## Distinct Events'), true)
  })

  it('formats event labels, frames and parsed locations', () => {
    const event = createEvent({ decodedResult: undefined })
    assert.equal(eventDisplayLabel(event), event.reason)

    const decoded = createDecoded()
    event.decodedResult = decoded
    assert.equal(eventDisplayLabel(event), 'Guru Meditation Error · main.ino')

    assert.equal(collectDecodedStackFrames(undefined).length, 0)
    assert.equal(collectDecodedStackFrames(decoded).length, 2)
    assert.equal(countHeavyVars(decoded), 3)

    const first = collectDecodedStackFrames(decoded)[0]
    assert.equal(frameToLabel(first).includes('loop (a, b)'), true)
    assert.equal(frameToDescription(first), 'main.ino:4')
    assert.deepEqual(toParsedFrameLocation(first), {
      file: '/tmp/sketch/main.ino',
      line: 4,
    })
    assert.equal(frameToLabel(undefined), 'Unknown frame')
    assert.equal(frameToDescription(undefined), undefined)
    assert.equal(toParsedFrameLocation(undefined), undefined)
    assert.equal(
      toParsedFrameLocation({ regAddr: '0x1', lineNumber: '0' } as any),
      undefined
    )
    assert.equal(typeof formatLocalTimestamp(0), 'string')
  })
})
