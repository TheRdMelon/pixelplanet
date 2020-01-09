/**
 *
 * @flow
 */


import type { Request, Response } from 'express';
import Sequelize from 'sequelize';

import { RegUser } from '../../../data/models';
import mailProvider from '../../../core/mail';
import getMe from '../../../core/me';
import { getHostFromRequest } from '../../../utils/ip';
import {
  validateEMail,
  validateName,
  validatePassword,
} from '../../../utils/validation';

async function validate(email, name, password) {
  const errors = [];
  const emailerror = validateEMail(email);
  if (emailerror) errors.push(emailerror);
  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  let reguser = await RegUser.findOne({ where: { email } });
  if (reguser) errors.push('E-Mail already in use.');
  reguser = await RegUser.findOne({ where: { name } });
  if (reguser) errors.push('Username already in use.');

  return errors;
}

export default async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  const errors = await validate(email, name, password);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }

  const newuser = await RegUser.create({
    email,
    name,
    password,
    verificationReqAt: Sequelize.literal('CURRENT_TIMESTAMP'),
    lastLogIn: Sequelize.literal('CURRENT_TIMESTAMP'),
  });

  if (!newuser) {
    res.status(500);
    res.json({
      errors: ['Failed to create new user :('],
    });
    return;
  }

  const user = req.noauthUser;
  user.id = newuser.id;
  user.regUser = newuser;
  const me = await getMe(user);

  await req.logIn(user, (err) => {
    if (err) {
      res.status(500);
      res.json({
        errors: ['Failed to establish session after register :('],
      });
      return;
    }
    const host = getHostFromRequest(req);
    mailProvider.sendVerifyMail(email, name, host);
    res.status(200);
    res.json({
      success: true,
      me,
    });
  });
};
