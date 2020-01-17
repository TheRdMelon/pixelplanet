/*
 * accept or deny minecraft link request
 * @flow
 */

import type { Request, Response } from 'express';

import webSockets from '../../../socket/websockets';


export default async (req: Request, res: Response) => {
  const { accepted } = req.body;

  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }
  const { name, minecraftid } = user.regUser;

  if (accepted === true) {
    user.regUser.update({
      mcVerified: true,
    });
    res.json({
      accepted: true,
    });
  } else if (accepted === false) {
    user.regUser.update({
      minecraftid: null,
      minecraftname: null,
      mcVerified: false,
    });
    res.json({
      accepted: false,
    });
  } else {
    return;
  }
  webSockets.broadcastMinecraftLink(name, minecraftid, accepted);
};
