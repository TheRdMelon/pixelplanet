/*
 * request password change
 * @flow
 */


import type { Request, Response } from 'express';
import mailProvider from '../../../core/mail';

import { validatePassword, validateEMail } from '../../../utils/validation';
import { getHostFromRequest } from '../../../utils/ip';
import { compareToHash } from '../../../utils/hash';

function validate(email, password) {
  const errors = [];

  const passerror = validatePassword(password);
  if (passerror) errors.push(passerror);
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const errors = validate(email, password);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const { user } = req;
  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const currentPassword = user.regUser.password;
  if (!compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  await user.regUser.update({
    email,
    mailVerified: false,
  });

  const host = getHostFromRequest(req);
  mailProvider.sendVerifyMail(email, user.regUser.name, host);

  res.json({
    success: true,
  });
};
