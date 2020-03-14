/* eslint-disable react/jsx-filename-extension */
/* @flow */

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import fetch from 'isomorphic-fetch'; // TODO put in the beggining with webpack!

import './components/font.css';

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
  joinFaction,
  fetchOwnFactions,
  deleteLocalFaction,
  hideModal,
  setUserFactionRank,
  fetchFactionInfo,
} from './actions';
import store from './ui/store';

import App from './components/App';
import Style from './components/Style';
import Error from './components/Error';

import { initRenderer, getRenderer } from './ui/renderer';
import ProtocolClient from './socket/ProtocolClient';

function renderAndGC() {
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
          const [z, i, j] = value.cell;
          if (!renderer.isChunkInView(z, i, j)) {
            if (value.isBasechunk) {
              ProtocolClient.deRegisterChunk([i, j]);
            }
            chunks.delete(key);
          }
        }
      });
      // eslint-disable-next-line no-console
      console.log('Garbage collection cleaned', cnt, 'chunks');
    }
  }

  ReactDOM.render(
    <Provider store={store}>
      <Style>
        <App />
      </Style>
    </Provider>,
    document.getElementById('app'),
  );
  document.addEventListener('keydown', onKeyPress, false);

  setInterval(runGC, 300000);
}

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
  ProtocolClient.on('chatMessage', (name, text) => {
    store.dispatch(receiveChatMessage(name, text));
  });
  ProtocolClient.on('chatHistory', (data) => {
    store.dispatch(receiveChatHistory(data));
  });
  ProtocolClient.on('changedMe', () => {
    store.dispatch(fetchMe());
  });
  ProtocolClient.on('factionKick', (factionId) => {
    const state = store.getState();
    const faction = state.user.factions.find((f) => f.id === factionId);
    if (faction) {
      store.dispatch(deleteLocalFaction(faction.id, !faction.private));
      const ownFactionsCount = state.user.ownFactions.length;
      if (ownFactionsCount <= 0) {
        store.dispatch(hideModal());
      }
    }
  });
  ProtocolClient.on('factionPromote', (factionId) => {
    store.dispatch(
      setUserFactionRank(store.getState().user.id, factionId, true),
    );
    store.dispatch(
      fetchFactionInfo(factionId),
    );
  });
  ProtocolClient.on('factionDemote', (factionId) => {
    store.dispatch(
      setUserFactionRank(store.getState().user.id, factionId, false),
    );
    store.dispatch(
      fetchFactionInfo(factionId),
    );
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

  store.dispatch(fetchMe()).then(() => {
    const state = store.getState();
    // eslint-disable-next-line no-underscore-dangle
    if (state._persist && state._persist.rehydrated) {
      store.dispatch(fetchOwnFactions(state.gui.selectedFaction));
    }
  });
  ProtocolClient.connect();

  store.dispatch(fetchStats());
  setInterval(() => {
    store.dispatch(fetchStats());
  }, 300000);
}

let hasDOMContentLoaded = false;

function runGame() {
  init();

  if (hasDOMContentLoaded) {
    renderAndGC();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      renderAndGC();
    });
  }
}

function loadRoute(newPath?: string) {
  if (newPath !== undefined) {
    window.history.replaceState(null, null, newPath);
  }

  const invitePattern = /^\/invite\/(.+)$/g;
  const errorPattern = /^\/error\?code=ER([0-9]{3})$/g;

  const inviteMatches = invitePattern.exec(window.location.pathname);
  const errorMatches = errorPattern.exec(
    `${window.location.pathname}${window.location.search}`,
  );

  switch (true) {
    case inviteMatches !== null:
      store.dispatch(
        joinFaction(
          inviteMatches[1],
          () => {
            init();
            renderAndGC();
          },
          (code) => {
            loadRoute(`/error?code=${code}`);
          },
        ),
      );
      break;
    case errorMatches !== null:
      ReactDOM.render(
        <Provider store={store}>
          <Style>
            <Error loadRoute={loadRoute} code={errorMatches[1]} />
          </Style>
        </Provider>,
        document.getElementById('app'),
      );
      break;
    default:
      runGame();
      break;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  hasDOMContentLoaded = true;
});

loadRoute();
