/**
 * @flow
 */

import expressSession from 'express-session';
import connectRedis from 'connect-redis';

import client from '../data/redis';
import { HOUR, COOKIE_SESSION_NAME } from './constants';
import { SESSION_SECRET } from './config';


const RedisStore = connectRedis(expressSession);
export const store = new RedisStore({ client });

const session = expressSession({
  name: COOKIE_SESSION_NAME,
  store,
  secret: SESSION_SECRET,
  // The best way to know is to check with your store if it implements the touch method. If it does, then you can safely set resave: false
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    // not setting maxAge or expire makes it a non-persisting cookies
    maxAge: 30 * 24 * HOUR,
  },
});

export default session;
