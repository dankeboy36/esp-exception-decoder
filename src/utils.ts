import debug from 'debug';
import { promises as fs } from 'node:fs';
import { platform } from 'node:os';
// @ts-expect-error see https://github.com/microsoft/TypeScript/issues/49721#issuecomment-1319854183
import type { Options } from 'execa';

const utilsDebug: Debug = debug('espExceptionDecoder:utils');

export interface Debug {
  (message: string): void;
}

export const isWindows = platform() === 'win32';
export const neverSignal = new AbortController().signal;

export async function run(
  execPath: string,
  args: string[],
  options: Options & {
    silent?: boolean;
    silentError?: boolean;
    debug?: Debug;
  } = {
    silent: true,
    silentError: false,
    debug: utilsDebug,
  }
): Promise<string> {
  const { execa } = await import(/* webpackMode: "eager" */ 'execa');
  debug(`run: ${execPath} args: ${JSON.stringify(args)}`);
  const cp = execa(execPath, args, options);
  if (!options.silent) {
    cp.pipeStdout?.(process.stdout);
  }
  if (!options.silentError) {
    cp.pipeStderr?.(process.stderr);
  }
  try {
    const { stdout } = await cp;
    return stdout;
  } catch (err) {
    if (
      err instanceof Error &&
      'code' in err &&
      err.code === 'ABORT_ERR' &&
      'isCanceled' in err &&
      err.isCanceled === true
    ) {
      // ignore
    } else {
      console.error(
        `Failed to execute: ${execPath} ${JSON.stringify(args)}`,
        err
      );
    }
    throw err;
  }
}

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
