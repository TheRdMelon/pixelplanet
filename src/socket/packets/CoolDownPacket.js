/* @flow */


const OP_CODE = 0xC2;

export default {
  OP_CODE,
  hydrate(data: DataView) {
    return data.getUint32(1);
  },
  dehydrate(wait): Buffer {
    const buffer = Buffer.allocUnsafe(1 + 4);
    buffer.writeUInt8(OP_CODE, 0);
    buffer.writeUInt32BE(wait, 1);
    return buffer;
  },
};
