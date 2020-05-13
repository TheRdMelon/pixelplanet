/*
 * Hooks for renderer
 *
 * @flow
 */

import {
  getRenderer,
  initRenderer,
} from '../ui/renderer';

export default (store) => (next) => (action) => {
  const { type } = action;

  if (type === 'SET_HISTORICAL_TIME') {
    const state = store.getState();
    const renderer = getRenderer();
    renderer.updateOldHistoricalTime(state.canvas.historicalTime);
  }

  // executed after reducers
  const ret = next(action);

  const state = store.getState();

  switch (type) {
    case 'RELOAD_URL':
    case 'SELECT_CANVAS':
    case 'RECEIVE_ME': {
      const renderer = getRenderer();
      const { is3D } = state.canvas;
      if (is3D === renderer.is3D) {
        renderer.updateCanvasData(state);
      } else {
        initRenderer(store, is3D);
      }
      break;
    }

    case 'SET_HISTORICAL_TIME':
    case 'REQUEST_BIG_CHUNK':
    case 'PRE_LOADED_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      const renderer = getRenderer();
      renderer.forceNextRender = true;
      break;
    }

    case 'SET_PLACE_ALLOWED': {
      const renderer = getRenderer();
      renderer.forceNextSubRender = true;
      break;
    }

    case 'TOGGLE_HISTORICAL_VIEW':
    case 'SET_SCALE': {
      const {
        viewscale,
        canvasMaxTiledZoom,
        view,
        canvasSize,
      } = state.canvas;
      const renderer = getRenderer();
      renderer.updateScale(viewscale, canvasMaxTiledZoom, view, canvasSize);
      break;
    }

    case 'RECEIVE_PIXEL_UPDATE': {
      const {
        i,
        j,
        offset,
        color,
      } = action;
      const renderer = getRenderer();
      renderer.renderPixel(i, j, offset, color);
      break;
    }

    case 'SET_VIEW_COORDINATES': {
      const { view, canvasSize } = state.canvas;
      const renderer = getRenderer();
      renderer.updateView(view, canvasSize);
      break;
    }

    default:
      // nothing
  }

  return ret;
};
