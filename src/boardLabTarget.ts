import path from 'node:path'

import { FQBN } from 'fqbn'

import type {
  BoardLabContextExt,
  BoardPickCandidate,
  BoardPickOptions,
} from './boardLabExt'

export interface PortIdentifier {
  protocol: string
  address: string
}

export interface SketchTargetDraft {
  sketchPath: string
  fqbn: string
  port: PortIdentifier
}

export type SketchTargetSelectionMode =
  | 'use-sketch-target'
  | 'select-board'
  | 'select-port'
  | 'select-both'
  | 'use-board-select-port'
  | 'use-port-select-board'
  | 'select-board-select-port'

export interface SketchTargetSelectionModeItem {
  mode: SketchTargetSelectionMode
  label: string
  description: string
}

export interface ResolveSketchTargetWithBoardLabOptions {
  boardLab: Pick<
    BoardLabContextExt,
    'pickSketch' | 'selectBoard' | 'pickBoard' | 'selectPort' | 'pickPort'
  >
  openedSketches: readonly unknown[]
  pickMode: (
    items: readonly SketchTargetSelectionModeItem[]
  ) => Promise<SketchTargetSelectionModeItem | undefined>
  onError?: (message: string) => void
}

const supportedCapturerArchitectures = new Set(['esp32', 'esp8266'])
type SelectBoardInput = Parameters<BoardLabContextExt['selectBoard']>[0]
type PickBoardInput = Parameters<BoardLabContextExt['pickBoard']>[0]
type SelectPortInput = Parameters<BoardLabContextExt['selectPort']>[0]
type PickPortInput = Parameters<BoardLabContextExt['pickPort']>[0]

interface FqbnContainerLike {
  fqbn?: unknown
}

interface SketchLike {
  sketchPath?: unknown
  uri?: {
    fsPath?: unknown
  }
  configOptions?: unknown
  board?: FqbnContainerLike
  fqbn?: unknown
  port?: unknown
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function tryCreateFqbn(value: string): FQBN | undefined {
  try {
    return new FQBN(value)
  } catch {
    return undefined
  }
}

function resolveBoardFqbn(sketch: unknown): FQBN | undefined {
  const maybeSketch = sketch as SketchLike | undefined
  const boardFqbn =
    toNonEmptyString(maybeSketch?.board?.fqbn) ??
    toNonEmptyString(maybeSketch?.fqbn)
  if (!boardFqbn) {
    return undefined
  }
  return tryCreateFqbn(boardFqbn)
}

export function pathEquals(left: string, right: string): boolean {
  const normalize = (value: string) =>
    process.platform === 'win32'
      ? path.resolve(value).toLowerCase()
      : path.resolve(value)
  return normalize(left) === normalize(right)
}

export function resolveSketchPath(sketch: unknown): string | undefined {
  const maybeSketch = sketch as SketchLike | undefined
  const bySketchPath = toNonEmptyString(maybeSketch?.sketchPath)
  if (bySketchPath) {
    return path.resolve(bySketchPath)
  }
  const byUriPath = toNonEmptyString(maybeSketch?.uri?.fsPath)
  if (byUriPath) {
    return path.resolve(byUriPath)
  }
  return undefined
}

export function resolveConfiguredFqbn(sketch: unknown): string | undefined {
  const maybeSketch = sketch as SketchLike | undefined
  const configOptions = toNonEmptyString(maybeSketch?.configOptions)
  const boardFqbn = resolveBoardFqbn(sketch)

  if (boardFqbn && configOptions) {
    const mergedFromOptions = tryCreateFqbn(
      `${boardFqbn.sanitize().toString()}:${configOptions}`
    )
    if (mergedFromOptions) {
      return mergedFromOptions.toString()
    }
    const mergedFromFqbn = tryCreateFqbn(configOptions)
    if (mergedFromFqbn) {
      try {
        return boardFqbn.withFQBN(mergedFromFqbn.toString()).toString()
      } catch {
        // ignore incompatible FQBN and continue with fallback
      }
    }
    return boardFqbn.toString()
  }

  if (boardFqbn) {
    return boardFqbn.toString()
  }
  if (configOptions) {
    return tryCreateFqbn(configOptions)?.toString()
  }
  return undefined
}

function resolveSupportedConfiguredFqbn(sketch: unknown): string | undefined {
  const fqbn = resolveConfiguredFqbn(sketch)
  if (!fqbn) {
    return undefined
  }
  return isSupportedCapturerFqbn(fqbn) ? fqbn : undefined
}

export function isPortIdentifierLike(arg: unknown): arg is PortIdentifier {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    typeof (arg as { protocol?: unknown }).protocol === 'string' &&
    typeof (arg as { address?: unknown }).address === 'string'
  )
}

