/**
 *
 * Outputs binary chunk directly from redis
 *
 * @flow
 */

import type { Request, Response } from 'express';
import etag from 'etag';
import RedisCanvas from '../data/models/RedisCanvas';
import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  THREE_CANVAS_HEIGHT,
} from '../core/constants';
import logger from '../core/logger';

/*
 * Send binary chunk to the client
 */
export default async (req: Request, res: Response, next) => {
  const {
    c: paramC,
    x: paramX,
    y: paramY,
    z: paramZ,
  } = req.params;
  const c = parseInt(paramC, 10);
  const x = parseInt(paramX, 10);
  const y = parseInt(paramY, 10);
  const z = (paramZ) ? parseInt(paramZ, 10) : null;
  try {
    // botters where using cachebreakers to update via chunk API
    // lets not allow that for now
    if (Object.keys(req.query).length !== 0) {
      res.status(400).end();
      return;
    }

    // z is in preeration for 3d chunks that are also
    // divided in height, which is not used yet
    // - this is not used and probably won't ever be used
    const chunk = await RedisCanvas.getChunk(c, x, y, z);

    res.set({
      'Cache-Control': `public, s-maxage=${60}, max-age=${50}`, // seconds
      'Content-Type': 'application/octet-stream',
    });

    if (!chunk) {
      res.status(200).end();
      return;
    }

    // for temporary logging to see if we have invalid chunks in redis

    if (chunk.length !== TILE_SIZE * TILE_SIZE
      && chunk.length !== (THREE_TILE_SIZE ** 2) * THREE_CANVAS_HEIGHT) {
      logger.error(`Chunk ${x},${y}/${c} has invalid length ${chunk.length}!`);
    }

    const curEtag = etag(chunk, { weak: true });
    res.set({
      ETag: curEtag,
    });
    const preEtag = req.headers['if-none-match'];
    if (preEtag === curEtag) {
      res.status(304).end();
      return;
    }

    res.end(chunk, 'binary');
  } catch (error) {
    next(error);
  }
};

export const templateChunks = async (req: Request, res: Response, next) => {
  const { c: paramC, x: paramX, y: paramY } = req.params;
  const c = parseInt(paramC, 10);
  const x = parseInt(paramX, 10);
  const y = parseInt(paramY, 10);
  try {
    // botters where using cachebreakers to update via chunk API
    // lets not allow that for now
    if (Object.keys(req.query).length !== 0) {
      res.status(400).end();
      return;
    }

    const templateChunk = await RedisCanvas.getTemplateChunk(x, y, c);

    res.set({
      'Cache-Control': `public, s-maxage=${60}, max-age=${50}`, // seconds
      'Content-Type': 'application/octet-stream',
    });

    if (!templateChunk) {
      res.status(200).end();
      return;
    }

    // for temporary logging to see if we have invalid chunks in redis
    if (templateChunk.length !== TILE_SIZE * TILE_SIZE) {
      logger.error(
        `Chunk ${x},${y} in template ${c} has invalid length ${templateChunk.length}!`,
      );
    }

    const curEtag = etag(templateChunk, { weak: true });
    res.set({
      ETag: curEtag,
    });
    const preEtag = req.headers['if-none-match'];
    if (preEtag === curEtag) {
      res.status(304).end();
      return;
    }

    res.end(templateChunk, 'binary');
  } catch (error) {
    next(error);
  }
};
