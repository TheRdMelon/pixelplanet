/* @flow */


const OP_CODE = 0xC3;

export default {
  OP_CODE,
  hydrate(data: DataView) {
    const retCode = data.getUint8(1);
    const wait = data.getUint32(2);
    const coolDownSeconds = data.getInt16(6);
    return {
      retCode,
      wait,
      coolDownSeconds,
    };
  },
  dehydrate(retCode, wait, coolDown): Buffer {
    const buffer = Buffer.allocUnsafe(1 + 1 + 4 + 1 + 2);
    buffer.writeUInt8(OP_CODE, 0);
    buffer.writeUInt8(retCode, 1);
    buffer.writeUInt32BE(wait, 2);
    const coolDownSeconds = Math.round(coolDown / 1000);
    buffer.writeInt16BE(coolDownSeconds, 6);
    return buffer;
  },
};
