/* @flow
 *
 * functions to deal with images
 *
 */

import RedisCanvas from '../data/models/RedisCanvas';
import logger from './logger';
import { getChunkOfPixel } from './utils';
import { TILE_SIZE } from './constants';
import canvases from '../canvases.json';
import Palette from './Palette';


/*
 * Load iamge from ABGR buffer onto canvas
 * (be aware that tis function does no validation of arguments)
 * @param canvadIs numerical ID of canvas
 * @param x X coordinate on canvas
 * @param y Y coordinate on canvas
 * @param data buffer of image in ABGR format
 * @param width Width of image
 * @param height height of image
 */
export async function imageABGR2Canvas(
  canvasId: number,
  x: number,
  y: number,
  data: Buffer,
  width: number,
  height: number,
  wipe?: boolean,
  protect?: boolean,
) {
  logger.info(
    `Loading image with dim ${width}/${height} to ${x}/${y}/${canvasId}`,
  );
  const canvas = canvases[canvasId];
  const palette = new Palette(canvas.colors, canvas.alpha);
  const canvasMinXY = -(canvas.size / 2);
  const imageData = new Uint32Array(data.buffer);

  const [ucx, ucy] = getChunkOfPixel([x, y], canvas.size);
  const [lcx, lcy] = getChunkOfPixel([(x + width), (y + height)], canvas.size);

  logger.info(`Loading to chunks from ${ucx} / ${ucy} to ${lcx} / ${lcy} ...`);
  let chunk;
  for (let cx = ucx; cx <= lcx; cx += 1) {
    for (let cy = ucy; cy <= lcy; cy += 1) {
      chunk = await RedisCanvas.getChunk(cx, cy);
      chunk = (chunk) ? new Uint8Array(chunk) : new Uint8Array(TILE_SIZE * TILE_SIZE);
      // offset of chunk in image
      const cOffX = cx * TILE_SIZE + canvasMinXY - x;
      const cOffY = cy * TILE_SIZE + canvasMinXY - y;
      let cOff = 0;
      let pxlCnt = 0;
      for (let py = 0; py < TILE_SIZE; py += 1) {
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const clrX = cOffX + px;
          const clrY = cOffY + py;
          if (clrX >= 0 && clrY >= 0 && clrX < width && clrY < height) {
            const clr = imageData[clrX + clrY * width];
            const clrIndex = (wipe) ? palette.abgr.indexOf(clr) : palette.abgr.indexOf(clr, 2);
            if (~clrIndex) {
              const pixel = (protect) ? (clrIndex | 0x20) : clrIndex;
              chunk[cOff] = pixel;
              pxlCnt += 1;
            }
          }
          cOff += 1;
        }
      }
      if (pxlCnt) {
        const ret = await RedisCanvas.setChunk(cx, cy, chunk, canvasId);
        if (ret) {
          logger.info(`Loaded ${pxlCnt} pixels into chunk ${cx}, ${cy}.`);
        }
      }
      chunk = null;
    }
  }
  logger.info('Image loading done.');
}


/*
 * Load iamgemask from ABGR buffer and execute function for each black pixel
 * (be aware that tis function does no validation of arguments)
 * @param canvadIs numerical ID of canvas
 * @param x X coordinate on canvas
 * @param y Y coordinate on canvas
 * @param data buffer of image in ABGR format
 * @param width Width of image
 * @param height height of image
 * @param filter function that defines what happens to the pixel that matches,
 *               it will be called with the pixelcolor as argument, its return value gets set
 */
export async function imagemask2Canvas(
  canvasId: number,
  x: number,
  y: number,
  data: Buffer,
  width: number,
  height: number,
  filter,
) {
  logger.info(
    `Loading mask with size ${width} / ${height} to ${x} / ${y} to the canvas`,
  );
  const canvas = canvases[canvasId];
  const palette = new Palette(canvas.colors, canvas.alpha);
  const canvasMinXY = -(canvas.size / 2);

  const imageData = new Uint8Array(data.buffer);

  const [ucx, ucy] = getChunkOfPixel([x, y], canvas.size);
  const [lcx, lcy] = getChunkOfPixel([(x + width), (y + height)], canvas.size);

  logger.info(`Loading to chunks from ${ucx} / ${ucy} to ${lcx} / ${lcy} ...`);
  let chunk;
  for (let cx = ucx; cx <= lcx; cx += 1) {
    for (let cy = ucy; cy <= lcy; cy += 1) {
      chunk = await RedisCanvas.getChunk(cx, cy);
      chunk = (chunk) ? new Uint8Array(chunk) : new Uint8Array(TILE_SIZE * TILE_SIZE);
      // offset of chunk in image
      const cOffX = cx * TILE_SIZE + canvasMinXY - x;
      const cOffY = cy * TILE_SIZE + canvasMinXY - y;
      let cOff = 0;
      let pxlCnt = 0;
      for (let py = 0; py < TILE_SIZE; py += 1) {
        for (let px = 0; px < TILE_SIZE; px += 1) {
          const clrX = cOffX + px;
          const clrY = cOffY + py;
          if (clrX >= 0 && clrY >= 0 && clrX < width && clrY < height) {
            let offset = (clrX + clrY * width) * 3;
            if (!imageData[offset++] && !imageData[offset++] && !imageData[offset]) {
              chunk[cOff] = filter(palette.abgr[chunk[cOff]]);
              pxlCnt += 1;
            }
          }
          cOff += 1;
        }
      }
      if (pxlCnt) {
        const ret = await RedisCanvas.setChunk(cx, cy, chunk);
        if (ret) {
          logger.info(`Loaded ${pxlCnt} pixels into chunk ${cx}, ${cy}.`);
        }
      }
      chunk = null;
    }
  }
  logger.info('Imagemask loading done.');
}

