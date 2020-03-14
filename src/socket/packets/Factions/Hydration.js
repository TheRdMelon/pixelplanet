/**
 *
 * @flow
 */

import uuidParse from 'uuid-parse';

export default function getHydrators(OP_CODE) {
  return {
    hydrate(data: ArrayBuffer) {
      // Client
      const faction = uuidParse.unparse(Buffer.from(data).slice(1));
      return faction;
    },
    dehydrate(faction): Buffer {
      // Server
      if (!process.env.BROWSER) {
        const buffer = Buffer.allocUnsafe(1 + 16);
        buffer.writeUInt8(OP_CODE, 0);

        Buffer.from(uuidParse.parse(faction)).copy(buffer, 1);

        return buffer;
      }
      return null;
    },
  };
}
