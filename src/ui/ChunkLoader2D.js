/*
 * Fetching and storing of 2D chunks
 *
 * @flow
 */

import ChunkRGB from './ChunkRGB';
import { TILE_SIZE } from '../core/constants';
import { loadingTiles, loadImage } from './loadImage';
import {
  requestBigChunk,
  receiveBigChunk,
  receiveBigChunkFailure,
  requestBigTemplateChunk,
  recieveBigTemplateChunkFailure,
  recieveBigTemplateChunk,
} from '../actions';
import { getCellInsideChunk, getChunkOfPixel } from '../core/utils';

class ChunkLoader {
  store = null;
  canvasId: number;
  canvasMaxTiledZoom: number;
  palette;
  chunks: Map<string, ChunkRGB>;
  templateChunks: Map<string, ChunkRGB>;

  constructor(store) {
    this.store = store;
    const state = store.getState();
    const { canvasId, canvasMaxTiledZoom, palette } = state.canvas;
    this.canvasId = canvasId;
    this.canvasMaxTiledZoom = canvasMaxTiledZoom;
    this.palette = palette;
    this.chunks = new Map();
    this.templateChunks = new Map();
  }

  getAllChunks() {
    return this.chunks;
  }

  getPixelUpdate(cx: number, cy: number, offset: number, color: number) {
    const chunk = this.chunks.get(`${this.canvasMaxTiledZoom}:${cx}:${cy}`);
    if (chunk) {
      const ix = offset % TILE_SIZE;
      const iy = Math.floor(offset / TILE_SIZE);
      chunk.setColor([ix, iy], color);
    }
  }

  getColorIndexOfPixel(x: number, y: number, template: boolean = false) {
    const state: State = this.store.getState();
    const { canvasSize } = state.canvas;
    const [cx, cy] = getChunkOfPixel(canvasSize, x, y);
    const key = `${this.canvasMaxTiledZoom}:${cx}:${cy}`;
    const chunk = (template ? this.templateChunks : this.chunks).get(key);
    if (!chunk) {
      return 0;
    }
    return chunk.getColorIndex(getCellInsideChunk([x, y]));
  }

  getChunk(zoom, cx: number, cy: number, fetch: boolean) {
    const chunkKey = `${zoom}:${cx}:${cy}`;
    const chunk = this.chunks.get(chunkKey);
    const { canvasId } = this;
    if (chunk) {
      if (chunk.ready) {
        return chunk.image;
      }
      return loadingTiles.getTile(canvasId);
    }
    if (fetch) {
      // fetch chunk
      const chunkRGB = new ChunkRGB(this.palette, chunkKey);
      this.chunks.set(chunkKey, chunkRGB);

      if (this.canvasMaxTiledZoom === zoom) {
        this.fetchBaseChunk(zoom, cx, cy, chunkRGB);
      } else {
        this.fetchTile(zoom, cx, cy, chunkRGB);
      }
    }
    return loadingTiles.getTile(canvasId);
  }

  getTemplateChunk(zoom, cx: number, cy: number, fetch: boolean) {
    const chunkKey = `${zoom}:${cx}:${cy}`;
    const chunk = this.templateChunks.get(chunkKey);
    const { canvasId } = this;
    if (chunk) {
      if (chunk.ready) {
        return chunk.image;
      }
      return loadingTiles.getTile(canvasId);
    }
    if (fetch) {
      // fetch template chunk
      const chunkRGB = new ChunkRGB(this.palette, chunkKey);
      this.templateChunks.set(chunkKey, chunkRGB);

      if (this.canvasMaxTiledZoom === zoom) {
        this.fetchTemplateChunk(zoom, cx, cy, chunkRGB);
      } else {
        this.fetchTemplateTile(zoom, cx, cy, chunkRGB);
      }
    }
    return loadingTiles.getTile(canvasId);
  }

