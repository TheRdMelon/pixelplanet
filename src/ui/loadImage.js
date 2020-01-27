/* @flow */

/*
 * general function for async loading images
 * @param url url of image
 * @return Promise<Image>
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => {
      reject(new Error(`Failed to load image's URL: ${url}`));
    });
    img.src = url;
  });
}

/*
 * loading tiles that get temporarily shown till real tile is loaded
 */
class LoadingTiles {
  tiles: Object;

  constructor() {
    this.tiles = {};
    this.loadLoadingTile(0);
  }

  getTile(canvasId: number) {
    if (typeof this.tiles[canvasId] === 'undefined') {
      this.loadLoadingTile(canvasId);
    }
    return this.tiles[canvasId] || this.tiles[0] || null;
  }

  async loadLoadingTile(canvasId: number) {
    if (this.tiles[canvasId] === null) {
      return;
    }
    this.tiles[canvasId] = null;
    const img = await loadImage(`./loading${canvasId}.png`);
    this.tiles[canvasId] = img;
  }
}

export const loadingTiles = new LoadingTiles();
