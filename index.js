let ram = new Array(65536).fill(0);
let registers = {
  a: 0,
  x: 0,
  y: 0,
  pc: 0x4020,
  sp: 0xff,
  p: 48,
};

let memoryHTML = document.querySelector("#memory");
let disasmText = document.querySelector("#disasm");
let regA = document.querySelector(".a");
let regX = document.querySelector(".x");
let regY = document.querySelector(".y");
let regPC = document.querySelector(".pc");
let regSP = document.querySelector(".sp");
let regP = document.querySelector(".p");

function displayMemory(element, from, to) {
  if (element.value) element.value = "";
  for (from; from < to; from++) {
    if (from % 16 === 0) {
      element.value += `\n ${padFormatString(from, 4)}: `;
    }
    element.value += padFormatString(ram[from]) + " ";
  }
}

function clearDislpayMemory(element) {
  element.value = "";
  console.log("Clear");
}

memoryHTML.onscroll = logScroll;

let multiplier = 1;

function logScroll(e) {
  let el = e.target;
  let start = 1024;
  let end = 65536;

  if (el.offsetHeight + el.scrollTop + 20 > el.scrollHeight) {
    if (start * multiplier < end) {
      displayMemory(memoryHTML, start * multiplier, start * multiplier + start);
    }
    multiplier++;
  } else if (el.scrollTop === 0) {
    if (start * multiplier > start) {
      displayMemory(memoryHTML, start * multiplier, start * multiplier + start);
    }
    multiplier--;
  }
}

function padFormatString(string, stringSize = 2, radix = 16, padding = "0") {
  string = string.toString(radix);
  while (string.length < stringSize) {
    string = padding + string;
  }
  return string;
}

function displayRegs() {
  let { a, x, y, pc, sp, p } = registers;

  regA.innerText = `A: $${padFormatString(a)}`;
  regX.innerText = `X: $${padFormatString(x)}`;
  regY.innerText = `Y: $${padFormatString(y)}`;
  regPC.innerText = `PC: $${padFormatString(pc, 4)}`;
  regSP.innerText = `SP: $${padFormatString(sp)}`;
  regP.innerText = `NV-BDIZC
  ${padFormatString(p, 8, 2)}`;
}

function reset() {
  registers.a = 0;
  registers.x = 0;
  registers.y = 0;
  registers.pc = 0x4020;
  registers.sp = 0xfd;
  registers.p = 48;
  displayMemory(memoryHTML, 0, 1024);
  displayRegs();
}

function readRam8(addr) {
  return ram[addr];
}

function readRam16(addr) {
  return (readRam8(addr + 1) << 8) | readRam8(addr);
}

function writeRam8(address, value) {
  ram[address] = value;
}

function hexStringToArr(string) {
  let arr = [];

  for (let i = 0; i < string.length; i += 2) {
    arr.push(parseInt(string.substring(i, i + 2), 16));
  }

  return arr;
}

const MNEMONIC = {
  ADC: 0,
  AND: 1,
  ASL: 2,
  BIT: 3,
  BPL: 4,
  BMI: 5,
  BVC: 6,
  BVS: 7,
  BCC: 8,
  BCS: 9,
  BNE: 10,
  BEQ: 11,
  BRK: 12,
  CMP: 13,
  CPX: 14,
  CPY: 15,
  DEC: 16,
  EOR: 17,
  CLC: 18,
  SEC: 19,
  CLI: 20,
  SEI: 21,
  CLV: 22,
  CLD: 23,
  SED: 24,
  INC: 25,
  JMP: 26,
  JSR: 27,
  LDA: 28,
  LDX: 29,
  LDY: 30,
  LSR: 31,
  NOP: 32,
  ORA: 33,
  TAX: 34,
  TXA: 35,
  DEX: 36,
  INX: 37,
  TAY: 38,
  TYA: 39,
  DEY: 40,
  INY: 41,
  ROL: 42,
  ROR: 43,
  RTI: 44,
  RTS: 45,
  SBC: 46,
  STA: 47,
  TXS: 48,
  TSX: 49,
  PHA: 50,
  PLA: 51,
  PHP: 52,
  PLP: 53,
  STX: 54,
  STY: 55,
};

/*
Address  Hexdump   Dissassembly
-------------------------------
$0600    a9 01     LDA #$01
$0602    8d 00 02  STA $0200
$0605    a9 05     LDA #$05
$0607    8d 01 02  STA $0201
$060a    a9 08     LDA #$08
$060c    8d 02 02  STA $0202
let prog = "a9018d0002a9058d0102a9088d0202";
*/

/*
Address  Hexdump   Dissassembly
-------------------------------
$0600    a2 c0     LDX #$c0
$0602    aa        TAX 
$0603    e8        INX 
$0604    69 c4     ADC #$c4
$0606    00        BRK 
*/
let prog = "a200a0008a99000248e8c8c010d0f568990002c8c020d0f7";
let progBytes = hexStringToArr(prog);
//loadBin(progBytes);
//loadRom();

