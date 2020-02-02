/* @flow */

import type { ColorIndex } from '../../core/Palette';

type PixelUpdatePacket = {
  x: number,
  y: number,
  color: ColorIndex,
};

const OP_CODE = 0xc1; // Chunk Update

export default {
  OP_CODE,
  hydrate(data: DataView): PixelUpdatePacket {
    // CLIENT
    const i = data.getUint8(1);
    const j = data.getUint8(2);
    const offset = (data.getUint8(3) << 16) | data.getUint16(4);
    const color = data.getUint8(6);
    // const offset = data.getUint16(5);
    // const color = data.getUint8(7);
    return {
      i,
      j,
      offset,
      color,
    };
  },
  dehydrate(i, j, offset, color): Buffer {
    // SERVER
    if (!process.env.BROWSER) {
      const buffer = Buffer.allocUnsafe(1 + 1 + 1 + 1 + 2 + 1);
      buffer.writeUInt8(OP_CODE, 0);

      buffer.writeUInt8(i, 1);
      buffer.writeUInt8(j, 2);
      buffer.writeUInt8(offset >>> 16, 3);
      buffer.writeUInt16BE(offset & 0x00FFFF, 4);
      buffer.writeUInt8(color, 6);
      // buffer.writeUInt16BE(offset, 5);
      // buffer.writeUInt8(color, 7);

      return buffer;
    }
    return null;
  },
};
