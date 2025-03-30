import debug from 'debug';
import { promises as fs } from 'node:fs';
import { platform } from 'node:os';

const utilsDebug: Debug = debug('espExceptionDecoder:utils');

export interface Debug {
  (message: string): void;
}

export const isWindows = platform() === 'win32';
export const neverSignal = new AbortController().signal;

/**
 * Returns with the argument if accessible. Does not ensure that the resource will be accessible when actually accessed.
 */
export async function access(
  path: string,
  options: { mode?: number; debug?: Debug } = { debug: utilsDebug }
): Promise<string | undefined> {
  const { mode, debug } = options;
  try {
    await fs.access(path, mode);
    debug?.(`access: ${path}, mode: ${mode}. OK`);
    return path;
  } catch (err) {
    debug?.(`access: ${path}, mode: ${mode}. Fail`);
    return undefined;
  }
}

export class AbortError extends Error {
  constructor() {
    super('User abort');
    this.name = 'AbortError';
  }
}
