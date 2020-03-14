/**
 * @flow
 */

import express from 'express';
import bodyParser from 'body-parser';

import session from '../../core/session';
import passport from '../../core/passport';
import { User } from '../../data/models';
import { getIPFromRequest, getIPv6Subnet } from '../../utils/ip';

import me from './me';
import mctp from './mctp';
import pixel from './pixel';
import auth from './auth';
import ranking from './ranking';
import factions from './factions';
import history from './history';
import { factionIcon } from './factions/factions';

const router = express.Router();

// this route doesn't need passport
router.get('/ranking', ranking);

router.get('/history', history);

/*
 * get user session
 */
router.use(session);

/*
 * create dummy user that has just ip and id
 * (cut IPv6 to subnet to prevent abuse)
 */
router.use(async (req, res, next) => {
  const { session: reqSession } = req;
  const id = reqSession.passport && reqSession.passport.user
    ? reqSession.passport.user
    : null;
  const ip = await getIPFromRequest(req);
  const trueIp = ip || '0.0.0.1';
  req.trueIp = trueIp;
  const user = new User(id, getIPv6Subnet(trueIp));
  req.noauthUser = user;
  next();
});

router.use(bodyParser.json());

/*
 * rate limiting should occure outside,
 * with nginx or whatever
 */
router.post('/pixel', pixel);

/*
 * try to get faction icon without passport
 * only works if faction is public
 */
router.get('/factions/icon/:faction', factionIcon);

/*
 * passport authenticate
 * and deserlialize
 * (makes that sql request to map req.user.regUser)
 * After this point it is assumes that user.regUser is set if user.id is too
 */
router.use(passport.initialize());
router.use(passport.session());

router.get('/me', me);

router.post('/mctp', mctp);

router.use('/factions', factions);

router.use('/auth', auth(passport));

export default router;
