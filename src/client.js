/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!
import Hammer from 'hammerjs';

import './components/font.css';

import {
  screenToWorld,
  getColorIndexOfPixel,
} from './core/utils';

import type { State } from './reducers';
import initAds, { requestAds } from './ui/ads';
import {
  tryPlacePixel,
  setHover,
  unsetHover,
  setViewCoordinates,
  setScale,
  zoomIn,
  zoomOut,
  receivePixelUpdate,
  receiveCoolDown,
  fetchMe,
  fetchStats,
  initTimer,
  urlChange,
  onViewFinishChange,
  receiveOnline,
  receiveChatMessage,
  receiveChatHistory,
  selectColor,
} from './actions';
import store from './ui/store';

import onKeyPress from './ui/keypress';

import App from './components/App';

import renderer from './ui/Renderer';
import ProtocolClient from './socket/ProtocolClient';

window.addEventListener('keydown', onKeyPress, false);


function initViewport() {
  const canvas = document.getElementById('gameWindow');

  const viewport = canvas;
  viewport.width = window.innerWidth;
  viewport.height = window.innerHeight;

  // track hover
  viewport.onmousemove = ({ clientX, clientY }: MouseEvent) => {
    store.dispatch(setHover([clientX, clientY]));
  };
  viewport.onmouseout = () => {
    store.dispatch(unsetHover());
  };
  viewport.onwheel = ({ deltaY }: WheelEvent) => {
    const state = store.getState();
    const { hover } = state.gui;
    let zoompoint = null;
    if (hover) {
      zoompoint = screenToWorld(state, viewport, hover);
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
    const clrIndex = getColorIndexOfPixel(state, coords);
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
    const { autoZoomIn } = state.gui;
    const { placeAllowed } = state.user;

    const { scale } = state.canvas;
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

    // TODO assert only one finger
    store.dispatch(tryPlacePixel(cell));
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
      store.dispatch(setViewCoordinates([
        window.lastPosX - (deltaX / viewportScale),
        window.lastPosY - (deltaY / viewportScale),
      ]));

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

  return viewport;
}


document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('app'),
  );

  const viewport = initViewport();
  renderer.setViewport(viewport, store);

  ProtocolClient.on('pixelUpdate', ({
    i, j, offset, color,
  }) => {
    store.dispatch(receivePixelUpdate(i, j, offset, color));
    // render updated pixel
    renderer.renderPixel(i, j, offset, color);
  });
  ProtocolClient.on('cooldownPacket', (waitSeconds) => {
    console.log(`Received CoolDown ${waitSeconds}`);
    store.dispatch(receiveCoolDown(waitSeconds));
  });
  ProtocolClient.on('onlineCounter', ({ online }) => {
    store.dispatch(receiveOnline(online));
  });
  ProtocolClient.on('chatMessage', (name, text) => {
    store.dispatch(receiveChatMessage(name, text));
  });
  ProtocolClient.on('chatHistory', (data) => {
    store.dispatch(receiveChatHistory(data));
  });
  ProtocolClient.on('changedMe', () => {
    store.dispatch(fetchMe());
  });

  window.addEventListener('resize', () => {
    viewport.width = window.innerWidth;
    viewport.height = window.innerHeight;
    renderer.forceNextRender = true;
  });
  window.addEventListener('hashchange', () => {
    store.dispatch(urlChange());
  });

  store.subscribe(() => {
    // const state: State = store.getState();
    // this gets executed when store changes
  });

  store.dispatch(initTimer());

  function animationLoop() {
    renderer.render(viewport);
    window.requestAnimationFrame(animationLoop);
  }
  animationLoop();

  store.dispatch(fetchMe());
  ProtocolClient.connect();

  store.dispatch(fetchStats());
  setInterval(() => { store.dispatch(fetchStats()); }, 300000);

  // garbage collection
  function runGC() {
    const state: State = store.getState();
    const { chunks } = state.canvas;

    const curTime = Date.now();
    let cnt = 0;
    chunks.forEach((value, key) => {
      if (curTime > value.timestamp + 300000) {
        cnt++;
        const [z, i, j] = value.cell;
        if (!renderer.isChunkInView(z, i, j)) {
          if (value.isBasechunk) {
            ProtocolClient.deRegisterChunk([i, j]);
          }
          chunks.delete(key);
        }
      }
    });
    console.log('Garbage collection cleaned', cnt, 'chunks');
  }
  setInterval(runGC, 300000);
});
