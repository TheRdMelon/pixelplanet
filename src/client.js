/* @flow */

// eslint-disable-next-line no-unused-vars
import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!

import './styles/font.css';

// import initAds, { requestAds } from './ui/ads';
import onKeyPress from './controls/keypress';
import {
  receivePixelUpdate,
  fetchMe,
  fetchStats,
  initTimer,
  urlChange,
  receiveOnline,
  receiveCoolDown,
  receiveChatMessage,
  receiveChatHistory,
  receivePixelReturn,
  setMobile,
  tryPlacePixel,
} from './actions';
import store from './ui/store';


import renderApp from './components/App';

import { initRenderer, getRenderer } from './ui/renderer';
import ProtocolClient from './socket/ProtocolClient';

function init() {
  initRenderer(store, false);

  let nameRegExp = null;
  ProtocolClient.on('pixelUpdate', ({
    i, j, offset, color,
  }) => {
    store.dispatch(receivePixelUpdate(i, j, offset, color));
  });
  ProtocolClient.on('pixelReturn', ({
    retCode, wait, coolDownSeconds,
  }) => {
    store.dispatch(receivePixelReturn(retCode, wait, coolDownSeconds));
  });
  ProtocolClient.on('cooldownPacket', (coolDown) => {
    store.dispatch(receiveCoolDown(coolDown));
  });
  ProtocolClient.on('onlineCounter', ({ online }) => {
    store.dispatch(receiveOnline(online));
  });
  ProtocolClient.on('setWsName', (name) => {
    nameRegExp = new RegExp(`(^|\\s+)(@${name})(\\s+|$)`, 'g');
  });
  ProtocolClient.on('chatMessage', (name, text, country, channelId) => {
    const isPing = (nameRegExp && text.match(nameRegExp));
    store.dispatch(receiveChatMessage(name, text, country, channelId, isPing));
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


// on captcha received
// TODO: this really isn't beautiful
window.onCaptcha = async function onCaptcha(token: string) {
  const body = JSON.stringify({
    token,
  });
  await fetch('/api/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    // https://github.com/github/fetch/issues/349
    credentials: 'include',
  });

  const {
    i, j, offset, color,
  } = window.pixel;
  store.dispatch(tryPlacePixel(i, j, offset, color));

  if (typeof window.hcaptcha !== 'undefined') {
    window.hcaptcha.reset();
    const domBody = document.getElementsByTagName('BODY')[0];
    domBody.style.overflowY = null;
    domBody.style.overflow = 'hidden';
  } else {
    window.grecaptcha.reset();
  }
};
