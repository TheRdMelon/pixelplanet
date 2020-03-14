/* @flow */

import type { Action } from '../actions/types';
import type { Cell } from '../core/Cell';
import Palette from '../core/Palette';
import { getMaxTiledZoom, clamp, getIdFromObject } from '../core/utils';

import {
  MAX_SCALE,
  DEFAULT_SCALE,
  DEFAULT_CANVAS_ID,
  DEFAULT_CANVASES,
  TILE_SIZE,
} from '../core/constants';

export type CanvasState = {
  canvasId: number,
  canvasIdent: string,
  is3D: boolean,
  canvasSize: number,
  canvasMaxTiledZoom: number,
  canvasStartDate: string,
  palette: Palette,
  clrIgnore: number,
  view: Cell,
  scale: number,
  viewscale: number,
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
  // if (window.coordx && window.coordy) return [window.coordx, window.coordy];
  return [0, 0, 0];
}

/*
 * parse url hash and sets view to coordinates
 * @param canvases Object with all canvas informations
 * @return view, viewscale and scale for state
 */
function getViewFromURL(canvases: Object) {
  const { hash } = window.location;
  try {
    const almost = hash.substring(1).split(',');

    const canvasIdent = almost[0];
    // will be null if not in DEFAULT_CANVASES
    const canvasId = getIdFromObject(canvases, almost[0]);

    // canvasId is null if canvas data isn't loaded yet and it's not
    // the default canvas.
    // ie those few milliseconds before /api/me
    // eslint-disable-next-line max-len
    const canvas = canvasId === null ? canvases[DEFAULT_CANVAS_ID] : canvases[canvasId];
    const {
      colors,
      cli: clrIgnore,
      sd: canvasStartDate,
      size: canvasSize,
    } = canvas;
    const is3D = !!canvas.v;

    const x = parseInt(almost[1], 10);
    const y = parseInt(almost[2], 10);
    const z = parseInt(almost[3], 10);
    if (Number.isNaN(x) || Number.isNaN(y) || (Number.isNaN(z) && is3D)) {
      throw new Error('NaN');
    }
    const view = [x, y, z];

    let scale = z;
    if (!scale || Number.isNaN(scale)) {
      scale = DEFAULT_SCALE;
    } else {
      scale = 2 ** (scale / 10);
    }

    if (!is3D && canvasId !== null) {
      scale = clamp(scale, TILE_SIZE / canvasSize, MAX_SCALE);
      view.length = 2;
    }

    return {
      canvasId,
      canvasIdent,
      canvasSize,
      is3D,
      canvasStartDate,
      canvasMaxTiledZoom: getMaxTiledZoom(canvasSize),
      palette: new Palette(colors, 0),
      clrIgnore,
      view,
      viewscale: scale,
      scale,
      canvases,
    };
  } catch (error) {
    const canvasd = canvases[DEFAULT_CANVAS_ID];
    return {
      canvasId: DEFAULT_CANVAS_ID,
      canvasIdent: canvasd.ident,
      canvasSize: canvasd.size,
      is3D: !!canvasd.v,
      canvasStartDate: null,
      canvasMaxTiledZoom: getMaxTiledZoom(canvasd.size),
      palette: new Palette(canvasd.colors, 0),
      clrIgnore: canvasd.cli,
      view: getGivenCoords(),
      viewscale: DEFAULT_SCALE,
      scale: DEFAULT_SCALE,
    };
  }
}

const initialState: CanvasState = {
  ...getViewFromURL(DEFAULT_CANVASES),
  fetchs: 0,
  isHistoricalView: false,
  historicalDate: null,
  historicalTime: null,
};

export default function canvasReducer(
  state: CanvasState = initialState,
  action: Action,
): CanvasState {
  switch (action.type) {
    case 'SET_SCALE': {
      let { view, viewscale } = state;
      const { canvasSize, isHistoricalView } = state;

      let [hx, hy] = view;
      let { scale } = action;
      const { zoompoint } = action;
      const minScale = isHistoricalView ? 0.7 : TILE_SIZE / canvasSize;
      scale = clamp(scale, minScale, MAX_SCALE);
      if (zoompoint) {
        let scalediff = viewscale;
        // clamp to 1.0 (just do this when zoompoint is given, or it would mess with phones)
        viewscale = scale > 0.85 && scale < 1.2 ? 1.0 : scale;
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
      const { date, time } = action;
      return {
        ...state,
        historicalDate: date,
        historicalTime: time,
      };
    }

    case 'TOGGLE_HISTORICAL_VIEW': {
      const { scale, viewscale } = state;
      return {
        ...state,
        scale: scale < 1.0 ? 1.0 : scale,
        viewscale: viewscale < 1.0 ? 1.0 : viewscale,
        isHistoricalView: !state.is3D && !state.isHistoricalView,
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
      const { canvases } = state;
      const nextstate = getViewFromURL(canvases);
      return {
        ...state,
        ...nextstate,
      };
    }

    case 'REQUEST_BIG_CHUNK': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'REQUEST_BIG_TEMPLATE_CHUNK': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'RECEIVE_BIG_CHUNK': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'RECIEVE_BIG_TEMPLATE_CHUNK': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'RECIEVE_BIG_TEMPLATE_CHUNK_FAILURE': {
      const { fetchs } = state;

      return {
        ...state,
        fetchs: fetchs + 1,
      };
    }

    case 'SELECT_CANVAS': {
      let { canvasId } = action;
      const { canvases, isHistoricalView } = state;

      let canvas = canvases[canvasId];
      if (!canvas) {
        canvasId = DEFAULT_CANVAS_ID;
        canvas = canvases[DEFAULT_CANVAS_ID];
      }
      const {
        size: canvasSize,
        sd: canvasStartDate,
        ident: canvasIdent,
        v: is3D,
        cli: clrIgnore,
        colors,
      } = canvas;
      const canvasMaxTiledZoom = getMaxTiledZoom(canvasSize);
      const palette = new Palette(colors, 0);
      const view = canvasId === 0 ? getGivenCoords() : [0, 0, 0];
      if (!is3D) {
        view.length = 2;
      }
      return {
        ...state,
        canvasId,
        canvasIdent,
        canvasSize,
        is3D,
        canvasStartDate,
        canvasMaxTiledZoom,
        palette,
        clrIgnore,
        view,
        viewscale: DEFAULT_SCALE,
        scale: DEFAULT_SCALE,
        isHistoricalView: !is3D && isHistoricalView,
      };
    }

    case 'RECEIVE_ME': {
      const { canvases } = action;
      let { canvasIdent, scale, view } = state;

      let canvasId = getIdFromObject(canvases, canvasIdent);
      if (canvasId === null) {
        canvasId = DEFAULT_CANVAS_ID;
        canvasIdent = canvases[DEFAULT_CANVAS_ID].ident;
      }
      const {
        size: canvasSize,
        sd: canvasStartDate,
        v: is3D,
        cli: clrIgnore,
        colors,
      } = canvases[canvasId];
      const canvasMaxTiledZoom = getMaxTiledZoom(canvasSize);
      const palette = new Palette(colors, 0);

      if (!is3D) {
        scale = clamp(scale, TILE_SIZE / canvasSize, MAX_SCALE);
        view = [view[0], view[1]];
      }

      return {
        ...state,
        canvasId,
        canvasIdent,
        canvasSize,
        is3D,
        canvasStartDate,
        canvasMaxTiledZoom,
        palette,
        clrIgnore,
        canvases,
        viewscale: scale,
        scale,
        view,
      };
    }

    default:
      return state;
  }
}
