/*
 * keypress actions
 * @flow
 */
import keycode from 'keycode';

import store from '../ui/store';
import { toggleGrid, togglePixelNotify, toggleMute } from '../actions';

function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (
    event.target.nodeName === 'INPUT'
    || event.target.nodeName === 'TEXTAREA'
  ) {
    return;
  }

  switch (keycode(event)) {
    case 'g':
      store.dispatch(toggleGrid());
      break;
    case 'c':
      store.dispatch(togglePixelNotify());
      break;
    case 'm':
      store.dispatch(toggleMute());
      break;
    default:
  }
}

export default onKeyPress;
