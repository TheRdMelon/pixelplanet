/*
 * This is just for verifying captcha tokens,
 * the actual notification that a captcha is needed is sent
 * with the pixel return answer when sending apixel on websocket
 *
 * @flow
 */
import type { Request, Response } from 'express';

import logger from '../../core/logger';
import redis from '../../data/redis';
import verifyCaptcha from '../../utils/recaptcha';

import {
  RECAPTCHA_SECRET,
  RECAPTCHA_TIME,
} from '../../core/config';

const TTL_CACHE = RECAPTCHA_TIME * 60; // seconds

export default async (req: Request, res: Response) => {
  if (!RECAPTCHA_SECRET) {
    res.status(200)
      .json({
        errors: [{
          msg:
        'No need for a captcha here',
        }],
      });
    return;
  }

  const user = req.user || req.noauthUser;
  const { ip } = user;

  try {
    const { token } = req.body;
    if (!token) {
      res.status(400)
        .json({ errors: [{ msg: 'No token given' }] });
      return;
    }

    const key = `human:${ip}`;

    const ttl: number = await redis.ttlAsync(key);
    if (ttl > 0) {
      res.status(400)
        .json({
          errors: [{
            msg:
          'Why would you even want to solve a captcha?',
          }],
        });
      return;
    }

    if (!await verifyCaptcha(token, ip)) {
      logger.info(`CAPTCHA ${ip} failed his captcha`);
      res.status(422)
        .json({
          errors: [{
            msg:
          'You failed your captcha',
          }],
        });
      return;
    }

    // save to cache
    await redis.setAsync(key, 'y', 'EX', TTL_CACHE);

    res.status(200)
      .json({ success: true });
  } catch (error) {
    logger.error('checkHuman', error);
    res.status(500)
      .json({
        errors: [{
          msg:
        'Server error occured',
        }],
      });
  }
};
