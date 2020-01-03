/**
 *
 * @flow
 */

import fetch from 'isomorphic-fetch';

import logger from '../core/logger';
import { RECAPTCHA_SECRET } from '../core/config';


const BASE_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify';
const ENDPOINT = `${BASE_ENDPOINT}?secret=${RECAPTCHA_SECRET}`;

/**
 * https://stackoverflow.com/questions/27297067/google-recaptcha-how-to-get-user-response-and-validate-in-the-server-side
 *
 * @param token
 * @param ip
 * @returns {Promise.<boolean>}
 */
async function verifyCaptcha(
  token: string,
  ip: string,
): Promise<boolean> {
  try {
    if (!RECAPTCHA_SECRET) {
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
  } catch (error) {
    logger.error(error);
  }

  return false;
}

export default verifyCaptcha;
