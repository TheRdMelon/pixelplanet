/**
 * basic admin api
 *
 * @flow
 */

import express from 'express';
import expressLimiter from 'express-limiter';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import sharp from 'sharp';
import multer from 'multer';

import { getIPFromRequest, getIPv6Subnet } from '../utils/ip';
import { getIdFromObject } from '../core/utils';
import redis from '../data/redis';
import session from '../core/session';
import passport from '../core/passport';
import logger from '../core/logger';
import { Blacklist, Whitelist } from '../data/models';

import { MINUTE } from '../core/constants';
import canvases from '../canvases.json';
import { imageABGR2Canvas } from '../core/Image';

import adminHtml from '../components/Admin';

const router = express.Router();
const limiter = expressLimiter(router, redis);

/*
 * multer middleware for getting POST parameters
 * into req.file (if file) and req.body for text
 */
router.use(bodyParser.urlencoded({ extended: true }));
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/*
 * rate limiting to prevent bruteforce attacks
 */
router.use(
  '/',
  limiter({
    lookup: 'headers.cf-connecting-ip',
    total: 240,
    expire: 5 * MINUTE,
    skipHeaders: true,
  }),
);

/*
 * make sure User is logged in and admin
 */
router.use(session);
router.use(passport.initialize());
router.use(passport.session());
router.use(async (req, res, next) => {
  const ip = await getIPFromRequest(req);
  if (!req.user) {
    logger.info(`ADMINTOOLS: ${ip} tried to access admintools without login`);
    res.status(403).send('You are not logged in');
    return;
  }
  if (!req.user.isAdmin()) {
    logger.info(
      `ADMINTOOLS: ${ip}/${req.user.id} wrongfully tried to access admintools`,
    );
    res.status(403).send('You are not allowed to access this page');
    return;
  }
  logger.info(
    `ADMINTOOLS: ${req.user.id} / ${req.user.regUser.name} is using admintools`,
  );
  next();
});

/*
 * Execute IP based actions (banning, whitelist, etc.)
 * @param action what to do with the ip
 * @param ip already sanizized ip
 * @return true if successful
 */
async function executeAction(action: string, ip: string): boolean {
  const ipKey = getIPv6Subnet(ip);
  const key = `isprox:${ipKey}`;

  logger.info(`ADMINTOOLS: ${action} ${ip}`);
  switch (action) {
    case 'ban':
      await Blacklist.findOrCreate({
        where: { ip: ipKey },
      });
      await redis.setAsync(key, 'y', 'EX', 24 * 3600);
      break;
    case 'unban':
      await Blacklist.destroy({
        where: { ip: ipKey },
      });
      await redis.del(key);
      break;
    case 'whitelist':
      await Whitelist.findOrCreate({
        where: { ip: ipKey },
      });
      await redis.setAsync(key, 'n', 'EX', 24 * 3600);
      break;
    case 'unwhitelist':
      await Whitelist.destroy({
        where: { ip: ipKey },
      });
      await redis.del(key);
      break;
    default:
      return false;
  }
  return true;
}

/*
 * Check for POST parameters,
 */
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (req.file) {
      const { imageaction, canvasident } = req.body;

      let error = null;
      if (Number.isNaN(req.body.x)) {
        error = 'x is not a valid number';
      } else if (Number.isNaN(req.body.y)) {
        error = 'y is not a valid number';
      } else if (!imageaction) {
        error = 'No imageaction given';
      } else if (!canvasident) {
        error = 'No canvas specified';
      }
      if (error !== null) {
        res.status(403).send(error);
        return;
      }
      const x = parseInt(req.body.x, 10);
      const y = parseInt(req.body.y, 10);

      const canvasId = getIdFromObject(canvases, canvasident);
      if (canvasId === null) {
        res.status(403).send('This canvas does not exist');
        return;
      }

      const canvas = canvases[canvasId];

      if (canvas.v) {
        res.status(403).send('Can not upload Image to 3D canvas');
        return;
      }

      const canvasMaxXY = canvas.size / 2;
      const canvasMinXY = -canvasMaxXY;
      if (
        x < canvasMinXY
        || y < canvasMinXY
        || x >= canvasMaxXY
        || y >= canvasMaxXY
      ) {
        res.status(403).send('Coordinates are outside of canvas');
        return;
      }

      const protect = imageaction === 'protect';
      const wipe = imageaction === 'wipe';

      await sharp(req.file.buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ err, data, info }) => {
          if (err) throw err;
          return imageABGR2Canvas(
            canvasId,
            x,
            y,
            data,
            info.width,
            info.height,
            wipe,
            protect,
          );
        });

      res.status(200).send('Successfully loaded image');
      return;
    }

    if (req.body.ip) {
      const ret = await executeAction(req.body.action, req.body.ip);
      if (!ret) {
        res.status(403).send('Failed');
      } else {
        res
          .status(200)
          .send(`Succseefully did ${req.body.action} ${req.body.ip}`);
      }
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});

/*
 * Check GET parameters for action to execute
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { ip, action } = req.query;
    if (!action) {
      next();
      return;
    }
    if (!ip) {
      res.status(400).json({ errors: 'invalid ip' });
      return;
    }

    const ret = await executeAction(action, ip);

    if (!ret) {
      res.status(403).json({ errors: ['action not available'] });
    }

    res.json({ action: 'success' });
  } catch (error) {
    next(error);
  }
});

router.use(async (req: Request, res: Response) => {
  res.set({
    'Content-Type': 'text/html',
  });
  res.status(200).send(adminHtml);
});

export default router;
