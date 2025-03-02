// TODO: this code must go to the future vscode-arduino-api-dev package
// TODO: vscode-arduino-api-dev should contribute commands to mock the
// Arduino context so that developers can implement their tools in
// VS Code without bundling every change to a VSIX and trying it out in Arduino IDE

import debug from 'debug';
import { getTool } from 'get-arduino-tools';
import assert from 'node:assert/strict';
import { constants, promises as fs } from 'node:fs';
import path from 'node:path';
import { rimraf } from 'rimraf';
import { SemVer, gte } from 'semver';
import { access, isWindows, run } from '../utils';
import { cliVersion } from './cliContext.json';
import cliEnv from './envs.cli.json';
import gitEnv from './envs.git.json';

const testEnvDebug = debug('espExceptionDecoder:testEnv');

const rootPath = path.resolve(__dirname, '../../test-resources/');
const storagePath = path.resolve(rootPath, 'cli-releases');

const getUserDirPath = (type: ToolsInstallType) =>
  path.resolve(rootPath, 'envs', type, 'Arduino');
const getDataDirPath = (type: ToolsInstallType) =>
  path.resolve(rootPath, 'envs', type, 'Arduino15');
const getCliConfigPath = (type: ToolsInstallType) =>
  path.resolve(rootPath, 'envs', type, 'arduino-cli.yaml');

export interface CliContext {
  readonly cliPath: string;
  readonly cliVersion: string;
}

/* TODO: add 'profile'? */
export type ToolsInstallType =
  /**
   * Installed via the CLI using the _Boards Manager_.
   */
  | 'cli'
  /**
   * Installing the tools from Git. [Here](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html#windows-manual-installation) is an example.
   */
  | 'git';

export interface ToolsEnv {
  readonly cliConfigPath: string;
  readonly dataDirPath: string;
  readonly userDirPath: string;
}

export interface TestEnv {
  readonly cliContext: CliContext;
  readonly toolsEnvs: Readonly<Record<ToolsInstallType, ToolsEnv>>;
}

async function installToolsViaGit(
  _: CliContext,
  toolsEnv: ToolsEnv
): Promise<ToolsEnv> {
  const { userDirPath } = toolsEnv;
  const { gitUrl, branchOrTagName, folderName } = gitEnv;
  const checkoutPath = path.join(userDirPath, 'hardware', folderName);
  await fs.mkdir(checkoutPath, { recursive: true });
  const toolsPath = path.join(checkoutPath, 'esp32/tools');
  const getPy = path.join(toolsPath, 'get.py');
  if (
    !(await access(getPy, {
      mode: constants.F_OK | constants.X_OK,
      debug: testEnvDebug,
    }))
  ) {
    let tempToolsPath: string | undefined;
    try {
      // `--branch` can be a branch name or a tag
      await run(
        'git',
        ['clone', gitUrl, '--depth', '1', '--branch', branchOrTagName, 'esp32'],
        {
          silent: false,
          cwd: checkoutPath,
        }
      );
      // Instead of running the core installation python script in the esp32/tools `cwd`,
      // this code extracts the tools into a "temp" folder inside the `./test-resources` folder,
      // then moves the tools to esp32/tools. Extracting the files to temp might not work, because
      // the tests can run on D:\ and the temp folder is on C:\ and moving the files will result in EXDEV error.
      // Running both `python get.py` and `get.exe` have failed on Windows from Node.js. it was fine from CMD.EXE.
      tempToolsPath = await fs.mkdtemp(path.join(rootPath, 'esp32-temp-tool'));
      if (isWindows) {
        //https://github.com/espressif/arduino-esp32/blob/72c41d09538663ebef80d29eb986cd5bc3395c2d/tools/get.py#L35-L36
        await run('pip', ['install', 'requests', '-q']);
      }
      try {
        await run('python', [getPy], { silent: false, cwd: tempToolsPath });
      } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
          await run('python3', [getPy], { silent: false, cwd: tempToolsPath });
        } else {
          throw err;
        }
      }
      const tools = await fs.readdir(tempToolsPath);
      for (const tool of tools) {
        await fs.rename(
          path.join(tempToolsPath, tool),
          path.join(toolsPath, tool)
        );
      }
    } catch (err) {
      await rimraf(checkoutPath, { maxRetries: 5 }); // Cleanup local git clone
      throw err;
    } finally {
      if (tempToolsPath) {
        await rimraf(tempToolsPath, { maxRetries: 5 });
      }
    }
  }
  return toolsEnv;
}

async function installToolsViaCLI(
  cliContext: CliContext,
  toolsEnv: ToolsEnv
): Promise<ToolsEnv> {
  const { cliPath } = cliContext;
  const { cliConfigPath } = toolsEnv;
  const additionalUrls = cliEnv.map(({ url }) => url);
  await ensureConfigSet(
    cliPath,
    cliConfigPath,
    'board_manager.additional_urls',
    ...additionalUrls
  );
  for (const requirePlatform of cliEnv) {
    const { vendor, arch, version } = requirePlatform;
    await ensurePlatformExists(cliPath, cliConfigPath, [vendor, arch], version);
  }
  await Promise.all(
    cliEnv.map(({ vendor, arch }) =>
      assertPlatformExists([vendor, arch], cliContext, toolsEnv)
    )
  );
  return toolsEnv;
}

