/*
 * react html for 3D globe page
 *
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './Html';
import assets from './assets.json';
import { ASSET_SERVER } from '../core/config';

import globeCss from './globe.tcss';

const Globe = () => (
  <div>
    <style dangerouslySetInnerHTML={{ __html: globeCss }} />
    <div id="webgl" />
    <div id="coorbox">(0, 0)</div>
    <div id="info">Double click on globe to go back.</div>
    <div id="loading">Loading...</div>
  </div>
);

const data = {
  title: 'PixelPlanet.fun 3DGlobe',
  description: '3D globe of our canvas',
  scripts: [
    ASSET_SERVER + assets.globe.js,
  ],
  body: <Globe />,
};
const globeHtml = `<!doctype html>${ReactDOM.renderToStaticMarkup(<Html {...data} />)}`;

export default globeHtml;
