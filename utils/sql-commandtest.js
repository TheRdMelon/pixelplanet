/*
 * Just a testscript for sequelize sql stuff,
 * 
 */

import Sequelize from 'sequelize';
import DataType from 'sequelize';
import Model from 'sequelize';
import bcrypt from 'bcrypt';

const mysql_host = "localhost";
const mysql_user = "user";
const mysql_password = "password";
const mysql_db = "database";

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};

const sequelize = new Sequelize(mysql_db, mysql_user, mysql_password, {
    host: mysql_host,
    dialect: 'mysql',
    pool: {
        min: 5,
        max: 25,
        idle: 10000,
        acquire: 10000,
    },
    dialectOptions: {
        connectTimeout: 10000,
        multipleStatements: true,
    },
    operatorsAliases: operatorsAliases, // use Sequelize.Op
    multipleStatements: true,
    //operatorsAliases: false,
});


const RegUser = sequelize.define('User', {
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

  //null if external oauth authentification
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

  //mail verified
  verified: {
    type: DataType.BOOLEAN,
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

  //when mail verification got requested,
  //used for purging unverified accounts
  verificationReqAt: {
    type: DataType.DATE,
    allowNull: true,
  },

  lastLogIn: {
    type: DataType.DATE,
    allowNull: true,
  },
}, {
  multipleStatements: true,
  timestamps: true,
  updatedAt: false,

  setterMethods: {
    password(value: string): string {
      if(value) this.setDataValue('password', generateHash(value));
    },
  },

});

async function recalculate() {
  //multiple sql statements at once,
  //important here, because splitting them would cause different thread pools with different @r to get used
  await sequelize.query("SET @r=0; UPDATE Users SET ranking= @r:= (@r + 1) ORDER BY totalPixels DESC;");
  await sequelize.query("SET @r=0; UPDATE Users SET dailyRanking= @r:= (@r + 1) ORDER BY dailyTotalPixels DESC;");

  //delete all rows with timestamp older than 4 days
  RegUser.destroy({
    where: {
      verificationReqAt: {
        $lt: Sequelize.literal('CURRENT_TIMESTAMP - INTERVAL 4 DAY')
      },
      verified: 0,
    }
  })

  //update whole column
  RegUser.update({dailyTotalPixels: 0},{where:{}});

  //select command that does also print datediff
  RegUser.findAll({
    attributes: [ 'name', 'totalPixels', 'ranking' , 'dailyRanking', 'dailyTotalPixels', 'createdAt', [Sequelize.fn('DATEDIFF', Sequelize.literal('CURRENT_TIMESTAMP'), Sequelize.col('createdAt')),'age']],
    limit: 10,
    order: ['ranking'],
  }).then((users) =>{
    console.log("All users:", JSON.stringify(users, null, 4));
    return;
    const ranking = [];
    users.forEach((user) => {
      const createdAt = new Date(user.createdAt);
      const registeredSince = createdAt.getDate() + "." + (createdAt.getMonth()+1) + "." + createdAt.getFullYear();
      ranking.push({
        rank: user.ranking,
        name: user.name,
        totalPixels: user.totalPixels,
        dailyRanking: user.dailyRanking,
        dailyTotalPixels: user.dailyTotalPixels,
        registeredSince,
      });
    });
    console.log(ranking);
  });
}
setTimeout(recalculate, 2000);
