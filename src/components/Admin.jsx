/*
 * Html for adminpage
 *
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './Html';

const Admin = () => (
  <form method="post" action="admintools" encType="multipart/form-data">
    <p>------Image Upload------</p>
    <p>file:</p>
    <select name="imageaction">
      <option value="build">build</option>
      <option value="protect">protect</option>
      <option value="wipe">wipe</option>
    </select>
    <input type="file" name="image" /><br />
    <p><span>canvasId (d: default, m: moon):</span>
      <input type="text" name="canvasident" /></p>
    <span>x:</span>
    <input type="number" name="x" min="-40000" max="40000" /><br />
    <span>y:</span>
    <input type="number" name="y" min="-40000" max="40000" /><br />
    <br />
    <p>---------IP actions---------</p>
    <select name="action">
      <option value="ban">ban</option>
      <option value="unban">unban</option>
      <option value="whitelist">whitelist</option>
      <option value="unwhitelist">unwhitelist</option>
    </select>
    <input type="text" name="ip" /><br />
    <p>-----------------------</p>
    <button type="submit" name="upload">Submit</button>
  </form>
);

const data = {
  title: 'PixelPlanet.fun AdminTools',
  description: 'admin access on pixelplanet',
  body: <Admin />,
};
const adminHtml = `<!doctype html>${ReactDOM.renderToStaticMarkup(<Html {...data} />)}`;

export default adminHtml;
