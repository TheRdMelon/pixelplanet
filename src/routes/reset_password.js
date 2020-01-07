/**
 * basic admin api
 *
 * @flow
 */

import express from 'express';
import expressLimiter from 'express-limiter';
import bodyParser from 'body-parser';

import type { Request, Response } from 'express';

import redis from '../data/redis';
import logger from '../core/logger';
import { getPasswordResetHtml } from '../components/PasswordReset';
import { MINUTE } from '../core/constants';

import mailProvider from '../core/mail';
import { RegUser } from '../data/models';


const router = express.Router();
const limiter = expressLimiter(router, redis);


/*
 * rate limiting to prevent bruteforce attacks
 */
router.use('/',
  limiter({
    lookup: 'headers.cf-connecting-ip',
    total: 24,
    expire: 5 * MINUTE,
    skipHeaders: true,
  }));


/*
 * decode form data to req.body
 */
router.use(bodyParser.urlencoded({ extended: true }));


/*
 * Check for POST parameters,
 * if invalid password is given, ignore it and go to next
 */
router.post('/', async (req: Request, res: Response, next) => {
  const { pass, passconf, code } = req.body;
  if (!pass || !passconf || !code) {
    const html = getPasswordResetHtml(null, null, 'You sent an empty password or invalid data :(');
    res.status(400).send(html);
    return;
  }

  const email = mailProvider.checkCode(code);
  if (!email) {
    const html = getPasswordResetHtml(null, null, "This password-reset link isn't valid anymore :(");
    res.status(401).send(html);
    return;
  }

  if (pass != passconf) {
    const html = getPasswordResetHtml(null, null, 'Your passwords do not match :(');
    res.status(400).send(html);
    return;
  }

  // set password
  const reguser = await RegUser.findOne({ where: { email } });
  if (!reguser) {
    logger.error(`${email} from PasswordReset page does not exist in database`);
    const html = getPasswordResetHtml(null, null, "User doesn't exist in our database :(");
    res.status(400).send(html);
    return;
  }
  await reguser.update({ password: pass });

  logger.info(`Changed password of ${email} via passowrd reset form`);
  const html = getPasswordResetHtml(null, null, 'Passowrd successfully changed.');
  res.status(200).send(html);
});


/*
 * Check GET parameters for action to execute
 */
router.get('/', async (req: Request, res: Response, next) => {
  const { token } = req.query;
  if (!token) {
    const html = getPasswordResetHtml(null, null, 'Invalid url :( Please check your mail again.');
    res.status(400).send(html);
    return;
  }

  const email = mailProvider.checkCode(token);
  if (!email) {
    const html = getPasswordResetHtml(null, null, 'This passwort reset link is wrong or already expired, please request a new one (Note: you can use those links just once)');
    res.status(401).send(html);
    return;
  }

  const code = mailProvider.setCode(email);
  const html = getPasswordResetHtml(email, code);
  res.status(200).send(html);
});

export default router;
