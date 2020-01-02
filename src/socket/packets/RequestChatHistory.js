/* @flow */

const OP_CODE = 0xA5;

export default {
  OP_CODE,
  dehydrate(): ArrayBuffer {
    const buffer = new ArrayBuffer(1);
    const view = new DataView(buffer);
    view.setInt8(0, OP_CODE);
    return buffer;
  },
};
