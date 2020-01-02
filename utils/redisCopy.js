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
      const newkey = `ch:0:${i}:${j}`;
      const chunk = await oldredis.getAsync(oldkey);
      if (chunk) {
        const setNXArgs = [newkey, chunk];
        await newredis.sendCommandAsync('SETNX', setNXArgs);
        console.log("Created Chunk ", key);
      }
    }
  }
}

/*
 * Creating new basechunk if the sizes are the same, just the colors chaned
 * @param x x coordinates of chunk (in chunk coordinates, not pixel coordinates)
 * @param y y coordinates of chunk (in chunk coordinates, not pixel coordinates)
 */
async function createBasechunk(x: number, y: number): Uint8Array {
  const key = `chunk:${x}:${y}`;
  const newChunk = new Uint8Array(TILE_SIZE * TILE_SIZE);

  const smallchunk = await oldredis.getAsync(key);
  if (!smallchunk) {
    return
  }

  const oldChunk = new Uint8Array(smallchunk);
  if (oldChunk.length != newChunk.length || oldChunk.length != TILE_SIZE * TILE_SIZE) {
    console.log(`ERROR: Chunk length ${oldChunk.length} of chunk ${x},${y} not of correct size!`);
  }

  for (let px = 0; px < oldChunk.length; px += 1) {
    newChunk[px] = colorConvert(oldChunk[px]);
  }

  const setNXArgs = [key, Buffer.from(newChunk.buffer).toString('binary')]
  await newredis.sendCommandAsync('SETNX', setNXArgs);
  console.log("Created Chunk ", key);
}


copyChunks();
