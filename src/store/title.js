/**
 *
 * @flow
 */

import { durationToString } from '../core/utils';

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
    case 'RECEIVE_ME':
    case 'RELOAD_URL':
    case 'ON_VIEW_FINISH_CHANGE': {
      const {
        view, viewscale, canvasIdent, is3D,
      } = store.getState().canvas;
      const coords = view.map((u) => Math.round(u)).join(',');
      let newhash = `#${canvasIdent},${coords}`;
      if (!is3D) {
        const scale = Math.round(Math.log2(viewscale) * 10);
        newhash += `,${scale}`;
      }
      window.history.replaceState(undefined, undefined, newhash);
      break;
    }

    default:
    // nothing
  }

  return ret;
};
