/*
 *
 * @flow
 */

import type { Cell } from '../core/Cell';
import type { State } from '../reducers';
import { TILE_SIZE } from '../core/constants';

import {
  getTileOfPixel,
  getPixelFromChunkOffset,
} from '../core/utils';
import { fetchChunk, fetchTile } from '../actions';

import {
  renderGrid,
  renderPlaceholder,
  renderPotatoPlaceholder,
} from './renderelements';
import ChunkRGB from './ChunkRGB';
import { loadingTiles } from './loadImage';


import pixelNotify from './PixelNotify';

// dimensions of offscreen canvas NOT whole canvas
const CANVAS_WIDTH = window.screen.width * 2;
const CANVAS_HEIGHT = window.screen.height * 2;
const SCALE_THREASHOLD = Math.min(
  CANVAS_WIDTH / TILE_SIZE / 3,
  CANVAS_HEIGHT / TILE_SIZE / 3,
);


class Renderer {
  centerChunk: Cell;
  tiledScale: number;
  tiledZoom: number;
  hover: boolean;
  //--
  viewport: HTMLCanvasElement = null;
  store;
  //--
  forceNextRender: boolean;
  forceNextSubrender: boolean;
  canvas: HTMLCanvasElement;
  lastFetch: number;

  constructor() {
    this.centerChunk = [null, null];
    this.tiledScale = 0;
    this.tiledZoom = 4;
    this.hover = false;
    //--
    this.forceNextRender = true;
    this.forceNextSubrender = true;
    this.lastFetch = 0;
    //--
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    const context = this.canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#000000';
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // HAS to be set before any rendering can happen
  setViewport(viewport: HTMLCanvasElement, store) {
    this.viewport = viewport;
    this.store = store;
    const state = store.getState();
    const {
      canvasMaxTiledZoom,
      viewscale,
      view,
      canvasSize,
    } = state.canvas;
    this.updateCanvasData(state);
    this.updateScale(viewscale, canvasMaxTiledZoom, view, canvasSize);
    this.forceNextRender = true;
  }

  updateCanvasData(state: State) {
    const {
      canvasMaxTiledZoom,
      viewscale,
      view,
      canvasSize,
    } = state.canvas;
    this.tiledZoom = canvasMaxTiledZoom + Math.log2(this.tiledScale) / 2;
    this.updateScale(viewscale, canvasMaxTiledZoom, view, canvasSize);
  }

  updateScale(
    viewscale: number,
    canvasMaxTiledZoom: number,
    view,
    canvasSize,
  ) {
    pixelNotify.updateScale(viewscale);
    let tiledScale = (viewscale > 0.5) ? 0 : Math.round(Math.log2(viewscale) / 2);
    tiledScale = 4 ** tiledScale;
    const tiledZoom = canvasMaxTiledZoom + Math.log2(tiledScale) / 2;
    const relScale = viewscale / tiledScale;

    this.tiledScale = tiledScale;
    this.tiledZoom = tiledZoom;
    this.relScale = relScale;
    this.updateView(view, canvasSize);
  }

  updateView(view, canvasSize) {
    const [x, y] = view;
    let [cx, cy] = this.centerChunk;
    const [curcx, curcy] = getTileOfPixel(this.tiledScale, [x, y], canvasSize);
    if (cx !== curcx || cy !== curcy) {
      cx = curcx;
      cy = curcy;
      this.centerChunk = [cx, cy];
      this.forceNextRender = true;
    } else {
      this.forceNextSubrender = true;
    }
  }


  renderPixel(
    i: number,
    j: number,
    offset: number,
    color: ColorIndex,
  ) {
    const state: State = this.store.getState();
    const {
      canvasSize,
      palette,
      scale,
    } = state.canvas;

    if (scale < 0.8) return;
    const scaleM = (scale > SCALE_THREASHOLD) ? 1 : scale;

    const context = this.canvas.getContext('2d');
    if (!context) return;

    const [x, y] = getPixelFromChunkOffset(i, j, offset, canvasSize);

    const [canX, canY] = this.centerChunk
      .map((z) => (z + 0.5) * TILE_SIZE - canvasSize / 2);
    const px = ((x - canX) * scaleM) + (CANVAS_WIDTH / 2);
    const py = ((y - canY) * scaleM) + (CANVAS_HEIGHT / 2);
    // if not part of our current canvas, do not render
    if (px < 0 || py >= CANVAS_WIDTH || py < 0 || py >= CANVAS_HEIGHT) return;

    context.fillStyle = palette.colors[color];
    context.fillRect(px, py, scaleM, scaleM);
    pixelNotify.addPixel(x, y);

    this.forceNextSubrender = true;
  }


  isChunkInView(
    cz: number,
    cx: number,
    cy: number,
  ) {
    if (cz !== this.tiledZoom) {
      return false;
    }
    const { width, height } = this.viewport;
    const CHUNK_RENDER_RADIUS_X = Math.ceil(width / TILE_SIZE / 2 / this.relScale);
    const CHUNK_RENDER_RADIUS_Y = Math.ceil(height / TILE_SIZE / 2 / this.relScale);
    const [xc, yc] = this.centerChunk;
    if (Math.abs(cx - xc)
      <= CHUNK_RENDER_RADIUS_X && Math.abs(cy - yc)
      <= CHUNK_RENDER_RADIUS_Y
    ) {
      return true;
    }
    return false;
  }


  renderChunks(
    state: State,
  ) {
    const context = this.canvas.getContext('2d');
    if (!context) return;

    const {
      centerChunk: chunkPosition,
      tiledScale,
      tiledZoom,
      viewport,
    } = this;
    const {
      viewscale: scale,
      canvasId,
      canvasSize,
      canvasMaxTiledZoom,
      chunks,
    } = state.canvas;

    let { relScale } = this;
    // clear rect is just needed for Google Chrome, else it would flash regularly
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Disable smoothing
    // making it dependent on the scale is needed for Google Chrome, else scale <1 would look shit
    if (scale >= 1) {
      context.msImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.imageSmoothingEnabled = false;
    } else {
      context.msImageSmoothingEnabled = true;
      context.webkitImageSmoothingEnabled = true;
      context.imageSmoothingEnabled = true;
    }
    // define how many chunks we will render
    // don't render chunks outside of viewport
    const { width, height } = viewport;
    const CHUNK_RENDER_RADIUS_X = Math.ceil(width / TILE_SIZE / 2 / relScale);
    const CHUNK_RENDER_RADIUS_Y = Math.ceil(height / TILE_SIZE / 2 / relScale);
    // If scale is so large that neighbouring chunks wouldn't fit in canvas,
    // do scale = 1 and scale in render()
    // TODO this is not working
    if (scale > SCALE_THREASHOLD) relScale = 1.0;
    // scale
    context.save();
    context.fillStyle = '#C4C4C4';
    context.scale(relScale, relScale);
    // decide if we will fetch missing chunks
    // and update the timestamps of accessed chunks
    const curTime = Date.now();
    let fetch = false;
    if (curTime > this.lastFetch + 150) {
      this.lastFetch = curTime;
      fetch = true;
    }

    const xOffset = CANVAS_WIDTH / 2 / relScale - TILE_SIZE / 2;
    const yOffset = CANVAS_HEIGHT / 2 / relScale - TILE_SIZE / 2;

    const [xc, yc] = chunkPosition; // center chunk
    // CLEAN margin
    // draw new chunks. If not existing, just clear.
    let chunk: ChunkRGB;
    let key: string;
    for (let dx = -CHUNK_RENDER_RADIUS_X; dx <= CHUNK_RENDER_RADIUS_X; dx += 1) {
      for (let dy = -CHUNK_RENDER_RADIUS_Y; dy <= CHUNK_RENDER_RADIUS_Y; dy += 1) {
        const cx = xc + dx;
        const cy = yc + dy;
        const x = xOffset + dx * TILE_SIZE;
        const y = yOffset + dy * TILE_SIZE;

        const chunkMaxXY = canvasSize / TILE_SIZE;
        if (cx < 0 || cx >= chunkMaxXY * tiledScale || cy < 0 || cy >= chunkMaxXY * tiledScale) {
          // if out of bounds
          context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          key = ChunkRGB.getKey(tiledZoom, cx, cy);
          chunk = chunks.get(key);
          if (chunk) {
            // render new chunk
            if (chunk.ready) {
              context.drawImage(chunk.image, x, y);
              if (fetch) chunk.timestamp = curTime;
            } else if (loadingTiles.hasTiles) {
              context.drawImage(loadingTiles.getTile(canvasId), x, y);
            } else {
              context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
          } else {
            // we don't have that chunk
            if (fetch) {
              if (tiledZoom === canvasMaxTiledZoom) {
                this.store.dispatch(fetchChunk(canvasId, [tiledZoom, cx, cy]));
              } else {
                this.store.dispatch(fetchTile(canvasId, [tiledZoom, cx, cy]));
              }
            }
            if (loadingTiles.hasTiles) {
              context.drawImage(loadingTiles.getTile(canvasId), x, y);
            } else {
              context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }
    context.restore();
  }


  // keep in mind that everything we got here gets executed 60 times per second
  // avoiding unneccessary stuff is important
  render() {
    try{
    const {
      viewport,
    } = this;
    const state: State = this.store.getState();
    const {
      showGrid,
      showPixelNotify,
      hover,
      isPotato,
      isLightGrid,
    } = state.gui;
    const {
      placeAllowed,
    } = state.user;
    const {
      view,
      viewscale,
      canvasSize,
      canvasId,
    } = state.canvas;

    if (!view || canvasId === null) return;

    const [x, y] = view;
    const [cx, cy] = this.centerChunk;

    // if we have to render pixelnotify
    const doRenderPixelnotify = (viewscale >= 0.5 && showPixelNotify && pixelNotify.doRender());
    // if we have to render placeholder
    const doRenderPlaceholder = (viewscale >= 3 && placeAllowed && (hover || this.hover) && !isPotato);
    const doRenderPotatoPlaceholder = (viewscale >= 3 && placeAllowed && (hover !== this.hover || this.forceNextRender || this.forceNextSubrender || doRenderPixelnotify) && isPotato);
    //--
    // if we have nothing to render, return
    // note: this.hover is used to, to render without the placeholder one last time when cursor leaves window
    if (
      // no full rerender
      !this.forceNextRender
      // no render placeholder under cursor
      && !doRenderPlaceholder
      && !doRenderPotatoPlaceholder
      // no pixelnotification
      && !doRenderPixelnotify
      // no forced just-viewscale render (i.e. when just a pixel got set)
      && !this.forceNextSubrender
    ) {
      return;
    }
    this.hover = hover;

    if (this.forceNextRender) {
      this.renderChunks(state);
    }
    this.forceNextRender = false;
    this.forceNextSubrender = false;

    const { width, height } = viewport;
    const viewportCtx = viewport.getContext('2d');
    if (!viewportCtx) return;

    // canvas optimization: https://www.html5rocks.com/en/tutorials/canvas/performance/
    viewportCtx.msImageSmoothingEnabled = false;
    viewportCtx.webkitImageSmoothingEnabled = false;
    viewportCtx.imageSmoothingEnabled = false;
    // If scale is so large that neighbouring chunks wouldn't fit in offscreen canvas,
    // do scale = 1 in renderChunks and scale in render()
    const canvasCenter = canvasSize / 2;
    console.log("do render")
    if (viewscale > SCALE_THREASHOLD) {
      viewportCtx.save();
      viewportCtx.scale(viewscale, viewscale);
      viewportCtx.drawImage(this.canvas,
        width / 2 / viewscale - CANVAS_WIDTH / 2 + ((cx + 0.5) * TILE_SIZE - canvasCenter - x),
        height / 2 / viewscale - CANVAS_HEIGHT / 2 + ((cy + 0.5) * TILE_SIZE - canvasCenter - y));
      viewportCtx.restore();
    } else {
      viewportCtx.drawImage(this.canvas,
        Math.floor(width / 2 - CANVAS_WIDTH / 2 + ((cx + 0.5) * TILE_SIZE / this.tiledScale - canvasCenter - x) * viewscale),
        Math.floor(height / 2 - CANVAS_HEIGHT / 2 + ((cy + 0.5) * TILE_SIZE / this.tiledScale - canvasCenter - y) * viewscale));
    }

    if (showGrid && viewscale >= 8) renderGrid(state, viewport, viewscale, isLightGrid);

    if (doRenderPixelnotify) pixelNotify.render(state, viewport);

    if (hover && doRenderPlaceholder) renderPlaceholder(state, viewport, viewscale);
    if (hover && doRenderPotatoPlaceholder) renderPotatoPlaceholder(state, viewport, viewscale);
  } catch {
    console.log("error");
  }
  }
}


const renderer = new Renderer();
export default renderer;
