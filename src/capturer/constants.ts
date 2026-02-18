export const capturerViewId = 'espExceptionDecoder.capturerView'
export const capturerConfigStateKey = 'espExceptionDecoder.capturer.configs.v1'
export const replayFileStateKey = 'espExceptionDecoder.capturer.replayFile.v1'

export const statusNoElf = 'No ELF'
export const statusReady = 'Ready'
export const statusCapturing = 'Capturing crashes'
export const statusSuspended = 'Suspended'
export const statusNotCompiled = 'Not compiled'
export const statusDisconnected = 'Disconnected'
export const statusInvalidFqbn = 'Invalid FQBN'
export const statusNotEspBoard = 'Not ESP board'
export const statusError = 'Error'
export const statusWarning = 'Warning'
export const statusNoSketch = 'Missing Sketch'

export const splitMarker = /^---\s*SNAP\s*---$/im
export const idleFlushDelayMs = 1200

export const capturerCreateCommandId = 'espExceptionDecoder.capturerCreate'
export const capturerRemoveCommandId = 'espExceptionDecoder.capturerRemove'
export const capturerStartCommandId = 'espExceptionDecoder.capturerStart'
export const capturerStopCommandId = 'espExceptionDecoder.capturerStop'
export const capturerRefreshCommandId = 'espExceptionDecoder.capturerRefresh'
export const capturerReplayCrashCommandId =
  'espExceptionDecoder.capturerReplayCrash'
export const capturerClearEventCommandId =
  'espExceptionDecoder.capturerClearEvent'
export const capturerClearAllEventsCommandId =
  'espExceptionDecoder.capturerClearAllEvents'
export const capturerShowEventCommandId =
  'espExceptionDecoder.capturerShowEvent'
export const capturerQuickFixCommandId = 'espExceptionDecoder.capturerQuickFix'
export const capturerQuickFixSyncSketchBoardCommandId =
  'espExceptionDecoder.capturerQuickFixSyncSketchBoard'
export const capturerCompileSketchCommandId =
  'espExceptionDecoder.capturerCompileSketch'
export const capturerCompileSketchDebugCommandId =
  'espExceptionDecoder.capturerCompileSketchDebug'
export const dumpCapturerStateCommandId =
  'espExceptionDecoder.dumpCrashCapturerState'
export const capturerCopyToClipboardCommandId =
  'espExceptionDecoder.capturerCopyToClipboard'

export const supportedCapturerArchitectures = new Set(['esp32', 'esp8266'])
