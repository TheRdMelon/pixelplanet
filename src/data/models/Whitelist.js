/**
 * Created by HF
 *
 * https://github.com/sequelize/sequelize/issues/1485#issuecomment-243822779
 *
 * @flow
 */

import DataType from 'sequelize';
import nodeIp from 'ip';

import Model from '../sequelize';


const Whitelist = Model.define('Whitelist', {

  numIp: {
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

}, {

  getterMethods: {
    ip(): string {
      return nodeIp.fromLong(this.numIp);
    },
  },

  setterMethods: {
    ip(value: string): number {
      this.setDataValue('numIp', nodeIp.toLong(value));
    },
  },

});

export default Whitelist;
