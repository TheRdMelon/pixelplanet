/**
 *
 * @flow
 */

import DataType from 'sequelize';
import Model from '../sequelize';

const UserFactions = Model.define(
  'UserFactions',
  {
    admin: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },
    banned: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  },
);

export default UserFactions;
