/*
 *
 * implements a fetch that always chooses a random proxy from a list
 * of http proxies
 *
*/

import isoFetch from 'isomorphic-fetch';
import HttpProxyAgent from 'http-proxy-agent';
import proxylist from '../proxies.json';

import logger from '../core/logger';

function randomProxyURL() {
  const rand = proxylist[Math.floor(Math.random() * proxylist.length)];
  logger.info(`choosesn fetch proxy ${rand}`);
  return rand;
}

function fetch(url, options = {}) {
  if (proxylist.length === 0) {
    return isoFetch(url, options);
  }
  const agent = new HttpProxyAgent(randomProxyURL());

  return isoFetch(url, {
    ...options,
    agent,
  });
}

export default fetch;
