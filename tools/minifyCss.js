/*
 *
 * @flow
 */

import fs from 'fs';
import CleanCSS from 'clean-css';
import crypto from 'crypto';

const FOLDER = './src/styles';
const FILES = [
  'default.css',
  'dark.css',
  'light-round.css',
  'dark-round.css',
  'arkeros.css',
];

async function minifyCss() {
  console.log('Minifying css');
  const assets = {};
  FILES.forEach((file) => {
    const input = fs.readFileSync(`${FOLDER}/${file}`, 'utf8');
    const options = {};
    const output = new CleanCSS(options).minify(input);
    if (output.warnings && output.warnings.length > 0) {
      for (let i = 0; i < output.warnings.length; i += 1) {
        console.log('\x1b[33m%s\x1b[0m', output.warnings[i]);
      }
    }
    if (output.errors && output.errors.length > 0) {
      for (let i = 0; i < output.errors.length; i += 1) {
        console.log('\x1b[31m%s\x1b[0m', output.errors[i]);
      }
      throw new Error("Minify CSS Error Occured");
    }
    // eslint-disable-next-line max-len
    console.log('\x1b[33m%s\x1b[0m', `Minified ${file} by ${Math.round(output.stats.efficiency * 100)}%`);
    const hash = crypto.createHash('md5').update(output.styles).digest('hex');
    const key = file.substr(0, file.indexOf('.'));
    const filename = `${key}.${hash.substr(0, 8)}.css`;
    fs.writeFileSync(`./build/public/assets/${filename}`, output.styles, 'utf8');
    assets[key] = `/assets/${filename}`;
  });
  const json = JSON.stringify(assets);
  fs.writeFileSync('./build/styleassets.json', json);
}

export default minifyCss;
