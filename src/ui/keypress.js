/*
 * keypress actions
 */
import keycode from 'keycode';

import store from '../ui/store';
import {
  toggleGrid,
  togglePixelNotify,
  toggleMute,
  moveNorth,
  moveWest,
  moveSouth,
  moveEast,
  zoomIn,
  zoomOut,
  onViewFinishChange,
} from '../actions';


function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (event.target.nodeName == 'INPUT' || event.target.nodeName == 'TEXTAREA') return;

  switch (keycode(event)) {
    case 'up':
    case 'w':
      store.dispatch(moveNorth());
      break;
    case 'left':
    case 'a':
      store.dispatch(moveWest());
      break;
    case 'down':
    case 's':
      store.dispatch(moveSouth());
      break;
    case 'right':
    case 'd':
      store.dispatch(moveEast());
      break;
    case 'g':
      store.dispatch(toggleGrid());
      return;
    case 'c':
      store.dispatch(togglePixelNotify());
      return;
    case 'space':
      if ($viewport) $viewport.click();
      return;
    case 'm':
      store.dispatch(toggleMute());
      return;
    case '+':
    case 'e':
      store.dispatch(zoomIn());
      return;
    case '-':
    case 'q':
      store.dispatch(zoomOut());
      return;
    default:
      return;
  }
  store.dispatch(onViewFinishChange());
}

export default onKeyPress;
