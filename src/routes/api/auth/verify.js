/*
 * verify mail adress
 * @flow
 */

import type { Request, Response } from 'express';

import webSockets from '../../../socket/websockets';
import { getHtml } from '../../../components/RedirectionPage';
import { getHostFromRequest } from '../../../utils/ip';
import mailProvider from '../../../core/mail';

export default async (req: Request, res: Response) => {
  const { token } = req.query;
  const name = await mailProvider.verify(token);
  const host = getHostFromRequest(req);
  if (name) {
    // notify websoecket to reconnect user
    // thats a bit counter productive because it directly links to the websocket
    webSockets.notifyChangedMe(name);
    // ---
    const index = getHtml('Mail verification', 'You are now verified :)', host);
    res.status(200).send(index);
  } else {
    // eslint-disable-next-line max-len
    const index = getHtml('Mail verification', 'Your mail verification code is invalid or already expired :(, please request a new one.', host);
    res.status(400).send(index);
  }
};
