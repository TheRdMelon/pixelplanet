/* @flow */

import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore } from 'redux-persist';

import audio from './audio';
import swal from './sweetAlert';
import protocolClientHook from './protocolClientHook';
import rendererHook from './rendererHook';
// import ads from './ads';
// import analytics from './analytics';
import array from './array';
import promise from './promise';
import notifications from './notifications';
import title from './title';
import reducers from '../reducers';

const isDebuggingInChrome = __DEV__ && !!window.navigator.userAgent;

const logger = createLogger({
  predicate: () => isDebuggingInChrome,
  collapsed: true,
  duration: true,
});

const store = createStore(
  reducers,
  undefined,
  compose(
    applyMiddleware(
      thunk,
      promise,
      array,
      swal,
      audio,
      notifications,
      title,
      protocolClientHook,
      rendererHook,
      // ads,
      // analytics,
      logger,
    ),
  ),
);

export default function configureStore(onComplete: ?() => void) {
  persistStore(store, null, onComplete);
  if (isDebuggingInChrome) {
    window.store = store;
  }
  return store;
}
