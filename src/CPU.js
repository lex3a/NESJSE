class CPU {
  constructor() {
    this.a = 0;
    this.x = 0;
    this.y = 0;
    this.sp = 0xff;
    this.pc = 0;
    this.p = 0b00110000;
    this.ram = new Uint8Array(65536).fill(0);
  }

  /**
   * Returns one byte value from CPU memory map
   * @param  {number} address Address in CPU memory map
   */
  readRam8(address) {
    return this.ram[address];
  }

  /**
   * Returns two byte value from CPU memory map
   * @param  {number} address Address in CPU memory map
   */
  readRam16(address) {
    return (readRam8(address + 1) << 8) | readRam8(address);
  }
  /**
   * @param  {number} address Address in CPU memory map
   * @param  {number} value Value to write
   */
  writeRam8(address, value) {
    this.ram[address] = value;
  }

  /**
   * Enable/disable corresponding register status flag
   * @param  {string} flag 
   * Accepts
   * N - Negative,
   * V - oVerflow,
   * B - Break,
   * D - Binary Coded Decimal mode, disabled in NES,
   * I - Interrupt,
   * Z - Zero,
   * C - Carry
   * @param {boolean} value Enable/disable
   */
  setFlag(flag, value) {
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
      default: {
        throw new Error("Such flag does not exist");
        break;
      }
    }
  },

  step(program) {
    //clearDislpayMemory(memoryHTML);
    //displayMemory(memoryHTML, 0, 1024);
    readOpcode(program[registers.pc]);
    registers.pc += 1;
    //displayRegs();
  }
}

CPU.readRam8