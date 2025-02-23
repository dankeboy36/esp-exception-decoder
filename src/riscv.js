// @ts-check

// Using CommonJS to ensure compatibility with the GDB remote debugger.
// ESM is supported from GDB 11.1, but the decoder extension cannot guarantee the GDB version used by the platform.
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs/promises');
const { createWriteStream } = require('node:fs');
const readline = require('node:readline');

// Based on the work of:
//  - [Peter Dragun](https://github.com/peterdragun)
//  - [Ivan Grokhotkov](https://github.com/igrr)
//  - [suda-morris](https://github.com/suda-morris)
//
// https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py

const gdbRegsInfoRiscvIlp32 = /** @type {const} */ ([
  'X0',
  'RA',
  'SP',
  'GP',
  'TP',
  'T0',
  'T1',
  'T2',
  'S0/FP',
  'S1',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'S9',
  'S10',
  'S11',
  'T3',
  'T4',
  'T5',
  'T6',
  'MEPC',
]);

/**
 * @typedef {keyof typeof gdbRegsInfo} Target
 */
const gdbRegsInfo = /** @type {const} */ ({
  esp32c2: gdbRegsInfoRiscvIlp32,
  esp32c3: gdbRegsInfoRiscvIlp32,
  esp32c6: gdbRegsInfoRiscvIlp32,
  esp32h2: gdbRegsInfoRiscvIlp32,
  esp32h4: gdbRegsInfoRiscvIlp32,
});

/**
 * @typedef {Object} RegNameValidatorParams
 * @property {string} type
 */

/**
 * @template {Target} T
 * @callback RegNameTypeGuard
 * @param {string} regName
 * @returns {regName is keyof typeof gdbRegsInfo[T]}
 */

/**
 * @param {unknown} arg
 * @returns {arg is Target}
 */
/** @type {(arg: unknown) => arg is Target} */
const isTarget = (arg) => typeof arg === 'string' && arg in gdbRegsInfo;

/**
 * @template {Target} T
 * @param {T} type
 * @returns {RegNameTypeGuard<T>}
 */
