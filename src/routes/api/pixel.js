/**
 *
 * @flow
 */

import type { Request, Response } from 'express';
import url from 'url';
import nodeIp from 'ip';

import draw from '../../core/draw';
import { blacklistDetector, cheapDetector, strongDetector } from '../../core/isProxy';
import { verifyCaptcha } from '../../utils/recaptcha';
import logger from '../../core/logger';
import { clamp } from '../../core/utils';
import redis from '../../data/redis';
import { USE_PROXYCHECK, RECAPTCHA_SECRET, RECAPTCHA_TIME } from '../../core/config';
import {
  User,
} from '../../data/models';


async function validate(req: Request, res: Response, next) {
  // c canvas id
  req.checkBody('cn', 'No canvas selected')
    .notEmpty()
    .isInt();
  // x x coordinage
  req.checkBody('x', 'x not a valid integer')
    .notEmpty()
    .isInt();
  // y y coordinage
  req.checkBody('y', 'y not a valid integer')
    .notEmpty()
    .isInt();
  // clr color
  req.checkBody('clr', 'color not valid')
    .notEmpty()
    .isInt({ min: 2, max: 31 });

  req.sanitizeBody('cn').toInt();
  req.sanitizeBody('x').toInt();
  req.sanitizeBody('y').toInt();
  req.sanitizeBody('clr').toInt();

  const validationResult = await req.getValidationResult();
  if (!validationResult.isEmpty()) {
    res.status(400).json({ errors: validationResult.array() });
    return;
  }

  const { noauthUser } = req;
  let user = req.user;
  if (!req.user) {
    req.user = req.noauthUser;
    user = req.user;
  }
  if (!user || !user.ip) {
    res.status(400).json({ errors: ["Couldn't authenticate"] });
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
    const numIp = nodeIp.toLong(ip);

    const key = `human:${ip}:${ip}`;

    const ttl: number = await redis.ttlAsync(key);
    if (ttl > 0) {
      next();
      return;
    }

    if (!token || !await verifyCaptcha(token, ip)) {
      logger.info(`CAPTCHA ${ip} got a captcha`);
      res.status(422)
        .json({ errors: [{ msg: 'Captcha occured' }] });
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
  if (USE_PROXYCHECK && ip != '0.0.0.1') {
    const { x, y } = req.body;
    /*
    //one area uses stronger detector
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
    if (!ip || await cheapDetector(ip)) {
      res.status(403)
        .json({ errors: [{ msg: 'You are using a proxy!' }] });
      return;
    }
    /*
    }
    */
  } else if (await blacklistDetector(ip)) {
    res.status(403)
      .json({ errors: [{ msg: 'You are using a proxy or got banned!' }] });
    return;
  }

  next();
}

// strongly check just specific areas for proxies
// do not proxycheck the rest
async function checkProxySelective(req: Request, res: Response, next) {
  const { trueIp: ip } = req;
  if (USE_PROXYCHECK) {
    const { x, y } = req.body;
    if (x > 970 && x < 2380 && y > -11407 && y < -10597) { // nc
      if (!ip || await strongDetector(ip)) {
        res.status(403)
          .json({ errors: [{ msg: 'You are using a proxy!' }] });
        return;
      }
    }
  } else if (await blacklistDetector(ip)) {
    res.status(403)
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

  const { cn, x, y, clr } = req.body;
  const { user, headers, trueIp } = req;
  const { ip } = user;

  const isHashed = parseInt(req.body.a, 10) === (x + y + 8);

  logger.info(`${trueIp} / ${user.id} wants to place ${clr} in (${x}, ${y})`);

  const { errorTitle, error, success, waitSeconds, coolDownSeconds } = await draw(user, cn, x, y, clr);
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
      res.json({ success, waitSeconds, coolDownSeconds, errorTitle, errors });
    } else {
      res.json({ success, waitSeconds, coolDownSeconds, errors });
    }
  }
}


export default [validate, checkHuman, checkProxy, place];
