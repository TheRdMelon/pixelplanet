/* @flow */
//this script removes protection from all pixels on main canas

import redis from 'redis';
import bluebird from 'bluebird';


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


//ATTENTION Make suer to set the rdis URLs right!!!
const urlo = "redis://localhost:6379";
const url = "redis://localhost:6380";
const rediso = redis.createClient(urlo, { return_buffers: true });
const redisc = redis.createClient(url, { return_buffers: true });

const CANVAS_SIZE = 256 * 256;
const TILE_SIZE = 256;
const CHUNKS_XY = CANVAS_SIZE / TILE_SIZE;

async function moveProtection() {
  for (let x = 0; x < CHUNKS_XY; x++) {
    for (let y = 0; y < CHUNKS_XY; y++) {
      const key = `ch:0:${x}:${y}`;
      const chunk = await redisc.getAsync(key);
      if (chunk) {
        const buffer = new Uint8Array(chunk);
        let changed = false;
        for (let u = 0; u < buffer.length; ++u) {
          const bit = buffer[u];
          if (bit & 0x80) {
            buffer[u] = bit & 0x1F;
            changed = true;
          }
        }
        if (changed) {
          await rediso.setAsync(key, Buffer.from(buffer.buffer));
          console.log("Changed Chunk ", key);
        }
      }
    }
  }
  console.log("done");
}

moveProtection();
