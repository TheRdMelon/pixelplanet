/* @flow */

import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { persistStore, autoRehydrate } from 'redux-persist';

import ads from './ads';
import audio from './audio';
import analytics from './analytics';
import array from './array';
import promise from './promise';
import notifications from './notifications';
import title from './title';
import reducers from '../reducers';


const isDebuggingInChrome = __DEV__ && !!window.navigator.userAgent;

const logger = createLogger({
  predicate: (getState, action) => isDebuggingInChrome,
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
      ads,
      audio,
      notifications,
      title,
      analytics,
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