function createRegNameValidator(type) {
  const regsInfo = gdbRegsInfo[type];
  if (!regsInfo) {
    throw new Error(`Unsupported target: ${type}`);
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return (regName) => regsInfo.includes(regName);
}

/**
 * @typedef {Object} RegisterDump
 * @property {number} coreId
 * @property {Record<string,number>} regs
 */

/**
 * @typedef {Object} StackDump
 * @property {number} baseAddr
 * @property {number[]} data
 */

/**
 * @typedef {Object} ParsePanicOutputParams
 * @property {string} input
 * @property {keyof typeof gdbRegsInfo} target
 */

/**
 * @typedef {Object} ParsePanicOutputResult
 * @property {RegisterDump[]} regDumps
 * @property {StackDump[]} stackDump
 */

/**
 * @param {ParsePanicOutputParams} params
 * @returns {ParsePanicOutputResult}
 */
function parse({ input, target }) {
  const lines = input.split('\n');
  /** @type {RegisterDump[]} */
  const regDumps = [];
  /** @type {StackDump[]} */
  const stackDump = [];
  /** @type {RegisterDump|undefined} */
  let currentRegDump;
  let inStackMemory = false;

  const regNameValidator = createRegNameValidator(target);

  lines.forEach((line) => {
    if (line.startsWith('Core')) {
      const match = line.match(/^Core\s+(\d+)\s+register dump:/);
      if (match) {
        currentRegDump = {
          coreId: parseInt(match[1], 10),
          regs: {},
        };
        regDumps.push(currentRegDump);
      }
    } else if (currentRegDump && !inStackMemory) {
      const regMatches = line.matchAll(/([A-Z_0-9/]+)\s*:\s*(0x[0-9a-fA-F]+)/g);
      for (const match of regMatches) {
        const regName = match[1];
        const regAddress = parseInt(match[2], 16);
        if (regAddress && regNameValidator(regName)) {
          currentRegDump.regs[regName] = regAddress;
        }
      }
      if (line.trim() === 'Stack memory:') {
        inStackMemory = true;
      }
    } else if (inStackMemory) {
      const match = line.match(/^([0-9a-fA-F]+):\s*((?:0x[0-9a-fA-F]+\s*)+)/);
      if (match) {
        const baseAddr = parseInt(match[1], 16);
        const data = match[2]
          .trim()
          .split(/\s+/)
          .map((hex) => parseInt(hex, 16));
        stackDump.push({ baseAddr, data });
      }
    }
  });

  return { regDumps, stackDump };
}

/**
 * @typedef {Object} GetStackAddrAndDataParams
 * @property {readonly StackDump[]} stackDump
 */

/**
 * @typedef {Object} GetStackAddrAndDataResult
 * @property {number} stackBaseAddr
 * @property {Buffer} stackData
 */

/**
 * @param {GetStackAddrAndDataParams} stackDump
 * @returns {GetStackAddrAndDataResult}
 */
function getStackAddrAndData({ stackDump }) {
  let stackBaseAddr = 0;
  let baseAddr = 0;
  let bytesInLine = 0;
  let stackData = Buffer.alloc(0);

  stackDump.forEach((line) => {
    const prevBaseAddr = baseAddr;
    baseAddr = line.baseAddr;
    if (stackBaseAddr === 0) {
      stackBaseAddr = baseAddr;
    } else {
      if (baseAddr !== prevBaseAddr + bytesInLine) {
        throw new Error('Invalid base address');
      }
    }

    const lineData = Buffer.concat(
      line.data.map((word) =>
        Buffer.from(word.toString(16).padStart(8, '0'), 'hex')
      )
    );
    bytesInLine = lineData.length;
    stackData = Buffer.concat([stackData, lineData]);
  });

  return { stackBaseAddr, stackData };
}

/**
 * @typedef {Object} PanicInfo
 * @property {number} coreId
 * @property {Record<string,number>} regs
 * @property {number} stackBaseAddr
 * @property {Buffer} stackData
 */

/**
 * @typedef {Object} ParseIdfRiscvPanicOutputParams
 * @property {string} input
 * @property {Target} target
 */

/**
 * @param {ParseIdfRiscvPanicOutputParams} params
 * @returns {PanicInfo}
 */
function parsePanicOutput({ input, target }) {
  const { regDumps, stackDump } = parse({
    input,
    target,
  });

  if (regDumps.length > 1) {
    throw new Error('Handling of multi-core register dumps not implemented');
  }

  const { coreId, regs } = regDumps[0];
  const { stackBaseAddr, stackData } = getStackAddrAndData({ stackDump });

  return {
    coreId,
    regs,
    stackBaseAddr,
    stackData,
  };
}

class GdbServer {
  /**
   * @param {PanicInfo} panicInfo
   * @param {Target} target
   * @param {import('node:fs').PathLike} [logFile]
   */
  constructor(panicInfo, target, logFile = undefined) {
    this.panicInfo = panicInfo;
    this.inStream = process.stdin;
    this.outStream = process.stdout;
    this.regList = gdbRegsInfo[target];

    this.logger = console;
    if (logFile) {
      this.logger = new console.Console(
        createWriteStream(logFile, { flags: 'w+' })
      );
    }
  }

  run() {
    const rl = readline.createInterface({
      input: this.inStream,
      output: this.outStream,
      terminal: false,
    });

    let buffer = '';
    rl.on('line', (line) => {
      buffer += line;
      if (buffer.length > 3 && buffer.slice(-3, -2) === '#') {
        this._handleCommand(buffer);
        buffer = '';
      }
    });
  }

  /**
   * @param {string} buffer
   */
  _handleCommand(buffer) {
    const command = buffer.slice(1, -3); // ignore checksums
    // Acknowledge the command
    this.outStream.write('+');
    this.logger.debug('Got command: %s', command);
    if (command === '?') {
      // report sigtrap as the stop reason; the exact reason doesn't matter for backtracing
      this._respond('T05');
    } else if (command.startsWith('Hg') || command.startsWith('Hc')) {
      // Select thread command
      this._respond('OK');
    } else if (command === 'qfThreadInfo') {
      // Get list of threads.
      // Only one thread for now, can be extended to show one thread for each core,
      // if we dump both cores (e.g. on an interrupt watchdog)
      this._respond('m1');
    } else if (command === 'qC') {
      // That single thread is selected.
      this._respond('QC1');
    } else if (command === 'g') {
      // Registers read
      this._respondRegs();
    } else if (command.startsWith('m')) {
      // Memory read
      const [addr, size] = command
        .slice(1)
        .split(',')
        .map((v) => parseInt(v, 16));
      this._respondMem(addr, size);
    } else if (command.startsWith('vKill') || command === 'k') {
      // Quit
      this._respond('OK');
      process.exit(0);
    } else {
      // Empty response required for any unknown command
      this._respond('');
    }
  }

  /**
   * @param {string} data
   */
  _respond(data) {
    // calculate checksum
    const dataBytes = Buffer.from(data, 'ascii');
    const checksum = dataBytes.reduce((sum, byte) => sum + byte, 0) & 0xff;
    // format and write the response
    const res = `$${data}#${checksum.toString(16).padStart(2, '0')}`;
    this.logger.debug('Wrote: %s', res);
    this.outStream.write(res);
    // get the result ('+' or '-')
    this.inStream.once('data', (ret) => {
      this.logger.debug('Response: %s', ret.toString());
      if (ret.toString() !== '+') {
        console.error(`GDB responded with '-' to ${res}`);
        process.exit(1);
      }
    });
  }

  _respondRegs() {
    let response = '';
    // https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py#L242-L247
    // It loops over the list of register names.
    // For each register name, it gets the register value from panicInfo.regs.
    // It converts the register value to bytes in little-endian byte order.
    // It converts each byte to a hexadecimal string and joins them together.
    // It appends the hexadecimal string to the response string.
    for (const regName of this.regList) {
      const regVal = this.panicInfo.regs[regName] || 0;
      const regBytes = Buffer.alloc(4);
      regBytes.writeUInt32LE(regVal);
      response += regBytes.toString('hex');
    }
    this._respond(response);
  }

  /**
   * @param {number} startAddr
   * @param {number} size
   */
  _respondMem(startAddr, size) {
    const stackAddrMin = this.panicInfo.stackBaseAddr;
    const stackData = this.panicInfo.stackData;
    const stackLen = stackData.length;
    const stackAddrMax = stackAddrMin + stackLen;

    /**
     * @param {number} addr
     * @returns {boolean}
     */
    const inStack = (addr) => stackAddrMin <= addr && addr < stackAddrMax;

    let result = '';
    for (let addr = startAddr; addr < startAddr + size; addr++) {
      if (!inStack(addr)) {
        result += '00';
      } else {
        result += stackData[addr - stackAddrMin].toString(16).padStart(2, '0');
      }
    }

    this._respond(result);
  }
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: riscv.js --target <target> <panic_output>');
    process.exit(1);
  }

  const targetIndex = args.indexOf('--target');
  if (targetIndex === -1 || targetIndex + 1 >= args.length) {
    console.error('Target not specified');
    process.exit(1);
  }

  const target = /** @type {Target} */ (args[targetIndex + 1]);
  if (!isTarget(target)) {
    console.error(`Unsupported target: ${target}`);
    process.exit(1);
  }

  const panicOutput = args.slice(targetIndex + 2).join(' ');
  // TODO: instead of writing the output into a file and reading the content back in this module,
  // pass in the content directly from the decoder. (can be fd or string content)
  const input = await fs.readFile(panicOutput, 'utf8');
  const panicInfo = parsePanicOutput({
    input,
    target,
  });
  const server = new GdbServer(panicInfo, target);
  server.run();
}

if (require.main === module) {
  run();
}

module.exports = {
  /**
   * (non-API)
   */
  __tests: {
    GdbServer,
    isTarget,
    parse,
    parsePanicOutput,
  },
};
