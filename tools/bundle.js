/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import fs from 'fs';
import webpack from 'webpack';
import webpackConfig from './webpack.config';

/**
 * Creates application bundles from the source files.
 */
function bundle() {
  try {
    /* fix image-q imports here
     * Pretty dirty, but we did write an issue and they might
     * update one day
     */
    console.log('Pathing image-q set-immediate import');
    const regex = /core-js\/fn\/set-immediate/g;
    const files = [
      './node_modules/image-q/dist/esm/basicAPI.js',
      './node_modules/image-q/dist/esm/helper.js',
    ];
    files.forEach((file) => {
      let fileContent = fs.readFileSync(file,'utf8');
      fileContent = fileContent.replace(regex, 'core-js/features/set-immediate');
      fs.writeFileSync(file, fileContent);
    });
    console.log('Pathing image-q done');
  } catch {
    console.log('Error while patching image-q');
  }
  return new Promise((resolve, reject) => {
    webpack(webpackConfig).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.log(stats.toString(webpackConfig[0].stats));
      return resolve();
    });
  });
}

export default bundle;
