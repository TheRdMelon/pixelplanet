/*
 * @flow
 */

import ccCoords from '../data/countrycode-coords-array.json';


/*
 * takes country name in two letter ISO style,
 * return canvas coords based on pre-made json list
 * @param cc Two letter country code
 * @return coords X/Y coordinates of the country on the canvas
 */
export function ccToCoords(cc: string) {
  const country = cc.toLowerCase();
  const coords = ccCoords[country];
  return (coords) || [0, 0];
}

export default ccToCoords;
