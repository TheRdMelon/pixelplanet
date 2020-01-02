/*
 * password hashing
 * @flow
 */

import bcrypt from 'bcrypt';

export function generateHash(password: string) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}

export function compareToHash(password: string, hash: string) {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}
