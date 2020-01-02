/* @flow */

import path from 'path';
import compression from 'compression';
import express from 'express';
import http from 'http';
import etag from 'etag';
import React from 'react';
import ReactDOM from 'react-dom/server';
import expressValidator from 'express-validator';


// import baseCss from './components/base.tcss';
import forceGC from './core/forceGC';
import Html from './components/Html';
import assets from './assets.json'; // eslint-disable-line import/no-unresolved
import logger from './core/logger';
import models from './data/models';

import {
  api,
  tiles,
  chunks,
  admintools,
  resetPassword,
} from './routes';
import { SECOND, MONTH } from './core/constants';
import { PORT, ASSET_SERVER, DISCORD_INVITE } from './core/config';

import { ccToCoords } from './utils/location';
import { wsupgrade } from './socket/websockets';
import { startAllCanvasLoops } from './core/tileserver';

startAllCanvasLoops();


const app = express();
app.disable('x-powered-by');


// Call Garbage Collector every 30 seconds
setInterval(forceGC, 15 * 60 * SECOND);

// create websocket
const server = http.createServer(app);
server.on('upgrade', wsupgrade);


/*
 * using validator to check user input
 */
app.use(expressValidator());


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
app.use(compression({ level: 3,
  filter: (req, res) => {
    if (res.getHeader('Content-Type') === 'application/octet-stream') {
      return true;
    }
    return compression.filter(req, res);
  } }));


//
// public folder
// (this should be served with nginx or other webserver)
// -----------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 3 * MONTH,
  extensions: ['html'],
}));


//
// Redirecct to discord
// -----------------------------------------------------------------------------
app.use('/discord', (req, res) => {
  res.redirect(DISCORD_INVITE);
});


//
// Serving Chunks
// -----------------------------------------------------------------------------
app.get('/chunks/:c([0-9]+)/:x([0-9]+)/:y([0-9]+).bmp', chunks);


//
// Admintools
// -----------------------------------------------------------------------------
app.use('/admintools', admintools);

//
// Password Reset Link
// -----------------------------------------------------------------------------
app.use('/reset_password', resetPassword);


//
// Register server-side rendering middleware
// -----------------------------------------------------------------------------
const data = {
  title: 'PixelPlanet.fun',
  description: 'Place color pixels on an map styled canvas ' +
  'with other players online',
  //  styles: [
  //    { id: 'css', cssText: baseCss },
  //  ],
  scripts: [
    ASSET_SERVER + assets.vendor.js,
    ASSET_SERVER + assets.client.js,
  ],
};
const indexEtag = etag(
  `${assets.vendor.js},${assets.client.js}`,
  { weak: true },
);

app.get('/', async (req, res) => {
  res.set({
    'Cache-Control': `private, max-age=${15 * 60}`, // seconds
    ETag: indexEtag,
  });

  if (req.headers['if-none-match'] === indexEtag) {
    res.status(304).end();
    return;
  }

  // get start coordinates based on cloudflare header country
  const country = req.headers['cf-ipcountry'];
  const [x, y] = (country) ? ccToCoords(country) : [0, 0];
  const code =
    `window.coordx=${x};window.coordy=${y};window.assetserver="${ASSET_SERVER}";`;
  const htmldata = { ...data, code };
  const html = ReactDOM.renderToStaticMarkup(<Html {...htmldata} />);
  const index = `<!doctype html>${html}`;

  res.send(index);
});


//
// ip config
// -----------------------------------------------------------------------------
const promise = models.sync().catch(err => logger.error(err.stack));
promise.then(() => {
  server.listen(PORT, () => {
    const address = server.address();
    logger.log('info', `web is running at http://localhost:${address.port}/`);
  });
});
