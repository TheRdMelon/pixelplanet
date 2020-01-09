/*
 * request resend of verification mail
 * @flow
 */


import type { Request, Response } from 'express';

import mailProvider from '../../../core/mail';
import { getHostFromRequest } from '../../../utils/ip';

export default async (req: Request, res: Response) => {
  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const { name, email, mailVerified } = user.regUser;
  if (mailVerified) {
    res.status(400);
    res.json({
      errors: ['You are already verified.'],
    });
    return;
  }

  const host = getHostFromRequest(req);

  const error = mailProvider.sendVerifyMail(email, name, host);
  if (error) {
    res.status(400);
    res.json({
      errors: [error],
    });
    return;
  }
  res.json({
    success: true,
  });
};
