/* @flow
 *
 * creation of tiles
 *
 */

import fs from 'fs';

import type { Cell } from './Cell';
import logger from './logger';
import canvases from '../canvases.json';
import Palette from './Palette';
import RedisCanvas from '../data/models/RedisCanvas';

import { TILE_FOLDER } from './config';
import { TILE_SIZE, TILE_ZOOM_LEVEL } from './constants';
import {
  createZoomTileFromChunk,
  createZoomedTile,
  createTexture,
  initializeTiles,
} from './Tile';
import { mod, getMaxTiledZoom } from './utils';

// Array that holds cells of all changed base zoomlevel tiles
const CanvasUpdaters = {};

class CanvasUpdater {
  TileLoadingQueues: Array;
  palette: Palette;
  id: number;
  canvas: Object;
  firstZoomtileWidth: number;
  canvasTileFolder: string;

  constructor(id: number) {
    this.updateZoomlevelTiles = this.updateZoomlevelTiles.bind(this);

    this.TileLoadingQueues = [];
    this.id = id;
    this.canvas = canvases[id];
    this.canvasTileFolder = `${TILE_FOLDER}/${id}`;
    this.palette = new Palette(this.canvas.colors);
    this.firstZoomtileWidth = this.canvas.size / TILE_SIZE / TILE_ZOOM_LEVEL;
    this.maxTiledZoom = getMaxTiledZoom(this.canvas.size);
    this.startReloadingLoops();
  }

  /*
   * @param zoom tilezoomlevel to update
   */
  async updateZoomlevelTiles(zoom: number) {
    const queue = this.TileLoadingQueues[zoom];
    if (typeof queue === 'undefined') return;

    const tile = queue.shift();
    if (typeof tile !== 'undefined') {
      const width = TILE_ZOOM_LEVEL ** zoom;
      const cx = mod(tile, width);
      const cy = Math.floor(tile / width);

      if (zoom === this.maxTiledZoom - 1) {
        await createZoomTileFromChunk(
          RedisCanvas,
          this.canvas.size,
          this.id,
          this.canvasTileFolder,
          this.palette,
          [cx, cy],
        );
      } else if (zoom !== this.maxTiledZoom) {
        await createZoomedTile(this.canvasTileFolder, this.palette, [
          zoom,
          cx,
          cy,
        ]);
      }

      if (zoom === 0) {
        createTexture(
          RedisCanvas,
          this.id,
          this.canvas.size,
          this.canvasTileFolder,
          this.palette,
        );
      } else {
        const [ucx, ucy] = [cx, cy].map((z) => Math.floor(z / 4));
        const upperTile = ucx + ucy * TILE_ZOOM_LEVEL ** (zoom - 1);
        const upperQueue = this.TileLoadingQueues[zoom - 1];
        if (~upperQueue.indexOf(upperTile)) return;
        upperQueue.push(upperTile);
        logger.info(`Tiling: Enqueued ${zoom - 1}, ${ucx}, ${ucy} for reload`);
      }
    }
  }

  /*
   * register changed chunk, queue corespongind tile to reload
   * @param chunk Chunk coordinates
   */
  registerChunkChange(chunk: Cell) {
    const queue = this.TileLoadingQueues[Math.max(this.maxTiledZoom - 1, 0)];
    if (typeof queue === 'undefined') return;

    const [cx, cy] = chunk.map((z) => Math.floor(z / 4));
    const chunkOffset = cx + cy * this.firstZoomtileWidth;
    if (~queue.indexOf(chunkOffset)) return;
    queue.push(chunkOffset);
    logger.info(
      `Tiling: Enqueued ${cx}, ${cy} / ${this.id} for basezoom reload`,
    );
  }

  /*
   * initialize queues and start loops for updating tiles
   */
  async startReloadingLoops() {
    logger.info(`Tiling: Using folder ${this.canvasTileFolder}`);
    if (!fs.existsSync(`${this.canvasTileFolder}/0`)) {
      if (!fs.existsSync(this.canvasTileFolder)) {
        fs.mkdirSync(this.canvasTileFolder);
      }
      logger.warn(
        'Tiling: tiledir empty, will initialize it, this can take some time',
      );
      await initializeTiles(
        RedisCanvas,
        this.canvas.size,
        this.id,
        this.canvasTileFolder,
        this.palette,
        false,
      );
    }
    for (let c = 0; c < this.maxTiledZoom; c += 1) {
      this.TileLoadingQueues.push([]);
      const timeout = 8 ** (this.maxTiledZoom - c - 1) * 5 * 1000;
      logger.info(
        `Tiling: Set interval for zoomlevel ${c} update to ${timeout / 1000}`,
      );
      setInterval(this.updateZoomlevelTiles, timeout, c);
    }
    if (this.maxTiledZoom === 0) {
      // in the case of canvasSize == 256
      this.TileLoadingQueues.push([]);
      setInterval(this.updateZoomlevelTiles, 5 * 60 * 1000, 0);
    }
  }
}

export function registerChunkChange(canvasId: number, chunk: Cell) {
  if (CanvasUpdaters[canvasId]) {
    CanvasUpdaters[canvasId].registerChunkChange(chunk);
  }
}
RedisCanvas.setChunkChangeCallback(registerChunkChange);

/*
 * starting update loops for canvases
 */
export function startAllCanvasLoops() {
  if (!fs.existsSync(`${TILE_FOLDER}`)) fs.mkdirSync(`${TILE_FOLDER}`);
  const ids = Object.keys(canvases);
  for (let i = 0; i < ids.length; i += 1) {
    const id = parseInt(ids[i], 10);
    const canvas = canvases[id];
    if (!canvas.v) {
      // just 2D canvases
      const updater = new CanvasUpdater(id);
      CanvasUpdaters[ids[i]] = updater;
    }
  }
}
