/* @flow */

import type { Action } from '../actions/types';
import type { Cell } from '../core/Cell';
import Palette from '../core/Palette';
import {
  getMaxTiledZoom,
  getChunkOfPixel,
  getCellInsideChunk,
  clamp,
  getIdFromObject,
} from '../core/utils';


import {
  MAX_SCALE,
  DEFAULT_SCALE,
  DEFAULT_CANVAS_ID,
  DEFAULT_CANVASES,
  TILE_SIZE,
} from '../core/constants';
import ChunkRGB from '../ui/ChunkRGB';

export type CanvasState = {
  canvasId: number,
  canvasIdent: string,
  canvasSize: number,
  canvasMaxTiledZoom: number,
  palette: Palette,
  chunks: Map<string, ChunkRGB>,
  view: Cell,
  scale: number,
  viewscale: number,
  requested: Set<string>,
  fetchs: number,
  isHistoricalView: boolean,
  historicalDate: string,
  historicalTime: string,
  // object with all canvas informations from all canvases like colors and size
  canvases: Object,
};

/*
 * check if we got coords from index.html
 */
function getGivenCoords() {
  if (window.coordx && window.coordy) return [window.coordx, window.coordy];
  return [1749, -8283];
}

/*
 * parse url hash and sets view to coordinates
 * @param canvases Object with all canvas informations
 * @return view, viewscale and scale for state
 */
function getViewFromURL(canvases: Object) {
  const { hash } = window.location;
  try {
    const almost = hash.substring(1)
      .split(',');

    const canvasIdent = almost[0];
    // will be null if not in DEFAULT_CANVASES
    const canvasId = getIdFromObject(canvases, almost[0]);
    const colors = (canvasId !== null)
      ? canvases[canvasId].colors : canvases[DEFAULT_CANVAS_ID].colors;
    const canvasSize = (canvasId !== null) ? canvases[canvasId].size : 1024;

    const x = parseInt(almost[1], 10);
    const y = parseInt(almost[2], 10);
    let urlscale = parseInt(almost[3], 10);
    if (isNaN(x) || isNaN(y)) {
      const thrown = 'NaN';
      throw thrown;
    }
    if (!urlscale || isNaN(urlscale)) {
      urlscale = DEFAULT_SCALE;
    } else {
      urlscale = 2 ** (urlscale / 10);
    }
    urlscale = clamp(urlscale, TILE_SIZE / canvasSize, MAX_SCALE);
    return {
      canvasId,
      canvasIdent,
      canvasSize,
      canvasMaxTiledZoom: getMaxTiledZoom(canvasSize),
      palette: new Palette(colors, 0),
      view: [x, y],
      viewscale: urlscale,
      scale: urlscale,
      canvases,
    };
  } catch (error) {
    return {
      canvasId: DEFAULT_CANVAS_ID,
      canvasIdent: canvases[DEFAULT_CANVAS_ID].ident,
      canvasSize: canvases[DEFAULT_CANVAS_ID].size,
      canvasMaxTiledZoom: getMaxTiledZoom(canvases[DEFAULT_CANVAS_ID].size),
      palette: new Palette(canvases[DEFAULT_CANVAS_ID].colors, 0),
      view: getGivenCoords(),
      viewscale: DEFAULT_SCALE,
      scale: DEFAULT_SCALE,
    };
  }
}

const initialState: CanvasState = {
  chunks: new Map(),
  ...getViewFromURL(DEFAULT_CANVASES),
  requested: new Set(),
  fetchs: 0,
  isHistoricalView: false,
  historicalDate: null,
  historicalTime: null,
};


