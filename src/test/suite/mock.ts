import vscode from 'vscode';
import type {
  ArduinoContext,
  ArduinoState,
  BoardDetails,
  BuildProperties,
  CompileSummary,
} from 'vscode-arduino-api';

const never = new vscode.EventEmitter<void>().event;
const neverDidChange = <T extends keyof ArduinoState>() =>
  never as vscode.Event<unknown> as vscode.Event<ArduinoState[T]>;

export function mockArduinoContext(
  state?: Partial<ArduinoState>,
  onDidChange?: ArduinoContext['onDidChange']
): ArduinoContext {
  const mock = mockArduinoState(state);
  return {
    ...mock,
    onDidChange: onDidChange ?? neverDidChange,
  };
}

export function mockArduinoState(state?: Partial<ArduinoState>): ArduinoState {
  return {
    fqbn: undefined,
    boardDetails: undefined,
    compileSummary: undefined,
    dataDirPath: undefined,
    port: undefined,
    sketchPath: undefined,
    userDirPath: undefined,
    ...state,
  };
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
    toolsDependencies: [],
  };
}

export function mockCompileSummary(buildPath: string): CompileSummary {
  return {
    buildPath,
    boardPlatform: undefined,
    buildPlatform: undefined,
    buildProperties: {},
    executableSectionsSize: [],
    usedLibraries: [],
  };
}
