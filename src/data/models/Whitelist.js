/**
 * Created by HF
 *
 * https://github.com/sequelize/sequelize/issues/1485#issuecomment-243822779
 *
 * @flow
 */

import DataType from 'sequelize';
import Model from '../sequelize';


const Whitelist = Model.define('Whitelist', {

  ip: {
    type: DataType.CHAR(39),
    allowNull: false,
    primaryKey: true,
  },

});

export default Whitelist;
