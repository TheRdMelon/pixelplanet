/**
 *
 * @flow
 */

import DataType, { UUIDV4 } from "sequelize";
import Model from "../sequelize";
/* import RegUser from "./RegUser"; */

const Faction = Model.define(
  "Faction",
  {
    id: {
      type: DataType.UUID,
      primaryKey: true,
      defaultValue: UUIDV4
    },

    name: {
      type: DataType.STRING(50)
    },

    leader: {
      type: DataType.STRING(32)
    },

    private: {
      type: DataType.BOOLEAN
    },

    icon: {
      type: DataType.TEXT({
        length: "long"
      }),
      allowNull: true
    }
  },
  {
    timestamps: true,
    updatedAt: false
  }
);

Faction.associate = function(models) {
  Faction.belongsToMany(models.RegUser, {
    through: "UserFactions",
    as: "factions",
    foreignKey: "userId",
    otherKey: "factionId"
  });
};

export default Faction;