  getHistoricalChunk(cx, cy, fetch, historicalDate, historicalTime = null) {
    let chunkKey = historicalTime
      ? `${historicalDate}${historicalTime}`
      : historicalDate;
    chunkKey += `:${cx}:${cy}`;
    const chunk = this.chunks.get(chunkKey);
    const { canvasId } = this;
    if (chunk) {
      if (chunk.ready) {
        return chunk.image;
      }
      return historicalTime ? null : loadingTiles.getTile(canvasId);
    }
    if (fetch) {
      // fetch tile
      const chunkRGB = new ChunkRGB(this.palette, chunkKey);
      this.chunks.set(chunkKey, chunkRGB);
      this.fetchHistoricalChunk(
        cx,
        cy,
        historicalDate,
        historicalTime,
        chunkRGB,
      );
    }
    return historicalTime ? null : loadingTiles.getTile(canvasId);
  }

  async fetchHistoricalChunk(
    cx: number,
    cy: number,
    historicalDate: string,
    historicalTime: string,
    chunkRGB,
  ) {
    const { canvasId } = this;
    let url = `${window.backupurl}/${historicalDate}/`;
    if (historicalTime) {
      // incremential tiles
      url += `${canvasId}/${historicalTime}/${cx}/${cy}.png`;
    } else {
      // full tiles
      url += `${canvasId}/tiles/${cx}/${cy}.png`;
    }
    this.store.dispatch(requestBigChunk(null));
    try {
      const img = await loadImage(url);
      chunkRGB.fromImage(img);
      this.store.dispatch(receiveBigChunk(null));
    } catch (error) {
      this.store.dispatch(receiveBigChunkFailure(null, error));
      if (historicalTime) {
        chunkRGB.empty(true);
      } else {
        chunkRGB.empty();
      }
    }
  }

  async fetchBaseChunk(zoom, cx: number, cy: number, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigChunk(center));
    chunkRGB.isBasechunk = true;
    try {
      const url = `/chunks/${this.canvasId}/${cx}/${cy}.bmp`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength) {
          const chunkArray = new Uint8Array(arrayBuffer);
          chunkRGB.fromBuffer(chunkArray);
        } else {
          throw new Error('Chunk response was invalid');
        }
        this.store.dispatch(receiveBigChunk(center));
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      chunkRGB.empty();
      this.store.dispatch(receiveBigChunkFailure(center, error));
    }
  }

  async fetchTemplateChunk(zoom, cx: number, cy: number, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigTemplateChunk(center));
    chunkRGB.isBasechunk = true;
    try {
      const url = `/chunks/templates/${this.canvasId}/${cx}/${cy}.bmp`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength) {
          const chunkArray = new Uint8Array(arrayBuffer);
          chunkRGB.fromBuffer(chunkArray, true);
        } else {
          throw new Error('Chunk response was invalid');
        }
        this.store.dispatch(recieveBigTemplateChunk(center));
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      chunkRGB.empty(false, true);
      this.store.dispatch(recieveBigTemplateChunkFailure(center, error));
    }
  }

  async fetchTile(zoom, cx: number, cy: number, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigChunk(center));
    try {
      const url = `/tiles/${this.canvasId}/${zoom}/${cx}/${cy}.png`;
      const img = await loadImage(url);
      chunkRGB.fromImage(img);
      this.store.dispatch(receiveBigChunk(center));
    } catch (error) {
      this.store.dispatch(receiveBigChunkFailure(center, error));
      chunkRGB.empty();
    }
  }

  async fetchTemplateTile(zoom, cx: number, cy: number, chunkRGB) {
    const center = [zoom, cx, cy];
    this.store.dispatch(requestBigTemplateChunk(center));
    try {
      const url = `/tiles/templates/${this.canvasId}/${zoom}/${cx}/${cy}.png`;
      const img = await loadImage(url);
      chunkRGB.fromImage(img);
      this.store.dispatch(recieveBigTemplateChunk(center));
    } catch (error) {
      this.store.dispatch(recieveBigTemplateChunkFailure(center, error));
      chunkRGB.empty(false, true);
    }
  }
}

export default ChunkLoader;
