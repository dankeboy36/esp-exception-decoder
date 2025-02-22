import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FQBN } from 'fqbn';
import temp from 'temp';
import {
  DecodeParams,
  DecodeParamsError,
  __tests,
  createDecodeParams,
  decode,
} from '../../decoder';
import { isWindows } from '../../utils';
import { mockArduinoState, mockBoardDetails, mockCompileSummary } from './mock';

const {
  buildCommandFlags,
  findElfPath,
  parseException,
  parseStacktrace,
  parseInstructionAddresses,
  parseGDBOutput,
  parseAlloc,
  parseRegisters,
  exceptions,
} = __tests;

const esp8266Input = `--------------- CUT HERE FOR EXCEPTION DECODER ---------------
$�K��5�z�͎����
User exception (panic/abort/assert)
--------------- CUT HERE FOR EXCEPTION DECODER ---------------

Abort called

>>>stack>>>

ctx: cont
sp: 3fffff90 end: 3fffffd0 offset: 0010
3fffffa0:  00002580 00000000 3ffee54c 4020104e  
3fffffb0:  3fffdad0 00000000 3ffee54c 402018ac  
3fffffc0:  feefeffe feefeffe 3fffdab0 40100d19  
<<<stack<<<

--------------- CUT HERE FOR EXCEPTION DECODER ---------------
$�K��5�z�͎����
User exception (panic/abort/assert)
--------------- CUT HERE FOR EXCEPTION DECODER ---------------

Abort called

>>>stack>>>

ctx: cont
sp: 3fffff90 end: 3fffffd0 offset: 0011
3fffffa0:  00002580 00000000 3ffee54c 4020104e  
3fffffb0:  3fffdad0 00000000 3ffee54c 402018ac  
3fffffc0:  feefeffe feefeffe 3fffdab0 40100d19  
<<<stack<<<

--------------- CUT HERE FOR EXCEPTION DECODER ---------------`;

const esp8266Content = `

ctx: cont
sp: 3fffff90 end: 3fffffd0 offset: 0010
3fffffa0:  00002580 00000000 3ffee54c 4020104e  
3fffffb0:  3fffdad0 00000000 3ffee54c 402018ac  
3fffffc0:  feefeffe feefeffe 3fffdab0 40100d19  
`;

const esp8266Stdout = `
0x402018ac is in loop_wrapper() (/Users/dankeboy36/Library/Arduino15/packages/esp8266/hardware/esp8266/3.1.2/cores/esp8266/core_esp8266_main.cpp:258).
258	    loop_end();
0x40100d19 is at /Users/dankeboy36/Library/Arduino15/packages/esp8266/hardware/esp8266/3.1.2/cores/esp8266/cont.S:81.
81	    movi    a2, cont_norm
`.trim();

const esp32AbortInput = `
Backtrace: 0x400833dd:0x3ffb21b0 0x40087f2d:0x3ffb21d0 0x4008d17d:0x3ffb21f0 0x400d129d:0x3ffb2270 0x400d2305:0x3ffb2290




ELF file SHA256: cc58cc88d58e4143

Rebooting...
`;

const esp32AbortContent =
  ' 0x400833dd:0x3ffb21b0 0x40087f2d:0x3ffb21d0 0x4008d17d:0x3ffb21f0 0x400d129d:0x3ffb2270 0x400d2305:0x3ffb2290';

const esp32PanicInput = `
�Guru Meditation Error: Core  1 panic'ed (Unhandled debug exception). 
Debug exception reason: BREAK instr 
Core  1 register dump:
PC      : 0x400d129d  PS      : 0x00060836  A0      : 0x800d2308  A1      : 0x3ffb2270  
A2      : 0x00000000  A3      : 0x00000000  A4      : 0x00000014  A5      : 0x00000004  
A6      : 0x3ffb8188  A7      : 0x80000001  A8      : 0x800d129d  A9      : 0x3ffb2250  
A10     : 0x00002710  A11     : 0x00000000  A12     : 0x00000001  A13     : 0x00000003  
A14     : 0x00000001  A15     : 0x0000e100  SAR     : 0x00000003  EXCCAUSE: 0x00000001  
EXCVADDR: 0x00000000  LBEG    : 0x40085e50  LEND    : 0x40085e5b  LCOUNT  : 0xffffffff  


Backtrace: 0x400d129a:0x3ffb2270 0x400d2305:0x3ffb2290
`;

