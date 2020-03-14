/* @flow */

import url from 'url';
import path from 'path';
import compression from 'compression';
import express from 'express';
import http from 'http';
import etag from 'etag';

// import baseCss from './components/base.tcss';
import forceGC from './core/forceGC';
import assets from './assets.json'; // eslint-disable-line import/no-unresolved
import logger from './core/logger';
import rankings from './core/ranking';
import factions from './core/factions';
import models from './data/models';

import SocketServer from './socket/SocketServer';
import APISocketServer from './socket/APISocketServer';

import {
  api,
  tiles,
  chunks,
  admintools,
  resetPassword,
  templateChunks,
} from './routes';
import globeHtml from './components/Globe';
import generateMainPage from './components/Main';

import { SECOND, MONTH } from './core/constants';
import { PORT, DISCORD_INVITE } from './core/config';

import { ccToCoords } from './utils/location';
import { startAllCanvasLoops } from './core/tileserver';

startAllCanvasLoops();

const app = express();
app.disable('x-powered-by');

// Call Garbage Collector every 30 seconds
setInterval(forceGC, 15 * 60 * SECOND);

// create http server
const server = http.createServer(app);

//
// websockets
// -----------------------------------------------------------------------------
const usersocket = new SocketServer();
const apisocket = new APISocketServer();
function wsupgrade(request, socket, head) {
  const { pathname } = url.parse(request.url);

  if (pathname === '/ws') {
    usersocket.wss.handleUpgrade(request, socket, head, (ws) => {
      usersocket.wss.emit('connection', ws, request);
    });
  } else if (pathname === '/mcws') {
    apisocket.wss.handleUpgrade(request, socket, head, (ws) => {
      apisocket.wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
}
server.on('upgrade', wsupgrade);

//
// API
// -----------------------------------------------------------------------------
app.use('/api', api);

//
// Serving Zoomed Tiless
// -----------------------------------------------------------------------------
app.use('/tiles', tiles);

/*
 * use gzip compression for following calls
/* level from -1 (default, 6) to 0 (no) from 1 (fastest) to 9 (best)
 * Set custon filter to make sure that .bmp files get compressed
 */
app.use(
  compression({
    level: 3,
    filter: (req, res) => {
      if (res.getHeader('Content-Type') === 'application/octet-stream') {
        return true;
      }
      return compression.filter(req, res);
    },
  }),
);

//
// public folder
// (this should be served with nginx or other webserver)
// -----------------------------------------------------------------------------
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: 3 * MONTH,
    extensions: ['html'],
  }),
);

//
// Redirecct to discord
// -----------------------------------------------------------------------------
app.use('/discord', (req, res) => {
  res.redirect(DISCORD_INVITE);
});

//
// Serving Chunks
// -----------------------------------------------------------------------------
app.get(
  '/chunks/templates/:c([0-9]+)/:x([0-9]+)/:y([0-9]+).bmp',
  templateChunks,
);
app.get('/chunks/:c([0-9]+)/:x([0-9]+)/:y([0-9]+)(/)?:z([0-9]+)?.bmp', chunks);

//
// Admintools
// -----------------------------------------------------------------------------
app.use('/admintools', admintools);

//
// Password Reset Link
// -----------------------------------------------------------------------------
app.use('/reset_password', resetPassword);

//
// 3D Globe (react generated)
// -----------------------------------------------------------------------------
const globeEtag = etag(`${assets.globe.js}`, { weak: true });
app.get('/globe', async (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    'Content-Type': 'text/html; charset=utf-8',
    ETag: globeEtag,
  });

  if (req.headers['if-none-match'] === globeEtag) {
    res.status(304).end();
    return;
  }

  res.status(200).send(globeHtml);
});

//
// Main Page (react generated)
// -----------------------------------------------------------------------------
const indexEtag = etag(`${assets.vendor.js},${assets.client.js}`, {
  weak: true,
});

app.get(['/', '/invite/*', '/error'], async (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    'Content-Type': 'text/html; charset=utf-8',
    ETag: indexEtag,
  });

  if (req.headers['if-none-match'] === indexEtag) {
    res.status(304).end();
    return;
  }

  // get start coordinates based on cloudflare header country
  const country = req.headers['cf-ipcountry'];
  const countryCoords = country ? ccToCoords(country) : [0, 0];

  res.status(200).send(generateMainPage(countryCoords));
});

//
// ip config
// -----------------------------------------------------------------------------

models.associate();
const promise = models.sync().catch((err) => logger.error(err.stack));
promise.then(() => {
  server.listen(PORT, () => {
    rankings.updateRanking();
    factions.update();
    factions.updateBans();
    const address = server.address();
    logger.info('info', `web is running at http://localhost:${address.port}/`);
  });
});