function loadFormData() {
  let formVal = document.forms["myForm"]["data"].value;
  let data = formVal.split(" ").join("");
  loadBin(hexStringToArr(data));
  alert("Data loaded!");
}

function loadBin(progBytes) {
  let address = 0x4020;
  for (byte of progBytes) {
    ram[address] = byte;
    address++;
  }
}

async function loadRom() {
  let address = 0x4020;
  let response = await fetch("/Super Mario Bros. (JU) [!].nes");

  let buffer = await response.arrayBuffer(); // download as arrBuffer
  let uint8 = new Uint8Array(buffer);
  for (byte of uint8.subarray(16)) {
    ram[address] = byte;
    address++;
  }
}

function runProg(prog) {
  let tick = 0;
  let cycles = 0;
  displayMemory(memoryHTML, 0, 1024);
  while ((readRam16(registers.pc) << 16) | (readRam16(registers.pc + 2) !== 0)) {
    //displayMemory(memoryHTML, 0, 1024);
    let opcode = readRam8(registers.pc);
    let [mnemonic, addrMode, length, cycle] = OPCODES[opcode];
    let addr = mode[addrMode]();
    console.log(`Address: $${padFormatString(addr, 4)} 
    PC: $${padFormatString(registers.pc, 4)}
    A: $${padFormatString(registers.a)}
    Y: $${padFormatString(registers.x)}
    X: $${padFormatString(registers.y)}
    SP: $${padFormatString(registers.sp)}`);
    registers.pc += length;
    cycles += cycle;
    instruction[mnemonic](addr);

    //displayMemory(memoryHTML, 0, 1024);
    //displayRegs();
    let dis = dissasembler(0x4020, 0x4040);
    disasmText.innerText = dis;
    tick++;
  }
  console.log(`Ticks: ${tick}
  Cycles ${cycles}`);
}

const getRelativeAddr = (addr) => (readRam8(addr + 1) & 0x80 ? -((readRam8(addr + 1) ^ 0xff) + 1) : readRam8(addr + 1));

displayRegs();

let prevInst = 0;

function step() {
  //clearDislpayMemory(memoryHTML);
  displayMemory(memoryHTML, 0, 1024);
  let opcode = readRam8(registers.pc);
  let [mnemonic, addrMode, length, cycle] = OPCODES[opcode];
  let addr = mode[addrMode]();
  console.log(`Address: $${padFormatString(addr, 4)}`);
  prevInst = registers.pc;
  registers.pc += length;
  instruction[mnemonic](addr);

  displayMemory(memoryHTML, 0, 1024);
  displayRegs();

  let dis = dissasembler(0x4020, 0x4040);
  disasmText.innerText = dis;
}

function dissasembler(start, end) {
  let commandNames = Object.keys(MNEMONIC);

  const getMemSyntax = (memMode) => {
    let addr16 = padFormatString((ram[start + 2] << 8) | ram[start + 1], 4);
    let addr8 = padFormatString(ram[start + 1]);
    let addrRel = padFormatString(getRelativeAddr(start) + start + 2, 4);

    switch (memMode) {
      case MODES.ABSOLUTE:
        return `$${addr16}`;
      case MODES.ABSOLUTE_X:
        return `$${addr16},X`;
      case MODES.ABSOLUTE_Y:
        return `$${addr16},Y`;
      case MODES.ZERO_PAGE:
        return `$${addr8}`;
      case MODES.ZERO_PAGE_X:
        return `$${addr8},X`;
      case MODES.ZERO_PAGE_Y:
        return `$${addr8},Y`;
      case MODES.INDIRECT:
        return `($${addr16})`;
      case MODES.INDIRECT_X:
        return `$(${addr8},X)`;
      case MODES.INDIRECT_Y:
        return `$(${addr8}),Y`;
      case MODES.IMMEDIATE:
        return `#$${addr8}`;
      case MODES.RELATIVE:
        return `LABEL_$${addrRel}`;
      case MODES.ACCUMULATOR:
        return `A`;
      case MODES.IMPLIED:
      default:
        return ``;
    }
  };

  // const retMemSyntax =  {
  //   addr16 = padFormatString((ram[start + 2] << 8) | ram[start + 1], 4),
  //   addr8 = padFormatString(ram[start + 1]),
  //   addrRel = padFormatString(ram[start + 1] + start + 2),

  //   [MODES.ABSOLUTE]: () => `$${this.addr16}`,
  //   [MODES.ABSOLUTE_X]: () => `$${this.addr16},X`,
  //   [MODES.ABSOLUTE_Y]: () => `$${this.addr16},Y`,
  //   [MODES.ZERO_PAGE]: () => `$${this.addr8}`,
  //   [MODES.ZERO_PAGE_X]: () => `$${this.addr8},X`,
  //   [MODES.ZERO_PAGE_Y]: () => `$${this.addr8},Y`,
  //   [MODES.INDIRECT]: () => `$(${this.addr16})`,
  //   [MODES.INDIRECT_X]: () => `$(${this.addr16},X)`,
  //   [MODES.INDIRECT_Y]: () => `$(${this.addr16}),Y`,
  //   [MODES.IMMEDIATE]: () => `#$${this.addr8}`,
  //   [MODES.RELATIVE]: () => `LABEL_$${this.addrRel}`,
  //   [MODES.ACCUMULATOR]: () => ``,
  //   [MODES.IMPLIED]: () => ``,
  // };

  let assembly = ``;

  for (start; start < end; ) {
    let [mnemoNum, addrMode, length, cycle] = OPCODES[ram[start]];

    let hexData = ``;
    if (length === 3) {
      hexData = `${padFormatString(ram[start])} ${padFormatString(ram[start + 1])} ${padFormatString(ram[start + 2])} `;
    } else if (length === 2) {
      hexData = `${padFormatString(ram[start])} ${padFormatString(ram[start + 1])}    `;
    } else {
      hexData = `${padFormatString(ram[start])}       `;
    }

    // If opcode does not exists, return data and skip iteration
    if (OPCODES[ram[start]] == 0) {
      assembly += `$${padFormatString(start, 4)}: ${hexData}\n`;
      start++;
      continue;
    }

    assembly += `$${padFormatString(start, 4)}: ${hexData} ${commandNames[mnemoNum]} ${getMemSyntax(addrMode)}\n`;
    //assembly += `$${padFormatString(start, 4)}: ${hexData} ${commandNames[mnemoNum]} ${retMemSyntax[addrMode]()}\n`;
    start += length;
  }

  return assembly;
}

