/*
 * * basic functions for creating zommed tiles
 *
 * @flow
 * */

import sharp from 'sharp';
import fs from 'fs';

import type { Cell } from './Cell';
import type { Palette } from './Palette';
import logger from './logger';
import { getMaxTiledZoom } from './utils';
import { TILE_SIZE, TILE_ZOOM_LEVEL } from './constants';

/*
 * Deletes a subtile from a tile (paints it in color 0), if we wouldn't do it, it would be black
 * @param palette Palette to use
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param buffer Uint8Array for RGB values of tile
 */
function deleteSubtilefromTile(
  palette: Palette,
  subtilesInTile: number,
  cell: Cell,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const offset = (dx + dy * TILE_SIZE * subtilesInTile) * TILE_SIZE;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (offset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      buffer[channelOffset++] = palette.rgb[0];
      buffer[channelOffset++] = palette.rgb[1];
      buffer[channelOffset++] = palette.rgb[2];
    }
  }
}

/*
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param subtile RGB buffer of subtile
 * @param buffer Uint8Array for RGB values of tile
 */
function addRGBSubtiletoTile(
  subtilesInTile: number,
  cell: Cell,
  subtile: Buffer,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const chunkOffset = (dx + dy * subtilesInTile * TILE_SIZE) * TILE_SIZE; // offset in pixels
  let pos: number = 0;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (chunkOffset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      buffer[channelOffset++] = subtile[pos++];
      buffer[channelOffset++] = subtile[pos++];
      buffer[channelOffset++] = subtile[pos++];
    }
  }
}

/*
 * @param palette Palette to use
 * @param subtilesInTile how many subtiles are in a tile (per dimension)
 * @param cell subtile to delete [dx, dy]
 * @param subtile RGB buffer of subtile
 * @param buffer RGB Buffer of tile
 */
function addIndexedSubtiletoTile(
  palette: Palette,
  subtilesInTile: number,
  cell: Cell,
  subtile: Buffer,
  buffer: Uint8Array,
) {
  const [dx, dy] = cell;
  const chunkOffset = (dx + dy * subtilesInTile * TILE_SIZE) * TILE_SIZE; // offset in pixels
  let pos: number = 0;
  let clr: number;
  for (let row = 0; row < TILE_SIZE; row += 1) {
    let channelOffset = (chunkOffset + row * TILE_SIZE * subtilesInTile) * 3;
    const max = channelOffset + TILE_SIZE * 3;
    while (channelOffset < max) {
      clr = (subtile[pos++] & 0x3F) * 3;
      buffer[channelOffset++] = palette.rgb[clr++];
      buffer[channelOffset++] = palette.rgb[clr++];
      buffer[channelOffset++] = palette.rgb[clr];
    }
  }
}

/*
 * @param canvasTileFolder root folder where to save tiles
 * @param cell tile [z, x, y]
 * @return filename of tile
 */
function tileFileName(canvasTileFolder: string, cell: Cell): string {
  const [z, x, y] = cell;
  const filename = `${canvasTileFolder}/${z}/${x}/${y}.png`;
  return filename;
}

/*
 * @param canvasSize dimension of the canvas (pixels width/height)
 * @param redisCanvas Redis Canvas object
 * @param canvasId id of the canvas
 * @param canvasTileFolder root folder where to save tiles
 * @param palette Palette to use
 * @param cell tile to create [x, y]
 * @return true if successfully created tile, false if tile empty
 */
export async function createZoomTileFromChunk(
  redisCanvas: Object,
  canvasSize: number,
  canvasId: number,
  canvasTileFolder: string,
  palette: Palette,
  cell: Cell,
): boolean {
  const [x, y] = cell;
  const maxTiledZoom = getMaxTiledZoom(canvasSize);
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL * 3,
  );

  const xabs = x * TILE_ZOOM_LEVEL;
  const yabs = y * TILE_ZOOM_LEVEL;
  const na = [];
  let chunk = null;
  for (let dy = 0; dy < TILE_ZOOM_LEVEL; dy += 1) {
    for (let dx = 0; dx < TILE_ZOOM_LEVEL; dx += 1) {
      chunk = await redisCanvas.getChunk(canvasId, xabs + dx, yabs + dy);
      if (!chunk) {
        na.push([dx, dy]);
        continue;
      }
      addIndexedSubtiletoTile(
        palette,
        TILE_ZOOM_LEVEL,
        [dx, dy],
        chunk,
        tileRGBBuffer,
      );
    }
  }
  chunk = null;

  if (na.length !== TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL) {
    na.forEach((element) => {
      deleteSubtilefromTile(palette, TILE_ZOOM_LEVEL, element, tileRGBBuffer);
    });

    const filename = tileFileName(canvasTileFolder, [maxTiledZoom - 1, x, y]);
    await sharp(Buffer.from(tileRGBBuffer.buffer), {
      raw: {
        width: TILE_SIZE * TILE_ZOOM_LEVEL,
        height: TILE_SIZE * TILE_ZOOM_LEVEL,
        channels: 3,
      },
    })
      .resize(TILE_SIZE)
      .png({ options: { compressionLevel: 6 } })
      .toFile(filename);
    logger.info(
      `Tiling: Created Tile ${filename} with ${na.length} empty chunks`,
    );
    return true;
  }
  return false;
}

