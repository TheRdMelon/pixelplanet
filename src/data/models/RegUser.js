/**
 * Created by HF
 *
 * This is the database of the data for registered Users
 *
 * @flow
 */

import DataType from 'sequelize';
import Model from '../sequelize';

import { generateHash } from '../../utils/hash';

const RegUser = Model.define(
  'User',
  {
    id: {
      type: DataType.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    email: {
      type: DataType.CHAR(40),
      allowNull: true,
    },

    name: {
      type: DataType.CHAR(32),
      allowNull: false,
    },

    // null if external oauth authentification
    password: {
      type: DataType.CHAR(60),
      allowNull: true,
    },

    totalPixels: {
      type: DataType.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    dailyTotalPixels: {
      type: DataType.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    ranking: {
      type: DataType.INTEGER.UNSIGNED,
      allowNull: true,
    },

    dailyRanking: {
      type: DataType.INTEGER.UNSIGNED,
      allowNull: true,
    },

    // mail and Minecraft verified
    verified: {
      type: DataType.TINYINT,
      allowNull: false,
      defaultValue: false,
    },

    discordid: {
      type: DataType.CHAR(18),
      allowNull: true,
    },

    redditid: {
      type: DataType.CHAR(10),
      allowNull: true,
    },

    minecraftid: {
      type: DataType.CHAR(36),
      allowNull: true,
    },

    minecraftname: {
      type: DataType.CHAR(16),
      allowNull: true,
    },

    // when mail verification got requested,
    // used for purging unverified accounts
    verificationReqAt: {
      type: DataType.DATE,
      allowNull: true,
    },

    lastLogIn: {
      type: DataType.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    updatedAt: false,

    getterMethods: {
      mailVerified(): boolean {
        return this.verified & 0x01;
      },

      mcVerified(): boolean {
        return this.verified & 0x02;
      },
    },

    setterMethods: {
      mailVerified(num: boolean) {
        const val = num ? this.verified | 0x01 : this.verified & ~0x01;
        this.setDataValue('verified', val);
      },

      mcVerified(num: boolean) {
        const val = num ? this.verified | 0x02 : this.verified & ~0x02;
        this.setDataValue('verified', val);
      },

      password(value: string) {
        if (value) this.setDataValue('password', generateHash(value));
      },
    },
  },
);

RegUser.associate = (models) => {
  RegUser.belongsToMany(models.Faction, {
    through: models.UserFactions,
  });
};

export default RegUser;
