/* @flow */
//this script just copies chunks from one redis to another with a different key as needed

import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
//ATTENTION Make suer to set the rdis URLs right!!!
const oldurl = "redis://localhost:6379";
const oldredis = redis.createClient(oldurl, { return_buffers: true });
const newurl = "redis://localhost:6380";
const newredis = redis.createClient(newurl, { return_buffers: true });

const CANVAS_SIZE = 256 * 256;
const TILE_SIZE = 256;
const CHUNKS_XY = CANVAS_SIZE / TILE_SIZE;

async function copyChunks() {
  for (let x = 0; x < CHUNKS_XY; x++) {
    for (let y = 0; y < CHUNKS_XY; y++) {
      const oldkey = `chunk:${x}:${y}`;
      const newkey = `ch:0:${x}:${y}`;
      const chunk = await oldredis.getAsync(oldkey);
      if (chunk) {
        const setNXArgs = [newkey, chunk];
        await newredis.sendCommandAsync('SETNX', setNXArgs);
        console.log("Created Chunk ", key);
      }
    }
  }
}

copyChunks();
