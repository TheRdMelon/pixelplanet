/**
 * @flow
 */

import express from 'express';
import bodyParser from 'body-parser';

import session from '../../core/session';
import passport from '../../core/passport';
import logger from '../../core/logger';
import User from '../../data/models/User';
import { getIPFromRequest } from '../../utils/ip';

import me from './me';
import mctp from './mctp';
import captcha from './captcha';
import auth from './auth';
import ranking from './ranking';
import history from './history';


const router = express.Router();

// this route doesn't need passport
router.get('/ranking', ranking);

router.get('/history', history);

router.use(bodyParser.json());

router.use((err, req, res, next) => {
  if (err) {
    logger.warn(`Got invalid json from ${req.trueIp} on ${req.originalUrl}`);
    res.status(400);
    res.status(400).json({ errors: [{ msg: 'Invalid Request' }] });
  } else {
    next();
  }
});

// captcah doesn't need a user
router.post('/captcha', captcha);

/*
 * get user session
 */
router.use(session);

/*
 * at this point we could use the session id to get
 * stuff without having to verify the whole user,
 * which would avoid SQL requests and it got used previously
 * when we set pixels via api/pixel (new removed)
*/

/*
 * passport authenticate
 * and deserlialize
 * (makes that sql request to map req.user.regUser)
 * After this point it is assumes that user.regUser is set if user.id is too
 */
router.use(passport.initialize());
router.use(passport.session());

/*
 * create dummy user with just ip if not
 * logged in
 */
router.use((req, res, next) => {
  if (!req.user) {
    req.user = new User(null, getIPFromRequest(req));
  }
  next();
});

router.get('/me', me);

router.post('/mctp', mctp);

router.use('/auth', auth(passport));

export default router;
