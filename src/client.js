/* @flow */

import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!

import './styles/font.css';

// import initAds, { requestAds } from './ui/ads';
import onKeyPress from './controls/keypress';
import {
  receivePixelUpdate,
  receiveCoolDown,
  fetchMe,
  fetchStats,
  initTimer,
  urlChange,
  receiveOnline,
  receiveChatMessage,
  receiveChatHistory,
  setMobile,
} from './actions';
import store from './ui/store';


import renderApp from './components/App';

import { initRenderer, getRenderer } from './ui/renderer';
import ProtocolClient from './socket/ProtocolClient';

function init() {
  initRenderer(store, false);

  ProtocolClient.on('pixelUpdate', ({
    i, j, offset, color,
  }) => {
    store.dispatch(receivePixelUpdate(i, j, offset, color));
  });
  ProtocolClient.on('cooldownPacket', (waitSeconds) => {
    store.dispatch(receiveCoolDown(waitSeconds));
  });
  ProtocolClient.on('onlineCounter', ({ online }) => {
    store.dispatch(receiveOnline(online));
  });
  ProtocolClient.on('chatMessage', (name, text, country, channelId) => {
    store.dispatch(receiveChatMessage(name, text, country, channelId));
  });
  ProtocolClient.on('chatHistory', (data) => {
    store.dispatch(receiveChatHistory(data));
  });
  ProtocolClient.on('changedMe', () => {
    store.dispatch(fetchMe());
  });

  window.addEventListener('hashchange', () => {
    store.dispatch(urlChange());
  });

  // check if on mobile
  //
  function checkMobile() {
    store.dispatch(setMobile(true));
    document.removeEventListener('touchstart', checkMobile, false);
  }
  document.addEventListener('touchstart', checkMobile, false);

  store.dispatch(initTimer());

  store.dispatch(fetchMe());
  ProtocolClient.connect();

  store.dispatch(fetchStats());
  setInterval(() => { store.dispatch(fetchStats()); }, 300000);

  // mess with void bot :)
  function ayylmao() {
    let cnt = 0;
    for (let i = 0; i < document.body.children.length; i += 1) {
      const node = document.body.children[i];
      if (node.nodeName === 'SCRIPT' && node.src === '') {
        cnt += 1;
      }
    }
    if (cnt > 1) {
      document.body.style.setProperty(
        '-webkit-transform', 'rotate(-180deg)',
        null,
      );
      fetch('https://assets.pixelplanet.fun/iamabot');
      window.fetch = () => true;
    }
  }
  ayylmao();
  setInterval(ayylmao, 120000);
}
init();

document.addEventListener('DOMContentLoaded', () => {
  renderApp(document.getElementById('app'));

  document.addEventListener('keydown', onKeyPress, false);

  // garbage collection
  function runGC() {
    const renderer = getRenderer();

    const chunks = renderer.getAllChunks();
    if (chunks) {
      const curTime = Date.now();
      let cnt = 0;
      chunks.forEach((value, key) => {
        if (curTime > value.timestamp + 300000) {
          cnt++;
          const [zc, xc, yc] = value.cell;
          if (!renderer.isChunkInView(zc, xc, yc)) {
            if (value.isBasechunk) {
              ProtocolClient.deRegisterChunk([xc, yc]);
            }
            chunks.delete(key);
            value.destructor();
          }
        }
      });
      // eslint-disable-next-line no-console
      console.log('Garbage collection cleaned', cnt, 'chunks');
    }
  }
  setInterval(runGC, 300000);
});
