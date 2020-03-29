/* @flow */
//this script just copies chunks from one redis to another with a different
//key as needed

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

copyChunks();
