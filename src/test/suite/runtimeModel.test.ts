import assert from 'node:assert/strict'

import {
  collectRuntimeProblems,
  eventContextValue,
  getRuntimeStatus,
  isReadyToRecord,
  isRuntimeConnected,
  resolveRootDescription,
  rootContextValue,
  sanitizeFqbn,
  toRootLabel,
  type RuntimeLike,
} from '../../capturer/runtimeModel'

function createRuntime(
  overrides: Partial<RuntimeLike> = {},
  readinessOverrides: Partial<RuntimeLike['readiness']> = {}
): RuntimeLike {
  const base: RuntimeLike = {
    config: {
      id: 'serial:///dev/mock0|esp32:esp32:esp32c3|/tmp/sketch',
      fqbn: 'esp32:esp32:esp32c3',
      sketchPath: '/tmp/sketch',
      port: {
        protocol: 'serial',
        address: '/dev/mock0',
      },
    },
    readiness: {
      sketchExists: true,
      hasCompileSummary: true,
      elfPath: '/tmp/sketch/build/sketch.ino.elf',
      boardName: 'ESP32C3 Dev Module',
      selectedBoardName: 'ESP32C3 Dev Module',
      selectedBoardFqbn: 'esp32:esp32:esp32c3',
      configuredPortDetected: true,
      ...readinessOverrides,
    },
    monitorState: undefined,
    eventsBySignature: new Map<string, unknown>(),
    ...overrides,
  }
  return base
}

