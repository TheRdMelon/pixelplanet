/*
 * react html for 3D globe page
 *
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './Html';
/* this will be set by webpack */
// eslint-disable-next-line import/no-unresolved
import assets from './assets.json';
import { ASSET_SERVER } from '../core/config';

import globeCss from '../styles/globe.css';

const Globe = () => (
  <div>
    <div id="webgl" />
    <div id="coorbox">(0, 0)</div>
    <div id="info">Double click on globe to go back.</div>
    <div id="loading">Loading...</div>
  </div>
);
const styles = [{
  id: 'globe',
  cssText: globeCss,
}];

const title = 'PixelPlanet.fun 3DGlobe';
const description = '3D globe of our canvas';
const scripts = [
  ASSET_SERVER + assets.globe.js,
];
const body = <Globe />;
const globeHtml = `<!doctype html>${ReactDOM.renderToStaticMarkup(
  <Html
    title={title}
    description={description}
    scripts={scripts}
    body={body}
    styles={styles}
  />,
)}`;

export default globeHtml;
