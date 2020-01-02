/* @flow 
 * this script takes black/withe tiles and sets their colors on the canvas
 * its used to set the land area on the planet.
 *
 * The tiles it uses are explained in 3dmodels/ocean-tiles
 *
 * run this script with --expose-gc or you run out of RAM
 */


import { imagemask2Canvas } from '../../src/core/Image';
import sharp from 'sharp';
import fs from 'fs';

const CANVAS_SIZE = 256 * 256;
const CANVAS_MIN_XY = -(CANVAS_SIZE / 2);
const CANVAS_MAX_XY = (CANVAS_SIZE / 2) - 1;

const TILEFOLDER = './ocean';
const TILE_SIZE = 2048;


async function applyMasks() {
  for (let ty = 0; ty < CANVAS_SIZE / TILE_SIZE; ty += 1) {
    for (let tx = 0; tx < CANVAS_SIZE / TILE_SIZE; tx += 1) {
      const [ x, y ] = [tx, ty].map(z => z * TILE_SIZE + CANVAS_MIN_XY);
      const filename = `${TILEFOLDER}/${tx}/${ty}.png`;
      console.log(`Checking tile ${filename}`);
      if (!fs.existsSync(filename)) continue;
      let tile = await sharp(filename).removeAlpha().raw().toBuffer();
      await imagemask2Canvas(0, x, y, tile, TILE_SIZE, TILE_SIZE, (clr) => {
        return 1; //set color to index 1 -> land
      });
      tile = null;
    }
    global.gc();
  }
}

applyMasks();
