/*
 * Creates Viewport for 2D Canvas
 *
 * @flow
 */

import Hammer from 'hammerjs';
import keycode from 'keycode';

import {
  tryPlacePixel,
  setHover,
  unsetHover,
  setViewCoordinates,
  setScale,
  zoomIn,
  zoomOut,
  selectColor,
  moveNorth,
  moveWest,
  moveSouth,
  moveEast,
  onViewFinishChange,
} from '../actions';
import { screenToWorld } from '../core/utils';

let store = null;

function onKeyPress(event: KeyboardEvent) {
  // ignore key presses if modal is open or chat is used
  if (
    event.target.nodeName === 'INPUT'
    || event.target.nodeName === 'TEXTAREA'
  ) {
    return;
  }

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
    /*
    case 'space':
      if ($viewport) $viewport.click();
      return;
    */
    case '+':
    case 'e':
      store.dispatch(zoomIn());
      break;
    case '-':
    case 'q':
      store.dispatch(zoomOut());
      break;
    default:
  }
}

export function initControls(renderer, viewport: HTMLCanvasElement, curStore) {
  store = curStore;
  viewport.onmousemove = ({ clientX, clientY }: MouseEvent) => {
    const state = store.getState();
    const screenCoor = screenToWorld(state, viewport, [clientX, clientY]);
    store.dispatch(setHover(screenCoor));
  };
  viewport.onmouseout = () => {
    store.dispatch(unsetHover());
  };
  viewport.onwheel = ({ deltaY }: WheelEvent) => {
    const state = store.getState();
    const { hover } = state.gui;
    let zoompoint = null;
    if (hover) {
      zoompoint = hover;
    }
    if (deltaY < 0) {
      store.dispatch(zoomIn(zoompoint));
    }
    if (deltaY > 0) {
      store.dispatch(zoomOut(zoompoint));
    }
    store.dispatch(onViewFinishChange());
  };
  viewport.onauxclick = ({ which, clientX, clientY }: MouseEvent) => {
    // middle mouse button
    if (which !== 2) {
      return;
    }
    const state = store.getState();
    if (state.canvas.scale < 3) {
      return;
    }
    const coords = screenToWorld(state, viewport, [clientX, clientY]);
    let clrIndex = renderer.getColorIndexOfPixel(...coords, true);
    if (clrIndex === null || clrIndex === 0) {
      clrIndex = renderer.getColorIndexOfPixel(...coords);
    }
    if (clrIndex === null) {
      return;
    }
    store.dispatch(selectColor(clrIndex));
  };

  // fingers controls on touch
  const hammertime = new Hammer(viewport);
  hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
  hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
  // Zoom-in Zoom-out in touch devices
  hammertime.get('pinch').set({ enable: true });

  hammertime.on('tap', ({ center }) => {
    const state = store.getState();
    const { autoZoomIn, selectedColor } = state.gui;
    const { placeAllowed } = state.user;

    const { scale, isHistoricalView } = state.canvas;
    if (isHistoricalView) return;

    const { x, y } = center;
    const cell = screenToWorld(state, viewport, [x, y]);

    if (autoZoomIn && scale < 8) {
      store.dispatch(setViewCoordinates(cell));
      store.dispatch(setScale(12));
      return;
    }

    // don't allow placing of pixel just on low zoomlevels
    if (scale < 3) return;

    if (!placeAllowed) return;

    // dirty trick: to fetch only before multiple 3 AND on user action
    // if (pixelsPlaced % 3 === 0) requestAds();

    if (selectedColor !== renderer.getColorIndexOfPixel(...cell)) {
      store.dispatch(tryPlacePixel(cell));
    }
  });

  const initialState: State = store.getState();
  [window.lastPosX, window.lastPosY] = initialState.canvas.view;
  let lastScale = initialState.canvas.scale;
  hammertime.on(
    'panstart pinchstart pan pinch panend pinchend',
    ({
      type, deltaX, deltaY, scale,
    }) => {
      viewport.style.cursor = 'move'; // like google maps
      const { scale: viewportScale } = store.getState().canvas;

      // pinch start
      if (type === 'pinchstart') {
        store.dispatch(unsetHover());
        lastScale = viewportScale;
      }

      // panstart
      if (type === 'panstart') {
        store.dispatch(unsetHover());
        const { view: initView } = store.getState().canvas;
        [window.lastPosX, window.lastPosY] = initView;
      }

      // pinch
      if (type === 'pinch') {
        store.dispatch(setScale(lastScale * scale));
      }

      // pan
      store.dispatch(
        setViewCoordinates([
          window.lastPosX - deltaX / viewportScale,
          window.lastPosY - deltaY / viewportScale,
        ]),
      );

      // pinch end
      if (type === 'pinchend') {
        lastScale = viewportScale;
      }

      // panend
      if (type === 'panend') {
        store.dispatch(onViewFinishChange());
        const { view } = store.getState().canvas;
        [window.lastPosX, window.lastPosY] = view;
        viewport.style.cursor = 'auto';
      }
    },
  );

  document.addEventListener('keydown', onKeyPress, false);
}

export function removeControls() {
  document.removeEventListener('keydown', onKeyPress, false);
}
