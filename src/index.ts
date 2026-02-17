/* eslint-disable @typescript-eslint/no-explicit-any */
let heapPtr = 0x1000;

export interface IKoffiCType {
  name?: string;
  [key: string]: any;
}
export interface IKoffiLib {
  [key: string]: any;
}
export type TypeSpecWithAlignment = any;
export type IKoffiRegisteredCallback = any;
export type KoffiFunction = any;

const MockKoffi = {
  // Struct definition - just store the spec
  struct: (name: string, spec: unknown) => ({ name, spec }),

  // Array definition
  array: (type: any, len: number, hint?: string) =>
    ({ type, len, hint, name: `[${len}]` }) as IKoffiCType,

  // Sizeof - return fixed sizes for known structs/types
  sizeof: (type: any) => {
    if (typeof type === 'string') {
      switch (type) {
        case 'uint64':
        case 'int64':
        case 'double':
          return 8;
        case 'uint32':
        case 'int32':
        case 'float':
          return 4;
        case 'uint16':
        case 'int16':
          return 2;
        case 'uint8':
        case 'int8':
          return 1;
        default:
          return 8; // Pointer size assumed
      }
    }
    if (type.name === 'MEMORY_BASIC_INFORMATION') return 48; // x64
    if (type.name === 'CONTEXT') return 1232; // x64
    if (type.name === 'M128A') return 16;
    return 8;
  },

  // Alloc - simple bump allocator simulation
  alloc: (type: any, count: number = 1) => {
    const size = MockKoffi.sizeof(type) * count;
    const buf = Buffer.alloc(size);
    (buf as any).__addr = BigInt(heapPtr);
    heapPtr += size;
    // Align to 16 bytes for safety
    heapPtr = (heapPtr + 15) & ~15;
    return buf;
  },

  // Address - return the mock address
  address: (ptr: any) => {
    return ptr.__addr || 0n;
  },

  free: (_ptr: any) => {},

  // Decode - parse buffer based on struct layout
  decode: (buffer: Buffer, type: any) => {
    if (type.name === 'MEMORY_BASIC_INFORMATION') {
      return {
        BaseAddress: buffer.readBigUInt64LE(0),
        AllocationBase: buffer.readBigUInt64LE(8),
        AllocationProtect: buffer.readUInt32LE(16),
        RegionSize: buffer.readBigUInt64LE(24),
        State: buffer.readUInt32LE(32),
        Protect: buffer.readUInt32LE(36),
        Type: buffer.readUInt32LE(40),
      };
    }
    if (type.name === 'CONTEXT') {
      const ctx: any = {
        ContextFlags: buffer.readUInt32LE(0x30),
      };
      // Read registers if buffer has them
      if (buffer.length >= 256) {
        ctx.Rip = buffer.readBigUInt64LE(0xf8);
        ctx.Rsp = buffer.readBigUInt64LE(0x98);
        ctx.Rax = buffer.readBigUInt64LE(0x78);
      }
      return ctx;
    }
    return {};
  },

  // Encode - write object to buffer
  encode: (buffer: Buffer, type: any, value: any) => {
    if (type.name === 'CONTEXT') {
      if (value.ContextFlags) buffer.writeUInt32LE(value.ContextFlags, 0x30);
      if (value.Rip) buffer.writeBigUInt64LE(value.Rip, 0xf8);
      if (value.Rsp) buffer.writeBigUInt64LE(value.Rsp, 0x98);
      if (value.Rax) buffer.writeBigUInt64LE(value.Rax, 0x78);
    }
  },
};

export default MockKoffi;
