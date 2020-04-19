/*
 * Fetching and storing of 2D chunks
 *
 * @flow
 */

import ChunkRGB from './ChunkRGB';
import { TILE_SIZE, TILE_ZOOM_LEVEL } from '../core/constants';
import {
  loadingTiles,
  loadImage,
} from './loadImage';
import {
  requestBigChunk,
  receiveBigChunk,
  receiveBigChunkFailure,
  // preLoadedBigChunk,
} from '../actions';
import {
  getCellInsideChunk,
  getChunkOfPixel,
} from '../core/utils';

class ChunkLoader {
  store = null;
  canvasId: number;
  canvasMaxTiledZoom: number;
  palette;
  chunks: Map<string, ChunkRGB>;

  constructor(store) {
    this.store = store;
    const state = store.getState();
    const {
      canvasId,
      canvasMaxTiledZoom,
      palette,
    } = state.canvas;
    this.canvasId = canvasId;
    this.canvasMaxTiledZoom = canvasMaxTiledZoom;
    this.palette = palette;
    this.chunks = new Map();
  }

  getAllChunks() {
    return this.chunks;
  }

  getPixelUpdate(
    cx: number,
    cy: number,
    offset: number,
    color: number,
  ) {
    const chunk = this.chunks.get(`${this.canvasMaxTiledZoom}:${cx}:${cy}`);
    if (chunk) {
      const ix = offset % TILE_SIZE;
      const iy = Math.floor(offset / TILE_SIZE);
      chunk.setColor([ix, iy], color);
    }
  }

  getColorIndexOfPixel(
    x: number,
    y: number,
  ) {
    const state: State = this.store.getState();
    const { canvasSize } = state.canvas;
    const [cx, cy] = getChunkOfPixel(canvasSize, x, y);
    const key = `${this.canvasMaxTiledZoom}:${cx}:${cy}`;
    const chunk = this.chunks.get(key);
    if (!chunk) {
      return 0;
    }
    return chunk.getColorIndex(
      getCellInsideChunk(canvasSize, [x, y]),
    );
  }

  /*
   * preLoad chunks by generating them out of
   * available lower zoomlevel chunks
   */
  preLoadChunk(
    zoom: number,
    cx: number,
    cy: number,
    chunkRGB,
  ) {
    if (zoom <= 0) return null;

    try {
      // first try if one zoomlevel higher is available (without fetching it)
      let plZoom = zoom - 1;
      let zoomDiffAbs = TILE_ZOOM_LEVEL;
      let [plX, plY] = [cx, cy].map((z) => (Math.floor(z / zoomDiffAbs)));
      let plChunk = this.getChunk(plZoom, plX, plY, false, false, true);
      if (!plChunk) {
        // if not, try one more zoomlevel higher, fetching it if not available
        if (plZoom > 0) {
          plZoom -= 1;
        }
        zoomDiffAbs = TILE_ZOOM_LEVEL ** (zoom - plZoom);
        [plX, plY] = [cx, cy].map((z) => (Math.floor(z / zoomDiffAbs)));
        plChunk = this.getChunk(plZoom, plX, plY, true, false, true);
      }
      if (plChunk) {
        const pcX = (cx % zoomDiffAbs) * TILE_SIZE / zoomDiffAbs;
        const pcY = (cy % zoomDiffAbs) * TILE_SIZE / zoomDiffAbs;
        chunkRGB.preLoad(plChunk, zoomDiffAbs, pcX, pcY);
        // fetching of preLoad chunk triggers rerender already
        // lets keep this commented out for now
        // this.store.dispatch(preLoadedBigChunk([zoom, cx, cy]));
        return chunkRGB.image;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error occured while preloading for ${zoom}:${cx}:${cy}`,
        error);
      return null;
    }
    return null;
  }


  getChunk(
    zoom: number,
    cx: number,
    cy: number,
    fetch: boolean,
    showLoadingTile: boolean = true,
    chunkPreLoading: boolean = true,
  ) {
    const chunkKey = `${zoom}:${cx}:${cy}`;
    let chunkRGB = this.chunks.get(chunkKey);
    const { canvasId } = this;
    if (chunkRGB) {
      if (chunkRGB.ready) {
        return chunkRGB.image;
      }
    } else if (fetch) {
      chunkRGB = new ChunkRGB(this.palette, zoom, cx, cy);
      this.chunks.set(chunkKey, chunkRGB);
      // fetch chunk
      if (this.canvasMaxTiledZoom === zoom) {
        this.fetchBaseChunk(zoom, cx, cy, chunkRGB);
      } else {
        this.fetchTile(zoom, cx, cy, chunkRGB);
      }
    }
    if (chunkPreLoading && chunkRGB) {
      const preLoad = this.preLoadChunk(zoom, cx, cy, chunkRGB);
      if (preLoad) return preLoad;
    }
    return (showLoadingTile) ? loadingTiles.getTile(canvasId) : null;
  }

  getHistoricalChunk(cx, cy, fetch, historicalDate, historicalTime = null) {
    let chunkKey = (historicalTime)
      ? `${historicalDate}${historicalTime}`
      : historicalDate;
    chunkKey += `:${cx}:${cy}`;
    const chunk = this.chunks.get(chunkKey);
    const { canvasId } = this;
    if (chunk) {
      if (chunk.ready) {
        return chunk.image;
      }
      return (historicalTime) ? null : loadingTiles.getTile(canvasId);
    } if (fetch) {
      // fetch tile
      const chunkRGB = new ChunkRGB(
        this.palette,
        this.canvasMaxTiledZoom,
        cx,
        cy,
      );
      this.chunks.set(chunkKey, chunkRGB);
      this.fetchHistoricalChunk(
        cx,
        cy,
        historicalDate,
        historicalTime,
        chunkRGB,
      );
    }
    return (historicalTime) ? null : loadingTiles.getTile(canvasId);
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
}

export default ChunkLoader;