/*
 * @param canvasTileFolder root folder where to save tiles
 * @param palette Palette to use
 * @param cell tile to create [z, x, y]
 * @return trie if successfully created tile, false if tile empty
 */
export async function createZoomedTile(
  canvasTileFolder: string,
  palette: Palette,
  cell: Cell,
): boolean {
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL * 3,
  );
  const [z, x, y] = cell;

  const na = [];
  for (let dy = 0; dy < TILE_ZOOM_LEVEL; dy += 1) {
    for (let dx = 0; dx < TILE_ZOOM_LEVEL; dx += 1) {
      const chunkfile = `${canvasTileFolder}/${z + 1}/${x * TILE_ZOOM_LEVEL + dx}/${y * TILE_ZOOM_LEVEL + dy}.png`;
      if (!fs.existsSync(chunkfile)) {
        na.push([dx, dy]);
        continue;
      }
      const chunk = await sharp(chunkfile).removeAlpha().raw().toBuffer();
      addRGBSubtiletoTile(TILE_ZOOM_LEVEL, [dx, dy], chunk, tileRGBBuffer);
    }
  }

  if (na.length !== TILE_ZOOM_LEVEL * TILE_ZOOM_LEVEL) {
    na.forEach((element) => {
      deleteSubtilefromTile(palette, TILE_ZOOM_LEVEL, element, tileRGBBuffer);
    });

    const filename = tileFileName(canvasTileFolder, [z, x, y]);
    await sharp(
      Buffer.from(
        tileRGBBuffer.buffer,
      ), {
        raw: {
          width: TILE_SIZE * TILE_ZOOM_LEVEL,
          height: TILE_SIZE * TILE_ZOOM_LEVEL,
          channels: 3,
        },
      },
    ).resize(TILE_SIZE).toFile(filename);
    logger.info(
      `Tiling: Created tile ${filename} with ${na.length} empty subtiles.`,
    );
    return true;
  }
  return false;
}

/*
 * create an empty image tile with just one color
 * @param canvasTileFolder root folder where to save texture
 * @param palette Palette to use
 */
export async function createEmptyTile(
  canvasTileFolder: string,
  palette: Palette,
) {
  const tileRGBBuffer = new Uint8Array(
    TILE_SIZE * TILE_SIZE * 3,
  );
  let i = 0;
  const max = TILE_SIZE * TILE_SIZE * 3;
  while (i < max) {
    tileRGBBuffer[i++] = palette.rgb[0];
    tileRGBBuffer[i++] = palette.rgb[1];
    tileRGBBuffer[i++] = palette.rgb[2];
  }
  const filename = `${canvasTileFolder}/emptytile.png`;
  await sharp(Buffer.from(tileRGBBuffer.buffer), {
    raw: {
      width: TILE_SIZE,
      height: TILE_SIZE,
      channels: 3,
    },
  })
    .png({ options: { compressionLevel: 6 } })
    .toFile(filename);
  logger.info(`Tiling: Created empty tile at ${filename}`);
}

/*
 * created 4096x4096 texture of default canvas
 * @param redisCanvas Redis Canvas object
 * @param canvasId numberical Id of canvas
 * @param canvasSize size of canvas
 * @param canvasTileFolder root folder where to save texture
 * @param palette Palette to use
 *
 */
