/**
 *
 * Outputs binary chunk directly from redis
 *
 * @flow
 */

import type { Request, Response } from 'express';
import etag from 'etag';
import RedisCanvas from '../data/models/RedisCanvas';
import { TILE_SIZE } from '../core/constants';
import logger from '../core/logger';

/*
 * Send binary chunk to the client
 */
export default async (req: Request, res: Response, next) => {
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

    const chunk = await RedisCanvas.getChunk(x, y, c);

    res.set({
      'Cache-Control': `public, s-maxage=${60}, max-age=${50}`, // seconds
      'Content-Type': 'application/octet-stream',
    });

    if (!chunk) {
      res.status(200).end();
      return;
    }

    // for temporary logging to see if we have invalid chunks in redis
    if (chunk.length !== TILE_SIZE * TILE_SIZE) {
      logger.error(`Chunk ${x},${y} has invalid length ${chunk.length}!`);
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
