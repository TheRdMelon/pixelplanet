/**
 *
 * @flow
 */

import DataType, { UUIDV4 } from 'sequelize';
import Model from '../sequelize';

const FactionPassword = Model.define(
  'Password',
  {
    password: {
      type: DataType.UUID,
      defaultValue: UUIDV4,
    },
  },
  {
    updatedAt: false,
  },
);

export default FactionPassword;
