/**
 *
 * @flow
 */

import Sequelize from 'sequelize';

import logging from '../core/logger';
import {
  MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PW,
} from '../core/config';

const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PW, {
  host: MYSQL_HOST,
  dialect: 'mysql',
  pool: {
    min: 5,
    max: 25,
    idle: 10000,
    acquire: 10000,
    logging,
  },
  dialectOptions: {
    connectTimeout: 10000,
    multipleStatements: true,
  },
});

export default sequelize;
