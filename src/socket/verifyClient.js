/*
 * used to authenticate websocket session
 */

import express from 'express';

import session from '../core/session';
import passport from '../core/passport';
import { User } from '../data/models';
import { getIPFromRequest, getIPv6Subnet } from '../utils/ip';

const router = express.Router();

router.use(session);

/*
 * create dummy user that has just ip and id
 * (cut IPv6 to subnet to prevent abuse)
 */
router.use(async (req, res, next) => {
  const ip = await getIPFromRequest(req);
  const trueIp = ip || '0.0.0.1';
  req.trueIp = trueIp;
  const user = new User(null, getIPv6Subnet(trueIp));
  req.noauthUser = user;
  next();
});


router.use(passport.initialize());
router.use(passport.session());


function authenticateClient(req) {
  return new Promise(
    ((resolve) => {
      router(req, {}, () => {
        if (req.user) {
          resolve(req.user);
        } else {
          resolve(req.noauthUser);
        }
      });
    }),
  );
}

export default authenticateClient;
