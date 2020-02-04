/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import { getRenderer } from './renderer';
import { fetchOwnFactions } from '../actions';

const store = configureStore(() => {
  getRenderer().forceNextRender = true;
  if (!store.getState().user.invited) {
    store.dispatch(fetchOwnFactions(store.getState().gui.selectedFaction));
  }
  window.store = store;
});

export default store;
