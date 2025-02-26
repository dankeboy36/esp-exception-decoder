// @ts-check

// Based on the work of:
//  - [Peter Dragun](https://github.com/peterdragun)
//  - [Ivan Grokhotkov](https://github.com/igrr)
//  - [suda-morris](https://github.com/suda-morris)
//
// https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py

// Using CommonJS to ensure compatibility with the GDB remote debugger.
// ESM is supported from GDB 11.1, but the decoder extension cannot guarantee the GDB version used by the platform.
/* eslint-disable @typescript-eslint/no-var-requires */
const net = require('node:net');

const debug = require('debug');

/** @type {import('./utils').Debug} */
const riscvDebug = debug('espExceptionDecoder:riscv');

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
  const lines = input.split(/\r?\n|\r/);
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

/**
 * @typedef {Object} GdbServerParams
 * @property {string} input
 * @property {string} target
 * @property {import('./utils').Debug} [debug]
 */
class GdbServer {
  /**
   * @param {GdbServerParams} params
   */
  constructor(params) {
    const { target, input } = params;
    if (!isTarget(target)) {
      throw new Error(`Unsupported target: ${target}`);
    }
    this.panicInfo = parsePanicOutput({ input, target });
    this.regList = gdbRegsInfo[target];
    /** @type {net.Server|undefined} */
    this.server = undefined;
    this.debug = riscvDebug;
  }

  async start(port = 0) {
    if (this.server) {
      throw new Error('Server already started');
    }
    const server = net.createServer();
    this.server = server;
    await new Promise((resolve) => {
      server.on('listening', resolve);
      server.listen(port);
    });
    const address = server.address();
    if (!address) {
      throw new Error('Failed to start server');
    }
    if (typeof address === 'string') {
      throw new Error(
        `Expected an address info object. Got a string: ${address}`
      );
    }
    server.on('connection', (socket) => {
      socket.on('data', (data) => {
        const buffer = data.toString();
        if (buffer.length > 3 && buffer.slice(-3, -2) === '#') {
          this.debug(`Command: ${buffer}`);
          this._handleCommand(buffer, socket);
        } else if (buffer !== '+') {
          console.log('Invalid command: %s', buffer);
          socket.write('-');
        }
      });
    });
    return address;
  }

  close() {
    this.server?.close();
    this.server = undefined;
  }

  /**
   * @param {string} buffer
   * @param {net.Socket} socket
   */
  _handleCommand(buffer, socket) {
    if (buffer.startsWith('+')) {
      buffer = buffer.slice(1); // ignore the leading '+'
    }

    const command = buffer.slice(1, -3); // ignore checksums
    // Acknowledge the command
    socket.write('+');
    this.debug(`Got command: ${command}`);
    if (command === '?') {
      // report sigtrap as the stop reason; the exact reason doesn't matter for backtracing
      this._respond('T05', socket);
    } else if (command.startsWith('Hg') || command.startsWith('Hc')) {
      // Select thread command
      this._respond('OK', socket);
    } else if (command === 'qfThreadInfo') {
      // Get list of threads.
      // Only one thread for now, can be extended to show one thread for each core,
      // if we dump both cores (e.g. on an interrupt watchdog)
      this._respond('m1', socket);
    } else if (command === 'qC') {
      // That single thread is selected.
      this._respond('QC1', socket);
    } else if (command === 'g') {
      // Registers read
      this._respondRegs(socket);
    } else if (command.startsWith('m')) {
      // Memory read
      const [addr, size] = command
        .slice(1)
        .split(',')
        .map((v) => parseInt(v, 16));
      this._respondMem(addr, size, socket);
    } else if (command.startsWith('vKill') || command === 'k') {
      // Quit
      this._respond('OK', socket);
      socket.end();
    } else {
      // Empty response required for any unknown command
      this._respond('', socket);
    }
  }

  /**
   * @param {string} data
   * @param {net.Socket} socket
   */
  _respond(data, socket) {
    // this.debug(`Responding with: ${data}`);
    // calculate checksum
    const dataBytes = Buffer.from(data, 'ascii');
    // this.debug(`Data bytes: ${dataBytes}`);
    const checksum = dataBytes.reduce((sum, byte) => sum + byte, 0) & 0xff;
    // this.debug(`Checksum: ${checksum}`);
    // format and write the response
    const res = `$${data}#${checksum.toString(16).padStart(2, '0')}`;
    socket.write(res);
    this.debug(`Wrote: ${res}`);
    // get the result ('+' or '-')
    // socket.once('data', (ret) => {
    //   this.debug(`Response: ${ret.toString()}`);
    //   if (ret.toString() !== '+') {
    //     this.debug(`GDB responded with '-' to ${res}`);
    //     // socket.end();
    //   }
    // });
  }

  /**
   * @param {net.Socket} socket
   */
  _respondRegs(socket) {
    let response = '';
    // https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py#L242-L247
    // It loops over the list of register names.
    // For each register name, it gets the register value from panicInfo.regs.
    // It converts the register value to bytes in little-endian byte order.
    // It converts each byte to a hexadecimal string and joins them together.
    // It appends the hexadecimal string to the response string.
    for (const regName of this.regList) {
      const regVal = this.panicInfo.regs[regName] || 0;
      // this.debug(`Register ${regName}: ${regVal}`);
      const regBytes = Buffer.alloc(4);
      regBytes.writeUInt32LE(regVal);
      const regValHex = regBytes.toString('hex');
      // this.debug(`Register ${regName}: ${regValHex}`);
      response += regValHex;
    }
    this.debug(`Register response: ${response}`);
    this._respond(response, socket);
  }

  /**
   * @param {number} startAddr
   * @param {number} size
   * @param {net.Socket} socket
   */
  _respondMem(startAddr, size, socket) {
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

    this._respond(result, socket);
  }
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
    createRegNameValidator,
  },
};
