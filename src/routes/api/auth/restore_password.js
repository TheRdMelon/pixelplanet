/*
 * request passowrd reset mail
 * @flow
 */


import type { Request, Response } from 'express';

import mailProvider from '../../../core/mail';
import { validateEMail } from '../../../utils/validation';

async function validate(email) {
  const errors = [];
  const emailerror = validateEMail(email);
  if (emailerror) errors.push(emailerror);

  return errors;
}

export default async (req: Request, res: Response) => {
  const ip = req.trueIp;
  const { email } = req.body;

  const errors = await validate(email);
  if (errors.length > 0) {
    res.status(400);
    res.json({
      errors,
    });
    return;
  }
  const error = await mailProvider.sendPasswdResetMail(email, ip);
  if (error) {
    res.status(400);
    res.json({
      errors: [error],
    });
    return;
  }
  res.status(200);
  res.json({
    success: true,
  });
};
