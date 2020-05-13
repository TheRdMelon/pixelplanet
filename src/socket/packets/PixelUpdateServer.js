/* @flow */


import type { ColorIndex } from '../../core/Palette';

type PixelUpdatePacket = {
  x: number,
  y: number,
  color: ColorIndex,
};

const OP_CODE = 0xC1;

export default {
  OP_CODE,
  hydrate(data: Buffer): PixelUpdatePacket {
    const i = data.readUInt8(1);
    const j = data.readUInt8(2);
    const offset = (data.readUInt8(3) << 16) | data.readUInt16BE(4);
    const color = data.readUInt8(6);
    return {
      i, j, offset, color,
    };
  },
  dehydrate(i, j, offset, color): Buffer {
    const buffer = Buffer.allocUnsafe(1 + 1 + 1 + 1 + 2 + 1);
    buffer.writeUInt8(OP_CODE, 0);

    buffer.writeUInt8(i, 1);
    buffer.writeUInt8(j, 2);
    buffer.writeUInt8(offset >>> 16, 3);
    buffer.writeUInt16BE(offset & 0x00FFFF, 4);
    buffer.writeUInt8(color, 6);

    return buffer;
  },
};
