export class Chip8 {
  // 4KB of Memory
  memory: Uint8Array;

  // 16 8-bit Registers (V0 to VF)
  registers: Uint8Array;

  // Index Register (stores memory addresses)
  I: number;

  // Program Counter (points to the current instruction)
  pc: number;

  // Graphics Buffer (64x32 pixels, monochrome)
  gfx: number[];

  // Timers
  delayTimer: number;
  soundTimer: number;

  // The Stack and Stack Pointer
  stack: number[];
  sp: number;

  // Keypad state (16 keys)
  keys: boolean[];

  constructor() {
    this.memory = new Uint8Array(4096);
    this.registers = new Uint8Array(16);
    this.I = 0;
    this.pc = 0x200;
    this.gfx = new Array(64 * 32).fill(0);
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.stack = [];
    this.sp = 0;
    this.keys = new Array(16).fill(false);

    // Standard Chip-8 Font Set
    const fontSet = [
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ];

    // Load fonts into memory at 0x000
    for (let i = 0; i < fontSet.length; i++) {
      this.memory[i] = fontSet[i];
    }
  }

  loadGame(romData: Uint8Array) {
    // Load the ROM into memory starting at 0x200
    for (let i = 0; i < romData.length; i++) {
      this.memory[0x200 + i] = romData[i];
    }
  }

  cycle() {
    // 1. FETCH: Read 2 bytes (opcode is 16-bit)
    // Combine memory[pc] and memory[pc+1]
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];

    // 2. EXECUTE: Decode the opcode
    // (This is a giant switch statement matching hex patterns)
    this.executeOpcode(opcode);

