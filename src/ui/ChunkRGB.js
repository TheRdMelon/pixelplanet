/* @flow */

import type { Cell } from '../core/Cell';
import type { Palette } from '../core/Palette';

import { TILE_SIZE } from '../core/constants';


class ChunkRGB {
  cell: Array;
  key: string;
  image: HTMLCanvasElement;
  ready: boolean;
  timestamp: number;
  palette: Palette;
  isBasechunk: boolean;

  constructor(palette: Palette, key, zoom = 0, cx = 0, cy = 0) {
    // isBasechunk gets set to true by RECEIVE_BIG_CHUNK
    // if true => chunk got requested from api/chunk and
    //            receives websocket pixel updates
    // if false => chunk is an zoomed png tile
    this.isBasechunk = false;
    this.palette = palette;
    this.image = document.createElement('canvas');
    this.image.width = TILE_SIZE;
    this.image.height = TILE_SIZE;
    this.key = key;
    this.cell = [zoom, cx, cy];
    this.ready = false;
    this.timestamp = Date.now();
  }

  fromBuffer(chunkBuffer: Uint8Array) {
    const imageData = new ImageData(TILE_SIZE, TILE_SIZE);
    const imageView = new Uint32Array(imageData.data.buffer);
    const colors = this.palette.buffer2ABGR(chunkBuffer);
    colors.forEach((color, index) => {
      imageView[index] = color;
    });
    const ctx = this.image.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    this.ready = true;
  }

  preLoad(img, zoomDiffAbs: number, sx: number, sy: number) {
    this.ready = true;
    const ctx = this.image.getContext('2d');
    ctx.save();
    ctx.msImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoomDiffAbs, zoomDiffAbs);
    const sDim = TILE_SIZE / zoomDiffAbs;
    ctx.drawImage(img, sx, sy, sDim, sDim, 0, 0, sDim, sDim);
    ctx.restore();
  }

  fromImage(img: Image) {
    this.ready = true;
    const ctx = this.image.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }

  empty(transparent: boolean = false) {
    this.ready = true;
    if (!transparent) {
      const { image, palette } = this;
      const ctx = image.getContext('2d');
      // eslint-disable-next-line prefer-destructuring
      ctx.fillStyle = palette.colors[0];
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
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
