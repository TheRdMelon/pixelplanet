/**
 *
 * @flow
 */

import fetch from 'isomorphic-fetch';
import logger from '../core/logger';
import redis from '../data/redis';

import {
  CAPTCHA_METHOD,
  CAPTCHA_SECRET,
  CAPTCHA_TIME,
} from '../core/config';

const TTL_CACHE = CAPTCHA_TIME * 60; // seconds
// eslint-disable-next-line max-len
const RECAPTCHA_ENDPOINT = `https://www.google.com/recaptcha/api/siteverify?secret=${CAPTCHA_SECRET}`;
const HCAPTCHA_ENDPOINT = 'https://hcaptcha.com/siteverify';

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
  const url = `${RECAPTCHA_ENDPOINT}&response=${token}&remoteip=${ip}`;
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
 * https://docs.hcaptcha.com/
 *
 * @param token
 * @param ip
 * @return boolean, true if successful, false on error or fail
 */
async function verifyHCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  const response = await fetch(HCAPTCHA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `response=${token}&secret=${CAPTCHA_SECRET}&remoteip=${ip}`,
  });
  if (response.ok) {
    const { success } = await response.json();
    if (success) {
      logger.info(`CAPTCHA ${ip} successfully solved captcha`);
      return true;
    }
    logger.info(`CAPTCHA Token for ${ip} not ok`);
  } else {
    // eslint-disable-next-line max-len
    logger.warn(`CAPTCHA hCapcha answer for ${ip} not ok ${await response.text()}`);
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
    if (!CAPTCHA_METHOD) {
      return true;
    }
    const key = `human:${ip}`;

    switch (CAPTCHA_METHOD) {
      case 1:
        if (!await verifyReCaptcha(token, ip)) {
          return false;
        }
        break;
      case 2:
        if (!await verifyHCaptcha(token, ip)) {
          return false;
        }
        break;
      default:
        // nothing
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
  if (!CAPTCHA_METHOD) {
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
