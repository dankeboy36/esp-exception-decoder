import assert from 'node:assert/strict';
import { createDecodeParams, decode } from '../../decoder';
import { __tests } from '../../riscv';
import { arduinoState } from './arduinoState';

const {
  createRegNameValidator,
  GdbServer,
  isTarget,
  parse,
  parsePanicOutput,
  buildPanicServerArgs,
  getStackAddrAndData,
  parseGDBOutput,
  processPanicOutput,
  toHexString,
  gdbRegsInfo,
  gdbRegsInfoRiscvIlp32,
} = __tests;

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

const esp32c3Input = `Core  0 panic'ed (Load access fault). Exception was unhandled.

Core  0 register dump:
MEPC    : 0x4200007e  RA      : 0x4200007e  SP      : 0x3fc98300  GP      : 0x3fc8d000  
TP      : 0x3fc98350  T0      : 0x4005890e  T1      : 0x3fc8f000  T2      : 0x00000000  
S0/FP   : 0x420001ea  S1      : 0x3fc8f000  A0      : 0x00000001  A1      : 0x00000001  
A2      : 0x3fc8f000  A3      : 0x3fc8f000  A4      : 0x00000000  A5      : 0x600c0028  
A6      : 0xfa000000  A7      : 0x00000014  S2      : 0x00000000  S3      : 0x00000000  
S4      : 0x00000000  S5      : 0x00000000  S6      : 0x00000000  S7      : 0x00000000  
S8      : 0x00000000  S9      : 0x00000000  S10     : 0x00000000  S11     : 0x00000000  
T3      : 0x3fc8f000  T4      : 0x00000001  T5      : 0x3fc8f000  T6      : 0x00000001  
MSTATUS : 0x00001801  MTVEC   : 0x40380001  MCAUSE  : 0x00000005  MTVAL   : 0x00000000  
MHARTID : 0x00000000  

Stack memory:
3fc98300: 0x00000000 0x00000000 0x00000000 0x42001c4c 0x00000000 0x00000000 0x00000000 0x40385d20
3fc98320: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98340: 0x00000000 0xa5a5a5a5 0xa5a5a5a5 0xa5a5a5a5 0xa5a5a5a5 0xbaad5678 0x00000168 0xabba1234
3fc98360: 0x0000015c 0x3fc98270 0x000007d7 0x3fc8e308 0x3fc8e308 0x3fc98364 0x3fc8e300 0x00000018
3fc98380: 0x00000000 0x00000000 0x3fc98364 0x00000000 0x00000001 0x3fc96354 0x706f6f6c 0x6b736154
3fc983a0: 0x00000000 0x00000000 0x3fc98350 0x00000005 0x00000000 0x00000001 0x00000000 0x00000000
3fc983c0: 0x00000000 0x00000262 0x00000000 0x3fc8fe64 0x3fc8fecc 0x3fc8ff34 0x00000000 0x00000000
3fc983e0: 0x00000001 0x00000000 0x00000000 0x00000000 0x4200917a 0x00000000 0x00000000 0x00000000
3fc98400: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98420: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98440: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98460: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98480: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc984a0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc984c0: 0xbaad5678 0x00000068 0xabba1234 0x0000005c 0x00000000 0x3fc984d0 0x00000000 0x00000000
3fc984e0: 0x00000000 0x3fc984e8 0xffffffff 0x3fc984e8 0x3fc984e8 0x00000000 0x3fc984fc 0xffffffff
3fc98500: 0x3fc984fc 0x3fc984fc 0x00000001 0x00000001 0x00000000 0x7700ffff 0x00000000 0x036f2206
3fc98520: 0x51c34501 0x8957fe96 0xdc2f3bf2 0xbaad5678 0x00000088 0xabba1234 0x0000007c 0x00000000
3fc98540: 0x00000014 0x3fc98d94 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x3fc985c8
3fc98560: 0x00000000 0x00000101 0x00000000 0x00000000 0x0000000a 0x3fc98cf0 0x00000000 0x00000000
3fc98580: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x3fc987d8 0x3fc98944
3fc985a0: 0x00000000 0x3fc98b40 0x3fc98ad4 0x3fc98c84 0x3fc98c18 0x3fc98bac 0xbaad5678 0x0000020c
3fc985c0: 0xabba1234 0x00000200 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc985e0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98600: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98620: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98640: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98660: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc98680: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc986a0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc986c0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
3fc986e0: 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000 0x00000000
`;

