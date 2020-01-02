/*
 * request password change
 */


import type { Request, Response } from 'express';

import { RegUser } from '../../../data/models';
import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';

function validate(password) {
  const errors = [];

  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { new_password, password } = req.body;
  const errors = await validate(password);
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
  const { id } = user;

  const current_password = user.regUser.password;
  if (!current_password || !compareToHash(password, current_password)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  req.logout();
  RegUser.destroy({ where: { id } });

  res.json({
    success: true,
  });
};
