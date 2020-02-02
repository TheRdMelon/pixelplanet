/* @flow */

import type { Cell } from '../core/Cell';
import type { Palette } from '../core/Palette';

import { TILE_SIZE } from '../core/constants';

class ChunkRGB {
  key: string;
  image: HTMLCanvasElement;
  ready: boolean;
  timestamp: number;
  palette: Palette;
  isBasechunk: boolean;

  constructor(palette: Palette, key) {
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

  fromBuffer(chunkBuffer: Uint8Array, template: boolean = false) {
    const imageData = new ImageData(TILE_SIZE, TILE_SIZE);
    const imageView = new Uint32Array(imageData.data.buffer);
    const colors = this.palette.buffer2ABGR(chunkBuffer, template);
    colors.forEach((color, index) => {
      imageView[index] = color;
      if (color === 0x00000000) {
        const ai = index * 4 + 3;
        imageData[ai] = 0;
      }
    });
    const ctx = this.image.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    this.ready = true;
  }

  fromImage(img: Image) {
    this.ready = true;
    const ctx = this.image.getContext('2d');
    ctx.drawImage(img, 0, 0);
  }

  empty(transparent: boolean = false, template: boolean = false) {
    this.ready = true;
    if (!transparent) {
      const { image, palette } = this;
      const ctx = image.getContext('2d');
      ctx.fillStyle = template ? 'rgba(0, 0, 0, 0)' : palette.colors[0];
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    }
  }

  static getIndexFromCell([x, y]: Cell): number {
    return x + TILE_SIZE * y;
  }

  getColorIndex(cell: Cell, template: boolean = false): ColorIndex {
    const [x, y] = cell;
    const ctx = this.image.getContext('2d');

    const rgb = ctx.getImageData(x, y, 1, 1).data;
    if (template && rgb[3] === 0) return 0;
    return this.palette.getIndexOfColor(rgb[0], rgb[1], rgb[2]);
  }

  hasColorIn(cell: Cell, color: ColorIndex): boolean {
    const index = ChunkRGB.getIndexFromCell(cell);

    const ctx = this.image.getContext('2d');
    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const intView = new Uint32Array(imageData.data.buffer);

    return intView[index] === this.palette.abgr[color];
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
