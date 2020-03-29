/* @flow */
//this script just copies chunks from one redis to another

import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

import {
  TILE_SIZE,
  THREE_TILE_SIZE,
} from '../src/core/constants';

//ATTENTION Make suer to set the rdis URLs right!!!
const oldurl = "redis://localhost:6380";
const oldredis = redis.createClient(oldurl, { return_buffers: true });
const newurl = "redis://localhost:6379";
const newredis = redis.createClient(newurl, { return_buffers: true });

const CANVAS_SIZE = 1024;
const OUR_TILE_SIZE = THREE_TILE_SIZE;
const CHUNKS_XY = CANVAS_SIZE / OUR_TILE_SIZE;

async function copyChunks() {
  for (let x = 0; x < CHUNKS_XY; x++) {
    for (let y = 0; y < CHUNKS_XY; y++) {
      const oldkey = `ch:2:${x}:${y}`;
      const newkey = `ch:2:${x}:${y}`;
      const chunk = await oldredis.getAsync(oldkey);
      if (chunk) {
        const setNXArgs = [newkey, chunk];
        await newredis.sendCommandAsync('SET', setNXArgs);
        console.log("Created Chunk ", newkey);
      }
    }
  }
}

function chunkOfCord(cor) {
  return Math.floor((cor + CANVAS_SIZE / 2) / OUR_TILE_SIZE);
}

async function copyChunksByCoords(xMin, xMax, yMin, yMax) {
  const chunkXMin = chunkOfCord(xMin);
  const chunkXMax = chunkOfCord(xMax);
  const chunkYMin = chunkOfCord(yMin);
  const chunkYMax = chunkOfCord(yMax);
  for (let x = chunkXMin; x <= chunkXMax; x++) {
    for (let y = chunkYMin; y < chunkYMax; y++) {
      const oldkey = `ch:2:${x}:${y}`;
      const newkey = `ch:2:${x}:${y}`;
      const chunk = await oldredis.getAsync(oldkey);
      if (chunk) {
        const setNXArgs = [newkey, chunk];
        await newredis.sendCommandAsync('SET', setNXArgs);
        console.log("Created Chunk ", newkey);
      }
    }
  }
}

copyChunksByCoords(-160, 60, -60, 160);
