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

import { sanitizeName } from '../utils/validation';

import logger from './logger';
import { User, RegUser } from '../data/models';
import { auth, HOSTURL } from './config';
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
  // Decide if email or name by the occurance of @
  // this is why we don't allow @ in usernames
  // NOTE: could allow @ in the future by making an OR query,
  // but i guess nobody really cares.
  //  https://sequelize.org/master/manual/querying.html
  const query = (nameoremail.indexOf('@') !== -1) ? { email: nameoremail } : { name: nameoremail };
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
}));

/*
 * OAuth SignIns, mail based
 *
 */
async function oauth_login(email, name, discordid = null) {
  name = sanitizeName(name);
  let reguser = await RegUser.findOne({ where: { email } });
  if (!reguser) {
    reguser = await RegUser.findOne({ where: { name } });
    while (reguser) {
      // name is taken by someone else
      name = `${name.substring(0, 15)}-${Math.random().toString(36).substring(2, 10)}`;
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
  callbackURL: `${HOSTURL}/api/auth/facebook/return`,
  profileFields: ['displayName', 'email'],
}, async (req, accessToken, refreshToken, profile, done) => {
  const { displayName: name, emails } = profile;
  const email = emails[0].value;
  const user = await oauth_login(email, name);
  done(null, user);
}));

/**
 * Sign in with Discord.
 */
passport.use(new DiscordStrategy({
  ...auth.discord,
  callbackURL: `${HOSTURL}/api/auth/discord/return`,
}, async (accessToken, refreshToken, profile, done) => {
  // TODO get discord id
  console.log({ profile, refreshToken, accessToken });
  const { id, email, username: name } = profile;
  const user = await oauth_login(email, name, id);
  done(null, user);
}));

/**
 * Sign in with Google.
 */
passport.use(new GoogleStrategy({
  ...auth.google,
  callbackURL: `${HOSTURL}/api/auth/google/return`,
}, async (accessToken, refreshToken, profile, done) => {
  const { displayName: name, emails } = profile;
  const email = emails[0].value;
  const user = await oauth_login(email, name);
  done(null, user);
}));

/*
 * Sign in with Reddit
 */
passport.use(new RedditStrategy({
  ...auth.reddit,
  callbackURL: `${HOSTURL}/api/auth/reddit/return`,
}, async (accessToken, refreshToken, profile, done) => {
  console.log({ profile, refreshToken, accessToken });
  const redditid = profile.id;
  let name = sanitizeName(profile.name);
  // reddit needs an own login strategy based on its id,
  // because we can not access it's mail
  let reguser = await RegUser.findOne({ where: { redditid } });
  if (!reguser) {
    reguser = await RegUser.findOne({ where: { name } });
    while (reguser) {
      // name is taken by someone else
      name = `${name.substring(0, 15)}-${Math.random().toString(36).substring(2, 10)}`;
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
}));

/**
 * Sign in with Vkontakte
 */
passport.use(new VkontakteStrategy({
  ...auth.vk,
  callbackURL: `${HOSTURL}/api/auth/vk/return`,
  scope: ['email'],
  profileFields: ['displayName', 'email'],
}, async (accessToken, refreshToken, params, profile, done) => {
  console.log(profile);
  const { displayName: name } = profile;
  const { email } = params;
  const user = await oauth_login(email, name);
  done(null, user);
}));


export default passport;
