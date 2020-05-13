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
  hydrate(data: DataView): PixelUpdatePacket {
    const i = data.getUint8(1);
    const j = data.getUint8(2);
    const offset = (data.getUint8(3) << 16) | data.getUint16(4);
    const color = data.getUint8(6);
    return {
      i, j, offset, color,
    };
  },

  dehydrate(i, j, offset, color): Buffer {
    const buffer = new ArrayBuffer(1 + 1 + 1 + 1 + 2 + 1);
    const view = new DataView(buffer);
    view.setUint8(0, OP_CODE);

    view.setUint8(1, i);
    view.setUint8(2, j);
    view.setUint8(3, offset >>> 16);
    view.setUint16(4, offset & 0x00FFFF);
    view.setUint8(6, color);

    return buffer;
  },

};
