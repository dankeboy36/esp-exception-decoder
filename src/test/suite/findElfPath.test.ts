import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import temp from 'temp'

import {
  buildFolderMd5Hash,
  findElfPath,
  resolveBuildPathCandidates,
  resolveBuildPathFromSketchPath,
} from '../../findElfPath'

describe('findElfPath', () => {
  let tracked: typeof temp
  before(() => (tracked = temp.track()))
  after(() => tracked.cleanupSync())

  it('should not find the elf path when the sketch folder name does not match', async () => {
    const buildPath = tracked.mkdirSync()
    const sketchName = 'my_sketch'
    const invalidName = 'MySketch'
    await fs.writeFile(path.join(buildPath, `${invalidName}.ino.elf`), '')
    await fs.writeFile(path.join(buildPath, `${invalidName}.cpp.elf`), '')
    const actual = await findElfPath(sketchName, buildPath)
    assert.strictEqual(actual, undefined)
  })

  it("should not find the elf path when neither 'ino.elf' nor 'cpp.elf' exist", async () => {
    const buildPath = tracked.mkdirSync()
    const sketchName = 'my_sketch'
    const actual = await findElfPath(sketchName, buildPath)
    assert.strictEqual(actual, undefined)
  })

  it("should find 'ino.elf' path", async () => {
    const buildPath = tracked.mkdirSync()
    const sketchName = 'my_sketch'
    const expected = path.join(buildPath, `${sketchName}.ino.elf`)
    await fs.writeFile(expected, '')
    const actual = await findElfPath(sketchName, buildPath)
    assert.strictEqual(actual, expected)
  })

  it("should find 'cpp.elf' path", async () => {
    const buildPath = tracked.mkdirSync()
    const sketchName = 'my_sketch'
    const expected = path.join(buildPath, `${sketchName}.cpp.elf`)
    await fs.writeFile(expected, '')
    const actual = await findElfPath(sketchName, buildPath)
    assert.strictEqual(actual, expected)
  })

  it("should prefer 'ino.elf' over 'cpp.elf' when both paths exist", async () => {
    const buildPath = tracked.mkdirSync()
    const sketchName = 'my_sketch'
    const expected = path.join(buildPath, `${sketchName}.ino.elf`)
    await fs.writeFile(expected, '')
    await fs.writeFile(path.join(buildPath, `${sketchName}.cpp.elf`), '')
    const actual = await findElfPath(sketchName, buildPath)
    assert.strictEqual(actual, expected)
  })

  it('resolves fallback build path when build.options.json exists', async () => {
    const basePath = tracked.mkdirSync()
    const sketchPath = '/tmp/workspace/esp32backtracetest'
    const sketchFolderName = 'esp32backtracetest'
    const [candidatePath] = resolveBuildPathCandidates(sketchPath, {
      userCacheDirPath: basePath,
      tempDirPath: basePath,
    })
    assert.ok(candidatePath)
    await fs.mkdir(candidatePath, { recursive: true })
    await fs.writeFile(path.join(candidatePath, 'build.options.json'), '{}')

    const actual = await resolveBuildPathFromSketchPath(
      sketchPath,
      sketchFolderName,
      {
        userCacheDirPath: basePath,
        tempDirPath: basePath,
      }
    )

    assert.ok(actual)
    assert.strictEqual(actual.buildPath, candidatePath)
    assert.strictEqual(actual.elfPath, undefined)
    assert.strictEqual(actual.hasBuildOptions, true)
  })

  it('resolves fallback build path when elf exists', async () => {
    const basePath = tracked.mkdirSync()
    const sketchPath = '/tmp/workspace/esp32backtracetest'
    const sketchFolderName = 'esp32backtracetest'
    const [candidatePath] = resolveBuildPathCandidates(sketchPath, {
      userCacheDirPath: basePath,
      tempDirPath: basePath,
    })
    assert.ok(candidatePath)
    await fs.mkdir(candidatePath, { recursive: true })
    const elfPath = path.join(candidatePath, `${sketchFolderName}.ino.elf`)
    await fs.writeFile(elfPath, '')

    const actual = await resolveBuildPathFromSketchPath(
      sketchPath,
      sketchFolderName,
      {
        userCacheDirPath: basePath,
        tempDirPath: basePath,
      }
    )

    assert.ok(actual)
    assert.strictEqual(actual.buildPath, candidatePath)
    assert.strictEqual(actual.elfPath, elfPath)
    assert.strictEqual(actual.hasBuildOptions, false)
  })

  it('generates windows hash candidates for both drive-letter casings', () => {
    const sketchPath = 'C:\\ws\\esp32backtracetest'
    const sketchPathOtherCase = 'c:\\ws\\esp32backtracetest'
    const basePath = 'C:\\Users\\per\\AppData\\Local\\Temp'
    const basePathOtherCase = 'c:\\Users\\per\\AppData\\Local\\Temp'

    const candidates = resolveBuildPathCandidates(sketchPath, {
      platform: 'win32',
      userCacheDirPath: basePath,
      tempDirPath: basePath,
    })

    const expectedPrimary = path.win32.join(
      basePath,
      'arduino',
      'sketches',
      buildFolderMd5Hash(sketchPath)
    )
    const expectedBaseOtherCase = path.win32.join(
      basePathOtherCase,
      'arduino',
      'sketches',
      buildFolderMd5Hash(sketchPath)
    )
    const expectedSketchOtherCase = path.win32.join(
      basePath,
      'arduino',
      'sketches',
      buildFolderMd5Hash(sketchPathOtherCase)
    )

    assert.ok(candidates.includes(expectedPrimary))
    assert.ok(candidates.includes(expectedBaseOtherCase))
    assert.ok(candidates.includes(expectedSketchOtherCase))
  })

  it('normalizes windows slash styles and emits both folder schemes', () => {
    const sketchPath = 'D:/a/esp-exception-decoder/esp-exception-decoder/sketch'
    const normalizedSketchPath = path.win32.normalize(sketchPath)
    const basePath = 'D:\\Users\\runneradmin\\AppData\\Local\\Temp'
    const candidates = resolveBuildPathCandidates(sketchPath, {
      platform: 'win32',
      userCacheDirPath: basePath,
      tempDirPath: basePath,
    })
    const hash = buildFolderMd5Hash(normalizedSketchPath)
    const sketchesFolderCandidate = path.win32.join(
      basePath,
      'arduino',
      'sketches',
      hash
    )
    const flatFolderCandidate = path.win32.join(
      basePath,
      `arduino-sketch-${hash}`
    )

    assert.ok(candidates.includes(sketchesFolderCandidate))
    assert.ok(candidates.includes(flatFolderCandidate))
  })
})
