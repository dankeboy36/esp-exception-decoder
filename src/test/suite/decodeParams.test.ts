import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import temp from 'temp';
import {
  DecodeParamsError,
  __tests,
  createDecodeParams,
} from '../../decodeParams';
import { isWindows } from '../../utils';
import { mockArduinoState, mockBoardDetails, mockCompileSummary } from './mock';

const { findElfPath } = __tests;

describe('decodeParams', () => {
  let tracked: typeof temp;
  before(() => (tracked = temp.track()));
  after(() => tracked.cleanupSync());

  describe('createDecodeParams', () => {
    it("should error with missing 'sketchPath' when all missing", async () => {
      await assert.rejects(
        createDecodeParams(mockArduinoState()),
        /Sketch path is not set/
      );
    });

    it("should error with missing 'fqbn' when no board is selected", async () => {
      const sketchPath = tracked.mkdirSync();
      await assert.rejects(
        createDecodeParams(mockArduinoState({ sketchPath })),
        /No board selected/
      );
    });

    it("should error with not installed platform when 'boardDetails' is missing", async () => {
      const sketchPath = tracked.mkdirSync();
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({ sketchPath, fqbn: 'esp8266:esp8266:generic' })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Platform 'esp8266:esp8266' is not installed/.test(reason.message)
      );
    });

    it("should error due to unsupported board when the arch is neither 'esp32' nor 'esp8266'", async () => {
      const sketchPath = tracked.mkdirSync();
      const fqbn = 'a:b:c';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Unsupported board: 'a:b:c'/.test(reason.message)
      );
    });

    it("should error when the sketch has not been compiled and the 'compileSummary' is undefined", async () => {
      const sketchPath = tracked.mkdirSync();
      const fqbn = 'esp8266:esp8266:generic';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /The summary of the previous compilation is unavailable. Compile the sketch/.test(
            reason.message
          )
      );
    });

    it("should error when the '.elf' file not found", async () => {
      const sketchPath = tracked.mkdirSync();
      const buildPath = tracked.mkdirSync();
      const fqbn = 'esp8266:esp8266:generic';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Could not detect the '.elf' file in the build folder/.test(
            reason.message
          )
      );
    });

    it('should error when the GDB tool not found', async () => {
      const tempPath = tracked.mkdirSync();
      const sketchPath = path.join(tempPath, 'my_sketch');
      await fs.mkdir(sketchPath, { recursive: true });
      const buildPath = tracked.mkdirSync();
      await fs.writeFile(
        path.join(buildPath, `${path.basename(sketchPath)}.ino.elf`),
        ''
      );
      const fqbn = 'esp8266:esp8266:generic';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          })
        ),
        (reason) =>
          reason instanceof Error &&
          /Could not find GDB tool for 'esp8266:esp8266:generic'/.test(
            reason.message
          )
      );
    });

    it('should create the decode params', async () => {
      const tempPath = tracked.mkdirSync();
      const sketchPath = path.join(tempPath, 'my_sketch');
      await fs.mkdir(sketchPath, { recursive: true });
      const buildPath = tracked.mkdirSync();
      const elfPath = path.join(
        buildPath,
        `${path.basename(sketchPath)}.ino.elf`
      );
      await fs.writeFile(elfPath, '');
      const mockToolDirPath = tracked.mkdirSync();
      await fs.mkdir(path.join(mockToolDirPath, 'bin'), { recursive: true });
      const toolPath = path.join(
        mockToolDirPath,
        'bin',
        `xtensa-lx106-elf-gdb${isWindows ? '.exe' : ''}`
      );
      await fs.writeFile(toolPath, '');
      await fs.chmod(toolPath, 0o755);
      const fqbn = 'esp8266:esp8266:generic';
      const actual = await createDecodeParams(
        mockArduinoState({
          sketchPath,
          fqbn,
          boardDetails: mockBoardDetails(fqbn, {
            'runtime.tools.xtensa-esp-elf-gdb.path': mockToolDirPath,
          }),
          compileSummary: mockCompileSummary(buildPath),
        })
      );
      assert.strictEqual(actual.elfPath, elfPath);
      assert.strictEqual(actual.toolPath, toolPath);
      assert.strictEqual(actual.sketchPath, sketchPath);
      assert.strictEqual(actual.fqbn.toString(), fqbn);
    });
  });

  describe('findElfPath', () => {
    it('should not find the elf path when the sketch folder name does not match', async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const invalidName = 'MySketch';
      await fs.writeFile(path.join(buildPath, `${invalidName}.ino.elf`), '');
      await fs.writeFile(path.join(buildPath, `${invalidName}.cpp.elf`), '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, undefined);
    });

    it("should not find the elf path when neither 'ino.elf' nor 'cpp.elf' exist", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, undefined);
    });

    it("should find 'ino.elf' path", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.ino.elf`);
      await fs.writeFile(expected, '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });

    it("should find 'cpp.elf' path", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.cpp.elf`);
      await fs.writeFile(expected, '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });

    it("should prefer 'ino.elf' over 'cpp.elf' when both paths exist", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.ino.elf`);
      await fs.writeFile(expected, '');
      await fs.writeFile(path.join(buildPath, `${sketchName}.cpp.elf`), '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });
  });
});