const esp32c3Stdout = `a::geta (this=0x0) at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:11
11	    return a;
#0  a::geta (this=0x0) at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:11
#1  loop () at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:21
#2  0x4c1c0042 in ?? ()
Backtrace stopped: frame did not save the PC`;

describe('riscv', () => {
  it('should be true', () => {
    const result = parsePanicOutput({ input: riscv32Input, target: 'esp32c3' });
    assert.strictEqual(result.coreId, 0);
    assert.deepStrictEqual(result.regs, {
      MEPC: 1107296372,
      RA: 1107296370,
      SP: 1070157680,
      GP: 1070120960,
      TP: 1070105356,
      T0: 1074104590,
      T1: 402653184,
      'S0/FP': 1070125056,
      A0: 1,
      A1: 1,
      A2: 10,
      A3: 4,
      A4: 1611399168,
      A6: 4194304000,
      A7: 3,
      T3: 1070158976,
    });
    assert.strictEqual(result.stackBaseAddr, 1070157680);
  });

  it('should decode', async () => {
    const params = await createDecodeParams(arduinoState);
    const result = await decode(params, esp32c3Input);
    console.log(result);
  });

  describe('createRegNameValidator', () => {
    it('should validate the register name', () => {
      Object.keys(gdbRegsInfo).forEach((target) => {
        const validator = createRegNameValidator(
          target as keyof typeof gdbRegsInfo
        );
        gdbRegsInfoRiscvIlp32.forEach((reg) => {
          assert.strictEqual(validator(reg), true);
        });
      });
    });

    it('should fail for invalid target', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assert.throws(() => createRegNameValidator('foo' as any));
    });

    it('should detect invalid', () => {
      const actual = createRegNameValidator('esp32c3')('foo');
      assert.strictEqual(actual, false);
    });
  });

  describe('GdbServer', () => {
    //
  });

  describe('isTarget', () => {
    it('should be a valid target', () => {
      Object.keys(gdbRegsInfo).forEach((target) => {
        assert.strictEqual(isTarget(target), true);
      });
    });

    it('should not be a valid target', () => {
      ['riscv32', 'trash'].forEach((target) => {
        assert.strictEqual(isTarget(target), false);
      });
    });
  });

  describe('parse', () => {
    //
  });

  describe('parsePanicOutput', () => {
    //
  });

  describe('buildPanicServerArgs', () => {
    //
  });

  describe('getStackAddrAndData', () => {
    //
  });

  describe('parseGDBOutput', () => {
    it('should parse the GDB output', () => {
      const lines =
        parseGDBOutput(`a::geta (this=0x0) at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:11
11\t    return a;
#0  a::geta (this=0x0) at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:11
#1  loop () at /Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino:21
#2  0x4c1c0042 in ?? ()
Backtrace stopped: frame did not save the PC`);
      assert.deepStrictEqual(lines, [
        {
          method: 'a::geta',
          address: 'this=0x0',
          file: '/Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino',
          line: '11',
          args: {
            this: '0x0',
          },
        },
        {
          method: 'loop',
          address: '??',
          file: '/Users/kittaakos/Documents/Arduino/riscv_1/riscv_1.ino',
          line: '21',
          args: {},
        },
        {
          address: '0x4c1c0042',
          line: '??',
        },
      ]);
    });
  });

  describe('toHexString', () => {
    it('should convert to hex string', () => {
      assert.strictEqual(toHexString(0x12345678), '0x12345678');
    });
    it('should pad 0', () => {
      assert.strictEqual(toHexString(0), '0x00000000');
    });
  });
});
