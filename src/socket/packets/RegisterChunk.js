/* @flow */


const OP_CODE = 0xA1;

export default {
  OP_CODE,
  hydrate(data: Buffer) {
    // SERVER (Client)
    const i = data[1] << 8 | data[2];
    return i;
  },
  dehydrate(chunkid): ArrayBuffer {
    // CLIENT (Sender)
    const buffer = new ArrayBuffer(1 + 2);
    const view = new DataView(buffer);
    view.setInt8(0, OP_CODE);
    view.setInt16(1, chunkid);
    return buffer;
  },
};