export function toPortIdentifier(
  portLike: unknown
): PortIdentifier | undefined {
  const directPort = isPortIdentifierLike(portLike) ? portLike : undefined
  const nestedPort =
    !directPort &&
    typeof portLike === 'object' &&
    portLike !== null &&
    isPortIdentifierLike((portLike as { port?: unknown }).port)
      ? (portLike as { port: PortIdentifier }).port
      : undefined
  const candidate = directPort ?? nestedPort
  if (!candidate) {
    return undefined
  }
  return {
    protocol: candidate.protocol,
    address: candidate.address,
  }
}

export function toDraftFromSketch(
  sketch: unknown
): SketchTargetDraft | undefined {
  const sketchPath = resolveSketchPath(sketch)
  if (!sketchPath) {
    return undefined
  }
  const fqbn = resolveConfiguredFqbn(sketch)
  const port = toPortIdentifier((sketch as SketchLike | undefined)?.port)
  if (!fqbn || !port) {
    return undefined
  }
  return {
    sketchPath,
    fqbn,
    port,
  }
}

export function toSketchTargetSelectionModeItems(
  sketch: unknown
): SketchTargetSelectionModeItem[] {
  const hasBoard = Boolean(resolveSupportedConfiguredFqbn(sketch))
  const hasPort = Boolean(toPortIdentifier((sketch as SketchLike)?.port))

  if (hasBoard && hasPort) {
    return [
      {
        mode: 'use-sketch-target',
        label: 'Use selected board + port',
        description: '(Recommended) Use current sketch target',
      },
      {
        mode: 'select-board',
        label: 'Select other board',
        description: 'Keep the current port and choose another board',
      },
      {
        mode: 'select-port',
        label: 'Select other port',
        description: 'Keep the current board and choose another port',
      },
      {
        mode: 'select-both',
        label: 'Select both manually',
        description: 'Choose both board and port',
      },
    ]
  }
  if (hasBoard && !hasPort) {
    return [
      {
        mode: 'use-board-select-port',
        label: 'Use selected board + choose port',
        description: '(Recommended) Keep sketch board and pick a port',
      },
      {
        mode: 'select-board-select-port',
        label: 'Select board + port',
        description: 'Choose both board and port',
      },
    ]
  }
  if (!hasBoard && hasPort) {
    return [
      {
        mode: 'use-port-select-board',
        label: 'Use selected port + choose board',
        description: '(Recommended) Keep sketch port and pick a board',
      },
      {
        mode: 'select-board-select-port',
        label: 'Select board + port',
        description: 'Choose both board and port',
      },
    ]
  }
  return [
    {
      mode: 'select-both',
      label: 'Select board + port',
      description: '(Recommended) Choose both board and port',
    },
  ]
}

export function modeNeedsBoardSelection(
  mode: SketchTargetSelectionMode
): boolean {
  return (
    mode === 'select-board' ||
    mode === 'use-port-select-board' ||
    mode === 'select-both' ||
    mode === 'select-board-select-port'
  )
}

