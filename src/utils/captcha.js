/**
 *
 * @flow
 */

import fetch from 'isomorphic-fetch';
import logger from '../core/logger';
import redis from '../data/redis';

import {
  CAPTCHA_SECRET,
  CAPTCHA_TIME,
} from '../core/config';

const TTL_CACHE = CAPTCHA_TIME * 60; // seconds
const BASE_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';
const ENDPOINT = `${BASE_ENDPOINT}?secret=${CAPTCHA_SECRET}`;

/**
 * https://stackoverflow.com/questions/27297067/google-recaptcha-how-to-get-user-response-and-validate-in-the-server-side
 *
 * @param token
 * @param ip
 * @returns {Promise.<boolean>}
 */
async function verifyReCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  if (!CAPTCHA_SECRET) {
    logger.info('Got captcha token but reCaptcha isn\'t configured?!');
    return true;
  }
  const url = `${ENDPOINT}&response=${token}&remoteip=${ip}`;
  const response = await fetch(url);
  if (response.ok) {
    const { success } = await response.json();
    if (success) {
      logger.info(`CAPTCHA ${ip} successfully solved captcha`);
      return true;
    }
    logger.info(`CAPTCHA Token for ${ip} not ok`);
  } else {
    logger.warn(`CAPTCHA Recapcha answer for ${ip} not ok`);
  }
  return false;
}

/*
 * verify captcha token from client
 *
 * @param token token of solved captcha from client
 * @param ip
 * @returns Boolean if successful
 */
export async function verifyCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  try {
    if (!CAPTCHA_SECRET) {
      return true;
    }
    const key = `human:${ip}`;

    const ttl: number = await redis.ttlAsync(key);
    if (ttl > 0) {
      return true;
    }
    if (!await verifyReCaptcha(token, ip)) {
      return false;
    }

    await redis.setAsync(key, '', 'EX', TTL_CACHE);
    return true;
  } catch (error) {
    logger.error(error);
  }
  return false;
}

/*
 * check if captcha is needed
 *
 * @param ip
 * @return boolean true if needed
 */
export async function needCaptcha(ip: string) {
  if (!CAPTCHA_SECRET) {
    return false;
  }

  const key = `human:${ip}`;
  const ttl: number = await redis.ttlAsync(key);
  if (ttl > 0) {
    return false;
  }
  logger.info(`CAPTCHA ${ip} got captcha`);
  return true;
}


export default verifyCaptcha;
