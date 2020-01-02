/* @flow */
// this scripts converts the old 64x64 chunks that were organiced relative to the center to 256x256 chunks with 0.0 being top-left corner
// it also goes from 2 pixel per byte to 1 pixel per byte
// old colors are converted to new order

import { TILE_SIZE, CANVAS_SIZE, CANVAS_MIN_XY, CANVAS_MAX_XY } from '../src/core/constants';

import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
//ATTENTION Make suer to set the rdis URLs right!!!
const oldurl = "redis://localhost:6380";
const oldredis = redis.createClient(oldurl, { return_buffers: true });
const newurl = "redis://localhost:6379";
const newredis = redis.createClient(newurl, { return_buffers: true });

const CHUNK_SIZE = 64; //old chunk size
const CHUNKS_IN_BASETILE = TILE_SIZE / CHUNK_SIZE;
const CHUNK_MIN_XY = Math.floor(CANVAS_MIN_XY / CHUNK_SIZE);
const CHUNK_MAX_XY = Math.floor(CANVAS_MAX_XY / CHUNK_SIZE);


import { COLORS_ABGR } from '../src/core/Color';

//-----------------------------
// old colors
const OLD_COLORS_RGB: Uint8Array = new Uint8Array( [
    202, 227, 255, //first color is unset pixel in ocean
    255, 255, 255, //second color is unset pixel on land
    255, 255, 255, //white
    228, 228, 228, //light gray
    136, 136, 136, //dark gray
    78, 78, 78,    //darker gray
    0, 0, 0,       //black
    244, 179, 174, //light pink
    255, 167, 209, //pink
    255, 101, 101, //peach
    229, 0, 0,     //red
    254, 164, 96,  //light brown
    229, 149, 0,   //orange
    160, 106, 66,  //brown
    245, 223, 176, //sand
    229, 217, 0,   //yellow
    148, 224, 68,  //light green
    2, 190, 1,     //green
    0, 101, 19,    //dark green
    202, 227, 255, //sky blue
    0, 211, 221,   //light blue
    0, 131, 199,   //dark blue
    0, 0, 234,     //blue
    25, 25, 115,   //darker blue
    207, 110, 228, //light violette
    130, 0, 128,   //violette
  ]
);
export const OLD_COLORS_ABGR: Uint32Array = new Uint32Array(OLD_COLORS_RGB.length / 3);
let cnt = 0;
for (let index = 0; index < OLD_COLORS_ABGR.length; index += 1) {
  const r = OLD_COLORS_RGB[cnt++];
  const g = OLD_COLORS_RGB[cnt++];
  const b = OLD_COLORS_RGB[cnt++];
  OLD_COLORS_ABGR[index] = (0xFF000000) | (b << 16) | (g << 8) | (r);
}
cnt = null;
//-----------------------------



/*
 * convert new color to old color
 * @param clr Color index of old color
 * @return Color index of new, converted color
 */
function colorConvert(clr: number): number {
  clr = clr & 0x1F; //this removes protections
  if (clr == 2) return 2; //hardcoded exception for 
  if (clr == 19) return 25; //the valid white and ocean blue
  const oldClr = OLD_COLORS_ABGR[clr];
  const newClr = COLORS_ABGR.indexOf(oldClr);
  return newClr;
}

/*
 * Creating new basechunk if new size is a multiple of the old size
 * @param x x coordinates of chunk (in chunk coordinates, not pixel coordinates)
 * @param y y coordinates of chunk (in chunk coordinates, not pixel coordinates)
 */
async function createBasechunkFromMultipleOldChunks(x: number, y: number): Uint8Array {
  const chunkBuffer = new Uint8Array(TILE_SIZE * TILE_SIZE);

  const xabs = x  * CHUNKS_IN_BASETILE + CHUNK_MIN_XY;
  const yabs = y  * CHUNKS_IN_BASETILE + CHUNK_MIN_XY;

  let na = 0;
  for (let dy = 0; dy < CHUNKS_IN_BASETILE; dy += 1) {
    for (let dx = 0; dx < CHUNKS_IN_BASETILE; dx += 1) {
      const smallchunk = await oldredis.getAsync(`chunk:${xabs + dx}:${yabs + dy}`);
      if (!smallchunk) {
        na++;
        continue;
      }
      const chunk = new Uint8Array(smallchunk);
      const chunkOffset = (dx + dy * CHUNKS_IN_BASETILE * CHUNK_SIZE) * CHUNK_SIZE; //offset in pixels
      let pos = 0;
      for (let row = 0; row < CHUNK_SIZE; row += 1) {
        let pixelOffset = (chunkOffset + row * CHUNK_SIZE * CHUNKS_IN_BASETILE);
        const max = pixelOffset + CHUNK_SIZE;
        while (pixelOffset < max) {
          let color = chunk[pos++];
          chunkBuffer[pixelOffset++] = colorConvert(color >> 4);
          chunkBuffer[pixelOffset++] = colorConvert(color & 0x0F);
        }
      }
    }
  }

  if (na != CHUNKS_IN_BASETILE * CHUNKS_IN_BASETILE) {
    const key = `chunk:${x}:${y}`;
    const setNXArgs = [key, Buffer.from(chunkBuffer.buffer).toString('binary')]
    await newredis.sendCommandAsync('SETNX', setNXArgs);
    console.log("Created Chunk ", key, "with", na, "empty chunks");
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


/*
 * Convert redis canvas
 */
async function convert() {
  for (let x = 0; x < CANVAS_SIZE / TILE_SIZE; x++) {
    console.log(x);
    for (let y = 0; y < CANVAS_SIZE / TILE_SIZE; y++) {
      await createBasechunk(x, y);
    }
  }
}

convert();