export function modeNeedsPortSelection(
  mode: SketchTargetSelectionMode
): boolean {
  return (
    mode === 'select-port' ||
    mode === 'use-board-select-port' ||
    mode === 'select-both' ||
    mode === 'select-board-select-port'
  )
}

export function resolveSketchByPath(
  sketchPath: string,
  openedSketches: readonly unknown[],
  fallbackSketch: unknown
): unknown {
  const normalizedSketchPath = path.resolve(sketchPath)
  const match = openedSketches.find((candidate) => {
    const candidatePath = toNonEmptyString(
      (candidate as SketchLike | undefined)?.sketchPath
    )
    return Boolean(
      candidatePath && pathEquals(candidatePath, normalizedSketchPath)
    )
  })
  return match ?? fallbackSketch
}

export async function tryExecuteBoardLabCall<T>(
  run: () => Promise<T>
): Promise<T | undefined> {
  try {
    return await run()
  } catch {
    return undefined
  }
}

export function isSupportedCapturerArch(arch: string): boolean {
  return supportedCapturerArchitectures.has(arch.trim().toLowerCase())
}

export function isSupportedCapturerFqbn(fqbn: string): boolean {
  const parsed = tryCreateFqbn(fqbn)
  if (!parsed) {
    return false
  }
  return isSupportedCapturerArch(parsed.arch)
}

export function isSupportedCapturerBoardCandidate(
  candidate: BoardPickCandidate
): boolean {
  const fqbn =
    resolveConfiguredFqbn(candidate.selection) ??
    resolveConfiguredFqbn(candidate.board)
  if (fqbn) {
    return isSupportedCapturerFqbn(fqbn)
  }

  // Boards without the installed core does not have the FQBN set
  // But boards from an index package carries the platform meta object on the board.
  if (
    'platform' in candidate &&
    typeof candidate.platform === 'object' &&
    candidate.platform !== null
  ) {
    const { platform } = candidate
    if (
      'metadata' in platform &&
      typeof platform.metadata === 'object' &&
      platform.metadata !== null
    ) {
      const { metadata } = platform
      if ('id' in metadata && typeof metadata.id === 'string') {
        let fqbn: FQBN | undefined
        try {
          fqbn = new FQBN(`${metadata.id}:placeholder_id`)
        } catch {}
        if (fqbn) {
          return isSupportedCapturerArch(fqbn.arch)
        }
      }
    }
  }
  return false
}

function toCapturerBoardPickOptions(): BoardPickOptions {
  return {
    filters: [isSupportedCapturerBoardCandidate],
  }
}

export async function selectBoardForSketchTarget(options: {
  boardLab: Pick<BoardLabContextExt, 'selectBoard' | 'pickBoard'>
  openedSketches: readonly unknown[]
  sketch: unknown
  onError?: (message: string) => void
}): Promise<{ sketch: unknown; fqbn: string } | undefined> {
  const boardPickOptions = toCapturerBoardPickOptions()
  const selectedBoard =
    (await tryExecuteBoardLabCall(() =>
      options.boardLab.selectBoard(
        options.sketch as SelectBoardInput,
        boardPickOptions
      )
    )) ??
    (await tryExecuteBoardLabCall(() =>
      options.boardLab.pickBoard(
        options.sketch as PickBoardInput,
        boardPickOptions
      )
    ))
  if (!selectedBoard) {
    return undefined
  }
  const sketchPath = resolveSketchPath(options.sketch)
  const refreshedSketch = sketchPath
    ? resolveSketchByPath(sketchPath, options.openedSketches, options.sketch)
    : options.sketch
  const refreshedSupportedFqbn = resolveSupportedConfiguredFqbn(refreshedSketch)
  const selectedSupportedFqbn = resolveSupportedConfiguredFqbn(selectedBoard)
  const fqbn = refreshedSupportedFqbn ?? selectedSupportedFqbn
  if (!fqbn) {
    const resolvedButUnsupported =
      resolveConfiguredFqbn(refreshedSketch) ??
      resolveConfiguredFqbn(selectedBoard)
    options.onError?.(
      resolvedButUnsupported
        ? 'Only ESP32 and ESP8266 boards are supported for crash capture.'
        : 'Could not resolve a valid board selection for the sketch.'
    )
    return undefined
  }
  return {
    sketch: refreshedSketch,
    fqbn,
  }
}

