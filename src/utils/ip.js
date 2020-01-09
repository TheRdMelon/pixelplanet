/**
 *
 * @flow
 */

import isCloudflareIp from './cloudflareip';

import logger from '../core/logger';

import { USE_XREALIP } from '../core/config';


function isTrustedProxy(ip: string): boolean {
  if (ip === '::ffff:127.0.0.1' || ip === '127.0.0.1' || isCloudflareIp(ip)) {
    return true;
  }
  return false;
}

export function getHostFromRequest(req): ?string {
  const { headers } = req;
  const host = headers['x-forwarded-host'] || headers.host;
  const proto = headers['x-forwarded-proto'] || 'http';

  return `${proto}://${host}`;
}

export async function getIPFromRequest(req): ?string {
  const { socket, connection, headers } = req;

  const conip = (connection ? connection.remoteAddress : socket.remoteAddress);

  if (USE_XREALIP) {
    const ip = headers['x-real-ip'];
    return ip || conip;
  }

  if (!headers['x-forwarded-for'] || !isTrustedProxy(conip)) {
    // eslint-disable-next-line max-len
    logger.warn(`Connection not going through nginx and cloudflare! IP: ${conip}`, headers);
    return conip;
  }

  const forwardedFor = headers['x-forwarded-for'];
  const ipList = forwardedFor.split(',').map((str) => str.trim());

  let ip = ipList.pop();
  while (isTrustedProxy(ip) && ipList.length) {
    ip = ipList.pop();
  }

  // logger.info('Proxied Connection allowed', ip, forwardedFor);
  return ip;
}

export function getIPv6Subnet(ip: string): string {
  if (ip.includes(':')) {
    // eslint-disable-next-line max-len
    const ipv6sub = `${ip.split(':').slice(0, 4).join(':')}:0000:0000:0000:0000`;
    // logger.warn("IPv6 subnet: ", ipv6sub);
    return ipv6sub;
  }
  return ip;
}
