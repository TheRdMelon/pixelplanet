/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import { getRenderer } from './renderer';
import { fetchOwnFactions } from '../actions';

const store = configureStore(() => {
  getRenderer().forceNextRender = true;
  const state = store.getState();
  if (state.user.ownFactions === undefined && state.user.name !== null) {
    store.dispatch(fetchOwnFactions(store.getState().gui.selectedFaction));
  }
  window.store = store;
});

export default store;
