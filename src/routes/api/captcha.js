/*
 * This is just for verifying captcha tokens,
 * the actual notification that a captcha is needed is sent
 * with the pixel return answer when sending apixel on websocket
 *
 * @flow
 */
import type { Request, Response } from 'express';

import logger from '../../core/logger';
import { verifyCaptcha } from '../../utils/captcha';
import { getIPFromRequest } from '../../utils/ip';

export default async (req: Request, res: Response) => {
  const ip = getIPFromRequest(req);

  try {
    const { token } = req.body;
    if (!token) {
      res.status(400)
        .json({ errors: [{ msg: 'No token given' }] });
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
