import type {
  CapturerConfig,
  CapturerEventNode,
  CapturerFrameNode,
  CapturerRootNode,
  CapturerRuntime,
} from './model'

export class CapturerTreeModel {
  private readonly rootNodesByConfigId = new Map<string, CapturerRootNode>()
  private readonly eventNodesByKey = new Map<string, CapturerEventNode>()

  getRootNodes(configs: readonly CapturerConfig[]): CapturerRootNode[] {
    return configs.map((config) => this.getRootNode(config.id))
  }

  getRootNode(configId: string): CapturerRootNode {
    const existing = this.rootNodesByConfigId.get(configId)
    if (existing) {
      return existing
    }
    const created: CapturerRootNode = { type: 'root', configId }
    this.rootNodesByConfigId.set(configId, created)
    return created
  }

  getEventNode(configId: string, signature: string): CapturerEventNode {
    const key = this.toEventNodeKey(configId, signature)
    const existing = this.eventNodesByKey.get(key)
    if (existing) {
      return existing
    }
    const created: CapturerEventNode = {
      type: 'event',
      configId,
      signature,
    }
    this.eventNodesByKey.set(key, created)
    return created
  }

  getEventNodes(
    configId: string,
    runtime: CapturerRuntime | undefined
  ): CapturerEventNode[] {
    if (!runtime) {
      return []
    }
    return Array.from(runtime.eventsBySignature.values())
      .sort((left, right) => right.createdAt - left.createdAt)
      .map((summary) => this.getEventNode(configId, summary.signature))
  }

  getFrameNodes(
    configId: string,
    signature: string,
    frameCount: number
  ): CapturerFrameNode[] {
    return Array.from({ length: frameCount }, (_, frameIndex) => ({
      type: 'frame' as const,
      configId,
      signature,
      frameIndex,
    }))
  }

  removeEventNode(configId: string, signature: string): void {
    this.eventNodesByKey.delete(this.toEventNodeKey(configId, signature))
  }

  clearConfig(configId: string): void {
    this.rootNodesByConfigId.delete(configId)
    const prefix = `${configId}::`
    for (const key of this.eventNodesByKey.keys()) {
      if (key.startsWith(prefix)) {
        this.eventNodesByKey.delete(key)
      }
    }
  }

  private toEventNodeKey(configId: string, signature: string): string {
    return `${configId}::${signature}`
  }
}
