/*
 * request password change
 * @flow
 */

import type { Request, Response } from 'express';

import { RegUser } from '../../../data/models';
import { validatePassword } from '../../../utils/validation';
import { compareToHash } from '../../../utils/hash';
import factions from '../../../core/factions';

function validate(password) {
  const errors = [];

  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const { password } = req.body;
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

  const currentPassword = user.regUser.password;
  if (!currentPassword || !compareToHash(password, currentPassword)) {
    res.status(400);
    res.json({
      errors: ['Incorrect password!'],
    });
    return;
  }

  req.logout();
  RegUser.destroy({ where: { id } });
  factions.update();

  res.json({
    success: true,
  });
};
