/* @flow */

import sequelize from '../sequelize';
import Blacklist from './Blacklist';
import Whitelist from './Whitelist';
import User from './User';
import RegUser from './RegUser';


function sync(...args) {
  return sequelize.sync(...args);
}

export default { sync };
export { Whitelist, Blacklist, User, RegUser };
