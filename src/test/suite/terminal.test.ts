import { FQBN } from 'fqbn';
import assert from 'node:assert/strict';
import path from 'node:path';
import vscode from 'vscode';
import { DecodeParamsError, ParsedGDBLine } from '../../decoder';
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
  bold,
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
          registerLocations: {},
          exception: undefined,
          allocLocation: undefined,
          stacktraceLines: [{ address: '0x00002710', line: 'bla bla' }],
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
          registerLocations: {},
          exception: undefined,
          allocLocation: undefined,
          stacktraceLines: [{ address: '0x00002710', line: 'bla bla' }],
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
      await new Promise((resolve) => setTimeout(resolve, 100)); // TODO: listen on state did change event
      assert.strictEqual(
        <unknown>terminal['state'].decoderResult instanceof Error,
        true
      );
      assert.strictEqual(
        (<Error>(<unknown>terminal['state'].decoderResult)).message,
        'Could not recognize stack trace/backtrace'
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
      await new Promise((resolve) => setTimeout(resolve, 100)); // TODO: listen on state did change event
      assert.strictEqual(
        terminal['state'].decoderResult instanceof Error,
        true
      );
      assert.strictEqual(
        (<Error>terminal['state'].decoderResult).message,
        'Could not recognize stack trace/backtrace'
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
      const headerPath = path.join(__dirname, 'path/to/header.h');
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
          allocLocation: [
            <ParsedGDBLine>{
              address: '0x400d200d',
              line: '12',
              file: libPath,
              method: 'myMethod()',
            },
            100,
          ],
          exception: ['error message', 1],
          stacktraceLines: [
            {
              address: '0x400d100d',
              line: 'stacktrace line',
            },
            <ParsedGDBLine>{
              address: '0x400d400d',
              line: '123',
              file: mainSketchFilePath,
              method: 'otherMethod()',
            },
          ],
          registerLocations: {
            BAR: <ParsedGDBLine>{
              address: '0x400d129d',
              line: '36',
              file: headerPath,
              method: 'loop()',
            },
            FOO: '0x00000000',
          },
        },
      });
      const location = (file: string) =>
        `${path.dirname(file)}${path.sep}${bold(path.basename(file))}`;
      const expected = stringifyLines([
        decodeTerminalTitle,
        `Sketch: ${green(sketchPath)} FQBN: ${green(fqbn)}`,
        '',
        'alma',
        'korte',
        'szilva',
        '',
        red('Exception 1: error message'),
        `${red('BAR')}: ${green('0x400d129d')}: ${blue(
          'loop()',
          true
        )} at ${location(headerPath)}:${bold('36')}`,
        `${red('FOO')}: ${green('0x00000000')}`,
        '',
        'Decoding stack results',
        `${green('0x400d100d')}: stacktrace line`,
        `${green('0x400d400d')}: ${blue('otherMethod()', true)} at ${location(
          mainSketchFilePath
        )}:${bold('123')}`,
        '',
        `${red('Memory allocation of 100 bytes failed at')} ${green(
          '0x400d200d'
        )}: ${blue('myMethod()', true)} at ${location(libPath)}:${bold('12')}`,
        '',
        statusMessage,
        '',
      ]);
      assert.strictEqual(actual, expected);
    });
  });
});
