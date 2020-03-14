/* @flow */

import sequelize from '../sequelize';
import User from './User';
import RegUser from './RegUser';
import Faction from './Faction';
import Blacklist from './Blacklist';
import Whitelist from './Whitelist';
import FactionPassword from './FactionPassword';
import UserFactions from './UserFactions';

function sync(...args) {
  return sequelize.sync(...args);
}

function associate() {
  const models = {
    RegUser,
    Faction,
    Blacklist,
    Whitelist,
    FactionPassword,
    UserFactions,
  };

  Object.keys(models).forEach((modelKey) => {
    if ('associate' in models[modelKey]) {
      models[modelKey].associate(models);
    }
  });
}

export default { sync, associate };
export {
  RegUser,
  Faction,
  Blacklist,
  Whitelist,
  User,
  FactionPassword,
  UserFactions,
};
