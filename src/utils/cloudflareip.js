/*
 * check if IP is from cloudflare
 * @flow
 */

import { Address4, Address6 } from 'ip-address';

// returns undefined | Address4 | Address6
function intoAddress(str) {
  if (typeof str === 'string') str = str.trim();
  let ip = new Address6(str);
  if (ip.v4 && !ip.valid) {
    ip = new Address4(str);
  }
  if (!ip.valid) return null;
  return ip;
}

const cloudflareIps = [
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '104.16.0.0/12',
  '108.162.192.0/18',
  '131.0.72.0/22',
  '141.101.64.0/18',
  '162.158.0.0/15',
  '172.64.0.0/13',
  '173.245.48.0/20',
  '188.114.96.0/20',
  '190.93.240.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '2400:cb00::/32',
  '2405:8100::/32',
  '2405:b500::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2c0f:f248::/32',
  '2a06:98c0::/29',
].map(intoAddress);

// returns bool
function isCloudflareIp(testIpString: string): boolean {
  if (!testIpString) return false;
  const testIp = intoAddress(testIpString);
  if (!testIp) return false;
  return cloudflareIps.some((cf) => testIp.isInSubnet(cf));
}

export default isCloudflareIp;
