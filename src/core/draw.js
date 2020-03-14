/* @flow */

import { using } from 'bluebird';

import type { User } from '../data/models';
import { redlock } from '../data/redis';
import { getChunkOfPixel, getOffsetOfPixel } from './utils';
import webSockets from '../socket/websockets';
import logger from './logger';
import RedisCanvas from '../data/models/RedisCanvas';
import canvases from '../canvases.json';

import { THREE_CANVAS_HEIGHT } from './constants';

/**
 *
 * @param canvasId
 * @param x
 * @param y
 * @param color
 */
export function setPixel(
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
) {
  const canvasSize = canvases[canvasId].size;
  const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
  const offset = getOffsetOfPixel(canvasSize, x, y, z);
  RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  webSockets.broadcastPixel(canvasId, i, j, offset, color);
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
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
): Promise<Object> {
  if (!{}.hasOwnProperty.call(canvases, canvasId)) {
    return {
      error: 'This canvas does not exist',
      success: false,
    };
  }
  const canvas = canvases[canvasId];

  const canvasMaxXY = canvas.size / 2;
  const canvasMinXY = -canvasMaxXY;
  if (x < canvasMinXY || x >= canvasMaxXY) {
    return {
      error: 'x Coordinate not within canvas',
      success: false,
    };
  }
  if (canvas.v) {
    if (z < canvasMinXY || z >= canvasMaxXY) {
      return {
        error: 'z Coordinate not within canvas',
        success: false,
      };
    }
    if (y >= THREE_CANVAS_HEIGHT) {
      return {
        error: "You reached build limit. Can't place higher than 128 blocks.",
        success: false,
      };
    }
    if (y < 0) {
      return {
        error: "Can't place on y < 0",
        success: false,
      };
    }
    if (z === null) {
      return {
        error: 'This is a 3D canvas. z is required.',
        success: false,
      };
    }
  } else {
    if (y < canvasMinXY || y >= canvasMaxXY) {
      return {
        error: 'y Coordinate not within canvas',
        success: false,
      };
    }
    if (color < canvas.cli) {
      return {
        error: 'Invalid color selected',
        success: false,
      };
    }
    if (z !== null) {
      if (!canvas.v) {
        return {
          error: 'This is not a 3D canvas',
          success: false,
        };
      }
    }
  }

  if (color < 0 || color >= canvas.colors.length) {
    return {
      error: 'Invalid color selected',
      success: false,
    };
  }

  if (canvas.req !== -1) {
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
        // eslint-disable-next-line max-len
        error: `You need to set ${canvas.req} pixels on another canvas first, before you can use this one.`,
        success: false,
      };
    }
  }

  const setColor = await RedisCanvas.getPixel(canvasId, x, y, z);

  let coolDown = (setColor & 0x3f) < canvas.cli ? canvas.bcd : canvas.pcd;
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

  if (setColor & 0x80) {
    logger.info(`${user.ip} tried to set on protected pixel (${x}, ${y})`);
    return {
      errorTitle: 'Pixel Protection',
      error: 'This pixel is protected',
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
    };
  }

  setPixel(canvasId, color, x, y, z);

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
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
): Promise<Cell> {
  if (user.isAdmin()) {
    return draw(user, canvasId, color, x, y, z);
  }

  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(redlock.disposer(`locks:${userId}`, 5000, logger.error), async () => {
      const ret = await draw(user, canvasId, color, x, y, z);
      resolve(ret);
    }); // <-- unlock is automatically handled by bluebird
  });
}

export const drawUnsafe = draw;

export default drawSafe;
