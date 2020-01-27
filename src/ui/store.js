/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import { getRenderer } from './renderer';

const store = configureStore(() => {
  getRenderer().forceNextRender = true;
  // TODO: still works?
  // renderer.forceNextRender = true;
});

export default store;
