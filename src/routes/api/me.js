/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import getMe from '../../core/me';

export default async (req: Request, res: Response) => {
  const user = req.user || req.noauthUser;
  const userdata = await getMe(user);
  user.updateLogInTimestamp();

  // https://stackoverflow.com/questions/49547/how-to-control-web-page-caching-across-all-browsers
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  res.json(userdata);
};
