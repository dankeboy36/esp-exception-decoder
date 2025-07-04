import { FQBN } from 'fqbn';
import assert from 'node:assert/strict';
import path from 'node:path';
import vscode from 'vscode';
import { DecodeParamsError } from '../../decodeParams';
import { __tests } from '../../terminal';
import { mockArduinoContext } from './mock';

const {
  openTerminal,
  decodeTerminalTitle,
  stringifyLines,
  stringifyTerminalState,
  DecoderTerminal,
  red,
  green,
  blue,
} = __tests;

describe('terminal', () => {
  const arduinoContext = mockArduinoContext();

  describe('openTerminal', () => {
    it('should open a terminal', async () => {
      const beforeOpenTerminals = vscode.window.terminals;
      const terminal = openTerminal(arduinoContext);
      assert.strictEqual(
        vscode.window.terminals.length,
        beforeOpenTerminals.length + 1
      );
      assert.strictEqual(vscode.window.terminals.includes(terminal), true);
      assert.strictEqual(beforeOpenTerminals.includes(terminal), false);
    });

    it('should not open a new terminal if already opened', async () => {
      const arduinoContext = mockArduinoContext();
      const first = openTerminal(arduinoContext);
      const beforeSecondOpenTerminals = vscode.window.terminals;
      const second = openTerminal(arduinoContext);
      const afterSecondOpenTerminals = vscode.window.terminals;
      assert.strictEqual(first, second);
      assert.strictEqual(
        beforeSecondOpenTerminals.length,
        afterSecondOpenTerminals.length
      );
    });
  });

  describe('DecoderTerminal', () => {
    const toDisposeBeforeEach: vscode.Disposable[] = [];

    beforeEach(() => {
      vscode.Disposable.from(...toDisposeBeforeEach).dispose();
      toDisposeBeforeEach.length = 0;
    });

    it('should discard the user input and decoder result on params error', () => {
      const fqbn = new FQBN('esp8266:esp8266:generic');
      const terminal = new DecoderTerminal(arduinoContext);
      toDisposeBeforeEach.push(new vscode.Disposable(() => terminal.close()));
      terminal['state'] = {
        params: {
          sketchPath: '/path/to/sketch',
          fqbn,
          elfPath: '/path/to/elf',
          toolPath: '/path/to/tool',
        },
        userInput: 'some user input',
        decoderResult: {
          stacktraceLines: [
            { regAddr: '0x00002710', lineNumber: 'bla bla' } as const,
          ],
        },
      };
      terminal['updateState']({ params: new Error('boom') });
      assert.strictEqual(terminal['state'].userInput, undefined);
      assert.strictEqual(terminal['state'].decoderResult, undefined);
    });

    it('should discard the decoder result before decoding', async function () {
      this.slow(200);
      const fqbn = new FQBN('esp8266:esp8266:generic');
      const terminal = new DecoderTerminal(arduinoContext);
      toDisposeBeforeEach.push(new vscode.Disposable(() => terminal.close()));
      terminal['state'] = {
        params: {
          sketchPath: '/path/to/sketch',
          fqbn,
          elfPath: '/path/to/elf',
          toolPath: '/path/to/tool',
        },
        userInput: 'some user input',
        decoderResult: {
          stacktraceLines: [
            { regAddr: '0x00002710', lineNumber: 'bla bla' } as const,
          ],
        },
        statusMessage: 'idle',
      };
      assert.notStrictEqual(terminal['state'].decoderResult, undefined);
      terminal.handleInput('some invalid thing it does not matter');
      assert.strictEqual(terminal['state'].decoderResult, undefined);
      assert.notStrictEqual(terminal['state'].statusMessage, 'idle');
      assert.notStrictEqual(terminal['state'].statusMessage, undefined);
      assert.strictEqual(
        (<{ statusMessage: string }>terminal['state']).statusMessage.length > 0,
        true
      );
      await waitUntil(() =>
        assert.strictEqual(
          (<Error>(<unknown>terminal['state'].decoderResult))?.message,
          'No register addresses found to decode'
        )
      );
      assert.strictEqual(
        terminal['state'].userInput,
        'some invalid thing it does not matter'
      );
    });

    it("should gracefully handle all kind of line endings (including the bogus '\\r')", async function () {
      this.slow(200);
      const fqbn = new FQBN('esp8266:esp8266:generic');
      const terminal = new DecoderTerminal(arduinoContext);
      toDisposeBeforeEach.push(new vscode.Disposable(() => terminal.close()));
      terminal['state'] = {
        params: {
          sketchPath: '/path/to/sketch',
          fqbn,
          elfPath: '/path/to/elf',
          toolPath: '/path/to/tool',
        },
      };
      terminal.handleInput('line1\rline2\r\nline3\rline4\nline5');
      await waitUntil(() =>
        assert.strictEqual(
          terminal['state'].decoderResult instanceof Error,
          true
        )
      );
      assert.strictEqual(
        (<Error>terminal['state'].decoderResult).message,
        'No register addresses found to decode'
      );
      assert.strictEqual(
        terminal['state'].userInput,
        'line1\r\nline2\r\nline3\r\nline4\r\nline5'
      );
    });
  });

  describe('stringifyLines', () => {
    it('should build terminal output from lines', () => {
      assert.strictEqual(stringifyLines([]), '');
      assert.strictEqual(stringifyLines(['a', 'b']), 'a\r\nb');
      assert.strictEqual(stringifyLines(['a', '', 'c']), 'a\r\n\r\nc');
    });
  });

  describe('stringifyTerminalState', () => {
    it('should show the title when the state is empty', () => {
      const actual = stringifyTerminalState({
        params: new Error('alma'),
      });
      const expected = stringifyLines([decodeTerminalTitle, `${red('alma')}`]);
      assert.strictEqual(actual, expected);
    });

    it('should show FQBN and sketch name when the error contains context traces', () => {
      const fqbn = 'a:b:c';
      const sketchPath = 'my_sketch';
      const actual = stringifyTerminalState({
        params: new DecodeParamsError('the error message', {
          fqbn: new FQBN(fqbn),
          sketchPath,
        }),
        statusMessage: 'this should be ignored',
      });
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        red('the error message'),
        '',
      ]);
      assert.strictEqual(actual, expected);
    });

    it('should show the idle prompt', () => {
      const fqbn = 'a:b:c';
      const sketchPath = 'my_sketch';
      const statusMessage = 'this is the status message';
      const actual = stringifyTerminalState({
        params: {
          fqbn: new FQBN(fqbn),
          sketchPath,
          toolPath: 'this does not matter',
          elfPath: 'irrelevant',
        },
        statusMessage,
      });
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        statusMessage,
        '',
      ]);
      assert.strictEqual(actual, expected);
    });

    it('should show the users input', () => {
      const fqbn = 'a:b:c';
      const sketchPath = 'my_sketch';
      const statusMessage = 'decoding';
      const actual = stringifyTerminalState({
        params: {
          fqbn: new FQBN(fqbn),
          sketchPath,
          toolPath: 'this does not matter',
          elfPath: 'irrelevant',
        },
        userInput: 'alma\nkorte\nszilva',
        statusMessage,
      });
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        'alma',
        'korte',
        'szilva',
        '',
        statusMessage,
        '',
      ]);
      assert.strictEqual(actual, expected);
    });

    it('should handle a decode error as result', () => {
      const fqbn = 'a:b:c';
      const sketchPath = 'my_sketch';
      const statusMessage = 'paste to decode';
      const actual = stringifyTerminalState({
        params: {
          fqbn: new FQBN(fqbn),
          sketchPath,
          toolPath: 'this does not matter',
          elfPath: 'irrelevant',
        },
        userInput: 'alma\nkorte\nszilva',
        statusMessage,
        decoderResult: new Error('boom!'),
      });
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        'alma',
        'korte',
        'szilva',
        '',
        red('boom!'),
        '',
        statusMessage,
        '',
      ]);
      assert.strictEqual(actual, expected);
    });
    it('should show decode output', () => {
      const fqbn = 'a:b:c';
      const sketchPath = 'my_sketch';
      const statusMessage = 'paste to decode';
      const libPath = path.join(__dirname, 'path/to/lib.cpp');
      const mainSketchFilePath = path.join(
        __dirname,
        'path/to/main_sketch.ino'
      );
      const actual = stringifyTerminalState({
        params: {
          fqbn: new FQBN(fqbn),
          sketchPath,
          toolPath: 'this does not matter',
          elfPath: 'irrelevant',
        },
        userInput: 'alma\nkorte\nszilva',
        statusMessage,
        decoderResult: {
          faultInfo: {
            faultMessage: 'error message',
            coreId: 0,
            faultCode: 1,
            programCounter: {
              location: {
                regAddr: '0x400d100d',
                lineNumber: '17',
                file: 'src/main.cpp',
                method: 'mainMethod',
                args: [
                  { name: 'arg1', value: 'value1' },
                  { name: 'arg2', value: 'value2' },
                ],
              },
              addr: 0x400d100d,
            },
          },
          allocInfo: {
            allocAddr: {
              regAddr: '0x400d200d',
              lineNumber: '12',
              file: libPath,
              method: 'myMethod',
            },
            allocSize: 100,
          },
          stacktraceLines: [
            {
              regAddr: '0x400d100d',
              lineNumber: 'stacktrace line',
            },
            {
              regAddr: '0x400d400d',
              lineNumber: '123',
              file: mainSketchFilePath,
              method: 'otherMethod',
            },
          ],
          regs: {
            BAR: 0x400d129d,
            FOO: 0x00000000,
          },
        },
      });
      const location = (file: string) =>
        `${path.dirname(file)}${path.sep}${path.basename(file)}`;
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        'alma',
        'korte',
        'szilva',
        '',
        red('0 | error message | 1'),
        '',
        red('PC -> ') +
          green('0x400d100d') +
          ': ' +
          blue('mainMethod (arg1=value1, arg2=value2)') +
          ' at src/main.cpp:17',
        '',
        green('0x400d100d') + ': stacktrace line',
        green('0x400d400d') +
          ': ' +
          blue('otherMethod ()') +
          ' at ' +
          location(mainSketchFilePath) +
          ':123',
        '',
        red('Memory allocation of 100 bytes failed') +
          ' at ' +
          green('0x400d200d') +
          ': ' +
          blue('myMethod ()') +
          ' at ' +
          location(libPath) +
          ':12',
        '',
        statusMessage,
        '',
      ]);
      assert.strictEqual(actual, expected);
    });
  });
});

export interface WaitUntilOptions {
  timeout?: number;
  interval?: number;
}

export async function waitUntil(
  fn: () => void | Promise<void>,
  { timeout = 2_000, interval = 50 }: WaitUntilOptions = {}
): Promise<void> {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeout) {
    try {
      await fn();
      return;
    } catch (e) {
      if (e instanceof Error && e.name === 'AssertionError') {
        lastError = e;
        await new Promise((r) => setTimeout(r, interval));
      } else {
        throw e;
      }
    }
  }

  throw lastError;
}
