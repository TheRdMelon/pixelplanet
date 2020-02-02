/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import draw from '../../core/draw';
import {
  blacklistDetector,
  cheapDetector,
  strongDetector,
} from '../../core/isProxy';
import verifyCaptcha from '../../utils/recaptcha';
import logger from '../../core/logger';
import redis from '../../data/redis';
import {
  USE_PROXYCHECK,
  RECAPTCHA_SECRET,
  RECAPTCHA_TIME,
} from '../../core/config';

async function validate(req: Request, res: Response, next) {
  let error = null;
  const cn = parseInt(req.body.cn, 10);
  const x = parseInt(req.body.x, 10);
  const y = parseInt(req.body.y, 10);
  let z = null;
  if (typeof req.body.z !== 'undefined') {
    z = parseInt(req.body.z, 10);
  }
  const clr = parseInt(req.body.clr, 10);

  if (Number.isNaN(cn)) {
    error = 'No valid canvas selected';
  } else if (Number.isNaN(x)) {
    error = 'x is not a valid number';
  } else if (Number.isNaN(y)) {
    error = 'y is not a valid number';
  } else if (Number.isNaN(clr)) {
    error = 'No color selected';
  } else if (z !== null && Number.isNaN(z)) {
    error = 'z is not a valid number';
  }
  if (error !== null) {
    res.status(400).json({ errors: [{ msg: error }] });
    return;
  }

  req.body.cn = cn;
  req.body.x = x;
  req.body.y = y;
  req.body.z = z;
  req.body.clr = clr;

  /**
   * make sure that a user is chosen
   * req.noauthUser: user with just ip and id set
   * req.user: fully passport authenticated user
   * api/pixel just requires ip and id, so noauthUser is enough
   *   a fully authenticated user would cause more SQL requests
   */
  let { user } = req;
  if (!req.user) {
    req.user = req.noauthUser;
    user = req.user;
  }
  if (!user || !user.ip) {
    res.status(400).json({ errors: [{ msg: "Couldn't authenticate" }] });
    return;
  }

  next();
}

const TTL_CACHE = RECAPTCHA_TIME * 60; // seconds
async function checkHuman(req: Request, res: Response, next) {
  if (!RECAPTCHA_SECRET) {
    next();
    return;
  }

  const { user } = req;
  const { ip } = user;
  if (user.isAdmin()) {
    next();
    return;
  }

  try {
    const { token } = req.body;

    const key = `human:${ip}`;

    const ttl: number = await redis.ttlAsync(key);
    if (ttl > 0) {
      next();
      return;
    }

    if (!token || !(await verifyCaptcha(token, ip))) {
      logger.info(`CAPTCHA ${ip} got a captcha`);
      res.status(422).json({ errors: [{ msg: 'Captcha occured' }] });
      return;
    }

    // save to cache
    await redis.setAsync(key, 'y', 'EX', TTL_CACHE);
  } catch (error) {
    logger.error('checkHuman', error);
  }

  next();
}

// cheap check whole canvas for proxies, if USE_PROXYCHECK is one
// strongly check selective areas
async function checkProxy(req: Request, res: Response, next) {
  const { trueIp: ip } = req;
  if (USE_PROXYCHECK && ip !== '0.0.0.1') {
    /*
    //one area uses stronger detector
    const { x, y } = req.body;
    if ((x > 970 && x < 2380 && y > -11407 && y < -10597) || //nc
        (x > 4220 && x < 6050 && y > -12955 && y < -11230) || //belarius
        (x > 14840 && x < 15490 && y > -17380 && y < -16331) || //russian bot
        (x > 11189 && x < 12003 && y > 3483 && y < 4170) || //random bot
        (x > -13402 && x < -5617 && y > 1640 && y < 5300)){ //brazil
      if (!ip || await strongDetector(ip)) {
        res.status(403)
          .json({ errors: [{ msg: 'You are using a proxy!' }] });
        return;
      }
    } else {
    */
    if (!ip || (await cheapDetector(ip))) {
      res.status(403).json({ errors: [{ msg: 'You are using a proxy!' }] });
      return;
    }
    /*
    }
    */
  } else if (await blacklistDetector(ip)) {
    res
      .status(403)
      .json({ errors: [{ msg: 'You are using a proxy or got banned!' }] });
    return;
  }

  next();
}

// strongly check just specific areas for proxies
// do not proxycheck the rest
// eslint-disable-next-line no-unused-vars
async function checkProxySelective(req: Request, res: Response, next) {
  const { trueIp: ip } = req;
  if (USE_PROXYCHECK) {
    const { x, y } = req.body;
    if (x > 970 && x < 2380 && y > -11407 && y < -10597) {
      // nc
      if (!ip || (await strongDetector(ip))) {
        res.status(403).json({ errors: [{ msg: 'You are using a proxy!' }] });
        return;
      }
    }
  } else if (await blacklistDetector(ip)) {
    res
      .status(403)
      .json({ errors: [{ msg: 'You are using a proxy or got banned!' }] });
    return;
  }

  next();
}

// place pixel and return waiting time
async function place(req: Request, res: Response) {
  // https://stackoverflow.com/questions/49547/how-to-control-web-page-caching-across-all-browsers
  // https://stackoverflow.com/a/7066740
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });

  const {
    cn, x, y, z, clr,
  } = req.body;
  const { user, trueIp } = req;

  logger.info(
    // eslint-disable-next-line max-len
    `${trueIp} / ${user.id} wants to place ${clr} in (${x}, ${y}, ${z}) on canvas ${cn}`,
  );

  const {
    errorTitle,
    error,
    success,
    waitSeconds,
    coolDownSeconds,
  } = await draw(user, cn, clr, x, y, z);
  logger.log('debug', success);

  if (success) {
    res.json({ success, waitSeconds, coolDownSeconds });
  } else {
    const errors = [];
    if (error) {
      res.status(403);
      errors.push({ msg: error });
    }
    if (errorTitle) {
      res.json({
        success,
        waitSeconds,
        coolDownSeconds,
        errorTitle,
        errors,
      });
    } else {
      res.json({
        success,
        waitSeconds,
        coolDownSeconds,
        errors,
      });
    }
  }
}

export default [validate, checkHuman, checkProxy, place];
