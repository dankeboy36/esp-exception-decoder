import { createHash } from 'node:crypto'
import { homedir, tmpdir } from 'node:os'
import path from 'node:path'

import { access } from './utils'

export async function findElfPath(
  sketchFolderName: string,
  buildPath: string
): Promise<string | undefined> {
  const [inoElfPath, cppElfPath] = await Promise.all(
    ['ino', 'cpp'].map((ext) =>
      access(path.join(buildPath, `${sketchFolderName}.${ext}.elf`))
    )
  )
  return inoElfPath ?? cppElfPath ?? undefined
}

interface BuildPathProbeOptions {
  platform?: NodeJS.Platform
  userCacheDirPath?: string
  tempDirPath?: string
  sketchRealPath?: string
}

interface BuildPathProbeResult {
  buildPath: string
  elfPath?: string
  hasBuildOptions: boolean
}

export function buildFolderMd5Hash(sketchPath: string): string {
  return createHash('md5').update(sketchPath).digest('hex').toUpperCase()
}

export function resolveBuildPathCandidates(
  sketchPath: string,
  options: BuildPathProbeOptions = {}
): string[] {
  const platform = options.platform ?? process.platform
  const platformPath = pathForPlatform(platform)
  const basePaths = resolveBasePaths(platform, options)
  const sketchPaths = resolveSketchPathVariants(
    sketchPath,
    platform,
    options,
    platformPath
  )
  const candidates: string[] = []
  for (const basePath of basePaths) {
    for (const sketchPathVariant of sketchPaths) {
      const hash = buildFolderMd5Hash(sketchPathVariant)
      candidates.push(
        platformPath.join(basePath, 'arduino', 'sketches', hash),
        platformPath.join(basePath, `arduino-sketch-${hash}`)
      )
    }
  }
  return dedupe(candidates)
}

// https://github.com/arduino/arduino-cli/issues/2866
export async function resolveBuildPathFromSketchPath(
  sketchPath: string,
  sketchFolderName: string,
  options: BuildPathProbeOptions = {}
): Promise<BuildPathProbeResult | undefined> {
  const platform = options.platform ?? process.platform
  const platformPath = pathForPlatform(platform)
  const candidates = resolveBuildPathCandidates(sketchPath, options)
  for (const buildPath of candidates) {
    const [elfPath, buildOptionsPath] = await Promise.all([
      findElfPath(sketchFolderName, buildPath),
      access(platformPath.join(buildPath, 'build.options.json')),
    ])
    if (!elfPath && !buildOptionsPath) {
      continue
    }
    return {
      buildPath,
      elfPath,
      hasBuildOptions: Boolean(buildOptionsPath),
    }
  }
  return undefined
}

function resolveSketchPathVariants(
  sketchPath: string,
  platform: NodeJS.Platform,
  options: { sketchRealPath?: string },
  platformPath: typeof path.posix | typeof path.win32
): string[] {
  const variants = new Set<string>()
  variants.add(platformPath.normalize(sketchPath))
  if (options.sketchRealPath) {
    variants.add(platformPath.normalize(options.sketchRealPath))
  }
  if (platform === 'win32') {
    for (const entry of [...variants]) {
      if (isWinDrivePath(entry)) {
        variants.add(toggleFirstCharCase(entry))
      }
    }
  }
  return [...variants]
}

function resolveBasePaths(
  platform: NodeJS.Platform,
  options: { userCacheDirPath?: string; tempDirPath?: string }
): string[] {
  const userCachePath =
    options.userCacheDirPath ?? resolveUserCacheDir(platform)
  const tempPath = options.tempDirPath ?? tmpdir()
  const bases = dedupe([userCachePath, tempPath].filter(isNonEmptyString))
  if (platform !== 'win32') {
    return bases
  }
  const withCaseVariants = new Set<string>(bases)
  for (const base of bases) {
    if (isWinDrivePath(base)) {
      withCaseVariants.add(toggleFirstCharCase(base))
    }
  }
  return [...withCaseVariants]
}

function resolveUserCacheDir(platform: NodeJS.Platform): string | undefined {
  if (platform === 'win32') {
    return process.env.LOCALAPPDATA
  }
  if (platform === 'darwin') {
    return path.posix.join(homedir(), 'Library', 'Caches')
  }
  return process.env.XDG_CACHE_HOME ?? path.posix.join(homedir(), '.cache')
}

function isWinDrivePath(candidate: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(candidate)
}

function toggleFirstCharCase(value: string): string {
  if (value.length === 0) {
    return value
  }
  const firstChar = value[0]
  const toggled =
    firstChar === firstChar.toUpperCase()
      ? firstChar.toLowerCase()
      : firstChar.toUpperCase()
  return `${toggled}${value.slice(1)}`
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function pathForPlatform(
  platform: NodeJS.Platform
): typeof path.posix | typeof path.win32 {
  return platform === 'win32' ? path.win32 : path.posix
}