async function setupToolsEnv(
  cliContext: CliContext,
  type: ToolsInstallType,
  postSetup: (
    cliContext: CliContext,
    toolsEnv: ToolsEnv
  ) => Promise<ToolsEnv> = (_, toolsEnv) => Promise.resolve(toolsEnv)
): Promise<ToolsEnv> {
  const { cliPath } = cliContext;
  const cliConfigPath = getCliConfigPath(type);
  const dataDirPath = getDataDirPath(type);
  const userDirPath = getUserDirPath(type);
  const toolsEnv = <ToolsEnv>{
    cliConfigPath,
    dataDirPath,
    userDirPath,
  };
  await Promise.all([
    ensureCliConfigExists(cliPath, toolsEnv),
    fs.mkdir(userDirPath, { recursive: true }),
    fs.mkdir(dataDirPath, { recursive: true }),
  ]);
  await ensureConfigSet(
    cliPath,
    cliConfigPath,
    'directories.data',
    dataDirPath
  );
  await ensureConfigSet(
    cliPath,
    cliConfigPath,
    'directories.user',
    userDirPath
  );
  await ensureIndexUpdated(cliPath, cliConfigPath);
  await postSetup(cliContext, toolsEnv);
  return toolsEnv;
}

async function assertCli(cliContext: CliContext): Promise<string> {
  const { cliPath, cliVersion } = cliContext;
  assert.ok(cliPath);
  assert.ok(cliPath.length);
  const stdout = await run(cliPath, ['version', '--format', 'json']);
  assert.ok(stdout);
  assert.ok(stdout.length);
  const actualVersion = JSON.parse(stdout).VersionString;
  let expectedVersion = cliVersion;
  // Drop the `v` prefix from the CLI GitHub release name.
  // https://github.com/arduino/arduino-cli/pull/2374
  if (gte(expectedVersion, '0.35.0-rc.1')) {
    expectedVersion = new SemVer(expectedVersion).version;
  }
  assert.strictEqual(actualVersion, expectedVersion);
  return cliPath;
}

async function assertPlatformExists(
  [vendor, arch]: [string, string],
  cliContext: CliContext,
  toolsEnv: ToolsEnv
): Promise<void> {
  const id = `${vendor}:${arch}`;
  const { cliPath } = cliContext;
  const { cliConfigPath } = toolsEnv;
  const stdout = await run(cliPath, [
    'core',
    'list',
    '--config-file',
    cliConfigPath,
    '--format',
    'json',
  ]);
  assert.ok(stdout);
  assert.ok(stdout.length);
  const { platforms } = JSON.parse(stdout);
  assert.ok(Array.isArray(platforms));
  const platform = (<Array<Record<string, unknown>>>platforms).find(
    (p) => p.id === id
  );
  assert.ok(platform, `Could not find installed platform: '${id}'`);
}

export async function setupTestEnv(): Promise<TestEnv> {
  const cliPath = await ensureCliExists(cliVersion);
  if (!cliPath) {
    throw new Error(`Could not find the Arduino CLI executable.`);
  }
  const cliContext = <CliContext>{
    cliPath,
    cliVersion,
  };
  await assertCli(cliContext);

  const [cliToolsEnv, gitToolsEnv] = await Promise.all([
    setupToolsEnv(cliContext, 'cli', installToolsViaCLI),
    setupToolsEnv(cliContext, 'git', installToolsViaGit),
  ]);
  return {
    cliContext,
    toolsEnvs: {
      cli: cliToolsEnv,
      git: gitToolsEnv,
    },
  };
}

async function ensureCliExists(
  version: string = cliVersion
): Promise<string | undefined> {
  await fs.mkdir(storagePath, { recursive: true });
  const tool = 'arduino-cli';
  try {
    const { toolPath } = await getTool({
      tool,
      version,
      destinationFolderPath: storagePath,
    });
    return toolPath;
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'EEXIST') {
      // this is expected when the CLI is already downloaded. A specific error would be great though
      return path.join(storagePath, `${tool}${isWindows ? '.exe' : ''}`);
    } else {
      throw err;
    }
  }
}

async function ensureIndexUpdated(
  cliPath: string,
  cliConfigPath: string
): Promise<void> {
  await runCli(cliPath, ['core', 'update-index'], cliConfigPath);
}

async function ensurePlatformExists(
  cliPath: string,
  cliConfigPath: string,
  [vendor, arch]: [string, string],
  version?: string
): Promise<void> {
  await ensureIndexUpdated(cliPath, cliConfigPath);
  await runCli(
    cliPath,
    [
      'core',
      'install',
      `${vendor}:${arch}${version ? `@${version}` : ''}`,
      '--skip-post-install',
    ],
    cliConfigPath
  );
}

async function ensureCliConfigExists(
  cliPath: string,
  toolsEnv: ToolsEnv
): Promise<void> {
  const { cliConfigPath } = toolsEnv;
  if (!(await access(cliConfigPath))) {
    await runCli(cliPath, ['config', 'init', '--dest-file', cliConfigPath]);
  }
}

async function ensureConfigSet(
  cliPath: string,
  cliConfigPath: string,
  configKey: string,
  ...configValue: string[]
): Promise<void> {
  await runCli(
    cliPath,
    ['config', 'set', configKey, ...configValue],
    cliConfigPath
  );
}

async function runCli(
  cliPath: string,
  args: string[],
  cliConfigPath: string | undefined = undefined
): Promise<string> {
  if (cliConfigPath) {
    args.push('--config-file', cliConfigPath);
  }
  return run(cliPath, args /*, { silent: false }*/);
}