const MODES = {
  ACCUMULATOR: 0,
  ABSOLUTE: 1,
  ABSOLUTE_X: 2,
  ABSOLUTE_Y: 3,
  IMMEDIATE: 4,
  IMPLIED: 5,
  INDIRECT: 6,
  INDIRECT_X: 7,
  INDIRECT_Y: 8,
  RELATIVE: 9,
  ZERO_PAGE: 10,
  ZERO_PAGE_X: 11,
  ZERO_PAGE_Y: 12,
};

const mode = {
  [MODES.ACCUMULATOR]: () => registers.a,
  [MODES.IMPLIED]: () => `IMP`,
  [MODES.IMMEDIATE]: () => registers.pc + 1,
  [MODES.ZERO_PAGE]: () => readRam8(registers.pc + 1),
  [MODES.ZERO_PAGE_X]: () => (readRam8(registers.pc) + registers.x) & 0xff,
  [MODES.ZERO_PAGE_Y]: () => (readRam8(registers.pc) + registers.y) & 0xff,
  [MODES.ABSOLUTE]: () => readRam16(registers.pc + 1),
  [MODES.ABSOLUTE_X]: () => readRam16(registers.pc + 1) + registers.x,
  [MODES.ABSOLUTE_Y]: () => readRam16(registers.pc + 1) + registers.y,
  [MODES.INDIRECT]: () => readRam16(readRam16(registers.pc + 1)),
  [MODES.INDIRECT_X]: () => readRam16((readRam8(registers.pc + 1) + registers.x) & 0xff),
  [MODES.INDIRECT_Y]: () => readRam16(readRam8(registers.pc + 1)) + registers.y,
  [MODES.RELATIVE]: () => getRelativeAddr(registers.pc),
};