export async function selectPortForSketchTarget(options: {
  boardLab: Pick<BoardLabContextExt, 'selectPort' | 'pickPort'>
  openedSketches: readonly unknown[]
  sketch: unknown
  onError?: (message: string) => void
}): Promise<{ sketch: unknown; port: PortIdentifier } | undefined> {
  const selectedPort =
    (await tryExecuteBoardLabCall(() =>
      options.boardLab.selectPort(options.sketch as SelectPortInput)
    )) ??
    (await tryExecuteBoardLabCall(() =>
      options.boardLab.pickPort(options.sketch as PickPortInput)
    ))
  if (!selectedPort) {
    return undefined
  }
  const sketchPath = resolveSketchPath(options.sketch)
  const refreshedSketch = sketchPath
    ? resolveSketchByPath(sketchPath, options.openedSketches, options.sketch)
    : options.sketch
  const port =
    toPortIdentifier((refreshedSketch as SketchLike | undefined)?.port) ??
    toPortIdentifier(selectedPort)
  if (!port) {
    options.onError?.(
      'Could not resolve a valid port selection for the sketch.'
    )
    return undefined
  }
  return {
    sketch: refreshedSketch,
    port,
  }
}

export async function resolveSketchTargetWithBoardLab(
  options: ResolveSketchTargetWithBoardLabOptions
): Promise<SketchTargetDraft | undefined> {
  const sketchSelection = await tryExecuteBoardLabCall(() =>
    options.boardLab.pickSketch()
  )
  if (!sketchSelection) {
    return undefined
  }

  const sketchPath = resolveSketchPath(sketchSelection)
  if (!sketchPath) {
    options.onError?.('Could not resolve the sketch path for target selection.')
    return undefined
  }

  let sketch = resolveSketchByPath(
    sketchPath,
    options.openedSketches,
    sketchSelection
  )
  const modeItems = toSketchTargetSelectionModeItems(sketch)
  const pickedMode =
    modeItems.length === 1 ? modeItems[0] : await options.pickMode(modeItems)
  if (!pickedMode) {
    return undefined
  }

  let fqbn = resolveSupportedConfiguredFqbn(sketch)
  let port = toPortIdentifier((sketch as SketchLike | undefined)?.port)

  if (modeNeedsBoardSelection(pickedMode.mode)) {
    const boardSelection = await selectBoardForSketchTarget({
      boardLab: options.boardLab,
      openedSketches: options.openedSketches,
      sketch,
      onError: options.onError,
    })
    if (!boardSelection) {
      return undefined
    }
    sketch = resolveSketchByPath(
      sketchPath,
      options.openedSketches,
      boardSelection.sketch
    )
    fqbn = boardSelection.fqbn ?? fqbn
  }

  if (modeNeedsPortSelection(pickedMode.mode)) {
    const portSelection = await selectPortForSketchTarget({
      boardLab: options.boardLab,
      openedSketches: options.openedSketches,
      sketch,
      onError: options.onError,
    })
    if (!portSelection) {
      return undefined
    }
    sketch = resolveSketchByPath(
      sketchPath,
      options.openedSketches,
      portSelection.sketch
    )
    port = portSelection.port ?? port
  }

  if (!fqbn || !port) {
    options.onError?.(
      'Could not resolve both board and port for the sketch target.'
    )
    return undefined
  }

  return {
    sketchPath,
    fqbn,
    port,
  }
}
