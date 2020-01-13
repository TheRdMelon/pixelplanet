/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import renderer from './Renderer';

const store = configureStore(() => {
  renderer.forceNextRender = true;
});

export default store;
