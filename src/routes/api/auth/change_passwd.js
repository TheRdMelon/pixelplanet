/*
 * request password change
 * @flow
 */


import type { Request, Response } from 'express';

import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(newPassword) {
  const errors = [];

  const newpassworderror = validatePassword(newPassword);
  if (newpassworderror) errors.push(newpassworderror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { new_password: newPassword, password } = req.body;
  const errors = validate(newPassword);
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
  if (currentPassword && !compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  await user.regUser.update({ password: newPassword });

  res.json({
    success: true,
  });
};
