/* @flow */
// move chunks to the middle when changing size on moon canvas from 1024 to 4096

import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//ATTENTION Make sure to set the rdis URLs right!!!
const oldurl = "redis://localhost:6380";
const oldredis = redis.createClient(oldurl, { return_buffers: true });
const newurl = "redis://localhost:6379";
const newredis = redis.createClient(newurl, { return_buffers: true });

async function copyChunks() {
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      const oldkey = `ch:1:${x}:${y}`;
      const newkey = `ch:1:${x + 6}:${y + 6}`;
      const chunk = await oldredis.getAsync(oldkey);
      if (chunk) {
        const setNXArgs = [newkey, chunk];
        await oldredis.sendCommandAsync('SET', setNXArgs);
        await oldredis.delAsync(oldkey);
        console.log("Created Chunk ", newkey);
      }
      const chunkl = await newredis.getAsync(oldkey);
      if (chunkl) {
        const setNXArgs = [newkey, chunkl];
        await newredis.sendCommandAsync('SET', setNXArgs);
        await newredis.delAsync(oldkey);
        console.log("Created Chunk ", newkey);
      }
    }
  }
}

copyChunks();
