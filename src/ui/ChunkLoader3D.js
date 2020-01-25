/*
 * Loading 3D chunks
 *
 * @flow
 */

import * as THREE from 'three';

import {
  THREE_CANVAS_HEIGHT,
  THREE_TILE_SIZE,
} from '../core/constants';
import {
  receiveBigChunk,
} from '../actions';

import Chunk from './ChunkRGB3D';


class ChunkLoader {
  store = null;
  canvasId: number;
  palette;
  chunks: Map<string, Chunk>;

  constructor(store) {
    console.log("Created Chunk loader");
    this.store = store;
    const state = store.getState();
    const {
      canvasId,
      palette,
    } = state.canvas;
    this.canvasId = canvasId;
    this.palette = palette;
    this.chunks = new Map();
  }

  getVoxelUpdate(
    xc: number,
    zc: number,
    offset: number,
    color: number,
  ) {
    const key = `${xc}:${zc}`;
    const chunk = this.chunks.get(key);
    if (chunk) {
      /*
      const offsetXZ = offset % (THREE_TILE_SIZE ** 2);
      const iy = (offset - offsetXZ) / (THREE_TILE_SIZE ** 2);
      const ix = offsetXZ % THREE_TILE_SIZE;
      const iz = (offsetXZ - ix) / THREE_TILE_SIZE;
      */
      chunk.setVoxelByOffset(offset, color);
      //this.store.dispatch(receiveBigChunk(key));
    }
  }

  getChunk(xc, zc, fetch: boolean) {
    const chunkKey = `${xc}:${zc}`;
    console.log(`Get chunk ${chunkKey}`);
    let chunk = this.chunks.get(chunkKey);
    if (chunk) {
      if (chunk.ready) {
        return chunk.mesh;
      }
      return null;
    }
    if (fetch) {
      // fetch chunk
      chunk = new Chunk(this.palette, chunkKey);
      this.chunks.set(chunkKey, chunk);
      this.fetchChunk(xc, zc, chunk);
    }
    return null;
  }

  async fetchChunk(xc: number, zc: number, chunk) {
    const { key } = chunk;
    console.log(`Fetch chunk ${key}`);
    await chunk.generateSin();
    this.store.dispatch(receiveBigChunk(key));
  }
}

export default ChunkLoader;