const esp32PanicContent = ' 0x400d129a:0x3ffb2270 0x400d2305:0x3ffb2290';

const esp8266exceptionInput = `
Fatal exception 29(StoreProhibitedCause):
epc1=0x4000dfd9, epc2=0x00000000, epc3=0x4000dfd9, excvaddr=0x00000000, depc=0x00000000

Exception (29):
epc1=0x4000dfd9 epc2=0x00000000 epc3=0x4000dfd9 excvaddr=0x00000000 depc=0x00000000
`;

const esp32Stdout = `0x400833dd is in panic_abort (/Users/ficeto/Desktop/ESP32/ESP32S2/esp-idf-public/components/esp_system/panic.c:408).
0x40087f2d is in esp_system_abort (/Users/ficeto/Desktop/ESP32/ESP32S2/esp-idf-public/components/esp_system/esp_system.c:137).
0x4008d17d is in abort (/Users/ficeto/Desktop/ESP32/ESP32S2/esp-idf-public/components/newlib/abort.c:46).
0x400d129d is in loop() (/Users/dankeboy36/Documents/Arduino/folder with space/(here)/AE/AE.ino:8).
8	  abort();
0x400d2305 is in loopTask(void*) (/Users/dankeboy36/Library/Arduino15/packages/esp32/hardware/esp32/2.0.9/cores/esp32/main.cpp:50).
50	        loop();`;

