/* @flow */

import { using } from 'bluebird';

import type { User } from '../data/models';
import { redlock } from '../data/redis';
import {
  getChunkOfPixel,
  getOffsetOfPixel,
  getPixelFromChunkOffset,
} from './utils';
import webSockets from '../socket/websockets';
import logger, { pixelLogger } from './logger';
import RedisCanvas from '../data/models/RedisCanvas';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';

import { THREE_CANVAS_HEIGHT, THREE_TILE_SIZE, TILE_SIZE } from './constants';


/**
 *
 * @param canvasId
 * @param canvasId
 * @param color
 * @param x
 * @param y
 * @param z optional, if given its 3d canvas
 */
export function setPixelByCoords(
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
 * By Offset is prefered on server side
 * @param canvasId
 * @param i Chunk coordinates
 * @param j
 * @param offset Offset of pixel withing chunk
 */
export function setPixelByOffset(
  canvasId: number,
  color: ColorIndex,
  i: number,
  j: number,
  offset: number,
) {
  RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  webSockets.broadcastPixel(canvasId, i, j, offset, color);
}

/**
 *
 * By Offset is prefered on server side
 * This gets used by websocket pixel placing requests
 * @param user user that can be registered, but doesn't have to
 * @param canvasId
 * @param i Chunk coordinates
 * @param j
 * @param offset Offset of pixel withing chunk
 */
export async function drawByOffset(
  user: User,
  canvasId: number,
  color: ColorIndex,
  i: number,
  j: number,
  offset: number,
): Promise<Object> {
  let wait = 0;
  let coolDown = 0;
  let retCode = 0;

  logger.info(`Got request for ${canvasId} ${i} ${j} ${offset} ${color}`);

  const canvas = canvases[canvasId];
  if (!canvas) {
    // canvas doesn't exist
    return {
      wait,
      coolDown,
      retCode: 1,
    };
  }
  const { size: canvasSize, v: is3d } = canvas;

  try {
    const tileSize = (is3d) ? THREE_TILE_SIZE : TILE_SIZE;
    if (i >= canvasSize / tileSize) {
      // x out of bounds
      throw new Error(2);
    }
    if (j >= canvasSize / tileSize) {
      // y out of bounds
      throw new Error(3);
    }
    const maxSize = (is3d) ? tileSize * tileSize * THREE_CANVAS_HEIGHT
      : tileSize * tileSize;
    if (offset >= maxSize) {
      // z out of bounds or weird stuff
      throw new Error(4);
    }
    if (color >= canvas.colors.length) {
      // color out of bounds
      throw new Error(5);
    }

    if (canvas.req !== -1) {
      if (user.id === null) {
        // not logged in
        throw new Error(6);
      }
      const totalPixels = await user.getTotalPixels();
      if (totalPixels < canvas.req) {
        // not enough pixels placed yet
        throw new Error(7);
      }
    }

    const setColor = await RedisCanvas.getPixelByOffset(canvasId, i, j, offset);
    if (setColor & 0x80
      /* 3D Canvas Minecraft Avatars */
      // && x >= 96 && x <= 128 && z >= 35 && z <= 100
      // 96 - 128 on x
      // 32 - 128 on z
      || (canvas.v && i === 19 && j >= 17 && j < 20 && !user.isAdmin())
    ) {
      // protected pixel
      throw new Error(8);
    }

    coolDown = (setColor & 0x3F) < canvas.cli ? canvas.bcd : canvas.pcd;
    if (user.isAdmin()) {
      coolDown = 0.0;
    }

    const now = Date.now();
    wait = await user.getWait(canvasId);
    if (!wait) wait = now;
    wait += coolDown;
    const waitLeft = wait - now;
    if (waitLeft > canvas.cds) {
      // cooldown stack used
      wait = waitLeft - coolDown;
      coolDown = canvas.cds - waitLeft;
      throw new Error(9);
    }

    setPixelByOffset(canvasId, color, i, j, offset);

    user.setWait(waitLeft, canvasId);
    if (canvas.ranked) {
      user.incrementPixelcount();
    }
    wait = waitLeft;
  } catch (e) {
    retCode = parseInt(e.message, 10);
    if (Number.isNaN(retCode)) {
      throw e;
    }
  }

  const [x, y, z] = getPixelFromChunkOffset(i, j, offset, canvasSize, is3d);
  // eslint-disable-next-line max-len
  pixelLogger.info(`${user.ip} ${user.id} ${canvasId} ${x} ${y} ${z} ${color} ${retCode}`);

  return {
    wait,
    coolDown,
    retCode,
  };
}


/**
 *
 * Old version of draw that returns explicit error messages
 * used for http json api/pixel, used with coordinates
 * @param user
 * @param canvasId
 * @param x
 * @param y
 * @param color
 * @returns {Promise.<Object>}
 */
export async function drawByCoords(
  user: User,
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
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
        error: 'You reached build limit. Can\'t place higher than 128 blocks.',
        success: false,
      };
    }
    if (y < 0) {
      return {
        error: 'Can\'t place on y < 0',
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

  let coolDown = (setColor & 0x3F) < canvas.cli ? canvas.bcd : canvas.pcd;
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

  if (setColor & 0x80
    || (canvas.v
      && x >= 96 && x <= 128 && z >= 35 && z <= 100
      && !user.isAdmin())
  ) {
    logger.info(`${user.ip} tried to set on protected pixel (${x}, ${y})`);
    return {
      errorTitle: 'Pixel Protection',
      error: 'This pixel is protected',
      success: false,
      waitSeconds: (waitLeft - coolDown) / 1000,
    };
  }

  setPixelByCoords(canvasId, color, x, y, z);

  user.setWait(waitLeft, canvasId);
  if (canvas.ranked) {
    user.incrementPixelcount();
  }
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
 * @param color
 * @param x
 * @param y
 * @param z (optional for 3d canvas)
 * @returns {Promise.<boolean>}
 */
export function drawSafeByCoords(
  user: User,
  canvasId: number,
  color: ColorIndex,
  x: number,
  y: number,
  z: number = null,
): Promise<Cell> {
  if (user.isAdmin()) {
    return drawByCoords(user, canvasId, color, x, y, z);
  }

  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(
      redlock.disposer(`locks:${userId}`, 5000, logger.error),
      async () => {
        const ret = await drawByCoords(user, canvasId, color, x, y, z);
        resolve(ret);
      },
    ); // <-- unlock is automatically handled by bluebird
  });
}


/**
 * This function is a wrapper for draw. It fixes race condition exploits
 * It permits just placing one pixel at a time per user.
 *
 * @param user
 * @param canvasId
 * @param color
 * @param i Chunk coordinates
 * @param j
 * @param offset Offset of pixel withing chunk
 * @returns {Promise.<boolean>}
 */
export function drawSafeByOffset(
  user: User,
  canvasId: number,
  color: ColorIndex,
  i: number,
  j: number,
  offset: number,
): Promise<Cell> {
  if (user.isAdmin()) {
    return drawByOffset(user, canvasId, color, i, j, offset);
  }

  // can just check for one unique occurence,
  // we use ip, because id for logged out users is
  // always null
  const userId = user.ip;

  return new Promise((resolve) => {
    using(
      redlock.disposer(`locks:${userId}`, 5000, logger.error),
      async () => {
        const ret = await drawByOffset(user, canvasId, color, i, j, offset);
        resolve(ret);
      },
    ); // <-- unlock is automatically handled by bluebird
  });
}
