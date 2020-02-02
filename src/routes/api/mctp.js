/**
 *
 * API endpoint to request tp in minecraft
 * (might be better in websocket?)
 *
 * @flow
 */


import type { Request, Response } from 'express';

import canvases from '../../canvases.json';
import webSockets from '../../socket/websockets';

const CANVAS_MAX_XY = (canvases[0].size / 2);
const CANVAS_MIN_XY = -CANVAS_MAX_XY;

export default async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      success: false,
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const x = parseInt(req.body.x, 10);
  const y = parseInt(req.body.y, 10);
  if (x < CANVAS_MIN_XY
    || y < CANVAS_MIN_XY
    || x >= CANVAS_MAX_XY
    || y >= CANVAS_MAX_XY) {
    res.status(400);
    res.json({
      success: false,
      errors: ['Coordinates out of bounds.'],
    });
    return;
  }

  const { minecraftid } = user.regUser;
  if (!minecraftid) {
    res.status(400);
    res.json({
      success: false,
      errors: ['You have no minecraft account linked to you.'],
    });
    return;
  }

  webSockets.broadcastMinecraftTP(minecraftid, x, y);

  res.json({
    success: true,
  });
};