export default function gui(
  state: CanvasState = initialState,
  action: Action,
): CanvasState {
  switch (action.type) {
    case 'PLACE_PIXEL': {
      const {
        chunks, canvasMaxTiledZoom, palette, canvasSize,
      } = state;
      const { coordinates, color } = action;

      const [cx, cy] = getChunkOfPixel(coordinates, canvasSize);
      const key = ChunkRGB.getKey(canvasMaxTiledZoom, cx, cy);
      let chunk = chunks.get(key);
      if (!chunk) {
        chunk = new ChunkRGB(palette, [canvasMaxTiledZoom, cx, cy]);
        chunks.set(chunk.key, chunk);
      }

      // redis prediction
      chunk.setColor(
        getCellInsideChunk(coordinates),
        color,
      );
      return {
        ...state,
        chunks,
      };
    }

    case 'SET_SCALE': {
      let {
        view,
        viewscale,
      } = state;
      const {
        canvasSize,
        isHistoricalView,
      } = state;

      let [hx, hy] = view;
      let { scale } = action;
      const { zoompoint } = action;
      const minScale = (isHistoricalView) ? 0.7 : TILE_SIZE / canvasSize;
      scale = clamp(scale, minScale, MAX_SCALE);
      if (zoompoint) {
        let scalediff = viewscale;
        // clamp to 1.0 (just do this when zoompoint is given, or it would mess with phones)
        viewscale = (scale > 0.85 && scale < 1.20) ? 1.0 : scale;
        // make sure that zoompoint is on the same space
        // after zooming
        scalediff /= viewscale;
        const [px, py] = zoompoint;
        hx = px + (hx - px) * scalediff;
        hy = py + (hy - py) * scalediff;
      } else {
        viewscale = scale;
      }
      const canvasMinXY = -canvasSize / 2;
      const canvasMaxXY = canvasSize / 2 - 1;
      view = [hx, hy].map((z) => clamp(z, canvasMinXY, canvasMaxXY));
      return {
        ...state,
        view,
        scale,
        viewscale,
      };
    }

    case 'SET_HISTORICAL_TIME': {
      const {
        date,
        time,
      } = action;
      return {
        ...state,
        historicalDate: date,
        historicalTime: time,
      };
    }

    case 'TOGGLE_HISTORICAL_VIEW': {
      const {
        scale,
        viewscale,
      } = state;
      return {
        ...state,
        scale: (scale < 1.0) ? 1.0 : scale,
        viewscale: (viewscale < 1.0) ? 1.0 : viewscale,
        isHistoricalView: !state.isHistoricalView,
      };
    }

    case 'SET_VIEW_COORDINATES': {
      const { view } = action;
      const { canvasSize } = state;
      const canvasMinXY = -canvasSize / 2;
      const canvasMaxXY = canvasSize / 2 - 1;
      const newview = view.map((z) => clamp(z, canvasMinXY, canvasMaxXY));
      return {
        ...state,
        view: newview,
      };
    }

    case 'RELOAD_URL': {
      const { canvasId, chunks, canvases } = state;
      const nextstate = getViewFromURL(canvases);
      if (nextstate.canvasId !== canvasId) {
        chunks.clear();
      }
      return {
        ...state,
        ...nextstate,
      };
    }

    /*
     * set url coordinates
     */
    case 'ON_VIEW_FINISH_CHANGE': {
      const { view, viewscale, canvasIdent } = state;
      let [x, y] = view;
      x = Math.round(x);
      y = Math.round(y);
      const scale = Math.round(Math.log2(viewscale) * 10);
      const newhash = `#${canvasIdent},${x},${y},${scale}`;
      window.history.replaceState(undefined, undefined, newhash);
      return {
        ...state,
      };
    }

    case 'REQUEST_BIG_CHUNK': {
      const {
        palette, chunks, fetchs, requested,
      } = state;
      const { center } = action;

      const chunkRGB = new ChunkRGB(palette, center);
      // chunkRGB.preLoad(chunks);
      const { key } = chunkRGB;
      chunks.set(key, chunkRGB);

      requested.add(key);
      return {
        ...state,
        chunks,
        fetchs: fetchs + 1,
        requested,
      };
    }

    case 'RECEIVE_BIG_CHUNK': {
      const { chunks, fetchs } = state;
      const { center, arrayBuffer } = action;

      const key = ChunkRGB.getKey(...center);
      const chunk = chunks.get(key);
      chunk.isBasechunk = true;
      if (arrayBuffer.byteLength) {
        const chunkArray = new Uint8Array(arrayBuffer);
        chunk.fromBuffer(chunkArray);
      } else {
        chunk.empty();
      }

      return {
        ...state,
        chunks,
        fetchs: fetchs + 1,
      };
    }

    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      const { chunks, fetchs } = state;
      const { center } = action;

      const key = ChunkRGB.getKey(...center);
      const chunk = chunks.get(key);
      chunk.empty();

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'RECEIVE_IMAGE_TILE': {
      const { chunks, fetchs } = state;
      const { center, tile } = action;

      const key = ChunkRGB.getKey(...center);
      const chunk = chunks.get(key);
      chunk.fromImage(tile);

      return {
        ...state,
        chunks,
        fetchs: fetchs + 1,
      };
    }

    case 'RECEIVE_PIXEL_UPDATE': {
      const { chunks, canvasMaxTiledZoom } = state;
      // i, j: Coordinates of chunk
      // offset: Offset of pixel within said chunk
      const {
        i, j, offset, color,
      } = action;

      const key = ChunkRGB.getKey(canvasMaxTiledZoom, i, j);
      const chunk = chunks.get(key);

      // ignore because is not seen
      if (!chunk) return state;

      const ix = offset % TILE_SIZE;
      const iy = Math.floor(offset / TILE_SIZE);
      chunk.setColor([ix, iy], color);

      return {
        ...state,
        chunks,
      };
    }

    case 'SELECT_CANVAS': {
      const { canvasId } = action;
      const { canvases, chunks } = state;

      chunks.clear();
      const canvas = canvases[canvasId];
      const canvasIdent = canvas.ident;
      const canvasSize = canvases[canvasId].size;
      const canvasMaxTiledZoom = getMaxTiledZoom(canvasSize);
      const palette = new Palette(canvas.colors, 0);
      const view = (canvasId === 0) ? getGivenCoords() : [0, 0];
      chunks.clear();
      return {
        ...state,
        canvasId,
        canvasIdent,
        canvasSize,
        canvasMaxTiledZoom,
        palette,
        view,
        viewscale: DEFAULT_SCALE,
        scale: DEFAULT_SCALE,
      };
    }

    case 'RECEIVE_ME': {
      const { canvases } = action;
      let { canvasIdent } = state;

      let canvasId = getIdFromObject(canvases, canvasIdent);
      if (canvasId === null) {
        canvasId = DEFAULT_CANVAS_ID;
        canvasIdent = canvases[DEFAULT_CANVAS_ID].ident;
      }
      const canvasSize = canvases[canvasId].size;
      const canvasMaxTiledZoom = getMaxTiledZoom(canvasSize);
      const palette = new Palette(canvases[canvasId].colors, 0);

      return {
        ...state,
        canvasId,
        canvasIdent,
        canvasSize,
        canvasMaxTiledZoom,
        palette,
        canvases,
      };
    }

    default:
      return state;
  }
}
