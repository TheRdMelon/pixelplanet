/* @flow */

import sequelize from "../sequelize";
import User from "./User";
import RegUser from "./RegUser";
import Faction from "./Faction";
import Blacklist from "./Blacklist";
import Whitelist from "./Whitelist";

function sync(...args) {
  return sequelize.sync(...args);
}

function associate() {
  const models = {
    RegUser: RegUser,
    Faction: Faction,
    Blacklist: Blacklist,
    Whitelist: Whitelist
  };

  Object.keys(models).forEach(modelKey => {
    if ("associate" in models[modelKey]) {
      models[modelKey].associate(models);
    }
  });
}

export default { sync, associate };
export { RegUser, Faction, Blacklist, Whitelist, User };