export async function createTexture(
  redisCanvas: Object,
  canvasId: number,
  canvasSize: numbr,
  canvasTileFolder,
  palette: Palette,
) {
  // dont create textures larger than 4096
  const targetSize = Math.min(canvasSize, 4096);
  const amount = targetSize / TILE_SIZE;
  const zoom = Math.log2(amount) / 2;
  const textureBuffer = new Uint8Array(targetSize * targetSize * 3);
  const timeStart = Date.now();

  const na = [];
  let chunk = null;
  if (targetSize !== canvasSize) {
    for (let dy = 0; dy < amount; dy += 1) {
      for (let dx = 0; dx < amount; dx += 1) {
        const chunkfile = `${canvasTileFolder}/${zoom}/${dx}/${dy}.png`;
        if (!fs.existsSync(chunkfile)) {
          na.push([dx, dy]);
          continue;
        }
        chunk = await sharp(chunkfile).removeAlpha().raw().toBuffer();
        addRGBSubtiletoTile(amount, [dx, dy], chunk, textureBuffer);
      }
    }
  } else {
    for (let dy = 0; dy < amount; dy += 1) {
      for (let dx = 0; dx < amount; dx += 1) {
        chunk = await redisCanvas.getChunk(canvasId, dx, dy);
        if (!chunk) {
          na.push([dx, dy]);
          continue;
        }
        addIndexedSubtiletoTile(
          palette,
          amount,
          [dx, dy],
          chunk,
          textureBuffer,
        );
      }
    }
  }
  chunk = null;

  na.forEach((element) => {
    deleteSubtilefromTile(palette, amount, element, textureBuffer);
  });

  const filename = `${canvasTileFolder}/texture.png`;
  await sharp(
    Buffer.from(textureBuffer.buffer), {
      raw: {
        width: targetSize,
        height: targetSize,
        channels: 3,
      },
    },
  ).toFile(filename);
  logger.info(
    `Tiling: Created texture in ${(Date.now() - timeStart) / 1000}s.`,
  );
}

/*
 * Create all tiles
 * @param redisCanvas Redis Canvas object
 * @param canvasSize dimension of the canvas (pixels width/height)
 * @param canvasId id of the canvas
 * @param canvasTileFolder root foler where to save tiles
 * @param palette Palette of canvas
 * @param force overwrite existing tiles
 */
export async function initializeTiles(
  redisCanvas: Object,
  canvasSize: number,
  canvasId: number,
  canvasTileFolder: string,
  palette: Palette,
  force: boolean = false,
) {
  logger.info(
    `Tiling: Initializing tiles in ${canvasTileFolder}, forceint = ${force}`,
  );
  const startTime = Date.now();
  const maxTiledZoom = getMaxTiledZoom(canvasSize);
  // empty tile
  await createEmptyTile(canvasTileFolder, palette);
  // base zoomlevel
  let zoom = maxTiledZoom - 1;
  let zoomDir = `${canvasTileFolder}/${zoom}`;
  logger.info(`Tiling: Checking zoomlevel ${zoomDir}`);
  if (!fs.existsSync(zoomDir)) fs.mkdirSync(zoomDir);
  let cnt = 0;
  let cnts = 0;
  const maxBase = TILE_ZOOM_LEVEL ** zoom;
  for (let cx = 0; cx < maxBase; cx += 1) {
    const tileDir = `${canvasTileFolder}/${zoom}/${cx}`;
    if (!fs.existsSync(tileDir)) fs.mkdirSync(tileDir);
    for (let cy = 0; cy < maxBase; cy += 1) {
      const filename = `${canvasTileFolder}/${zoom}/${cx}/${cy}.png`;
      if (force || !fs.existsSync(filename)) {
        const ret = await createZoomTileFromChunk(
          redisCanvas,
          canvasSize,
          canvasId,
          canvasTileFolder,
          palette,
          [cx, cy],
        );
        if (ret) cnts += 1;
        cnt += 1;
      }
    }
  }
  logger.info(
    `Tiling: Created ${cnts} / ${cnt} tiles for basezoom of canvas${canvasId}`,
  );
  // zoomlevels that are created from other zoomlevels
  for (zoom = maxTiledZoom - 2; zoom >= 0; zoom -= 1) {
    cnt = 0;
    cnts = 0;
    zoomDir = `${canvasTileFolder}/${zoom}`;
    logger.info(`Tiling: Checking zoomlevel ${zoomDir}`);
    if (!fs.existsSync(zoomDir)) fs.mkdirSync(zoomDir);
    const maxZ = TILE_ZOOM_LEVEL ** zoom;
    for (let cx = 0; cx < maxZ; cx += 1) {
      const tileDir = `${canvasTileFolder}/${zoom}/${cx}`;
      if (!fs.existsSync(tileDir)) fs.mkdirSync(tileDir);
      for (let cy = 0; cy < maxZ; cy += 1) {
        const filename = `${canvasTileFolder}/${zoom}/${cx}/${cy}.png`;
        if (force || !fs.existsSync(filename)) {
          const ret = await createZoomedTile(
            canvasTileFolder,
            palette,
            [zoom, cx, cy],
          );
          if (ret) cnts += 1;
          cnt += 1;
        }
      }
    }
    logger.info(
      `Tiling: Created ${cnts} / ${cnt} tiles for zoom ${zoom} for canvas${canvasId}`,
    );
  }
  // create snapshot texture
  await createTexture(
    redisCanvas,
    canvasId,
    canvasSize,
    canvasTileFolder,
    palette,
  );
  //--
  logger.info(
    `Tiling: Elapsed Time: ${Math.round((Date.now() - startTime) / 1000)} for canvas${canvasId}`,
  );
}
