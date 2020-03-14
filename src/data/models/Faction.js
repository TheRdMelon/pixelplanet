/**
 *
 * @flow
 */

import DataType, { UUIDV4 } from 'sequelize';
import Model from '../sequelize';
/* import RegUser from "./RegUser"; */

const Faction = Model.define(
  'Faction',
  {
    id: {
      type: DataType.UUID,
      primaryKey: true,
      defaultValue: UUIDV4,
    },

    name: {
      type: DataType.STRING(50),
    },

    leader: {
      type: DataType.INTEGER.UNSIGNED,
    },

    private: {
      type: DataType.BOOLEAN,
    },

    invite: {
      type: DataType.STRING(36),
      defaultValue: '',
      allowNull: true,
    },

    icon: {
      type: DataType.TEXT({
        length: 'long',
      }),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
  },
);

Faction.associate = (models) => {
  Faction.belongsToMany(models.RegUser, {
    through: models.UserFactions,
  });

  Faction.hasMany(models.FactionPassword);
};

export default Faction;
