/*
 * Offer functions for Canvas backups
 *
 * @flow
 */

/* eslint-disable no-console */

import sharp from 'sharp';
import fs from 'fs';
import Palette from './Palette';

import { TILE_SIZE } from './constants';


/*
 * Copy canvases from one redis instance to another
 * @param canvasRedis redis from where to get the data
 * @param backupRedis redis where to write the data to
 * @param canvases Object with all canvas informations
 */
export async function updateBackupRedis(canvasRedis, backupRedis, canvases) {
  const ids = Object.keys(canvases);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const canvas = canvases[id];
    if (canvas.v) {
      // ignore 3D canvases
      continue;
    }
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Copy Chunks to backup redis...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;
        /*
         * await on every iteration is fine because less resource usage
         * in exchange for higher execution time is wanted.
         */
        // eslint-disable-next-line no-await-in-loop
        const chunk = await canvasRedis.getAsync(key);
        if (chunk) {
          const setNXArgs = [key, chunk];
          // eslint-disable-next-line no-await-in-loop
          await backupRedis.sendCommandAsync('SET', setNXArgs);
          amount += 1;
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(`Finished Copying ${amount} chunks in ${time}ms.`);
  }
}


/*
 * Create incremential PNG tile backup between two redis canvases
 * @param canvasRedis redis from where to get the data
 * @param backupRedis redis where to write the data to
 * @param canvases Object with all canvas informations
 */
export async function incrementialBackupRedis(
  canvasRedis,
  backupRedis,
  canvases,
  backupDir: string,
) {
  const ids = Object.keys(canvases);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];

    const canvas = canvases[id];
    if (canvas.v) {
      // ignore 3D canvases
      continue;
    }

    const canvasBackupDir = `${backupDir}/${id}`;
    if (!fs.existsSync(canvasBackupDir)) {
      fs.mkdirSync(canvasBackupDir);
    }
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    const canvasTileBackupDir = `${canvasBackupDir}/${hours}${minutes}`;
    console.log(`Using folder ${canvasTileBackupDir}`);
    if (!fs.existsSync(canvasTileBackupDir)) {
      fs.mkdirSync(canvasTileBackupDir);
    }

    const palette = new Palette(canvas.colors);
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Creating Incremential Backup...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      const xBackupDir = `${canvasTileBackupDir}/${x}`;
      let createdDir = false;

      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;
        /*
         * await on every iteration is fine because less resource usage
         * in exchange for higher execution time is wanted.
         */
        // eslint-disable-next-line no-await-in-loop
        const curChunk = await canvasRedis.getAsync(key);
        let tileBuffer = null;
        if (curChunk) {
          // eslint-disable-next-line no-await-in-loop
          const oldChunk = await backupRedis.getAsync(key);
          if (oldChunk) {
            let pxl = 0;
            while (pxl < curChunk.length) {
              if (curChunk[pxl] !== oldChunk[pxl]) {
                if (!tileBuffer) {
                  tileBuffer = new Uint32Array(TILE_SIZE * TILE_SIZE);
                }
                const color = palette.abgr[curChunk[pxl] & 0x3F];
                tileBuffer[pxl] = color;
              }
              pxl += 1;
            }
          } else {
            tileBuffer = palette.buffer2ABGR(curChunk);
          }
        }
        if (tileBuffer) {
          if (!createdDir && !fs.existsSync(xBackupDir)) {
            createdDir = true;
            fs.mkdirSync(xBackupDir);
          }
          const filename = `${xBackupDir}/${y}.png`;
          // eslint-disable-next-line no-await-in-loop
          await sharp(
            Buffer.from(tileBuffer.buffer), {
              raw: {
                width: TILE_SIZE,
                height: TILE_SIZE,
                channels: 4,
              },
            },
          ).toFile(filename);
          amount += 1;
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(
      `Finished Incremential backup of ${amount} chunks in ${time}ms.`,
    );
  }
}


/*
 * Backup all tiles as PNG files into folder
 * @param redisClient RedisClient
 * @param canvases Object with the informations to all canvases
 * @param backupDir directory where to save png tiles
 */
export async function createPngBackup(
  redisClient: Object,
  canvases: Object,
  backupDir: string,
) {
  const ids = Object.keys(canvases);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];

    const canvasBackupDir = `${backupDir}/${id}`;
    if (!fs.existsSync(canvasBackupDir)) {
      fs.mkdirSync(canvasBackupDir);
    }
    const canvasTileBackupDir = `${canvasBackupDir}/tiles`;
    if (!fs.existsSync(canvasTileBackupDir)) {
      fs.mkdirSync(canvasTileBackupDir);
    }

    const canvas = canvases[id];
    const palette = new Palette(canvas.colors);
    const chunksXY = (canvas.size / TILE_SIZE);
    console.log('Create PNG tiles from backup...');
    const startTime = Date.now();
    let amount = 0;
    for (let x = 0; x < chunksXY; x++) {
      const xBackupDir = `${canvasTileBackupDir}/${x}`;
      if (!fs.existsSync(xBackupDir)) {
        fs.mkdirSync(xBackupDir);
      }
      for (let y = 0; y < chunksXY; y++) {
        const key = `ch:${id}:${x}:${y}`;
        /*
         * await on every iteration is fine because less resource usage
         * in exchange for higher execution time is wanted.
         */
        // eslint-disable-next-line no-await-in-loop
        const chunk = await redisClient.getAsync(key);
        if (chunk) {
          const textureBuffer = palette.buffer2RGB(chunk);
          const filename = `${xBackupDir}/${y}.png`;
          // eslint-disable-next-line no-await-in-loop
          await sharp(
            Buffer.from(textureBuffer.buffer), {
              raw: {
                width: TILE_SIZE,
                height: TILE_SIZE,
                channels: 3,
              },
            },
          ).toFile(filename);
          amount += 1;
        }
      }
    }
    const time = Date.now() - startTime;
    console.log(
      `Finished creating PNG backup of ${amount} chunks in ${time}ms.`,
    );
  }
}
