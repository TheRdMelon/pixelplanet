/**
 *
 * @flow
 */


import type { Request, Response } from 'express';

import getMe from '../../core/me';
import {
  USE_PROXYCHECK,
} from '../../core/config';
import { cheapDetector } from '../../core/isProxy';


export default async (req: Request, res: Response) => {
  const user = req.user || req.noauthUser;
  const userdata = await getMe(user);
  user.updateLogInTimestamp();

  const { trueIp: ip } = req;
  if (USE_PROXYCHECK && ip !== '0.0.0.1') {
    // pre-fire cheap Detector to give it time to get a real result
    // once api_pixel needs it
    cheapDetector(ip);
  }

  // https://stackoverflow.com/questions/49547/how-to-control-web-page-caching-across-all-browsers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.json(userdata);
};