const instruction = {
  [MNEMONIC.ADC]: (operand) => {
    let val = readRam8(operand);
    let isCarry = registers.a + val + (registers.p & 0x01);
    let overflow = ~(registers.a ^ val) & (registers.a ^ isCarry) & 0x80;
    setFlag("N", isCarry & 0x80);
    setFlag("V", overflow);
    setFlag("Z", operand === 0);
    setFlag("C", isCarry > 255);
    registers.a = isCarry & 0xff;
  },
  [MNEMONIC.SBC]: (operand) => {
    // https://stackoverflow.com/a/29224684/14218041
    instruction[MNEMONIC.ADC].call(instruction, ~operand);
  },
  [MNEMONIC.AND]: (operand) => {
    let val = readRam8(operand);
    registers.a &= val;
    setFlag("N", registers.a & 0x80);
    setFlag("Z", registers.a === 0);
  },
  [MNEMONIC.ASL]: (operand) => {
    let addr = readRam8(operand);
    let doesNeedCarry = addr & 0x80 ? true : false;
    let val = (addr << 1) & 0xff;
    //Check memory mode to not accidentaly overwite RAM with a register A vvalue
    operand === registers.a ? (registers.a = val) : writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
    setFlag("C", doesNeedCarry);
  },
  [MNEMONIC.LSR]: (operand) => {
    let addr = readRam8(operand);
    let doesNeedCarry = addr & 1 ? true : false;
    let val = (addr >> 1) & 0xff;
    //Check memory mode to not accidentaly overwite RAM with a register A vvalue
    operand === registers.a ? (registers.a = val) : writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
    setFlag("C", doesNeedCarry);
  },
  [MNEMONIC.ROL]: (operand) => {
    let addr = readRam8(operand);
    let doesNeedCarry = addr & 128 ? true : false;
    let val = (addr << 1) & 0xff;
    val |= registers.p & 1;
    //Check memory mode to not accidentaly overwite RAM with a register A vvalue
    operand === registers.a ? (registers.a = val) : writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
    setFlag("C", doesNeedCarry);
  },
  [MNEMONIC.ROR]: (operand) => {
    let addr = readRam8(operand);
    let doesNeedCarry = addr & 1 ? true : false;
    let val = (addr << 1) & 0xff;
    val |= registers.p & 128;
    //Check memory mode to not accidentaly overwite RAM with a register A vvalue
    operand === registers.a ? (registers.a = val) : writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
    setFlag("C", doesNeedCarry);
  },
  [MNEMONIC.BIT]: (operand) => {
    let val = readRam8(operand);
    let isZero = (val & registers.a) === 0;
    setFlag("N", val & 128);
    setFlag("V", val & 64);
    setFlag("Z", isZero);
  },
  [MNEMONIC.EOR]: (operand) => {
    let val = readRam8(operand);
    registers.a ^= val;
    setFlag("N", registers.a & 0x80);
    setFlag("Z", registers.a === 0);
  },
  [MNEMONIC.ORA]: (operand) => {
    let val = readRam8(operand);
    registers.a |= val;
    setFlag("N", registers.a & 0x80);
    setFlag("Z", registers.a === 0);
  },
  [MNEMONIC.CLC]: () => {
    setFlag("C", false);
  },
  [MNEMONIC.SEC]: () => {
    setFlag("C", true);
  },
  [MNEMONIC.CLI]: () => {
    setFlag("I", false);
  },
  [MNEMONIC.SEI]: () => {
    setFlag("I", true);
  },
  [MNEMONIC.CLV]: () => {
    setFlag("V", false);
  },
  [MNEMONIC.BPL]: (operand) => {
    registers.p & 128 ? registers.pc + 2 : (registers.pc += operand);
  },
  [MNEMONIC.BMI]: (operand) => {
    registers.p & 128 ? (registers.pc += operand) : registers.pc + 2;
  },
  [MNEMONIC.BVC]: (operand) => {
    registers.p & 64 ? registers.pc + 2 : (registers.pc += operand);
  },
  [MNEMONIC.BVS]: (operand) => {
    registers.p & 64 ? (registers.pc += operand) : registers.pc + 2;
  },
  [MNEMONIC.BCC]: (operand) => {
    registers.p & 1 ? registers.pc + 2 : (registers.pc += operand);
  },
  [MNEMONIC.BCS]: (operand) => {
    registers.p & 1 ? (registers.pc += operand) : registers.pc + 2;
  },
  [MNEMONIC.BNE]: (operand) => {
    registers.p & 2 ? registers.pc + 2 : (registers.pc += operand);
  },
  [MNEMONIC.BEQ]: (operand) => {
    registers.p & 2 ? (registers.pc += operand) : registers.pc + 2;
  },
  [MNEMONIC.LDA]: (operand) => {
    registers.a = readRam8(operand);
    setFlag("N", registers.a & 0x80);
    setFlag("Z", registers.a === 0);
  },
  [MNEMONIC.LDX]: (operand) => {
    registers.x = readRam8(operand);
    setFlag("N", registers.x & 0x80);
    setFlag("Z", registers.x === 0);
  },
  [MNEMONIC.LDY]: (operand) => {
    registers.y = readRam8(operand);
    setFlag("N", registers.y & 0x80);
    setFlag("Z", registers.y === 0);
  },
  [MNEMONIC.STX]: (operand) => {
    writeRam8(operand, registers.x);
  },
  [MNEMONIC.STY]: (operand) => {
    writeRam8(operand, registers.y);
  },
  [MNEMONIC.CMP]: (operand) => {
    let val = readRam8(operand);
    setFlag("C", registers.a >= val);
    registers.a === val ? setFlag("Z", true) : setFlag("N", true);
  },
  [MNEMONIC.CPX]: (operand) => {
    let val = readRam8(operand);
    setFlag("C", registers.x >= val);
    registers.x === val ? setFlag("Z", true) : setFlag("N", true);
  },
  [MNEMONIC.CPY]: (operand) => {
    let val = readRam8(operand);
    setFlag("C", registers.y >= val);
    registers.y === val ? setFlag("Z", true) : setFlag("N", true);
  },
  [MNEMONIC.JMP]: (operand) => {
    registers.pc = operand;
  },
  [MNEMONIC.DEC]: (operand) => {
    let val = (readRam8(operand) - 1) & 0xff;
    writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
  },
  [MNEMONIC.STA]: (operand) => {
    writeRam8(operand, registers.a);
  },
  [MNEMONIC.DEX]: () => {
    registers.x = (registers.x - 1) & 0xff;
    setFlag("N", registers.x & 0x80);
    setFlag("Z", registers.x === 0);
  },
  [MNEMONIC.DEY]: () => {
    registers.y = (registers.y - 1) & 0xff;
    setFlag("N", registers.y & 0x80);
    setFlag("Z", registers.y === 0);
  },
  [MNEMONIC.TAX]: () => {
    registers.x = registers.a;
    setFlag("N", registers.x === 0);
    setFlag("Z", registers.x & 0x80);
  },
  [MNEMONIC.TXA]: () => {
    registers.a = registers.x;
    setFlag("N", registers.a === 0);
    setFlag("Z", registers.a & 0x80);
  },
  [MNEMONIC.TYA]: () => {
    registers.a = registers.y;
    setFlag("N", registers.a === 0);
    setFlag("Z", registers.a & 0x80);
  },
  [MNEMONIC.TAY]: () => {
    registers.y = registers.a;
    setFlag("N", registers.y === 0);
    setFlag("Z", registers.y & 0x80);
  },
  [MNEMONIC.INC]: (operand) => {
    let val = (readRam8(operand) + 1) & 0xff;
    writeRam8(operand, val);
    setFlag("N", val & 0x80);
    setFlag("Z", val === 0);
  },
  [MNEMONIC.INX]: () => {
    registers.x = (registers.x + 1) & 0xff;
    setFlag("N", registers.x === 0);
    setFlag("Z", registers.x & 0x80);
  },
  [MNEMONIC.INY]: () => {
    registers.y = (registers.y + 1) & 0xff;
    setFlag("N", registers.y === 0);
    setFlag("Z", registers.y & 0x80);
  },
  // TODO: implement proper writeStack16
  [MNEMONIC.JSR]: (operand) => {
    let retAddr = prevInst + 2;
    writeRam8(0x100 | registers.sp, retAddr >> 8);
    registers.sp = (registers.sp - 1) & 0xff;
    writeRam8(0x100 | registers.sp, retAddr & 0xff);
    registers.sp = (registers.sp - 1) & 0xff;
    registers.pc = operand;
  },
  [MNEMONIC.RTS]: () => {
    let pcFromStack = readRam16((0x100 | registers.sp) + 1);
    registers.sp += 2;
    registers.pc = pcFromStack + 1;
  },
  [MNEMONIC.RTI]: () => {
    let status = readRam16(0x100 | registers.sp);
    registers.p = status;
    registers.sp++;
    let pc = readRam16(0x100 | registers.sp);
    registers.pc = pc;
    registers.sp++;
  },
  // Stack memory range is 0x0100 - 0x01FF
  [MNEMONIC.PHA]: () => {
    // Stack pointer starts at 0x01FF, so we first
    // write to this address and only then decrement it
    let stack = 0x100 | registers.sp;
    writeRam8(stack, registers.a);
    registers.sp = (registers.sp - 1) & 0xff;
  },
  [MNEMONIC.PLA]: () => {
    registers.sp = (registers.sp + 1) & 0xff;
    let stack = 0x100 | registers.sp;
    registers.a = readRam8(stack);
  },
  [MNEMONIC.PHP]: () => {
    let stack = 0x100 | registers.sp;
    writeRam8(stack, registers.p);
    registers.sp = (registers.sp - 1) & 0xff;
  },
  [MNEMONIC.PLP]: () => {
    registers.sp = (registers.sp + 1) & 0xff;
    let stack = 0x100 | registers.sp;
    registers.p = readRam8(stack);
  },
  [MNEMONIC.TXS]: () => {
    registers.sp = registers.x;
  },
  [MNEMONIC.TSX]: () => {
    registers.x = registers.x;
  },
  [MNEMONIC.NOP]: () => {},
  [MNEMONIC.BRK]: () => {
    // TODO: Interrupt request
    setFlag("B", true);
  },
};

