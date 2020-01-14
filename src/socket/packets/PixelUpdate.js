/* @flow */


import type { ColorIndex } from '../../core/Palette';

type PixelUpdatePacket = {
  x: number,
  y: number,
  color: ColorIndex,
};

const OP_CODE = 0xC1; // Chunk Update

export default {
  OP_CODE,
  hydrate(data: DataView): PixelUpdatePacket {
    // CLIENT
    const i = data.getInt16(1);
    const j = data.getInt16(3);
    const offset = data.getUint16(5);
    const color = data.getUint8(7);
    return {
      i, j, offset, color,
    };
  },
  dehydrate(i, j, offset, color): Buffer {
    // SERVER
    if (!process.env.BROWSER) {
      const buffer = Buffer.allocUnsafe(1 + 2 + 2 + 2 + 1);
      buffer.writeUInt8(OP_CODE, 0);

      buffer.writeInt16BE(i, 1);
      buffer.writeInt16BE(j, 3);
      buffer.writeUInt16BE(offset, 5);
      buffer.writeUInt8(color, 7);

      return buffer;
    }
    return null;
  },
};
