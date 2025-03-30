import { FQBN } from 'fqbn';
import path from 'node:path';
import {
  DecodeTarget,
  RiscvDecodeTarget,
  DecodeParams as TrbrDecodeParams,
  defaultTargetArch,
  isRiscvFQBN,
  resolveToolPath,
} from 'trbr';
import type { ArduinoState } from 'vscode-arduino-api';

import { access } from './utils';

export interface DecodeParams extends TrbrDecodeParams {
  fqbn: FQBN;
  sketchPath: string;
}

const esp32 = 'esp32';
const esp8266 = 'esp8266';
const supportedArchitectures = new Set([esp32, esp8266]);

export async function createDecodeParams(
  arduinoState: ArduinoState
): Promise<DecodeParams> {
  const { boardDetails, compileSummary, sketchPath } = arduinoState;
  if (!sketchPath) {
    throw new Error('Sketch path is not set');
  }
  if (!arduinoState.fqbn) {
    throw new Error('No board selected');
  }
  const fqbn = new FQBN(arduinoState.fqbn).sanitize();
  const { vendor, arch } = fqbn;
  if (!boardDetails) {
    throw new DecodeParamsError(
      `Platform '${vendor}:${arch}' is not installed`,
      { sketchPath, fqbn }
    );
  }
  if (!supportedArchitectures.has(fqbn.arch)) {
    throw new DecodeParamsError(`Unsupported board: '${fqbn}'`, {
      sketchPath,
      fqbn,
    });
  }
  if (!compileSummary) {
    throw new DecodeParamsError(
      'The summary of the previous compilation is unavailable. Compile the sketch',
      { sketchPath, fqbn }
    );
  }
  const { buildPath } = compileSummary;
  const { buildProperties } = boardDetails;
  const sketchFolderName = path.basename(sketchPath);
  const [toolPath, elfPath] = await Promise.all([
    maybeResolveToolPath(fqbn, buildProperties),
    findElfPath(sketchFolderName, buildPath),
  ]);
  if (!elfPath) {
    throw new DecodeParamsError(
      `Could not detect the '.elf' file in the build folder`,
      { sketchPath, fqbn }
    );
  }
  if (!toolPath) {
    throw new DecodeParamsError('Could not detect the GDB tool path', {
      sketchPath,
      fqbn,
    });
  }
  let targetArch: DecodeTarget = defaultTargetArch;
  if (isRiscvFQBN(fqbn)) {
    targetArch = fqbn.boardId as RiscvDecodeTarget;
  }
  return {
    toolPath,
    elfPath,
    fqbn,
    sketchPath,
    targetArch,
  };
}

export class DecodeParamsError extends Error {
  constructor(
    message: string,
    private readonly partial: Pick<DecodeParams, 'fqbn' | 'sketchPath'>
  ) {
    super(message);
    Object.setPrototypeOf(this, DecodeParamsError.prototype);
  }

  get fqbn(): string {
    return this.partial.fqbn.toString();
  }

  get sketchPath(): string {
    return this.partial.sketchPath;
  }
}

async function maybeResolveToolPath(
  fqbn: FQBN,
  buildProperties: Record<string, string>
): Promise<string | undefined> {
  let toolPath: string | undefined;
  try {
    toolPath = await resolveToolPath(fqbn, buildProperties);
  } catch {}
  return toolPath;
}

async function findElfPath(
  sketchFolderName: string,
  buildPath: string
): Promise<string | undefined> {
  const [inoElfPath, cppElfPath] = await Promise.all(
    ['ino', 'cpp'].map((ext) =>
      access(path.join(buildPath, `${sketchFolderName}.${ext}.elf`))
    )
  );
  return inoElfPath ?? cppElfPath ?? undefined;
}

/**
 * (non-API)
 */
export const __tests = {
  findElfPath,
} as const;
