/**
 *
 * @flow
 */

import {
  durationToString,
} from '../core/utils';


const TITLE = 'PixelPlanet.fun';

let lastTitle = null;

export default (store) => (next) => (action) => {
  const ret = next(action);

  switch (action.type) {
    case 'COOLDOWN_SET': {
      const { coolDown } = store.getState().user;
      const title = `${durationToString(coolDown, true)} | ${TITLE}`;
      if (lastTitle === title) break;
      lastTitle = title;
      document.title = title;
      break;
    }

    case 'COOLDOWN_END': {
      document.title = TITLE;
      break;
    }


    case 'SELECT_CANVAS':
    case 'ON_VIEW_FINISH_CHANGE': {
      const {
        view,
        viewscale,
        canvasIdent,
      } = store.getState().canvas;
      let [x, y] = view;
      x = Math.round(x);
      y = Math.round(y);
      const scale = Math.round(Math.log2(viewscale) * 10);
      const newhash = `#${canvasIdent},${x},${y},${scale}`;
      window.history.replaceState(undefined, undefined, newhash);
      break;
    }

    default:
    // nothing
  }

  return ret;
};
