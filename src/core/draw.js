/* @flow */

import { using } from 'bluebird';

import type { User } from '../data/models';
import { redlock } from '../data/redis';
import { getChunkOfPixel, getOffsetOfPixel } from './utils';
import { broadcastPixel } from '../socket/websockets';
import logger from './logger';
import RedisCanvas from '../data/models/RedisCanvas';
import { registerPixelChange } from './tileserver';
import canvases from '../canvases.json';


/**
 *
 * @param canvasId
 * @param x
 * @param y
 * @param color
 */
export function setPixel(
  canvasId: number,
  x: number,
  y: number,
  color: ColorIndex,
) {
  const canvasSize = canvases[canvasId].size;
  const [i, j] = getChunkOfPixel([x, y], canvasSize);
  const offset = getOffsetOfPixel(x, y, canvasSize);
  RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  broadcastPixel(canvasId, i, j, offset, color);
}

/**
 *
 * @param user
 * @param canvasId
 * @param x
 * @param y
 * @param color
 * @returns {Promise.<Object>}
 */
async function draw(
  user: User,
  canvasId: number,
  x: number,
  y: number,
  color: ColorIndex,
): Promise<Object> {
  if (!({}.hasOwnProperty.call(canvases, canvasId))) {
    return {
      error: 'This canvas does not exist',
      success: false,
    };
  }
  const canvas = canvases[canvasId];

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || y < canvasMinXY ||
      x >= canvasMaxXY || y >= canvasMaxXY) {
    return {
      error: 'Coordinates not withing canvas',
      success: false,
    };
  }

  if (canvas.req) {
    if (user.id === null) {
      return {
        errorTitle: 'Not Logged In',
        error: 'You need to be logged in to use this canvas.',
        success: false,
      };
    }
    // if the canvas has a requirement of totalPixels that the user
    // has to have set
    const totalPixels = await user.getTotalPixels();
    if (totalPixels < canvas.req) {
      return {
        errorTitle: 'Not Yet :(',
        error: `You need to set ${canvas.req} pixels on another canvas first, before you can use this one.`,
        success: false,
      };
    }
  }

  const setColor = await RedisCanvas.getPixel(x, y, canvasId);

  let coolDown = !(setColor & 0x1E) ? canvas.bcd : canvas.pcd;
  if (user.isAdmin()) {
    coolDown = 0.0;
  }

  const now = Date.now();
  let wait = await user.getWait(canvasId);
  if (!wait) wait = now;
  wait += coolDown;
  const waitLeft = wait - now;
  if (waitLeft > canvas.cds) {
    return {
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
      coolDownSeconds: (canvas.cds - waitLeft) / 1000,
    };
  }

  if (setColor & 0x20) {
    logger.info(`${user.ip} tried to set on protected pixel (${x}, ${y})`);
    return {
      errorTitle: 'Pixel Protection',
      error: 'This pixel is protected',
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
    };
  }

  setPixel(canvasId, x, y, color);

  user.setWait(waitLeft, canvasId);
  user.incrementPixelcount();
  return {
    success: true,
    waitSeconds: waitLeft / 1000,
    coolDownSeconds: coolDown / 1000,
  };
}

/**
 * This function is a wrapper for draw. It fixes race condition exploits
 * It permits just placing one pixel at a time per user.
 *
 * @param user
 * @param canvasId
 * @param x
 * @param y
 * @param color
 * @returns {Promise.<boolean>}
 */
function drawSafe(
  user: User,
  canvasId: number,
  x: number,
  y: number,
  color: ColorIndex,
): Promise<Cell> {
  if (user.isAdmin()) {
    return draw(user, canvasId, x, y, color);
  }

  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(
      redlock.disposer(`locks:${userId}`, 5000, logger.error),
      async () => {
        const ret = await draw(user, canvasId, x, y, color);
        resolve(ret);
      },
    ); // <-- unlock is automatically handled by bluebird
  });
}


export const drawUnsafe = draw;

export default drawSafe;
