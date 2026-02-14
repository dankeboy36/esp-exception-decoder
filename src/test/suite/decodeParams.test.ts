import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import temp from 'temp'

import { DecodeParamsError, createDecodeParams } from '../../decodeParams'
import { isWindows } from '../../utils'
import { mockBoardDetails, mockCompileSummary, mockSketchFolder } from './mock'

describe('decodeParams', () => {
  let tracked: typeof temp
  before(() => (tracked = temp.track()))
  after(() => tracked.cleanupSync())

  describe('createDecodeParams', () => {
    it("should error with missing 'sketchPath' when all missing", async () => {
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath: undefined as unknown as string,
          })
        ),
        /Sketch path is not set/
      )
    })

    it("should error with missing 'fqbn' when no board is selected", async () => {
      const sketchPath = tracked.mkdirSync()
      await assert.rejects(
        createDecodeParams(mockSketchFolder({ sketchPath })),
        /No board selected/
      )
    })

    it("should error with missing FQBN when 'fqbn' is not set on the 'board'", async () => {
      const sketchPath = tracked.mkdirSync()
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: { name: 'Mock Board', fqbn: undefined },
          })
        ),
        (reason) =>
          reason instanceof Error &&
          /No FQBN is set for board Mock Board/.test(reason.message)
      )
    })

    it("should error with not installed platform when 'boardDetails' is missing", async () => {
      const sketchPath = tracked.mkdirSync()
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: { name: 'Mock Board', fqbn: 'a:b:c' },
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Platform 'a:b' is not installed/.test(reason.message)
      )
    })

    it("should error due to unsupported board when the arch is neither 'esp32' nor 'esp8266'", async () => {
      const sketchPath = tracked.mkdirSync()
      const fqbn = 'a:b:c'
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Unsupported board: 'a:b:c'/.test(reason.message)
      )
    })

    it("should error when the sketch has not been compiled and the 'compileSummary' is undefined", async () => {
      const sketchPath = tracked.mkdirSync()
      const fqbn = 'esp8266:esp8266:generic'
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /The summary of the previous compilation is unavailable. Compile the sketch/.test(
            reason.message
          )
      )
    })

    it("should error when the 'compileSummary' build path is not a string", async () => {
      const sketchPath = tracked.mkdirSync()
      const fqbn = 'esp8266:esp8266:generic'
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: mockBoardDetails(fqbn),
            compileSummary: {
              ...mockCompileSummary('/tmp/ignored'),
              buildPath: undefined as unknown as string,
            },
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /does not contain a build path/.test(reason.message)
      )
    })

    it("should error when the '.elf' file not found", async () => {
      const sketchPath = tracked.mkdirSync()
      const buildPath = tracked.mkdirSync()
      const fqbn = 'esp8266:esp8266:generic'
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Could not detect the '.elf' file in the build folder/.test(
            reason.message
          )
      )
    })

    it('should error when the GDB tool not found', async () => {
      const tempPath = tracked.mkdirSync()
      const sketchPath = path.join(tempPath, 'my_sketch')
      await fs.mkdir(sketchPath, { recursive: true })
      const buildPath = tracked.mkdirSync()
      await fs.writeFile(
        path.join(buildPath, `${path.basename(sketchPath)}.ino.elf`),
        ''
      )
      const fqbn = 'esp8266:esp8266:generic'
      await assert.rejects(
        createDecodeParams(
          mockSketchFolder({
            sketchPath,
            board: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          })
        ),
        (reason) =>
          reason instanceof Error &&
          /Could not find GDB tool for 'esp8266:esp8266:generic'/.test(
            reason.message
          )
      )
    })

    it('should create the decode params', async () => {
      const tempPath = tracked.mkdirSync()
      const sketchPath = path.join(tempPath, 'my_sketch')
      await fs.mkdir(sketchPath, { recursive: true })
      const buildPath = tracked.mkdirSync()
      const elfPath = path.join(
        buildPath,
        `${path.basename(sketchPath)}.ino.elf`
      )
      await fs.writeFile(elfPath, '')
      const mockToolDirPath = tracked.mkdirSync()
      await fs.mkdir(path.join(mockToolDirPath, 'bin'), { recursive: true })
      const toolPath = path.join(
        mockToolDirPath,
        'bin',
        `xtensa-lx106-elf-gdb${isWindows ? '.exe' : ''}`
      )
      await fs.writeFile(toolPath, '')
      await fs.chmod(toolPath, 0o755)
      const fqbn = 'esp8266:esp8266:generic'
      const actual = await createDecodeParams(
        mockSketchFolder({
          sketchPath,
          board: mockBoardDetails(fqbn, {
            'runtime.tools.xtensa-esp-elf-gdb.path': mockToolDirPath,
          }),
          compileSummary: mockCompileSummary(buildPath),
        })
      )
      assert.strictEqual(actual.elfPath, elfPath)
      assert.strictEqual(actual.toolPath, toolPath)
      assert.strictEqual(actual.sketchPath, sketchPath)
      assert.strictEqual(actual.fqbn.toString(), fqbn)
    })
  })
})
