import path from 'node:path'

import { FQBN } from 'fqbn'
import {
  createDecodeParams as trbrCreateDecodeParams,
  type DecodeParams as TrbrDecodeParams,
} from 'trbr'
import type { BoardDetails, SketchFolder } from 'vscode-arduino-api'

import { findElfPath } from './findElfPath'

export interface DecodeParams extends TrbrDecodeParams {
  fqbn: FQBN
  sketchPath: string
}

const esp32 = 'esp32'
const esp8266 = 'esp8266'
const supportedArchitectures = new Set([esp32, esp8266])

export async function createDecodeParams(
  params: Pick<SketchFolder, 'compileSummary' | 'sketchPath' | 'board'>
): Promise<DecodeParams> {
  const { compileSummary, sketchPath, board } = params
  if (!sketchPath) {
    throw new Error('Sketch path is not set')
  }
  if (!board) {
    throw new Error('No board selected')
  }
  if (!board.fqbn) {
    throw new Error(`No FQBN is set for board ${board.name}`)
  }
  const fqbn = new FQBN(board.fqbn).sanitize()
  const { vendor, arch } = fqbn
  if (!isBoardDetails(board)) {
    throw new DecodeParamsError(
      `Platform '${vendor}:${arch}' is not installed`,
      { sketchPath, fqbn }
    )
  }
  if (!supportedArchitectures.has(fqbn.arch)) {
    throw new DecodeParamsError(`Unsupported board: '${fqbn}'`, {
      sketchPath,
      fqbn,
    })
  }
  if (!compileSummary) {
    throw new DecodeParamsError(
      'The summary of the previous compilation is unavailable. Compile the sketch',
      { sketchPath, fqbn }
    )
  }
  const { buildPath } = compileSummary
  // https://github.com/dankeboy36/vscode-arduino-api/issues/18
  if (typeof buildPath !== 'string') {
    throw new DecodeParamsError(
      'The summary of the previous compilation does not contain a build path. Compile the sketch',
      { sketchPath, fqbn }
    )
  }
  const sketchFolderName = path.basename(sketchPath)
  const elfPath = await findElfPath(sketchFolderName, buildPath)
  if (!elfPath) {
    throw new DecodeParamsError(
      "Could not detect the '.elf' file in the build folder",
      { sketchPath, fqbn }
    )
  }
  const { buildProperties } = board
  const decodeParams = await trbrCreateDecodeParams({
    elfPath,
    fqbn,
    buildProperties,
  })

  return {
    ...decodeParams,
    fqbn,
    sketchPath,
  }
}

export class DecodeParamsError extends Error {
  constructor(
    message: string,
    private readonly partial: Pick<DecodeParams, 'fqbn' | 'sketchPath'>
  ) {
    super(message)
    Object.setPrototypeOf(this, DecodeParamsError.prototype)
  }

  get fqbn(): string {
    return this.partial.fqbn.toString()
  }

  get sketchPath(): string {
    return this.partial.sketchPath
  }
}

function isBoardDetails(board: SketchFolder['board']): board is BoardDetails {
  return (
    typeof board === 'object' && board !== null && 'buildProperties' in board
  )
}
