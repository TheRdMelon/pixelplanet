/* @flow */
// this script checks a ip with the pixelplanet proxychecker
//

import fetch from '../src/utils/proxiedFetch.js';
import isoFetch from 'isomorphic-fetch';

/*
 * check proxycheck.io if IP is proxy
 * Use proxiedFetch with random proxies
 * @param ip IP to check
 * @return true if proxy, false if not
 */
async function getProxyCheck(ip: string): Promise<boolean> {
  const url = `http://proxycheck.io/v2/${ip}?risk=1&vpn=1&asn=1`;
  //const url = 'http://pixel.space';
  console.log('fetching proxycheck', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    }
  });
  if (!response.ok) {
    const text = await response.text();
    console.log('proxycheck not ok ' + response.status + '/' + text);
    return;
  }
  const data = await response.json();
  console.log('proxycheck.io is proxy?', ip, data);
  const ret = data.status == 'ok' && data[ip].proxy === 'yes';
  console.log(ret);
}

async function getIPIntel(ip: string): Promise<boolean> {
  const email = Math.random().toString(36).substring(8) + "-" + Math.random().toString(36).substring(4) + "@gmail.com";
  const url = `http://check.getipintel.net/check.php?ip=${ip}&contact=${email}&flags=m`;
  console.log('fetching getipintel', url);
  const response = await fetch(url, {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'de,en-US;q=0.7,en;q=0.3',
      Referer: 'http://check.getipintel.net/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    }
  });
  // TODO log response code
  if (!response.ok) {
    const text = await response.text();
    console.log('getipintel not ok ' + response.status + '/' + text);
    return;
  }
  const body = await response.text();
  console.log('fetch getipintel is proxy?', ip, body);
  // returns tru iff we found 1 in the response and was ok (http code = 200)
  const value = parseFloat(body);
  return value > 0.995;
}


const ip = '188.172.220.70';
getProxyCheck(ip);
getIPIntel(ip);
