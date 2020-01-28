/*
 * Hooks for websocket client to store changes
 *
 * @flow
 */

import ProtocolClient from '../socket/ProtocolClient';

export default (store) => (next) => (action) => {
  switch (action.type) {
    case 'RECEIVE_BIG_CHUNK':
    case 'RECEIVE_BIG_CHUNK_FAILURE': {
      if (!action.center) {
        break;
      }
      const [, cx, cy] = action.center;
      ProtocolClient.registerChunk([cx, cy]);
      break;
    }

    case 'RECEIVE_ME': {
      const { name } = action;
      ProtocolClient.setName(name);
      break;
    }

    case 'SET_NAME': {
      const { name } = action;
      ProtocolClient.setName(name);
      break;
    }

    default:
    // nothing
  }

  const ret = next(action);

  // executed after reducers
  switch (action.type) {
    case 'RELOAD_URL':
    case 'SELECT_CANVAS':
    case 'RECEIVE_ME': {
      const state = store.getState();
      const { canvasId } = state.canvas;
      ProtocolClient.setCanvas(canvasId);
      break;
    }

    default:
    // nothing
  }

  return ret;
};
