/* @flow */

import type { Cell } from '../core/Cell';
import type { Palette } from '../core/Palette';

import { TILE_SIZE } from '../core/constants';


class ChunkRGB {
  cell: Cell;
  key: string;
  image: HTMLCanvasElement;
  ready: boolean;
  timestamp: number;
  palette: Palette;
  isBasechunk: boolean;

  constructor(palette: Palette, cell: Cell) {
    // isBasechunk gets set to true by RECEIVE_BIG_CHUNK
    // if true => chunk got requested from api/chunk and
    //            receives websocket pixel updates
    // if false => chunk is an zoomed png tile
    this.isBasechunk = true;
    this.palette = palette;
    this.image = document.createElement('canvas');
    this.image.width = TILE_SIZE;
    this.image.height = TILE_SIZE;
    this.cell = cell;
    this.key = ChunkRGB.getKey(...cell);
    this.ready = false;
    this.timestamp = Date.now();
  }

  /*
  preLoad(chunks) {
    // what to display while chunk is loading
    // NOTE: i tried to create from smaller chunk, but that is
    // unreasonably slow, so we just default to a loading pic.
    //
    // Creating from larger chunk is faster, but still slow.
    // so i also commented it out.
    //
    // Since we now just load the loading tile always
    // i commented this also out and do it in ui/render instead
    const ctx = this.image.getContext('2d');
    const [cz, cx, cy] = this.cell;
    if (cz > 0) {
      const target = cz - 1;
      const key = ChunkRGB.getKey(target, Math.floor(cx / TILE_ZOOM_LEVEL), Math.floor(cy / TILE_ZOOM_LEVEL));
      console.log("ask for key", key);
      const chunk = chunks.get(ChunkRGB.getKey(target, Math.floor(cx / TILE_ZOOM_LEVEL), Math.floor(cy / TILE_ZOOM_LEVEL)));
      if (chunk) {
        const dx = -mod(cx, TILE_ZOOM_LEVEL) * TILE_SIZE;
        const dy = -mod(cy, TILE_ZOOM_LEVEL) * TILE_SIZE;
        console.log("create from larger chunk with dx", dx, "dy", dy);
        ctx.save();
        ctx.scale(TILE_ZOOM_LEVEL, TILE_ZOOM_LEVEL);
        ctx.drawImage(chunk.image, dx / TILE_ZOOM_LEVEL, dy / TILE_ZOOM_LEVEL);
        ctx.restore();
        return;
      }
    }
    if (loadingTiles.hasTiles) {
      ctx.drawImage(loadingTiles.getTile(0), 0, 0);
      return;
    } else {
      ctx.fillStyle = this.palette.colors[2];
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
  }
  */

  fromBuffer(chunkBuffer: Uint8Array) {
    this.ready = true;
    const imageData = new ImageData(TILE_SIZE, TILE_SIZE);
    const imageView = new Uint32Array(imageData.data.buffer);
    const colors = this.palette.buffer2ABGR(chunkBuffer);
    colors.forEach((color, index) => {
      imageView[index] = color;
    });
    const ctx = this.image.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  }

  fromImage(img: Image) {
    this.ready = true;
    const ctx = this.image.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }

  empty() {
    this.ready = true;
    const ctx = this.image.getContext('2d');
    ctx.fillStyle = this.palette.colors[0];
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  }

  static getKey(z: number, x: number, y: number) {
    // this is also hardcoded into core/utils.js at getColorIndexOfPixel
    // just to prevent whole ChunkRGB to get loaded into web.js
    // ...could test that at some point if really neccessary
    return `${z}:${x}:${y}`;
  }

  static getIndexFromCell([x, y]: Cell): number {
    return x + (TILE_SIZE * y);
  }

  getColorIndex(cell: Cell): ColorIndex {
    const [x, y] = cell;
    const ctx = this.image.getContext('2d');

    const rgb = ctx.getImageData(x, y, 1, 1).data;
    return this.palette.getIndexOfColor(rgb[0], rgb[1], rgb[2]);
  }

  hasColorIn(cell: Cell, color: ColorIndex): boolean {
    const index = ChunkRGB.getIndexFromCell(cell);

    const ctx = this.image.getContext('2d');
    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const intView = new Uint32Array(imageData.data.buffer);

    return (intView[index] === this.palette.abgr[color]);
  }

  setColor(cell: Cell, color: ColorIndex): boolean {
    const [x, y] = cell;
    const ctx = this.image.getContext('2d');
    ctx.fillStyle = this.palette.colors[color];
    ctx.fillRect(x, y, 1, 1);
    return true;
  }
}

export default ChunkRGB;
