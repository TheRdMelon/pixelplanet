/**
 *
 * Serve zoomlevel tiles
 *
 * @flow
 */

import express from 'express';
import type { Request, Response } from 'express';
import { TILE_FOLDER } from '../core/config';
import { HOUR } from '../core/constants';
// import sharp from 'sharp';
// import { TILE_SIZE, HOUR } from '../core/constants';
// import RedisCanvas from '../data/models/RedisCanvas';

const router = express.Router();

/*
 * send chunk, but as png
 * This might be handy in the future if we decide to
 * provide more zoomlevels to support GoogleMaps / OSM APIs
async function basetile(req: Request, res: Response, next) {
  const { c: paramC, x: paramX, y: paramY } = req.params;
  const x = parseInt(paramX, 10);
  const y = parseInt(paramY, 10);
  try {
    let tile = await RedisCanvas.getChunk(c, x, y);

    res.set({
      'Cache-Control': `public, s-maxage=${5 * 60}, max-age=${3 * 60}`, // seconds
    });

    if (!tile) {
      res.status(200).end();
      return;
    }

    //note that we have to initialize the palette somewhere, if we decide to use it
    const tileRGB = palette.buffer2RGB(tile);
    tile = null;
    const tilePng = await sharp(Buffer.from(tileRGB.buffer), { raw: { width: TILE_SIZE, height: TILE_SIZE, channels: 3 } })
      .png({ options: { compressionLevel: 0, palette: true, quality: 16, colors: 16, dither: 0.0 } })
      .toBuffer();
    res.set({
      'Content-Type': 'image/png',
    });

    res.status(200).send(tilePng);
  } catch (error) {
    next(error);
  }
}


// get basetiles from redis
// note that MAX_TILED_ZOOM is not an available constant anymore, sinze different
// canvases can have different sizes. If this should be reenabled, you have to find another
// solution for that here.
router.get(`/:c([a-z]+)/${MAX_TILED_ZOOM}/:x([0-9]+)/:y(-?[0-9]+).png`, basetile);
*/

/*
 * get other tiles from directory
 */
router.use(
  '/',
  express.static(TILE_FOLDER, {
    maxAge: 2 * HOUR,
  }),
);

router.use(
  '/templates/:c([0-9]+)/:z([0-9]+)/:x([0-9]+)/:y([0-9]+).png',
  async (req: Request, res: Response) => {
    const { c: paramC } = req.params;
    const c = parseInt(paramC, 10);
    res.set({
      'Cache-Control': `public, s-maxage=${2 * 60 * 60}, max-age=${1
        * 60
        * 60}`,
      'Content-Type': 'image/png',
    });
    res.status(200);
    res.sendFile(`${TILE_FOLDER}/${c}/emptytile.png`);
  },
);

/*
 * catch File Not Found: Send empty tile
 */
router.use(
  '/:c([0-9]+)/:z([0-9]+)/:x([0-9]+)/:y([0-9]+).png',
  async (req: Request, res: Response) => {
    const { c: paramC } = req.params;
    const c = parseInt(paramC, 10);
    res.set({
      'Cache-Control': `public, s-maxage=${2 * 3600}, max-age=${1 * 3600}`,
      'Content-Type': 'image/png',
    });
    res.status(200);
    res.sendFile(`${TILE_FOLDER}/${c}/emptytile.png`);
  },
);

export default router;
