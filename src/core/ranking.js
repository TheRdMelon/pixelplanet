/*
 * timers and cron for account related actions
 */

import Sequelize from 'sequelize';
import Model from '../data/sequelize';
import RegUser from '../data/models/RegUser';
import logger from './logger';

import { HOUR, MINUTE } from './constants';
import { DailyCron } from '../utils/cron';

class Ranks {
  ranks: Array;

  constructor() {
    this.updateRanking = this.updateRanking.bind(this);
    this.resetDailyRanking = this.resetDailyRanking.bind(this);

    this.ranks = {};
    this.updateRanking();
    setInterval(this.updateRanking, 5 * MINUTE);
    DailyCron.hook(this.resetDailyRanking);
  }

  async updateRanking() {
    // recalculate ranking column
    await Model.query('SET @r=0; UPDATE Users SET ranking= @r:= (@r + 1) WHERE NOT id= 18 ORDER BY totalPixels DESC;');
    await Model.query('SET @r=0; UPDATE Users SET dailyRanking= @r:= (@r + 1) WHERE NOT id= 18 ORDER BY dailyTotalPixels DESC;');
    // populate dictionaries
    const ranking = await RegUser.findAll({
      attributes: ['name', 'totalPixels', 'ranking', 'dailyRanking', 'dailyTotalPixels', [Sequelize.fn('DATEDIFF', Sequelize.literal('CURRENT_TIMESTAMP'), Sequelize.col('createdAt')), 'age']],
      limit: 100,
      where: { id: { [Sequelize.Op.notIn]: [18, 51] } },
      order: ['ranking'],
      raw: true,
    });
    const dailyRanking = await RegUser.findAll({
      attributes: ['name', 'totalPixels', 'ranking', 'dailyRanking', 'dailyTotalPixels', [Sequelize.fn('DATEDIFF', Sequelize.literal('CURRENT_TIMESTAMP'), Sequelize.col('createdAt')), 'age']],
      limit: 100,
      where: { id: { [Sequelize.Op.notIn]: [18, 51] } },
      order: ['dailyRanking'],
      raw: true,
    });
    this.ranks.ranking = ranking;
    this.ranks.dailyRanking = dailyRanking;
  }

  async resetDailyRanking() {
    logger.info('Resetting Daily Ranking');
    await RegUser.update({ dailyTotalPixels: 0 }, { where: {} });
    await this.updateRanking();
  }
}


export const rankings = new Ranks();
export default rankings;
