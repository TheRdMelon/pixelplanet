/**
 *
 * @flow
 */

import configureStore from '../store/configureStore';
import { getRenderer } from './renderer';
import { fetchOwnFactions } from '../actions';

const store = configureStore(() => {
  getRenderer().forceNextRender = true;
  store.dispatch(fetchOwnFactions(store.getState().gui.selectedFaction));
});

export default store;
