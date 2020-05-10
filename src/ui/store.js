/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import setStyle from './setStyle';

const store = configureStore(() => {
  const state = store.getState();
  setStyle(state.gui.style);
});

export default store;
