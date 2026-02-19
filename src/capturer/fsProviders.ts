import { Dirent } from 'node:fs'
import * as fs from 'node:fs/promises'

import vscode from 'vscode'

export const readonlyLibraryScheme = 'espExceptionDecoderReadonlyFs'
export const crashReportScheme = 'espExceptionDecoderCrashReport'

export class CrashReportContentProvider
  implements vscode.TextDocumentContentProvider, vscode.Disposable
{
  private readonly onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>()
  private readonly contentByUri = new Map<string, string>()
  private readonly uriOrder: string[] = []
  private readonly maxReports = 128

  readonly onDidChange = this.onDidChangeEmitter.event

  dispose(): void {
    this.onDidChangeEmitter.dispose()
    this.contentByUri.clear()
    this.uriOrder.length = 0
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    const key = uri.toString()
    return this.contentByUri.get(key) ?? '# Report is no longer available.'
  }

  createReportUri(name: string, content: string): vscode.Uri {
    const safeName = toSafeReportName(name)
    const uniqueId = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`
    const uri = vscode.Uri.from({
      scheme: crashReportScheme,
      path: `/${safeName}-${uniqueId}.md`,
    })
    const key = uri.toString()
    this.contentByUri.set(key, content)
    this.uriOrder.push(key)
    this.trimCache()
    this.onDidChangeEmitter.fire(uri)
    return uri
  }

  private trimCache(): void {
    while (this.uriOrder.length > this.maxReports) {
      const oldest = this.uriOrder.shift()
      if (oldest) {
        this.contentByUri.delete(oldest)
      }
    }
  }
}

export function toReadonlyLibraryUri(filePath: string): vscode.Uri {
  return vscode.Uri.from({
    scheme: readonlyLibraryScheme,
    path: vscode.Uri.file(filePath).path,
    query: `source=${encodeURIComponent(filePath)}`,
  })
}

export function toSourcePathFromReadonlyUri(uri: vscode.Uri): string {
  const source = new URLSearchParams(uri.query).get('source')
  if (source && source.length > 0) {
    return source
  }
  return /^\/[A-Za-z]:\//.test(uri.path) ? uri.path.slice(1) : uri.path
}

export class ReadonlyFsProvider
  implements vscode.FileSystemProvider, vscode.Disposable
{
  private readonly onDidChangeFileEmitter = new vscode.EventEmitter<
    vscode.FileChangeEvent[]
  >()

  readonly onDidChangeFile = this.onDidChangeFileEmitter.event

  dispose(): void {
    this.onDidChangeFileEmitter.dispose()
  }

  watch(): vscode.Disposable {
    return new vscode.Disposable(() => {
      // noop
    })
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const targetPath = toSourcePathFromReadonlyUri(uri)
    const stats = await fs.stat(targetPath)
    return {
      type: toFileType(stats),
      ctime: stats.ctimeMs,
      mtime: stats.mtimeMs,
      size: stats.size,
    }
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const targetPath = toSourcePathFromReadonlyUri(uri)
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    return entries.map((entry) => [entry.name, toFileType(entry)])
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const targetPath = toSourcePathFromReadonlyUri(uri)
    return fs.readFile(targetPath)
  }

  createDirectory(_uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Read-only filesystem provider')
  }

  writeFile(_uri: vscode.Uri, _content: Uint8Array): void {
    throw vscode.FileSystemError.NoPermissions('Read-only filesystem provider')
  }

  delete(_uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Read-only filesystem provider')
  }

  rename(_oldUri: vscode.Uri, _newUri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Read-only filesystem provider')
  }
}

function toSafeReportName(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return sanitized.length > 0 ? sanitized.slice(0, 64) : 'report'
}

function toFileType(
  entry: Dirent | Awaited<ReturnType<typeof fs.stat>>
): vscode.FileType {
  if (entry.isDirectory()) {
    return vscode.FileType.Directory
  }
  if (entry.isFile()) {
    return vscode.FileType.File
  }
  if (entry.isSymbolicLink()) {
    return vscode.FileType.SymbolicLink
  }
  return vscode.FileType.Unknown
}
