import assert from 'node:assert/strict'
import path from 'node:path'

import type { BoardLabContextExt } from '../../boardLabExt'
import {
  isSupportedCapturerArch,
  isSupportedCapturerFqbn,
  modeNeedsBoardSelection,
  modeNeedsPortSelection,
  resolveConfiguredFqbn,
  resolveSketchPath,
  resolveSketchTargetWithBoardLab,
  toDraftFromSketch,
  toPortIdentifier,
  toSketchTargetSelectionModeItems,
} from '../../boardLabTarget'

describe('boardLabTarget', () => {
  it('resolves sketch path from sketchPath and uri', () => {
    assert.strictEqual(
      resolveSketchPath({ sketchPath: 'workspace/sketch-a' }),
      path.resolve('workspace/sketch-a')
    )
    assert.strictEqual(
      resolveSketchPath({ uri: { fsPath: 'workspace/sketch-b' } }),
      path.resolve('workspace/sketch-b')
    )
    assert.strictEqual(resolveSketchPath({}), undefined)
  })

  it('resolves configured fqbn from board fqbn + config options', () => {
    assert.strictEqual(
      resolveConfiguredFqbn({
        configOptions: 'CPUFreq=240',
        board: { fqbn: 'esp32:esp32:esp32da' },
      }),
      'esp32:esp32:esp32da:CPUFreq=240'
    )
    assert.strictEqual(
      resolveConfiguredFqbn({
        board: { fqbn: 'esp32:esp32:esp32c3' },
      }),
      'esp32:esp32:esp32c3'
    )
    assert.strictEqual(
      resolveConfiguredFqbn({
        fqbn: 'esp8266:esp8266:nodemcuv2',
      }),
      'esp8266:esp8266:nodemcuv2'
    )
    assert.strictEqual(
      resolveConfiguredFqbn({
        configOptions: 'esp32:esp32:esp32da:CPUFreq=240',
      }),
      'esp32:esp32:esp32da:CPUFreq=240'
    )
    assert.strictEqual(
      resolveConfiguredFqbn({
        configOptions: 'CPUFreq=240',
      }),
      undefined
    )
    assert.strictEqual(
      resolveConfiguredFqbn({ configOptions: '  ' }),
      undefined
    )
  })

  it('normalizes direct and nested port identifiers', () => {
    assert.deepStrictEqual(
      toPortIdentifier({ protocol: 'serial', address: '/dev/ttyUSB0' }),
      { protocol: 'serial', address: '/dev/ttyUSB0' }
    )
    assert.deepStrictEqual(
      toPortIdentifier({
        port: { protocol: 'network', address: '192.168.1.3:23' },
      }),
      { protocol: 'network', address: '192.168.1.3:23' }
    )
    assert.strictEqual(toPortIdentifier({ protocol: 'serial' }), undefined)
  })

  it('builds capturer draft from sketch state when complete', () => {
    const draft = toDraftFromSketch({
      sketchPath: 'workspace/sketch-with-target',
      configOptions: 'CPUFreq=240,PartitionScheme=huge_app',
      board: { fqbn: 'esp32:esp32:esp32da' },
      port: { protocol: 'serial', address: '/dev/ttyUSB0' },
    })

    assert.deepStrictEqual(draft, {
      sketchPath: path.resolve('workspace/sketch-with-target'),
      fqbn: 'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app',
      port: { protocol: 'serial', address: '/dev/ttyUSB0' },
    })
    assert.strictEqual(
      toDraftFromSketch({
        sketchPath: 'workspace/sketch-without-port',
        board: { fqbn: 'esp32:esp32:esp32c3' },
      }),
      undefined
    )
  })

  it('returns creation modes based on available board/port', () => {
    const toModes = (value: unknown) =>
      toSketchTargetSelectionModeItems(value).map((item) => item.mode)

    assert.deepStrictEqual(
      toModes({
        board: { fqbn: 'esp32:esp32:esp32c3' },
        port: { protocol: 'serial', address: '/dev/mock0' },
      }),
      ['use-sketch-target', 'select-board', 'select-port', 'select-both']
    )
    assert.deepStrictEqual(
      toModes({
        board: { fqbn: 'esp32:esp32:esp32c3' },
      }),
      ['use-board-select-port', 'select-board-select-port']
    )
    assert.deepStrictEqual(
      toModes({
        port: { protocol: 'serial', address: '/dev/mock0' },
      }),
      ['use-port-select-board', 'select-board-select-port']
    )
    assert.deepStrictEqual(
      toModes({
        board: { fqbn: 'arduino:avr:uno' },
        port: { protocol: 'serial', address: '/dev/mock0' },
      }),
      ['use-port-select-board', 'select-board-select-port']
    )
    assert.deepStrictEqual(toModes({}), ['select-both'])
  })

  it('maps mode to required board and port selections', () => {
    const matrix = [
      {
        mode: 'use-sketch-target',
        needsBoard: false,
        needsPort: false,
      },
      {
        mode: 'select-board',
        needsBoard: true,
        needsPort: false,
      },
      {
        mode: 'select-port',
        needsBoard: false,
        needsPort: true,
      },
      {
        mode: 'select-both',
        needsBoard: true,
        needsPort: true,
      },
      {
        mode: 'use-board-select-port',
        needsBoard: false,
        needsPort: true,
      },
      {
        mode: 'use-port-select-board',
        needsBoard: true,
        needsPort: false,
      },
      {
        mode: 'select-board-select-port',
        needsBoard: true,
        needsPort: true,
      },
    ] as const

    for (const entry of matrix) {
      assert.strictEqual(modeNeedsBoardSelection(entry.mode), entry.needsBoard)
      assert.strictEqual(modeNeedsPortSelection(entry.mode), entry.needsPort)
    }
  })

  it('resolves sketch target from boardlab selections with select->pick fallback', async () => {
    const calls: string[] = []
    const boardLab = {
      pickSketch: async () => {
        calls.push('pickSketch')
        return {
          sketchPath: 'workspace/sketch-fallback',
        }
      },
      selectBoard: async () => {
        calls.push('selectBoard')
        return undefined
      },
      pickBoard: async () => {
        calls.push('pickBoard')
        return { fqbn: 'esp32:esp32:esp32da' }
      },
      selectPort: async () => {
        calls.push('selectPort')
        return undefined
      },
      pickPort: async () => {
        calls.push('pickPort')
        return { protocol: 'serial', address: '/dev/ttyUSB-fallback' }
      },
    } as unknown as Pick<
      BoardLabContextExt,
      'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
    >
    const draft = await resolveSketchTargetWithBoardLab({
      boardLab,
      openedSketches: [
        {
          sketchPath: 'workspace/sketch-fallback',
        },
      ],
      pickMode: async () => undefined,
    })

    assert.deepStrictEqual(draft, {
      sketchPath: path.resolve('workspace/sketch-fallback'),
      fqbn: 'esp32:esp32:esp32da',
      port: { protocol: 'serial', address: '/dev/ttyUSB-fallback' },
    })
    assert.deepStrictEqual(calls, [
      'pickSketch',
      'selectBoard',
      'pickBoard',
      'selectPort',
      'pickPort',
    ])
  })

  it('uses refreshed opened sketch values when select commands update sketch state', async () => {
    const openedSketch = {
      sketchPath: path.resolve('workspace/sketch-updated'),
      configOptions: undefined,
      board: undefined,
      port: undefined,
    } as {
      sketchPath: string
      configOptions?: string
      board?: { fqbn: string }
      port?: { protocol: string; address: string }
    }
    const calls: string[] = []
    const boardLab = {
      pickSketch: async () => {
        calls.push('pickSketch')
        return {
          sketchPath: 'workspace/sketch-updated',
        }
      },
      selectBoard: async () => {
        calls.push('selectBoard')
        openedSketch.configOptions = 'CPUFreq=240,PartitionScheme=huge_app'
        openedSketch.board = { fqbn: 'esp32:esp32:esp32da' }
        return {
          board: { fqbn: 'esp32:esp32:esp32da' },
        }
      },
      pickBoard: async () => {
        calls.push('pickBoard')
        return undefined
      },
      selectPort: async () => {
        calls.push('selectPort')
        openedSketch.port = {
          protocol: 'serial',
          address: '/dev/ttyUSB-updated',
        }
        return {
          port: openedSketch.port,
        }
      },
      pickPort: async () => {
        calls.push('pickPort')
        return undefined
      },
    } as unknown as Pick<
      BoardLabContextExt,
      'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
    >
    const draft = await resolveSketchTargetWithBoardLab({
      boardLab,
      openedSketches: [openedSketch],
      pickMode: async () => undefined,
    })

    assert.deepStrictEqual(draft, {
      sketchPath: path.resolve('workspace/sketch-updated'),
      fqbn: 'esp32:esp32:esp32da:CPUFreq=240,PartitionScheme=huge_app',
      port: { protocol: 'serial', address: '/dev/ttyUSB-updated' },
    })
    assert.deepStrictEqual(calls, ['pickSketch', 'selectBoard', 'selectPort'])
  })

  it('reports error when picked sketch path cannot be resolved', async () => {
    const errors: string[] = []
    const boardLab = {
      pickSketch: async () => ({}),
      selectBoard: async () => undefined,
      pickBoard: async () => undefined,
      selectPort: async () => undefined,
      pickPort: async () => undefined,
    } as unknown as Pick<
      BoardLabContextExt,
      'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
    >
    const draft = await resolveSketchTargetWithBoardLab({
      boardLab,
      openedSketches: [],
      pickMode: async () => undefined,
      onError: (message) => errors.push(message),
    })

    assert.strictEqual(draft, undefined)
    assert.deepStrictEqual(errors, [
      'Could not resolve the sketch path for target selection.',
    ])
  })

  it('passes board filters and rejects unsupported board architectures', async () => {
    const errors: string[] = []
    const calls: string[] = []
    const boardLab = {
      pickSketch: async () => {
        calls.push('pickSketch')
        return {
          sketchPath: 'workspace/sketch-unsupported-board',
        }
      },
      selectBoard: async (_sketch: unknown, boardOptions?: unknown) => {
        calls.push('selectBoard')
        const options = boardOptions as {
          filters?: Array<(candidate: unknown) => boolean | Promise<boolean>>
        }
        assert.ok(Array.isArray(options.filters))
        const filter = options.filters?.[0]
        assert.strictEqual(typeof filter, 'function')
        const allowed = await filter?.({
          board: { fqbn: 'arduino:avr:uno' },
          selection: { fqbn: 'arduino:avr:uno' },
        })
        assert.strictEqual(allowed, false)
        return { fqbn: 'arduino:avr:uno' }
      },
      pickBoard: async () => {
        calls.push('pickBoard')
        return undefined
      },
      selectPort: async () => {
        calls.push('selectPort')
        return { protocol: 'serial', address: '/dev/never-used' }
      },
      pickPort: async () => {
        calls.push('pickPort')
        return undefined
      },
    } as unknown as Pick<
      BoardLabContextExt,
      'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
    >
    const draft = await resolveSketchTargetWithBoardLab({
      boardLab,
      openedSketches: [
        {
          sketchPath: 'workspace/sketch-unsupported-board',
        },
      ],
      pickMode: async () => undefined,
      onError: (message) => errors.push(message),
    })

    assert.strictEqual(isSupportedCapturerArch('esp32'), true)
    assert.strictEqual(isSupportedCapturerArch('esp8266'), true)
    assert.strictEqual(isSupportedCapturerArch('avr'), false)
    assert.strictEqual(isSupportedCapturerFqbn('esp32:esp32:esp32'), true)
    assert.strictEqual(
      isSupportedCapturerFqbn('esp8266:esp8266:nodemcuv2'),
      true
    )
    assert.strictEqual(isSupportedCapturerFqbn('arduino:avr:uno'), false)
    assert.strictEqual(draft, undefined)
    assert.deepStrictEqual(calls, ['pickSketch', 'selectBoard'])
    assert.deepStrictEqual(errors, [
      'Only ESP32 and ESP8266 boards are supported for crash capture.',
    ])
  })

  it('treats unsupported sketch board as missing and guides to pick supported board', async () => {
    const calls: string[] = []
    const draft = await resolveSketchTargetWithBoardLab({
      boardLab: {
        pickSketch: async () => {
          calls.push('pickSketch')
          return {
            sketchPath: 'workspace/sketch-avr',
          }
        },
        selectBoard: async () => {
          calls.push('selectBoard')
          return { fqbn: 'esp32:esp32:esp32da' }
        },
        pickBoard: async () => {
          calls.push('pickBoard')
          return undefined
        },
        selectPort: async () => {
          calls.push('selectPort')
          return undefined
        },
        pickPort: async () => {
          calls.push('pickPort')
          return undefined
        },
      } as unknown as Pick<
        BoardLabContextExt,
        'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
      >,
      openedSketches: [
        {
          sketchPath: 'workspace/sketch-avr',
          board: { fqbn: 'arduino:avr:uno' },
          port: { protocol: 'serial', address: '/dev/mock0' },
          configOptions: 'arduino:avr:uno',
        },
      ],
      pickMode: async (items) => items[0],
    })

    assert.deepStrictEqual(draft, {
      sketchPath: path.resolve('workspace/sketch-avr'),
      fqbn: 'esp32:esp32:esp32da',
      port: { protocol: 'serial', address: '/dev/mock0' },
    })
    assert.deepStrictEqual(calls, ['pickSketch', 'selectBoard'])
  })
})