    // 3. UPDATE TIMERS
    if (this.delayTimer > 0) this.delayTimer--;
    if (this.soundTimer > 0) this.soundTimer--;
  }

  executeOpcode(opcode: number) {
    // Use bitwise masking to find the instruction
    // Example: 0xA123 -> "Set I to 123"

    switch (opcode & 0xF000) {
      case 0x0000:
        if (opcode === 0x00E0) {
          // 00E0: Clear Screen
          this.gfx.fill(0);
          this.pc += 2;
        } else if (opcode === 0x00EE) {
          // 00EE: Return from Subroutine
          this.pc = this.stack.pop() || 0x200;
          this.pc += 2;
        }
        break;

      case 0xC000: // CXNN: Set VX = Random byte AND NN
        {
          const x = (opcode & 0x0F00) >> 8;
          const nn = opcode & 0x00FF;
          this.registers[x] = Math.floor(Math.random() * 256) & nn;
          this.pc += 2;
        }
        break;

      case 0xF000: // Miscellaneous instructions
        {
          const x = (opcode & 0x0F00) >> 8;
          const subCode = opcode & 0x00FF;

          switch (subCode) {
            case 0x0007: // FX07: Set VX = Delay Timer
              this.registers[x] = this.delayTimer;
              this.pc += 2;
              break;

            case 0x000A: // FX0A: Wait for key press (Blocking)
              let keyPressed = false;
              for (let i = 0; i < 16; i++) {
                if (this.keys[i]) {
                  this.registers[x] = i;
                  keyPressed = true;
                  break; // Stop checking once found
                }
              }
              // If no key is pressed, we DO NOT increment pc.
              // This effectively "pauses" the CPU on this line.
              if (keyPressed) {
                this.pc += 2;
              }
              break;

            case 0x0015: // FX15: Set Delay Timer = VX
              this.delayTimer = this.registers[x];
              this.pc += 2;
              break;

            case 0x0018: // FX18: Set Sound Timer = VX
              this.soundTimer = this.registers[x];
              this.pc += 2;
              break;

            case 0x001E: // FX1E: Add VX to I
              this.I += this.registers[x];
              this.pc += 2;
              break;

            case 0x0029: // FX29: Set I to location of sprite for digit VX
              // Fonts are 5 bytes high, so 0 is at 0, 1 is at 5, etc.
              this.I = (this.registers[x] & 0x0F) * 5;
              this.pc += 2;
              break;

            case 0x0033: // FX33: Store BCD representation of VX in memory I, I+1, I+2
              let value = this.registers[x];
              this.memory[this.I + 2] = value % 10;
              value = Math.floor(value / 10);
              this.memory[this.I + 1] = value % 10;
              value = Math.floor(value / 10);
              this.memory[this.I] = value % 10;
              this.pc += 2;
              break;

            case 0x0055: // FX55: Store registers V0 through VX in memory starting at I
              for (let i = 0; i <= x; i++) {
                this.memory[this.I + i] = this.registers[i];
              }
              this.pc += 2;
              break;

            case 0x0065: // FX65: Read memory starting at I into registers V0 through VX
              for (let i = 0; i <= x; i++) {
                this.registers[i] = this.memory[this.I + i];
              }
              this.pc += 2;
              break;

            default:
              console.warn(`Unknown 0xF000 Opcode: ${opcode.toString(16)}`);
              this.pc += 2;
          }
        }
        break;

      case 0x1000: // 1NNN: Jump to address NNN
        this.pc = opcode & 0x0FFF;
        break;

      case 0x6000: // 6XNN: Set Register VX to NN
        const xnn = (opcode & 0x0F00) >> 8;
        const nn = opcode & 0x00FF;
        this.registers[xnn] = nn;
        this.pc += 2;
        break;

      case 0x7000: // 7XNN: Add NN to Register VX
        const reg = (opcode & 0x0F00) >> 8;
        const val = opcode & 0x00FF;
        this.registers[reg] += val;
        this.pc += 2;
        break;

      case 0xA000: // ANNN: Set I to address NNN
        this.I = opcode & 0x0FFF;
        this.pc += 2;
        break;

      case 0xD000: // DXYN: Draw Sprite at (VX, VY) with width 8 and height N
        const x = (opcode & 0x0F00) >> 8;
        const y = (opcode & 0x00F0) >> 4;
        const height = opcode & 0x000F;
        let pixel;

        this.registers[0xF] = 0; // VF is the "Collision Flag"

        for (let yline = 0; yline < height; yline++) {
          pixel = this.memory[this.I + yline]; // Fetch the pixel byte
          for (let xline = 0; xline < 8; xline++) {
            // Check if the current pixel in the byte is set (1)
            if ((pixel & (0x80 >> xline)) !== 0) {
              const gfxX = (this.registers[x] + xline) % 64; // Wrap around width
              const gfxY = (this.registers[y] + yline) % 32; // Wrap around height
              const gfxIdx = gfxX + (gfxY * 64);

              // XOR Logic: If pixel is already 1, set collision flag (VF) to 1
              if (this.gfx[gfxIdx] === 1) {
                this.registers[0xF] = 1;
              }
              // Flip the pixel
              this.gfx[gfxIdx] ^= 1;
            }
          }
        }
        this.pc += 2;
        break;

      case 0x3000: // 3XNN: Skip next instruction if VX == NN
        {
          const x = (opcode & 0x0F00) >> 8;
          const nn = opcode & 0x00FF;
          if (this.registers[x] === nn) {
            this.pc += 4; // Skip next (2 bytes for current + 2 bytes for skipped)
          } else {
            this.pc += 2; // Normal flow
          }
        }
        break;

      case 0x4000: // 4XNN: Skip next instruction if VX != NN
        {
          const x = (opcode & 0x0F00) >> 8;
          const nn = opcode & 0x00FF;
          if (this.registers[x] !== nn) {
            this.pc += 4;
          } else {
            this.pc += 2;
          }
        }
        break;

      case 0x5000: // 5XY0: Skip next instruction if VX == VY
        {
          const x = (opcode & 0x0F00) >> 8;
          const y = (opcode & 0x00F0) >> 4;
          if (this.registers[x] === this.registers[y]) {
            this.pc += 4;
          } else {
            this.pc += 2;
          }
        }
        break;

      case 0x8000: // Arithmetic Operations
        {
          const x = (opcode & 0x0F00) >> 8;
          const y = (opcode & 0x00F0) >> 4;
          const subCode = opcode & 0x000F;

          switch (subCode) {
            case 0x0000: // 8xy0: Set VX = VY
              this.registers[x] = this.registers[y];
              this.pc += 2;
              break;
            case 0x0001: // 8xy1: Set VX = VX OR VY
              this.registers[x] |= this.registers[y];
              this.pc += 2;
              break;
            case 0x0002: // 8xy2: Set VX = VX AND VY
              this.registers[x] &= this.registers[y];
              this.pc += 2;
              break;
            case 0x0003: // 8xy3: Set VX = VX XOR VY
              this.registers[x] ^= this.registers[y];
              this.pc += 2;
              break;
            case 0x0004: // 8xy4: Set VX = VX + VY, Set VF = carry
              const sum = this.registers[x] + this.registers[y];
              this.registers[0xF] = sum > 0xFF ? 1 : 0; // Carry flag
              this.registers[x] = sum & 0xFF; // Wrap to 8-bit
              this.pc += 2;
              break;
            case 0x0005: // 8xy5: Set VX = VX - VY, Set VF = NOT borrow
              this.registers[0xF] = this.registers[x] > this.registers[y] ? 1 : 0;
              this.registers[x] -= this.registers[y];
              this.pc += 2;
              break;
            case 0x0006: // 8xy6: Shift VX Right by 1
              this.registers[0xF] = this.registers[x] & 0x1;
              this.registers[x] >>= 1;
              this.pc += 2;
              break;
            case 0x0007: // 8xy7: Set VX = VY - VX
              this.registers[0xF] = this.registers[y] > this.registers[x] ? 1 : 0;
              this.registers[x] = this.registers[y] - this.registers[x];
              this.pc += 2;
              break;
            case 0x000E: // 8xyE: Shift VX Left by 1
              this.registers[0xF] = (this.registers[x] & 0x80) >> 7;
              this.registers[x] <<= 1;
              this.pc += 2;
              break;
            default:
              console.warn(`Unknown 0x8000 Opcode: ${opcode.toString(16)}`);
              this.pc += 2;
          }
        }
        break;

      case 0xE000: // Input Operations
        {
          const x = (opcode & 0x0F00) >> 8;
          const subCode = opcode & 0x00FF;

          switch (subCode) {
            case 0x009E: // Ex9E: Skip next instruction if key stored in VX is pressed
              if (this.keys[this.registers[x]]) {
                this.pc += 4;
              } else {
                this.pc += 2;
              }
              break;
            case 0x00A1: // ExA1: Skip next instruction if key stored in VX is NOT pressed
              if (!this.keys[this.registers[x]]) {
                this.pc += 4;
              } else {
                this.pc += 2;
              }
              break;
            default:
              console.warn(`Unknown 0xE000 Opcode: ${opcode.toString(16)}`);
              this.pc += 2;
          }
        }
        break;

      default:
        console.warn(`Unknown Opcode: ${opcode.toString(16)}`);
        this.pc += 2;
    }
  }
}