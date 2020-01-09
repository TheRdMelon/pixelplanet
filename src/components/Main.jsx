/*
 * Html for mainpage
 *
 * @flow
 */


import React from 'react';
import ReactDOM from 'react-dom/server';

import Html from './Html';
import assets from './assets.json';
import { ASSET_SERVER, BACKUP_URL } from '../core/config';

const data = {
  title: 'PixelPlanet.fun',
  description: 'Place color pixels on an map styled canvas '
  + 'with other players online',
  //  styles: [
  //    { id: 'css', cssText: baseCss },
  //  ],
  scripts: [
    ASSET_SERVER + assets.vendor.js,
    ASSET_SERVER + assets.client.js,
  ],
  useRecaptcha: true,
};

/*
 * generates string with html of main page
 * including setting global variables for countryCoords
 * and assetserver
 * @param countryCoords Cell with coordinates of client country
 * @return html of mainpage
 */
function generateMainPage(countryCoords: Cell): string {
  const [x, y] = countryCoords;
  let code = `window.coordx=${x};window.coordy=${y};window.assetserver="${ASSET_SERVER}";`;
  if (BACKUP_URL) {
    code += `window.backupurl="${BACKUP_URL}";`;
  }
  const htmldata = { ...data, code };
  const html = ReactDOM.renderToStaticMarkup(<Html {...htmldata} />);

  return `<!doctype html>${html}`;
}

export default generateMainPage;
