/* @flow */


const OP_CODE = 0xC2;

export default {
  OP_CODE,
  hydrate(data: DataView) {
    // SERVER (Client)
    const waitSeconds = data.getUint16(1);
    return waitSeconds;
  },
  dehydrate(waitSeconds): Buffer {
    // CLIENT (Sender)
    const buffer = Buffer.allocUnsafe(1 + 2);
    buffer.writeUInt8(OP_CODE, 0);

    buffer.writeUInt16BE(waitSeconds, 1);
    return buffer;
  },
};