const riscv32Input = `Guru Meditation Error: Core  0 panic'ed (Load access fault). Exception was unhandled.

Core  0 register dump:
MEPC    : 0x42000074  RA      : 0x42000072  SP      : 0x3fc94f70  GP      : 0x3fc8c000  
TP      : 0x3fc8830c  T0      : 0x4005890e  T1      : 0x18000000  T2      : 0x00000000  
S0/FP   : 0x3fc8d000  S1      : 0x00000000  A0      : 0x00000001  A1      : 0x00000001  
A2      : 0x0000000a  A3      : 0x00000004  A4      : 0x600c0000  A5      : 0x00000000  
A6      : 0xfa000000  A7      : 0x00000003  S2      : 0x00000000  S3      : 0x00000000  
S4      : 0x00000000  S5      : 0x00000000  S6      : 0x00000000  S7      : 0x00000000  
S8      : 0x00000000  S9      : 0x00000000  S10     : 0x00000000  S11     : 0x00000000  
T3      : 0x3fc95480  T4      : 0x00000000  T5      : 0x00000000  T6      : 0x00000000  
MSTATUS : 0x00001881  MTVEC   : 0x40380001  MCAUSE  : 0x00000005  MTVAL   : 0x00000000  
MHARTID : 0x00000000  

Stack memory:
3fc94f70: 0x00000000 0x00000000 0x00000000 0x4200360a 0x00000000 0x00000000 0x00000000 0x403872d8
3fc94f90: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc94fb0: 0x00000000 0xa5a5a5a5 0xa5a5a5a5 0xa5a5a5a5 0xa5a5a5a5 0xbaad5678 0x00000160 0xabba1234
3fc94fd0: 0x00000154 0x3fc94ed0 0x000007d6 0x3fc8d0e8 0x3fc8d0e8 0x3fc94fd4 0x3fc8d0e0 0x00000018
3fc94ff0: 0x5c7915e7 0x7b4e7a8c 0x3fc94fd4 0x00000000 0x00000001 0x3fc92fc4 0x706f6f6c 0x6b736154
3fc95010: 0xcfb6bc00 0x0093573e 0x00000000 0x3fc94fc0 0x00000001 0x00000000 0x00000000 0x00000000
3fc95030: 0x00000000 0x3fc8ed50 0x3fc8edb8 0x3fc8ee20 0x00000000 0x00000000 0x00000001 0x00000000
3fc95050: 0x00000000 0x00000000 0x4201a80c 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc95070: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc95090: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc950b0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc950d0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc950f0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc95110: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x02000000 0xbaad5678 0x00000060
3fc95130: 0xabba1234 0x00000054 0x00000000 0x3fc95138 0x00000000 0x00000000 0x00000000 0x3fc95150
3fc95150: 0xffffffff 0x3fc95150 0x3fc95150 0x00000000 0x3fc95164 0xffffffff 0x3fc95164 0x3fc95164
3fc95170: 0x00000001 0x00000001 0x00000000 0x0100ffff 0x00000000 0xb33fffff 0x00000000 0xbaad5678
3fc95190: 0x00000160 0xabba1234 0x00000154 0x3fc951f0 0x3fc951f0 0x3fc952f0 0x3fc952ef 0x00000000
3fc951b0: 0x3fc951b4 0xffffffff 0x3fc951b4 0x3fc951b4 0x00000000 0x3fc951c8 0xffffffff 0x3fc951c8
3fc951d0: 0x3fc951c8 0x00000000 0x00000100 0x00000001 0xdf00ffff 0x00000000 0xb33fffff 0x00000000
3fc951f0: 0x1b5a20c3 0xee7e423f 0x658fe1be 0x6dbb0365 0x2768218d 0x1f90cd68 0x182c00b2 0x4294b268
3fc95210: 0xa04df2fd 0x75048135 0x03eb0af3 0xeb7eda73 0x24338fa1 0xf7ed1cd7 0x8e5fc680 0x1979b0ae
3fc95230: 0xd3ef46f1 0x6372363e 0x38a11040 0x2e8efe8a 0x6d068dd2 0x8b00a172 0xb9830d9c 0x8769eab7
3fc95250: 0xa7c8daf7 0xbbb33bb5 0xbaf6b4e8 0xbf37a935 0x486d4432 0x3d990202 0x170898bb 0x97abc2b6
3fc95270: 0x4eb7fc73 0x055c4723 0x0733dec4 0xb5069893 0x66965406 0x8d46a1ec 0x36c1315a 0xdae43046
3fc95290: 0x20715846 0x6f1f2f25 0x9bd65078 0x91c8d748 0x3fdf2491 0xd4861e1d 0x9098b0f1 0x10529681
3fc952b0: 0xe841529d 0x1612cef2 0xa98be51a 0x15632d7b 0x46697688 0xfd75400a 0xce0eee80 0xdf004ebd
3fc952d0: 0x0de9176e 0xb8bb67ef 0x0502664c 0x5f7bceb7 0x06a6cfd2 0x30580f0e 0x6921bcb0 0xad210049
3fc952f0: 0xbaad5678 0x0000007c 0xabba1234 0x00000070 0x00000100 0x00000100 0x00000002 0x40383d14
3fc95310: 0x40384394 0x40383c4a 0x403848dc 0x403848c0 0x3fc9538d 0x3fc9538d 0x3fc95380 0x3fc95380
3fc95330: 0x3fc95380 0x3fc95480 0x0000000d 0x00000000 0x3fc95344 0xffffffff 0x3fc95344 0x3fc95344
3fc95350: 0x00000000 0x3fc95358 0xffffffff 0x3fc95358 0x3fc95358 0x00000000 0xb33fffff 0x00000000

ELF file SHA256: d0e2e7e7f0a0afca
`;

