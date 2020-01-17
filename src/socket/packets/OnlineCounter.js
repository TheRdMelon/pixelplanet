/* @flow */

type OnlineCounterPacket = {
  online: number,
};

const OP_CODE = 0xA7;

export default {
  OP_CODE,
  hydrate(data: DataView): OnlineCounterPacket {
    // CLIENT
    const online = data.getInt16(1);
    return { online };
  },
  dehydrate({ online }: OnlineCounterPacket): Buffer {
    // SERVER
    if (!process.env.BROWSER) {
      const buffer = Buffer.allocUnsafe(1 + 2);
      buffer.writeUInt8(OP_CODE, 0);

      buffer.writeInt16BE(online, 1);

      return buffer;
    }
    return 0;
  },
};
