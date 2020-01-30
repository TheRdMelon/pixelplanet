/* @flow */
//this script just copies chunks from one redis to another with a different key as needed

import redis from 'redis';
import bluebird from 'bluebird';


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);


//ATTENTION Make suer to set the rdis URLs right!!!
const url = "redis://localhost:6379";
const redis = redis.createClient(url, { return_buffers: true });

const CANVAS_SIZE = 256 * 256;
const TILE_SIZE = 256;
const CHUNKS_XY = CANVAS_SIZE / TILE_SIZE;

async function moveProtection() {
  for (let x = 0; x < CHUNKS_XY; x++) {
    for (let y = 0; y < CHUNKS_XY; y++) {
      const key = `ch:0:${x}:${y}`;
      const chunk = await redis.getAsync(key);
      if (chunk) {
        const buffer = new Uint8Array(chunk);
        let changed = false;
        for (let u = 0; u < buffer.length; ++u) {
          const bit = buffer[u];
          if (bit & 0x20) {
            // move protected bit from 0x20 to 0x80
            buffer[u] = (bit & 0x1F) | 0x80;
            changed = true;
          }
        }
        if (changed) {
          const setNXArgs = [key, Buffer.from(buffer.buffer).toString('binary')]
          await redis.sendCommandAsync('SETNX', setNXArgs);
          console.log("Changed Chunk ", key);
        }
      }
    }
  }
}

moveProtection();