describe('decoder', () => {
  let tracked: typeof temp;
  before(() => (tracked = temp.track()));
  after(() => tracked.cleanupSync());

  describe('createDecodeParams', () => {
    it("should error with missing 'sketchPath' when all missing", async () => {
      await assert.rejects(
        createDecodeParams(mockArduinoState()),
        /Sketch path is not set/
      );
    });

    it("should error with missing 'fqbn' when no board is selected", async () => {
      const sketchPath = tracked.mkdirSync();
      await assert.rejects(
        createDecodeParams(mockArduinoState({ sketchPath })),
        /No board selected/
      );
    });

    it("should error with not installed platform when 'boardDetails' is missing", async () => {
      const sketchPath = tracked.mkdirSync();
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({ sketchPath, fqbn: 'esp8266:esp8266:generic' })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Platform 'esp8266:esp8266' is not installed/.test(reason.message)
      );
    });

    it("should error due to unsupported board when the arch is neither 'esp32' nor 'esp8266'", async () => {
      const sketchPath = tracked.mkdirSync();
      const fqbn = 'a:b:c';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Unsupported board: 'a:b:c'/.test(reason.message)
      );
    });

    it("should error when the sketch has not been compiled and the 'compileSummary' is undefined", async () => {
      const sketchPath = tracked.mkdirSync();
      const fqbn = 'esp8266:esp8266:generic';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /The summary of the previous compilation is unavailable. Compile the sketch/.test(
            reason.message
          )
      );
    });

    it("should error when the '.elf' file not found", async () => {
      const sketchPath = tracked.mkdirSync();
      const buildPath = tracked.mkdirSync();
      const fqbn = 'esp8266:esp8266:generic';
      let elfPathFallbackCounter = 0;
      const fallbackParams = {
        async elfPath() {
          elfPathFallbackCounter++;
          return undefined;
        },
      };
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          }),
          fallbackParams
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Could not detect the '.elf' file in the build folder/.test(
            reason.message
          )
      );
      assert.strictEqual(elfPathFallbackCounter, 1);
    });

    it('should error when the GDB tool not found', async () => {
      const tempPath = tracked.mkdirSync();
      const sketchPath = path.join(tempPath, 'my_sketch');
      await fs.mkdir(sketchPath, { recursive: true });
      const buildPath = tracked.mkdirSync();
      await fs.writeFile(
        path.join(buildPath, `${path.basename(sketchPath)}.ino.elf`),
        ''
      );
      const fqbn = 'esp8266:esp8266:generic';
      await assert.rejects(
        createDecodeParams(
          mockArduinoState({
            sketchPath,
            fqbn,
            boardDetails: mockBoardDetails(fqbn),
            compileSummary: mockCompileSummary(buildPath),
          })
        ),
        (reason) =>
          reason instanceof DecodeParamsError &&
          /Could not detect the GDB tool path/.test(reason.message)
      );
    });

    it('should create the decode params', async () => {
      const tempPath = tracked.mkdirSync();
      const sketchPath = path.join(tempPath, 'my_sketch');
      await fs.mkdir(sketchPath, { recursive: true });
      const buildPath = tracked.mkdirSync();
      const elfPath = path.join(
        buildPath,
        `${path.basename(sketchPath)}.ino.elf`
      );
      await fs.writeFile(elfPath, '');
      const mockToolDirPath = tracked.mkdirSync();
      await fs.mkdir(path.join(mockToolDirPath, 'bin'), { recursive: true });
      const toolPath = path.join(
        mockToolDirPath,
        'bin',
        `xtensa-lx106-elf-gdb${isWindows ? '.exe' : ''}`
      );
      await fs.writeFile(toolPath, '');
      await fs.chmod(toolPath, 0o755);
      const fqbn = 'esp8266:esp8266:generic';
      const actual = await createDecodeParams(
        mockArduinoState({
          sketchPath,
          fqbn,
          boardDetails: mockBoardDetails(fqbn, {
            'runtime.tools.xtensa-esp-elf-gdb.path': mockToolDirPath,
          }),
          compileSummary: mockCompileSummary(buildPath),
        })
      );
      assert.strictEqual(actual.elfPath, elfPath);
      assert.strictEqual(actual.toolPath, toolPath);
      assert.strictEqual(actual.sketchPath, sketchPath);
      assert.strictEqual(actual.fqbn.toString(), fqbn);
    });
  });

  describe('parseStacktrace', () => {
    it('should parse ESP8266 content', () => {
      const actual = parseStacktrace(esp8266Input);
      assert.strictEqual(actual, esp8266Content);
    });

    it('should parse ESP32 content', () => {
      [
        [esp32AbortInput, esp32AbortContent],
        [esp32PanicInput, esp32PanicContent],
      ].forEach(([input, expected]) => {
        const actual = parseStacktrace(input);
        assert.strictEqual(actual, expected);
      });
    });
  });

  describe('parseInstructionAddresses', () => {
    it('should parse instruction addresses in stripped ESP8266 content', () => {
      const expected = ['4020104e', '402018ac', '40100d19'];
      const actual = parseInstructionAddresses(esp8266Content);
      assert.deepStrictEqual(actual, expected);
    });

    it('should parse instruction addresses in stripped ESP32 content', () => {
      const expected = [
        '400833dd',
        '40087f2d',
        '4008d17d',
        '400d129d',
        '400d2305',
      ];
      const actual = parseInstructionAddresses(esp32AbortContent);
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe('buildCommand', () => {
    it('should build command with flags from instruction addresses', () => {
      const elfPath = 'path/to/elf';
      const actualFlags = buildCommandFlags(
        ['4020104e', '402018ac', '40100d19'],
        elfPath
      );
      assert.deepStrictEqual(actualFlags, [
        '--batch',
        elfPath,
        '-ex',
        'set listsize 1',
        '-ex',
        'list *0x4020104e',
        '-ex',
        'list *0x402018ac',
        '-ex',
        'list *0x40100d19',
        '-ex',
        'q',
      ]);
    });

    it("should throw when 'addresses' is empty", () => {
      assert.throws(
        () => buildCommandFlags([], 'never'),
        /Invalid argument: addresses.length <= 0/
      );
    });
  });

  describe('parseException', () => {
    it('should parse the exception', () => {
      const expectedCode = 29;
      const actual = parseException(esp8266exceptionInput);
      assert.deepStrictEqual(actual, [exceptions[expectedCode], expectedCode]);
    });
  });

  describe('parseRegister', () => {
    it('should not parse register address from invalid input', () => {
      const actual = parseRegisters('blabla');
      assert.deepStrictEqual(actual, [undefined, undefined]);
    });

    it("should parse ESP32 'PC' register address", () => {
      const actual = parseRegisters('PC      : 0x400d129d');
      assert.deepStrictEqual(actual, ['400d129d', undefined]);
    });

    it("should parse ESP32 'EXCVADDR' register address", () => {
      const actual = parseRegisters('EXCVADDR: 0x00000001');
      assert.deepStrictEqual(actual, [undefined, '00000001']);
    });

    it("should parse ESP8266 'PC' register address", () => {
      const actual = parseRegisters('epc1=0x4000dfd9');
      assert.deepStrictEqual(actual, ['4000dfd9', undefined]);
    });

    it("should parse ESP8266 'EXCVADDR' register address", () => {
      const actual = parseRegisters('excvaddr=0x00000001');
      assert.deepStrictEqual(actual, [undefined, '00000001']);
    });

    it('should parse ESP32 register addresses', () => {
      const actual = parseRegisters(esp32PanicInput);
      assert.deepStrictEqual(actual, ['400d129d', '00000000']);
    });

    it('should parse ESP8266 register addresses', () => {
      const actual = parseRegisters(esp8266exceptionInput);
      assert.deepStrictEqual(actual, ['4000dfd9', '00000000']);
    });
  });

  describe('parseAlloc', () => {
    it('should not parse alloc from invalid input', () => {
      assert.deepStrictEqual(parseAlloc('invalid'), undefined);
    });

    it('should not parse alloc when address is not instruction address', () => {
      assert.deepStrictEqual(
        parseAlloc('last failed alloc call: 3022D552(1480)'),
        undefined
      );
    });

    it('should parse alloc', () => {
      assert.deepStrictEqual(
        parseAlloc('last failed alloc call: 4022D552(1480)'),
        ['4022D552', 1480]
      );
    });
  });

  describe('filterLines', () => {
    it('should filter irrelevant lines from the stdout', () => {
      const actual = parseGDBOutput(esp8266Stdout);
      assert.strictEqual(actual.length, 1);
      assert.deepStrictEqual(actual[0], {
        address: '0x402018ac',
        file: '/Users/dankeboy36/Library/Arduino15/packages/esp8266/hardware/esp8266/3.1.2/cores/esp8266/core_esp8266_main.cpp',
        line: '258',
        method: 'loop_wrapper()',
      });
    });

    it('should handle () in the file path', () => {
      const actual = parseGDBOutput(esp32Stdout);
      assert.strictEqual(actual.length, 5);
      assert.deepStrictEqual(actual[3], {
        address: '0x400d129d',
        file: '/Users/dankeboy36/Documents/Arduino/folder with space/(here)/AE/AE.ino',
        line: '8',
        method: 'loop()',
      });
    });
  });

  describe('findElfPath', () => {
    it('should not find the elf path when the sketch folder name does not match', async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const invalidName = 'MySketch';
      await fs.writeFile(path.join(buildPath, `${invalidName}.ino.elf`), '');
      await fs.writeFile(path.join(buildPath, `${invalidName}.cpp.elf`), '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, undefined);
    });

    it("should not find the elf path when neither 'ino.elf' nor 'cpp.elf' exist", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, undefined);
    });

    it("should find 'ino.elf' path", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.ino.elf`);
      await fs.writeFile(expected, '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });

    it("should find 'cpp.elf' path", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.cpp.elf`);
      await fs.writeFile(expected, '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });

    it("should prefer 'ino.elf' over 'cpp.elf' when both paths exist", async () => {
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const expected = path.join(buildPath, `${sketchName}.ino.elf`);
      await fs.writeFile(expected, '');
      await fs.writeFile(path.join(buildPath, `${sketchName}.cpp.elf`), '');
      const actual = await findElfPath(sketchName, buildPath);
      assert.strictEqual(actual, expected);
    });
  });

  describe('decode', () => {
    it('should support cancellation', async function () {
      this.slow(5_000);
      this.timeout(5_000);
      const buildPath = tracked.mkdirSync();
      const sketchName = 'my_sketch';
      const tempPath = tracked.mkdirSync();
      const sketchPath = path.join(tempPath, sketchName);
      const elfPath = path.join(buildPath, `${sketchName}.ino.elf`);
      const toolPath = path.join(
        __dirname,
        `../../../src/test/tools/fake-tool${isWindows ? '.bat' : ''}`
      );
      await Promise.all([
        fs.writeFile(elfPath, ''),
        fs.mkdir(sketchPath, { recursive: true }),
      ]);
      const params: DecodeParams = {
        elfPath,
        toolPath,
        fqbn: new FQBN('esp8266:esp8266:generic'),
        sketchPath,
      };
      const abortController = new AbortController();
      try {
        await Promise.all([
          new Promise<void>((resolve) =>
            setTimeout(() => {
              abortController.abort();
              resolve();
            }, 2_000)
          ),
          decode(params, esp8266Input, { signal: abortController.signal }),
        ]);
        assert.fail('Expected an abort error');
      } catch (err) {
        assert.strictEqual(err instanceof Error, true);
        assert.strictEqual('code' in <Error>err, true);
        assert.strictEqual((<{ code: string }>err).code, 'ABORT_ERR');
        assert.strictEqual(abortController.signal.aborted, true);
      }
    });
  });
});
