import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import vscode from 'vscode'

import {
  CrashReportContentProvider,
  ReadonlyFsProvider,
  crashReportScheme,
  readonlyLibraryScheme,
  toReadonlyLibraryUri,
  toSourcePathFromReadonlyUri,
} from '../../capturer/fsProviders'

describe('fsProviders', () => {
  it('creates and serves crash report content and trims old entries', () => {
    const provider = new CrashReportContentProvider()
    const missingUri = vscode.Uri.from({
      scheme: crashReportScheme,
      path: '/missing.md',
    })
    assert.equal(
      provider.provideTextDocumentContent(missingUri),
      '# Report is no longer available.'
    )

    const first = provider.createReportUri('My Report', '# hello')
    assert.equal(first.scheme, crashReportScheme)
    assert.equal(provider.provideTextDocumentContent(first), '# hello')

    for (let i = 0; i < 130; i += 1) {
      provider.createReportUri(`R ${i}`, `# ${i}`)
    }

    assert.equal(
      provider.provideTextDocumentContent(first),
      '# Report is no longer available.'
    )
    provider.dispose()
  })

  it('converts readonly uri roundtrip and falls back to uri path', () => {
    const sourcePath = '/tmp/library/main.cpp'
    const uri = toReadonlyLibraryUri(sourcePath)
    assert.equal(uri.scheme, readonlyLibraryScheme)
    assert.equal(toSourcePathFromReadonlyUri(uri), sourcePath)

    const fallback = vscode.Uri.from({
      scheme: readonlyLibraryScheme,
      path: '/tmp/no-query.cpp',
    })
    assert.equal(toSourcePathFromReadonlyUri(fallback), '/tmp/no-query.cpp')
  })

  it('creates absolute readonly uris for Windows drive-letter paths', () => {
    const sourcePath =
      'C:\\Users\\xxx\\AppData\\Local\\Arduino15\\packages\\esp32\\hardware\\esp32\\3.2.1\\cores\\esp32\\main.cpp'
    const uri = toReadonlyLibraryUri(sourcePath)
    const serialized = uri.toString()

    assert.equal(uri.scheme, readonlyLibraryScheme)
    assert.equal(toSourcePathFromReadonlyUri(uri), sourcePath)
    assert.equal(serialized.startsWith(`${readonlyLibraryScheme}:/`), true)

    const fallback = vscode.Uri.from({
      scheme: readonlyLibraryScheme,
      path: '/C:/Users/xxx/AppData/Local/Arduino15/main.cpp',
    })
    assert.equal(
      toSourcePathFromReadonlyUri(fallback),
      'C:/Users/xxx/AppData/Local/Arduino15/main.cpp'
    )
  })

  it('reads readonly files and blocks write operations', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'capturer-fs-'))
    const subDir = path.join(root, 'sub')
    const filePath = path.join(root, 'a.txt')
    await fs.mkdir(subDir)
    await fs.writeFile(filePath, 'hello')

    // best-effort symbolic link coverage for Dirent.isSymbolicLink().
    try {
      await fs.symlink(filePath, path.join(root, 'a-link.txt'))
    } catch {
      // symlink may be unavailable in some environments
    }

    const provider = new ReadonlyFsProvider()
    const watched = provider.watch()

    const stat = await provider.stat(toReadonlyLibraryUri(filePath))
    assert.equal(stat.type, vscode.FileType.File)
    const content = await provider.readFile(toReadonlyLibraryUri(filePath))
    assert.equal(new TextDecoder().decode(content), 'hello')

    const dirEntries = await provider.readDirectory(toReadonlyLibraryUri(root))
    assert.equal(
      dirEntries.some(([name]) => name === 'a.txt'),
      true
    )
    assert.equal(
      dirEntries.some(([name]) => name === 'sub'),
      true
    )

    assert.throws(() => (provider as any).createDirectory())
    assert.throws(() => (provider as any).writeFile())
    assert.throws(() => (provider as any).delete())
    assert.throws(() => (provider as any).rename())

    watched.dispose()
    provider.dispose()
    await fs.rm(root, { recursive: true, force: true })
  })
})
