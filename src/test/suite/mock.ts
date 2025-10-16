import vscode from 'vscode'
import type {
  ArduinoContext,
  ArduinoState,
  BoardDetails,
  BuildProperties,
  ChangeEvent,
  CliConfig,
  CompileSummary,
  SketchFolder,
  SketchFoldersChangeEvent,
} from 'vscode-arduino-api'

export function mockArduinoContext(
  options: {
    currentSketch?: SketchFolder
    openedSketches?: readonly SketchFolder[]
  } = {}
): ArduinoContext {
  const {
    currentSketch,
    openedSketches = currentSketch ? [currentSketch] : [],
  } = options
  const onDidChangeCurrentSketchEmitter = new vscode.EventEmitter<
    SketchFolder | undefined
  >()
  const onDidChangeSketchEmitter = new vscode.EventEmitter<
    ChangeEvent<SketchFolder>
  >()
  const onDidChangeSketchFoldersEmitter =
    new vscode.EventEmitter<SketchFoldersChangeEvent>()
  const onDidChangeConfigEmitter = new vscode.EventEmitter<
    ChangeEvent<CliConfig>
  >()
  const onDidChangeDeprecatedEmitter = new vscode.EventEmitter<unknown>()

  const boardDetails = isBoardDetails(currentSketch?.board)
    ? currentSketch?.board
    : undefined

  return {
    openedSketches,
    currentSketch,
    onDidChangeCurrentSketch: onDidChangeCurrentSketchEmitter.event,
    onDidChangeSketch: onDidChangeSketchEmitter.event,
    onDidChangeSketchFolders: onDidChangeSketchFoldersEmitter.event,
    config: { dataDirPath: undefined, userDirPath: undefined },
    onDidChangeConfig: onDidChangeConfigEmitter.event,
    onDidChange<T extends keyof ArduinoState>() {
      return onDidChangeDeprecatedEmitter.event as vscode.Event<ArduinoState[T]>
    },
    sketchPath: currentSketch?.sketchPath,
    compileSummary: currentSketch?.compileSummary,
    fqbn: boardDetails?.fqbn,
    boardDetails,
    port: undefined,
    userDirPath: undefined,
    dataDirPath: undefined,
  }
}

export function mockSketchFolder(
  overrides: Partial<SketchFolder> = {}
): SketchFolder {
  return {
    board: undefined,
    compileSummary: undefined,
    configOptions: undefined,
    port: undefined,
    selectedProgrammer: undefined,
    sketchPath: '/tmp/mock-sketch',
    ...overrides,
  }
}

export function mockBoardDetails(
  fqbn: string,
  buildProperties: BuildProperties = {}
): BoardDetails {
  return {
    fqbn,
    buildProperties,
    configOptions: [],
    programmers: [],
    defaultProgrammerId: 'mock-programmer',
    toolsDependencies: [],
    name: 'Mock Board',
  }
}

export function mockCompileSummary(buildPath: string): CompileSummary {
  return {
    buildPath,
    boardPlatform: undefined,
    buildPlatform: undefined,
    buildProperties: {},
    executableSectionsSize: [],
    usedLibraries: [],
  }
}

function isBoardDetails(
  board: SketchFolder['board']
): board is BoardDetails & { fqbn: string } {
  return Boolean(board && 'buildProperties' in board)
}
