/*
 * @flow
 * Convert a list of countrycodes to latlong -> canvas coordinates
 */

import fs from 'fs';
import countryCodeLatLong from './countrycode-latlong-array.json';

const CANVAS_SIZE = 256 * 256;
const CANVAS_MIN_XY = -(CANVAS_SIZE / 2);


/*
 * Converts lat/long to canvas coordinates
 * NOTE: our projection if off by the factor 265/256 in Y direction from common other
 *       common map projections
 * parses geo coords (lat/long) to canvas coordinates
 * @param coords lat / long
 * @return canvas coords x / y
 */
function latlong2Coords(coords) {
  const [ lat, lng ] = coords;
  const x = Math.floor(CANVAS_SIZE * ((lng + 180) / 360)) + CANVAS_MIN_XY;
  const y = (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 * CANVAS_SIZE) + CANVAS_MIN_XY) * 265/256;
  return [x, y];
}


/*
 * gets canvas coords to country
 * @param countryCode ISO two letter country code
 * @return canvas coords x / y
 */
export function country2Coords(countryCode) {
  try {
    const coords = countryCodeLatLong[countryCode].map(z => parseFloat(z));
    return latlong2Coords(coords)
  }
  catch(err) {
    console.log(`Country ${countryCode} not found.`);
    return [0, 0];
  }
}


/*
 * creates json file with country code to canvas coords
 * @param countryLatLang array with country codes to lat long
 * @param filename Output filename
 */
function createCoordsJson(filename) {
  let output = {};
  for (var cc in countryCodeLatLong) {
    output[cc] = country2Coords(cc);
  }
  fs.writeFile(filename, JSON.stringify(output), 'utf8', (a) => {});
}


createCoordsJson('countrycode-coords-array.json');
