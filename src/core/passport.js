/**
 * https://scotch.io/tutorials/easy-node-authentication-linking-all-accounts-together#toc-linking-accounts-together
 *
 * @flow
 */

import passport from 'passport';
import { Strategy as JsonStrategy } from 'passport-json';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as RedditStrategy } from 'passport-reddit';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as VkontakteStrategy } from 'passport-vkontakte';
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';

import logger from './logger';
import { sanitizeName } from '../utils/validation';

import { User, RegUser } from '../data/models';
import { auth } from './config';
import { compareToHash } from '../utils/hash';


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((req, id, done) => {
  // req.noauthUser already get populated with id and ip in routes/api/index to allow
  // some api requests (pixel) to not require this sql deserlialize
  // but still know the id
  const user = (req.noauthUser) ? req.noauthUser : new User(id);
  if (id) {
    RegUser.findOne({ where: { id } }).then((reguser) => {
      if (reguser) {
        user.regUser = reguser;
      } else {
        user.id = null;
      }
      done(null, user);
    });
  } else {
    done(null, user);
  }
});

/**
 * Sign in locally
 */
passport.use(new JsonStrategy({
  usernameProp: 'nameoremail',
  passwordProp: 'password',
}, (nameoremail, password, done) => {
  try {
    // Decide if email or name by the occurance of @
    // this is why we don't allow @ in usernames
    // NOTE: could allow @ in the future by making an OR query,
    // but i guess nobody really cares.
    //  https://sequelize.org/master/manual/querying.html
    const query = (nameoremail.indexOf('@') !== -1)
      ? { email: nameoremail }
      : { name: nameoremail };
    RegUser.findOne({ where: query }).then((reguser) => {
      if (!reguser) {
        return done(null, false, { message: 'Name or Email does not exist!' });
      }
      if (!compareToHash(password, reguser.password)) {
        return done(null, false, { message: 'Incorrect password!' });
      }
      const user = new User(reguser.id);
      user.regUser = reguser;
      user.updateLogInTimestamp();
      return done(null, user);
    });
  } catch (err) {
    done(err);
  }
}));

/*
 * OAuth SignIns, mail based
 *
 */
async function oauthLogin(email, name, discordid = null) {
  name = sanitizeName(name);
  let reguser = await RegUser.findOne({ where: { email } });
  if (!reguser) {
    reguser = await RegUser.findOne({ where: { name } });
    while (reguser) {
      // name is taken by someone else
      // eslint-disable-next-line max-len
      name = `${name.substring(0, 15)}-${Math.random().toString(36).substring(2, 10)}`;
      // eslint-disable-next-line no-await-in-loop
      reguser = await RegUser.findOne({ where: { name } });
    }
    reguser = await RegUser.create({
      email,
      name,
      verified: 1,
      discordid,
    });
  }
  if (!reguser.discordid && discordid) {
    reguser.update({ discordid });
  }
  const user = new User(reguser.id);
  user.regUser = reguser;
  return user;
}

/**
 * Sign in with Facebook.
 */
passport.use(new FacebookStrategy({
  ...auth.facebook,
  callbackURL: '/api/auth/facebook/return',
  proxy: true,
  profileFields: ['displayName', 'email'],
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const { displayName: name, emails } = profile;
    const email = emails[0].value;
    const user = await oauthLogin(email, name);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

/**
 * Sign in with Discord.
 */
passport.use(new DiscordStrategy({
  ...auth.discord,
  callbackURL: '/api/auth/discord/return',
  proxy: true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info({ profile, refreshToken, accessToken });
    const { id, email, username: name } = profile;
    if (!email) {
      done(null, false, {
        // eslint-disable-next-line max-len
        message: 'Sorry, you can not use discord login with an discord account that does not have email set.',
      });
    }
    const user = await oauthLogin(email, name, id);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  ...auth.google,
  callbackURL: '/api/auth/google/return',
  proxy: true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { displayName: name, emails } = profile;
    const email = emails[0].value;
    const user = await oauthLogin(email, name);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

/*
 * Sign in with Reddit
 */
passport.use(new RedditStrategy({
  ...auth.reddit,
  callbackURL: '/api/auth/reddit/return',
  proxy: true,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info({ profile, refreshToken, accessToken });
    const redditid = profile.id;
    let name = sanitizeName(profile.name);
    // reddit needs an own login strategy based on its id,
    // because we can not access it's mail
    let reguser = await RegUser.findOne({ where: { redditid } });
    if (!reguser) {
      reguser = await RegUser.findOne({ where: { name } });
      while (reguser) {
        // name is taken by someone else
        // eslint-disable-next-line max-len
        name = `${name.substring(0, 15)}-${Math.random().toString(36).substring(2, 10)}`;
        // eslint-disable-next-line no-await-in-loop
        reguser = await RegUser.findOne({ where: { name } });
      }
      reguser = await RegUser.create({
        name,
        verified: 1,
        redditid,
      });
    }
    const user = new User(reguser.id);
    user.regUser = reguser;
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

/**
 * Sign in with Vkontakte
 */
passport.use(new VkontakteStrategy({
  ...auth.vk,
  callbackURL: '/api/auth/vk/return',
  proxy: true,
  scope: ['email'],
  profileFields: ['displayName', 'email'],
}, async (accessToken, refreshToken, params, profile, done) => {
  try {
    logger.info(profile);
    const { displayName: name } = profile;
    const { email } = params;
    const user = await oauthLogin(email, name);
    done(null, user);
  } catch (err) {
    done(err);
  }
}));


export default passport;
