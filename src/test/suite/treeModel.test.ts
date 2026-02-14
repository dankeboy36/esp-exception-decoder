import assert from 'node:assert/strict'

import type { CapturerConfig, CapturerRuntime } from '../../capturer/model'
import { CapturerTreeModel } from '../../capturer/treeModel'

function makeConfig(id: string): CapturerConfig {
  return {
    id,
    fqbn: 'esp32:esp32:esp32c3',
    sketchPath: `/tmp/${id}`,
    port: { protocol: 'serial', address: `/dev/${id}` },
  }
}

function makeRuntime(
  signatures: Array<{ signature: string; createdAt: number }>
) {
  return {
    eventsBySignature: new Map(
      signatures.map((item) => [
        item.signature,
        { signature: item.signature, createdAt: item.createdAt },
      ])
    ),
  } as unknown as CapturerRuntime
}

describe('treeModel', () => {
  it('creates stable root and event node identities', () => {
    const model = new CapturerTreeModel()
    const rootA = model.getRootNode('a')
    const rootA2 = model.getRootNode('a')
    assert.strictEqual(rootA, rootA2)

    const event = model.getEventNode('a', 'sig')
    const event2 = model.getEventNode('a', 'sig')
    assert.strictEqual(event, event2)
  })

  it('returns root nodes and sorted event nodes', () => {
    const model = new CapturerTreeModel()
    const configs = [makeConfig('a'), makeConfig('b')]
    const roots = model.getRootNodes(configs)
    assert.deepEqual(
      roots.map((root) => root.configId),
      ['a', 'b']
    )

    const empty = model.getEventNodes('a', undefined)
    assert.deepEqual(empty, [])

    const runtime = makeRuntime([
      { signature: 'older', createdAt: 1 },
      { signature: 'newer', createdAt: 2 },
    ])
    const events = model.getEventNodes('a', runtime)
    assert.deepEqual(
      events.map((event) => event.signature),
      ['newer', 'older']
    )
  })

  it('creates frame nodes and clears/removes cached event nodes', () => {
    const model = new CapturerTreeModel()
    const frames = model.getFrameNodes('a', 'sig', 3)
    assert.equal(frames.length, 3)
    assert.deepEqual(
      frames.map((frame) => frame.frameIndex),
      [0, 1, 2]
    )

    const beforeRemove = model.getEventNode('a', 'sig-a')
    model.removeEventNode('a', 'sig-a')
    const afterRemove = model.getEventNode('a', 'sig-a')
    assert.notStrictEqual(beforeRemove, afterRemove)

    const keep = model.getEventNode('b', 'sig-b')
    model.getEventNode('a', 'sig-c')
    model.clearConfig('a')
    const recreated = model.getEventNode('a', 'sig-c')
    assert.notStrictEqual(recreated, beforeRemove)
    assert.strictEqual(model.getEventNode('b', 'sig-b'), keep)
  })
})
