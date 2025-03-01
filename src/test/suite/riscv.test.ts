import { FQBN } from 'fqbn';
import assert from 'node:assert/strict';
import net from 'node:net';
import {
  __tests,
  decodeRiscv,
  GdbServer,
  InvalidTargetError,
} from '../../riscv';

const {
  createRegNameValidator,
  isTarget,
  parsePanicOutput,
  buildPanicServerArgs,
  getStackAddrAndData,
  parseGDBOutput,
  toHexString,
  gdbRegsInfo,
  gdbRegsInfoRiscvIlp32,
  createDecodeResult,
} = __tests;

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

  describe('createDecodeResult', () => {
    it('should create a decode result', () => {
      const panicInfo = parsePanicOutput({
        input: esp32c3Input,
        target: 'esp32c3',
      });
      const result = createDecodeResult(panicInfo, esp32c3Stdout);
      assert.deepStrictEqual(result, {
        exception: ['Load access fault', 5],
        allocLocation: undefined,
        registerLocations: {
          MEPC: '0x4200007e',
          MTVAL: '0x00000000',
        },
        stacktraceLines: [
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
        ],
      });
    });
  });

  describe('GdbServer', () => {
    const panicInfo = parsePanicOutput({
      input: esp32c3Input,
      target: 'esp32c3',
    });
    const params = { panicInfo } as const;
    let server: GdbServer;
    let client: net.Socket;

    beforeEach(async () => {
      server = new GdbServer(params);
      const address = await server.start();
      client = await new Promise<net.Socket>((resolve) => {
        const socket: net.Socket = net.createConnection(
          { port: address.port },
          () => resolve(socket)
        );
      });
    });

    afterEach(() => {
      server.close();
      client.destroy();
    });

    it('should fail when the server is already started', async () => {
      assert.rejects(() => server.start(), /server already started/gi);
    });

    it('should end the connection when message starts with minus', async () => {
      const message = '-';
      client.write(message);
      let received = '';
      await new Promise<void>((resolve) => {
        client.on('end', resolve);
        client.on('data', (data) => {
          received += data.toString();
        });
      });
      assert.strictEqual(received, '-');
    });

    [
      ['+$?#3f', '+$T05#b9'],
      [
        '+$qSupported:multiprocess+;swbreak+;hwbreak+;qRelocInsn+;fork-events+;vfork-events+;exec-events+;vContSupported+;QThreadEvents+;no-resumed+;memory-tagging+#ec', //  unhandled
        '+$#00',
      ],
      ['+$Hg0#df', '+$OK#9a'],
      ['+$Hc0#df', '+$OK#9a'],
      ['+$qfThreadInfo#bb', '+$m1#9e'],
      ['+$qC#b4', '+$QC1#c5'],
      [
        '+$g#67',
        '+$000000007e0000420083c93f00d0c83f5083c93f0e89054000f0c83f00000000ea01004200f0c83f010000000100000000f0c83f00f0c83f0000000028000c60000000fa140000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f0c83f0100000000f0c83f010000007e000042#1c',
      ],
      [
        '+$m3fc98300,40#fd',
        '+$00000000000000000000000042001c4c00000000000000000000000040385d200000000000000000000000000000000000000000000000000000000000000000#bb',
      ],
      ['+$k#33', '+$OK#9a'],
      ['+$vKill;a410#33', '+$OK#9a'],
    ].map(([message, expected]) =>
      it(`should respond with ${expected} to ${message}`, async () => {
        client.write(message);
        client.end();
        let received = '';
        await new Promise<void>((resolve) => {
          client.on('end', resolve);
          client.on('data', (data) => {
            received += data.toString();
          });
        });
        assert.strictEqual(received, expected);
      })
    );
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

  describe('decodeRiscv', () => {
    it('should error on invalid target', () => {
      assert.rejects(
        () =>
          decodeRiscv(
            {
              elfPath: '',
              sketchPath: '',
              toolPath: '',
              fqbn: new FQBN('a:b:c'),
            },
            ''
          ),
        (reason) => reason instanceof InvalidTargetError
      );
    });
  });

  describe('parse', () => {
    //
  });

  describe('parsePanicOutput', () => {
    it('multi-code is not yet supported', () => {
      assert.throws(() =>
        parsePanicOutput({
          input: `Core  0 register dump:
MEPC    : 0x42000074  RA      : 0x42000072  SP      : 0x3fc94f70  GP      : 0x3fc8c000  

Stack memory:
3fc94f70: 0x00000000 0x00000000 0x00000000 0x4200360a 0x00000000 0x00000000 0x00000000 0x403872d8

Core  1 register dump:
MEPC    : 0x42000074  RA      : 0x42000072  SP      : 0x3fc94f70  GP      : 0x3fc8c000  

Stack memory:
3fc94f70: 0x00000000 0x00000000 0x00000000 0x4200360a 0x00000000 0x00000000 0x00000000 0x403872d8`,
          target: 'esp32c3',
        })
      );
    });

    it('should parse the panic output', () => {
      const result = parsePanicOutput({
        input: esp32c3Input,
        target: 'esp32c3',
      });
      assert.strictEqual(result.coreId, 0);
      assert.deepStrictEqual(result.regs, {
        MEPC: 0x4200007e,
        RA: 0x4200007e,
        SP: 0x3fc98300,
        GP: 0x3fc8d000,
        TP: 0x3fc98350,
        T0: 0x4005890e,
        T1: 0x3fc8f000,
        'S0/FP': 0x420001ea,
        S1: 0x3fc8f000,
        A0: 0x00000001,
        A1: 0x00000001,
        A2: 0x3fc8f000,
        A3: 0x3fc8f000,
        A5: 0x600c0028,
        A6: 0xfa000000,
        A7: 0x00000014,
        T3: 0x3fc8f000,
        T4: 0x00000001,
        T5: 0x3fc8f000,
        T6: 0x00000001,
      });
      assert.strictEqual(result.stackBaseAddr, 0x3fc98300);
    });
  });

  describe('buildPanicServerArgs', () => {
    it('should build the panic server args', () => {
      assert.deepStrictEqual(buildPanicServerArgs('path/to/elf', 36), [
        '--batch',
        '-n',
        'path/to/elf',
        '-ex',
        'target remote :36',
        '-ex',
        'bt',
      ]);
    });
  });

  describe('getStackAddrAndData', () => {
    assert.throws(
      () =>
        getStackAddrAndData({
          stackDump: [
            { baseAddr: 0x1000, data: [] },
            { baseAddr: 0x3000, data: [1, 2] },
          ],
        }),
      /invalid base address/gi
    );
  });

  describe('parseGDBOutput', () => {
    it('should parse the GDB output', () => {
      const lines = parseGDBOutput(esp32c3Stdout);
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
