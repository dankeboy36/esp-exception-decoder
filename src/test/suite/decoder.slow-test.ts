import { before, Suite } from 'mocha';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { BoardDetails, BuildProperties } from 'vscode-arduino-api';
import { __tests } from '../../decoder';
import { run } from '../../utils';
import type {
  CliContext,
  TestEnv,
  ToolsEnv,
  ToolsInstallType,
} from '../testEnv';

const { findToolPath } = __tests;

type PlatformId = [vendor: string, arch: string];
const esp32Boards = ['esp32', 'esp32s2', 'esp32s3', 'esp32c3'] as const;
type ESP32Board = (typeof esp32Boards)[number];
const esp8266Boards = ['generic'] as const;
type ESP8266Board = (typeof esp8266Boards)[number];

interface TestParams {
  readonly id: PlatformId;
  readonly toolsInstallType: ToolsInstallType;
  readonly boards: ESP32Board[] | ESP8266Board[];
}

const expectedToolFilenames: Record<ESP32Board | ESP8266Board, string> = {
  esp32: 'xtensa-esp32-elf-gdb',
  esp32s2: 'xtensa-esp32s2-elf-gdb',
  esp32s3: 'xtensa-esp32s3-elf-gdb',
  esp32c3: 'riscv32-esp-elf-gdb',
  generic: 'xtensa-lx106-elf-gdb',
};

const params: TestParams[] = [
  {
    id: ['esp32', 'esp32'],
    toolsInstallType: 'cli',
    boards: [...esp32Boards],
  },
  {
    id: ['espressif', 'esp32'],
    toolsInstallType: 'git',
    boards: [...esp32Boards],
  },
  {
    id: ['esp8266', 'esp8266'],
    toolsInstallType: 'cli',
    boards: [...esp8266Boards],
  },
];

function describeSuite(params: TestParams): Suite {
  const [vendor, arch] = params.id;
  const platformId = `${vendor}:${arch}`;
  return describe(`findToolPath for '${platformId}' platform installed via '${params.toolsInstallType}'`, () => {
    let testEnv: TestEnv;

    before(function () {
      testEnv = this.currentTest?.ctx?.['testEnv'];
      assert.notEqual(testEnv, undefined);
    });

    params.boards
      .map((boardId) => ({ fqbn: `${platformId}:${boardId}`, boardId }))
      .map(({ fqbn, boardId }) =>
        it(`should find the tool path for '${fqbn}'`, async function () {
          this.slow(10_000);
          const { cliContext, toolsEnvs } = testEnv;
          const boardDetails = await getBoardDetails(
            cliContext,
            toolsEnvs[params.toolsInstallType],
            fqbn
          );
          const actual = await findToolPath(boardDetails);
          assert.notEqual(
            actual,
            undefined,
            `could not find tool path for '${fqbn}'`
          );
          // filename without the extension independently from the OS
          const actualFilename = path.basename(
            <string>actual,
            path.extname(<string>actual)
          );
          assert.strictEqual(actualFilename, expectedToolFilenames[boardId]);
          const stdout = await run(<string>actual, ['--version'], {
            silent: true,
            silentError: true,
          });
          // TODO: assert GDB version?
          assert.strictEqual(
            stdout.includes('GNU gdb'),
            true,
            `output does not contain 'GNU gdb': ${stdout}`
          );
        })
      );
  });
}

async function getBoardDetails(
  cliContext: CliContext,
  toolsEnv: ToolsEnv,
  fqbn: string
): Promise<BoardDetails> {
  const { cliPath } = cliContext;
  const { cliConfigPath } = toolsEnv;
  const stdout = await run(cliPath, [
    'board',
    'details',
    '-b',
    fqbn,
    '--config-file',
    cliConfigPath,
    '--format',
    'json',
  ]);
  const buildProperties = JSON.parse(stdout).build_properties;
  return createBoardDetails(fqbn, buildProperties);
}

function createBoardDetails(
  fqbn: string,
  buildProperties: string[] | Record<string, string> = {}
): BoardDetails {
  return {
    fqbn,
    buildProperties: Array.isArray(buildProperties)
      ? parseBuildProperties(buildProperties)
      : buildProperties,
    configOptions: [],
    programmers: [],
    toolsDependencies: [],
  };
}

export function parseBuildProperties(properties: string[]): BuildProperties {
  return properties.reduce((acc, curr) => {
    const entry = parseProperty(curr);
    if (entry) {
      const [key, value] = entry;
      acc[key] = value;
    }
    return acc;
  }, <Record<string, string>>{});
}

const propertySep = '=';
function parseProperty(
  property: string
): [key: string, value: string] | undefined {
  const segments = property.split(propertySep);
  if (segments.length < 2) {
    console.warn(`Could not parse build property: ${property}.`);
    return undefined;
  }
  const [key, ...rest] = segments;
  if (!key) {
    console.warn(`Could not determine property key from raw: ${property}.`);
    return undefined;
  }
  const value = rest.join(propertySep);
  return [key, value];
}

describe('decoder (slow)', () => {
  params.map(describeSuite);

  it(`should throw an error when the board's architecture is unsupported`, async () => {
    await assert.rejects(
      () => findToolPath(createBoardDetails('a:b:c')),
      /Unsupported board architecture: 'a:b:c'/
    );
  });
});
