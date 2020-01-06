/*
 * logout
 * @flow
 */
import type { Request, Response } from 'express';

import getMe from '../../../core/me';

export default async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not even logged in.'],
    });
    return;
  }

  const me = await getMe(req.user);
  req.logout();
  res.status(200);
  res.json({
    success: true,
    me: {
      name: null,
      waitSeconds: me.waitSeconds,
      canvases: me.canvases,
    },
  });
};