function setFlag(flag, value) {
  switch (flag) {
    case "C": {
      value ? (registers.p |= 1) : (registers.p &= ~1);
      break;
    }
    case "Z": {
      value ? (registers.p |= 2) : (registers.p &= ~2);
      break;
    }
    case "I": {
      value ? (registers.p |= 4) : (registers.p &= ~4);
      break;
    }
    case "D": {
      value ? (registers.p |= 8) : (registers.p &= ~8);
      break;
    }
    case "B": {
      value ? (registers.p |= 16) : (registers.p &= ~16);
      break;
    }
    case "V": {
      value ? (registers.p |= 64) : (registers.p &= ~64);
      break;
    }
    case "N": {
      value ? (registers.p |= 128) : (registers.p &= ~128);
      break;
    }
  }
}

// TODO: Implement unofficial opcodes,
// because apparently some NES games use them
const OPCODES = {
  //Decimal OpCode: mnemonic, addressing mode, instruction length, cycles

  // Regardless of what ANY 6502 documentation says, BRK is a 2 byte opcode. The
  // first is #$00, and the second is a padding byte. This explains why interrupt
  // routines called by BRK always return 2 bytes after the actual BRK opcode,
  // and not just 1.
  // source: http://nesdev.com/the%20%27B%27%20flag%20&%20BRK%20instruction.txt
  0: [MNEMONIC.BRK, MODES.IMPLIED, 2, 7],
  1: [MNEMONIC.ORA, MODES.INDIRECT_X, 2, 6],
  //2: [],
  //3: [],
  //4: [],
  5: [MNEMONIC.ORA, MODES.ZERO_PAGE, 2, 3],
  6: [MNEMONIC.ASL, MODES.ZERO_PAGE, 2, 5],
  //7: [],
  8: [MNEMONIC.PHP, MODES.IMPLIED, 1, 2],
  9: [MNEMONIC.ORA, MODES.IMMEDIATE, 2, 2],
  10: [MNEMONIC.ASL, MODES.ACCUMULATOR, 1, 2],
  //11: [],
  //12: [],
  13: [MNEMONIC.ORA, MODES.ABSOLUTE, 3, 4],
  14: [MNEMONIC.ASL, MODES.ABSOLUTE, 3, 6],
  //15: [],
  16: [MNEMONIC.BPL, MODES.RELATIVE, 2, 2],
  17: [MNEMONIC.ORA, MODES.INDIRECT_Y, 2, 5],
  //18: [],
  //19: [],
  //20: [],
  21: [MNEMONIC.ORA, MODES.ZERO_PAGE_X, 2, 4],
  22: [MNEMONIC.ASL, MODES.ZERO_PAGE_X, 2, 6],
  //23: [],
  24: [MNEMONIC.CLC, MODES.IMPLIED, 1, 2],
  25: [MNEMONIC.ORA, MODES.ABSOLUTE_Y, 3, 4],
  //26: [],
  //27: [],
  //28: [],
  29: [MNEMONIC.ORA, MODES.ABSOLUTE_X, 3, 4],
  30: [MNEMONIC.ASL, MODES.ABSOLUTE_X, 3, 7],
  //31: [],
  32: [MNEMONIC.JSR, MODES.ABSOLUTE, 3, 6],
  33: [MNEMONIC.AND, MODES.INDIRECT_X, 2, 6],
  //34: [],
  //35: [],
  36: [MNEMONIC.BIT, MODES.ZERO_PAGE, 2, 3],
  37: [MNEMONIC.AND, MODES.ZERO_PAGE, 2, 3],
  38: [MNEMONIC.ROL, MODES.ZERO_PAGE, 2, 5],
  ////39: [],
  40: [MNEMONIC.PLP, MODES.IMPLIED, 1, 2],
  41: [MNEMONIC.AND, MODES.IMMEDIATE, 2, 2],
  42: [MNEMONIC.ROL, MODES.ACCUMULATOR, 1, 2],
  ////43: [],
  44: [MNEMONIC.BIT, MODES.ABSOLUTE, 3, 4],
  45: [MNEMONIC.AND, MODES.ABSOLUTE, 3, 4],
  46: [MNEMONIC.ROL, MODES.ABSOLUTE, 3, 6],
  ////47: [],
  48: [MNEMONIC.BMI, MODES.RELATIVE, 2, 2],
  49: [MNEMONIC.AND, MODES.INDIRECT_Y, 2, 5],
  ////50: [],
  ////51: [],
  ////52: [],
  53: [MNEMONIC.AND, MODES.ZERO_PAGE_X, 2, 4],
  54: [MNEMONIC.ROL, MODES.ZERO_PAGE_X, 2, 6],
  ////55: [],
  56: [MNEMONIC.SEC, MODES.IMPLIED, 1, 2],
  57: [MNEMONIC.AND, MODES.ABSOLUTE_Y, 3, 4],
  //58: [],
  //59: [],
  //60: [],
  61: [MNEMONIC.AND, MODES.ABSOLUTE_X, 3, 4],
  62: [MNEMONIC.ROL, MODES.ABSOLUTE_X, 3, 7],
  //63: [],
  64: [MNEMONIC.RTI, MODES.IMPLIED, 1, 6],
  65: [MNEMONIC.EOR, MODES.INDIRECT_X, 2, 6],
  //66: [],
  //67: [],
  //68: [],
  69: [MNEMONIC.EOR, MODES.ZERO_PAGE, 2, 3],
  70: [MNEMONIC.LSR, MODES.ZERO_PAGE, 2, 5],
  //71: [],
  72: [MNEMONIC.PHA, MODES.IMPLIED, 1, 2],
  73: [MNEMONIC.EOR, MODES.IMMEDIATE, 2, 2],
  74: [MNEMONIC.LSR, MODES.ACCUMULATOR, 1, 2],
  //75: [],
  76: [MNEMONIC.JMP, MODES.ABSOLUTE, 3, 3],
  77: [MNEMONIC.EOR, MODES.ABSOLUTE, 3, 4],
  78: [MNEMONIC.LSR, MODES.ABSOLUTE, 3, 6],
  //79: [],
  80: [MNEMONIC.BVC, MODES.RELATIVE, 2, 2],
  81: [MNEMONIC.EOR, MODES.INDIRECT_Y, 2, 5],
  //82: [],
  //83: [],
  //84: [],
  85: [MNEMONIC.EOR, MODES.ZERO_PAGE_X, 2, 4],
  86: [MNEMONIC.LSR, MODES.ZERO_PAGE_X, 2, 6],
  //87: [],
  88: [MNEMONIC.CLI, MODES.IMPLIED, 1, 2],
  89: [MNEMONIC.EOR, MODES.ABSOLUTE_Y, 3, 4],
  //90: [],
  //91: [],
  //92: [],
  93: [MNEMONIC.EOR, MODES.ABSOLUTE_X, 3, 4],
  94: [MNEMONIC.LSR, MODES.ABSOLUTE_X, 3, 7],
  //95: [],
  96: [MNEMONIC.RTS, MODES.IMPLIED, 1, 6],
  97: [MNEMONIC.ADC, MODES.INDIRECT_X, 2, 6],
  //98: [],
  //99: [],
  //100: [],
  101: [MNEMONIC.ADC, MODES.ZERO_PAGE, 2, 3],
  102: [MNEMONIC.ROR, MODES.ZERO_PAGE, 2, 5],
  //103: [],
  104: [MNEMONIC.PLA, MODES.IMPLIED, 1, 2],
  105: [MNEMONIC.ADC, MODES.IMMEDIATE, 2, 2],
  106: [MNEMONIC.ROR, MODES.ACCUMULATOR, 1, 2],
  //107: [],
  108: [MNEMONIC.JMP, MODES.INDIRECT, 3, 5],
  109: [MNEMONIC.ADC, MODES.ABSOLUTE, 3, 4],
  110: [MNEMONIC.ROR, MODES.ABSOLUTE, 3, 6],
  //111: [],
  112: [MNEMONIC.BVS, MODES.RELATIVE, 2, 2],
  113: [MNEMONIC.ADC, MODES.INDIRECT_Y, 2, 5],
  //114: [],
  //115: [],
  //116: [],
  117: [MNEMONIC.ADC, MODES.ZERO_PAGE_X, 2, 4],
  118: [MNEMONIC.ROR, MODES.ZERO_PAGE_X, 2, 6],
  //119: [],
  120: [MNEMONIC.SEI, MODES.IMPLIED, 1, 2],
  121: [MNEMONIC.ADC, MODES.ABSOLUTE_Y, 3, 4],
  //122: [],
  //123: [],
  //124: [],
  125: [MNEMONIC.ADC, MODES.ABSOLUTE_X, 3, 4],
  126: [MNEMONIC.ROR, MODES.ABSOLUTE_X, 3, 7],
  //127: [],
  //128: [],
  129: [MNEMONIC.STA, MODES.INDIRECT_X, 2, 6],
  //130: [],
  //131: [],
  132: [MNEMONIC.STY, MODES.ZERO_PAGE, 2, 3],
  133: [MNEMONIC.STA, MODES.ZERO_PAGE, 2, 3],
  134: [MNEMONIC.STX, MODES.ZERO_PAGE, 2, 3],
  //135: [],
  136: [MNEMONIC.DEY, MODES.IMPLIED, 1, 2],
  //137: [],
  138: [MNEMONIC.TXA, MODES.IMPLIED, 1, 2],
  //139: [],
  140: [MNEMONIC.STY, MODES.ABSOLUTE, 3, 4],
  141: [MNEMONIC.STA, MODES.ABSOLUTE, 3, 4],
  142: [MNEMONIC.STX, MODES.ABSOLUTE, 3, 4],
  //143: [],
  144: [MNEMONIC.BCC, MODES.RELATIVE, 2, 2],
  145: [MNEMONIC.STA, MODES.INDIRECT_Y, 2, 6],
  //146: [],
  //147: [],
  148: [MNEMONIC.STY, MODES.ZERO_PAGE_X, 2, 4],
  149: [MNEMONIC.STA, MODES.ZERO_PAGE_X, 2, 4],
  150: [MNEMONIC.STX, MODES.ZERO_PAGE_Y, 2, 4],
  //151: [],
  152: [MNEMONIC.TYA, MODES.IMPLIED, 1, 2],
  153: [MNEMONIC.STA, MODES.ABSOLUTE_Y, 3, 5],
  154: [MNEMONIC.TXS, MODES.IMPLIED, 1, 2],
  //155: [],
  //156: [],
  157: [MNEMONIC.STA, MODES.ABSOLUTE_X, 3, 5],
  //158: [],
  //159: [],
  160: [MNEMONIC.LDY, MODES.IMMEDIATE, 2, 2],
  161: [MNEMONIC.LDA, MODES.INDIRECT_X, 2, 6],
  162: [MNEMONIC.LDX, MODES.IMMEDIATE, 2, 2],
  //163: [],
  164: [MNEMONIC.LDY, MODES.ZERO_PAGE, 2, 3],
  165: [MNEMONIC.LDA, MODES.ZERO_PAGE, 2, 3],
  166: [MNEMONIC.LDX, MODES.ZERO_PAGE, 2, 3],
  //167: [],
  168: [MNEMONIC.TAY, MODES.IMPLIED, 1, 2],
  169: [MNEMONIC.LDA, MODES.IMMEDIATE, 2, 2],
  170: [MNEMONIC.TAX, MODES.IMPLIED, 1, 2],
  //171: [],
  172: [MNEMONIC.LDY, MODES.ABSOLUTE, 3, 4],
  173: [MNEMONIC.LDA, MODES.ABSOLUTE, 3, 4],
  174: [MNEMONIC.LDX, MODES.ABSOLUTE, 3, 4],
  //175: [],
  176: [MNEMONIC.BCS, MODES.RELATIVE, 2, 2],
  177: [MNEMONIC.LDA, MODES.INDIRECT_Y, 2, 5],
  //178: [],
  //179: [],
  180: [MNEMONIC.LDY, MODES.ZERO_PAGE_X, 2, 4],
  181: [MNEMONIC.LDA, MODES.ZERO_PAGE_X, 2, 4],
  182: [MNEMONIC.LDX, MODES.ZERO_PAGE_Y, 2, 4],
  //183: [],
  184: [MNEMONIC.CLV, MODES.IMPLIED, 1, 2],
  185: [MNEMONIC.LDA, MODES.ABSOLUTE_Y, 3, 4],
  186: [MNEMONIC.TSX, MODES.IMPLIED, 1, 2],
  //187: [],
  188: [MNEMONIC.LDY, MODES.ABSOLUTE_X, 3, 4],
  189: [MNEMONIC.LDA, MODES.ABSOLUTE_X, 3, 4],
  190: [MNEMONIC.LDX, MODES.ABSOLUTE_Y, 3, 4],
  //191: [],
  192: [MNEMONIC.CPY, MODES.IMMEDIATE, 2, 2],
  193: [MNEMONIC.CMP, MODES.INDIRECT_X, 2, 6],
  //194: [],
  //195: [],
  196: [MNEMONIC.CPY, MODES.ZERO_PAGE, 2, 3],
  197: [MNEMONIC.CMP, MODES.ZERO_PAGE, 2, 3],
  198: [MNEMONIC.DEC, MODES.ZERO_PAGE, 2, 5],
  //199: [],
  200: [MNEMONIC.INY, MODES.IMPLIED, 1, 2],
  201: [MNEMONIC.CMP, MODES.IMMEDIATE, 2, 2],
  202: [MNEMONIC.DEX, MODES.IMPLIED, 1, 2],
  //203: [],
  204: [MNEMONIC.CPY, MODES.ABSOLUTE, 3, 4],
  205: [MNEMONIC.CMP, MODES.ABSOLUTE, 3, 4],
  206: [MNEMONIC.DEC, MODES.ABSOLUTE, 3, 6],
  //207: [],
  208: [MNEMONIC.BNE, MODES.RELATIVE, 2, 2],
  209: [MNEMONIC.CMP, MODES.INDIRECT_Y, 2, 5],
  //210: [],
  //211: [],
  //212: [],
  213: [MNEMONIC.CMP, MODES.ZERO_PAGE_X, 2, 4],
  214: [MNEMONIC.DEC, MODES.ZERO_PAGE_X, 2, 6],
  //215: [],
  216: [MNEMONIC.CLD, MODES.IMPLIED, 1, 2],
  217: [MNEMONIC.CMP, MODES.ABSOLUTE_Y, 3, 4],
  //218: [],
  //219: [],
  //220: [],
  221: [MNEMONIC.CMP, MODES.ABSOLUTE_X, 3, 4],
  222: [MNEMONIC.DEC, MODES.ABSOLUTE_X, 3, 7],
  //223: [],
  224: [MNEMONIC.CPX, MODES.IMMEDIATE, 2, 2],
  225: [MNEMONIC.SBC, MODES.INDIRECT_X, 2, 6],
  //226: [],
  //227: [],
  228: [MNEMONIC.CPX, MODES.ZERO_PAGE, 2, 3],
  229: [MNEMONIC.SBC, MODES.ZERO_PAGE, 2, 3],
  230: [MNEMONIC.INC, MODES.ZERO_PAGE, 2, 5],
  //231: [],
  232: [MNEMONIC.INX, MODES.IMPLIED, 1, 2],
  233: [MNEMONIC.SBC, MODES.IMMEDIATE, 2, 2],
  234: [MNEMONIC.NOP, MODES.IMPLIED, 1, 2],
  //235: [],
  236: [MNEMONIC.CPX, MODES.ABSOLUTE, 3, 4],
  237: [MNEMONIC.SBC, MODES.ABSOLUTE, 3, 4],
  238: [MNEMONIC.INC, MODES.ABSOLUTE, 3, 6],
  //239: [],
  240: [MNEMONIC.BEQ, MODES.RELATIVE, 2, 2],
  241: [MNEMONIC.SBC, MODES.INDIRECT_Y, 2, 5],
  //242: [],
  //243: [],
  //244: [],
  245: [MNEMONIC.SBC, MODES.ZERO_PAGE_X, 2, 4],
  246: [MNEMONIC.INC, MODES.ZERO_PAGE_X, 2, 6],
  //247: [],
  248: [MNEMONIC.SED, MODES.IMPLIED, 1, 2],
  249: [MNEMONIC.SBC, MODES.ABSOLUTE_Y, 3, 4],
  //250: [],
  //251: [],
  //252: [],
  253: [MNEMONIC.SBC, MODES.ABSOLUTE_X, 3, 4],
  254: [MNEMONIC.INC, MODES.ABSOLUTE_X, 3, 7],
  //255: [],
};
