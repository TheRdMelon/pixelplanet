/**
 * @flow
 */


import express from 'express';

import logger from '../../../core/logger';
import { getHostFromRequest } from '../../../utils/ip';

import register from './register';
import verify from './verify';
import logout from './logout';
// eslint-disable-next-line camelcase
import resend_verify from './resend_verify';
// eslint-disable-next-line camelcase
import change_passwd from './change_passwd';
// eslint-disable-next-line camelcase
import delete_account from './delete_account';
// eslint-disable-next-line camelcase
import change_name from './change_name';
// eslint-disable-next-line camelcase
import change_mail from './change_mail';
// eslint-disable-next-line camelcase
import restore_password from './restore_password';
import mclink from './mclink';

import { getHtml } from '../../../components/RedirectionPage';

import getMe from '../../../core/me';

const router = express.Router();

export default (passport) => {
  router.get('/logout', logout);

  router.get('/facebook', passport.authenticate('facebook',
    { scope: ['email'] }));
  router.get('/facebook/return', passport.authenticate('facebook', {
    failureRedirect: '/api/auth/failure',
    failureFlash: true,
    successRedirect: '/',
  }));

  router.get('/discord', passport.authenticate('discord',
    { scope: ['identify', 'email'] }));
  router.get('/discord/return', passport.authenticate('discord', {
    failureRedirect: '/api/auth/failure',
    failureFlash: true,
    successRedirect: '/',
  }));

  router.get('/google', passport.authenticate('google',
    { scope: ['email', 'profile'] }));
  router.get('/google/return', passport.authenticate('google', {
    failureRedirect: '/api/auth/failure',
    failureFlash: true,
    successRedirect: '/',
  }));

  router.get('/vk', passport.authenticate('vkontakte',
    { scope: ['email'] }));
  router.get('/vk/return', passport.authenticate('vkontakte', {
    failureRedirect: '/api/auth/failure',
    failureFlash: true,
    successRedirect: '/',
  }));

  router.get('/reddit', passport.authenticate('reddit',
    { duration: 'temporary', state: 'foo' }));
  router.get('/reddit/return', passport.authenticate('reddit', {
    failureRedirect: '/api/auth/failure',
    failureFlash: true,
    successRedirect: '/',
  }));

  router.get('/failure', (req: Request, res: Response) => {
    res.set({
      'Content-Type': 'text/html',
    });
    let text = null;
    if (req.session && req.session.flash) {
      // eslint-disable-next-line prefer-destructuring
      text = req.session.flash.error[0];
      req.session.flash = {};
    }
    if (!text) {
      // eslint-disable-next-line max-len
      text = 'LogIn failed :(, please try again later or register a new account with mail.';
    }
    const host = getHostFromRequest(req);
    const index = getHtml('OAuth Authentification', text, host);
    res.status(200).send(index);
  });

  router.get('/verify', verify);

  router.get('/logout', logout);

  router.get('/resend_verify', resend_verify);

  router.post('/change_passwd', change_passwd);

  router.post('/change_name', change_name);

  router.post('/change_mail', change_mail);

  router.post('/delete_account', delete_account);

  router.post('/restore_password', restore_password);

  router.post('/mclink', mclink);

  // while previous auth methosed work by redirect,
  // local strategy is an json API
  router.post('/local', async (req: Request, res: Response, next) => {
    passport.authenticate('json', async (err, user, info) => {
      if (!user) {
        res.status(400);
        res.json({
          errors: [info.message],
        });
        return;
      }
      logger.info(`User ${user.id} logged in with mail/password.`);

      req.logIn(user, async (e) => {
        if (e) {
          res.json({
            success: false,
            errors: ['Failed to establish session. Please try again later :('],
          });
          return;
        }

        user.ip = req.user.ip;
        const me = await getMe(user);
        res.json({
          success: true,
          me,
        });
      });
    })(req, res, next);
  });

  router.post('/register', register);

  return router;
};