describe('runtimeModel', () => {
  it('returns ready status and root description when runtime is healthy', () => {
    const runtime = createRuntime()
    assert.equal(getRuntimeStatus(runtime), 'Ready')
    assert.equal(resolveRootDescription(runtime), 'Ready')
    assert.equal(isReadyToRecord(runtime), true)
  })

  it('returns capturing status and context when monitor is running', () => {
    const runtime = createRuntime({ monitor: {}, monitorState: 'running' })
    assert.equal(getRuntimeStatus(runtime), 'Capturing crashes')
    assert.equal(resolveRootDescription(runtime), 'Capturing crashes')
    assert.equal(rootContextValue(runtime), 'espCapturerRootCapturing')
  })

  it('returns disconnected description when configured port is not detected', () => {
    const runtime = createRuntime(
      {},
      {
        configuredPortDetected: false,
      }
    )
    assert.equal(getRuntimeStatus(runtime), 'Disconnected')
    assert.equal(resolveRootDescription(runtime), 'Not connected')
    assert.equal(isRuntimeConnected(runtime), false)
  })

  it('returns invalid fqbn status and problem', () => {
    const runtime = createRuntime({
      config: {
        ...createRuntime().config,
        fqbn: 'invalid-fqbn',
      },
    })
    const problems = collectRuntimeProblems(runtime)
    assert.equal(
      problems.some((problem) => problem.code === 'invalid-fqbn'),
      true
    )
    assert.equal(getRuntimeStatus(runtime), 'Invalid FQBN')
  })

  it('returns warnings when sketch and build fqbn differ from capturer fqbn', () => {
    const runtime = createRuntime(
      {
        config: {
          ...createRuntime().config,
          fqbn: 'esp32:esp32:esp32da',
        },
      },
      {
        selectedBoardFqbn: 'esp32:esp32:esp32c3',
        buildOptions: {
          fqbn: 'esp32:esp32:esp32c3',
        },
      }
    )
    const problems = collectRuntimeProblems(runtime)
    assert.equal(
      problems.some(
        (problem) => problem.code === 'fqbn-mismatch-selected-engine'
      ),
      true
    )
    assert.equal(
      problems.some(
        (problem) => problem.code === 'fqbn-mismatch-selected-build'
      ),
      true
    )
    assert.equal(getRuntimeStatus(runtime), 'Warning')
    assert.equal(resolveRootDescription(runtime), 'Sketch FQBN mismatch')
  })

  it('returns build mismatch warning when build fqbn differs from capturer fqbn', () => {
    const runtime = createRuntime(
      {},
      {
        buildOptions: {
          fqbn: 'esp32:esp32:esp32da',
        },
      }
    )
    const problems = collectRuntimeProblems(runtime)
    assert.equal(
      problems.some(
        (problem) => problem.code === 'fqbn-mismatch-selected-engine'
      ),
      false
    )
    assert.equal(
      problems.some(
        (problem) => problem.code === 'fqbn-mismatch-selected-build'
      ),
      true
    )
    assert.equal(resolveRootDescription(runtime), 'Build FQBN mismatch')
  })

  it('uses expected root context values based on state and event count', () => {
    const ready = createRuntime()
    assert.equal(rootContextValue(ready), 'espCapturerRootReady')

    const readyWithEvents = createRuntime({
      eventsBySignature: new Map<string, unknown>([['sig', {}]]),
    })
    assert.equal(
      rootContextValue(readyWithEvents),
      'espCapturerRootReadyHasEvents'
    )

    const stoppedWithEvents = createRuntime(
      {
        monitor: undefined,
        monitorState: 'disconnected',
        eventsBySignature: new Map<string, unknown>([['sig', {}]]),
      },
      { configuredPortDetected: false }
    )
    assert.equal(
      rootContextValue(stoppedWithEvents),
      'espCapturerRootStoppedHasEvents'
    )

    const stoppedFixable = createRuntime(
      {},
      {
        hasCompileSummary: false,
      }
    )
    assert.equal(
      rootContextValue(stoppedFixable),
      'espCapturerRootStoppedFixableCompile'
    )

    const stoppedFixableWithEvents = createRuntime(
      {
        eventsBySignature: new Map<string, unknown>([['sig', {}]]),
      },
      {
        hasCompileSummary: false,
      }
    )
    assert.equal(
      rootContextValue(stoppedFixableWithEvents),
      'espCapturerRootStoppedFixableCompileHasEvents'
    )

    const capturingFixable = createRuntime(
      {
        monitor: {},
        monitorState: 'running',
      },
      {
        selectedBoardFqbn: 'esp32:esp32:esp32da',
      }
    )
    assert.equal(
      rootContextValue(capturingFixable),
      'espCapturerRootCapturingFixableSync'
    )
  })

  it('maps event context values by decode state', () => {
    assert.equal(eventContextValue(undefined), 'espCapturerEvent')
    assert.equal(
      eventContextValue({ decodeState: 'detected' }),
      'espCapturerEventDetected'
    )
    assert.equal(
      eventContextValue({ decodeState: 'decoding' }),
      'espCapturerEventDecoding'
    )
    assert.equal(
      eventContextValue({ decodeState: 'decoded' }),
      'espCapturerEventDecoded'
    )
    assert.equal(
      eventContextValue({ decodeState: 'evaluating' }),
      'espCapturerEventEvaluating'
    )
    assert.equal(
      eventContextValue({ decodeState: 'evaluated' }),
      'espCapturerEventEvaluated'
    )
  })

  it('formats root label and sanitizes fqbn', () => {
    const runtime = createRuntime()
    assert.equal(
      toRootLabel(runtime),
      '/dev/mock0 · sketch · ESP32C3 Dev Module'
    )
    const runtimeWithoutBoardName = createRuntime(
      {},
      {
        boardName: undefined,
        selectedBoardName: undefined,
      }
    )
    assert.equal(
      toRootLabel(runtimeWithoutBoardName),
      '/dev/mock0 · sketch · esp32c3'
    )
    const runtimeWithMismatchedSelectedBoard = createRuntime(
      {
        config: {
          ...createRuntime().config,
          fqbn: 'esp32:esp32:esp32da',
        },
      },
      {
        boardName: undefined,
        selectedBoardName: 'ESP32C3 Dev Module',
        selectedBoardFqbn: 'esp32:esp32:esp32c3',
      }
    )
    assert.equal(
      toRootLabel(runtimeWithMismatchedSelectedBoard),
      '/dev/mock0 · sketch · esp32da'
    )
    assert.equal(sanitizeFqbn('esp32:esp32:esp32c3'), 'esp32:esp32:esp32c3')
    assert.equal(sanitizeFqbn('invalid'), undefined)
  })

  it('returns generic error status for runtime-error and resolves description message', () => {
    const runtime = createRuntime({
      lastError: 'monitor failed',
    })
    assert.equal(getRuntimeStatus(runtime), 'Error')
    assert.equal(resolveRootDescription(runtime), 'monitor failed')
  })

  it('handles explicit connected/disconnected runtime connectivity', () => {
    const connected = createRuntime(
      { monitorState: 'connected' },
      { configuredPortDetected: undefined }
    )
    assert.equal(isRuntimeConnected(connected), true)

    const disconnected = createRuntime(
      { monitorState: 'disconnected' },
      { configuredPortDetected: undefined }
    )
    assert.equal(isRuntimeConnected(disconnected), false)
  })
})
