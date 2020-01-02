/*
 * request password change
 */


import type { Request, Response } from 'express';

import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(new_password, password) {
  const errors = [];

  const newpassworderror = validatePassword(new_password);
  if (newpassworderror) errors.push(newpassworderror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { new_password, password } = req.body;
  const errors = validate(new_password, password);
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

  const current_password = user.regUser.password;
  if (current_password && !compareToHash(password, current_password)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  await user.regUser.update({ password: new_password });

  res.json({
    success: true,
  });
};
