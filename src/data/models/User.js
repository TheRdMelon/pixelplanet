/**
 *
 * user class which will be set for every single playing user,
 * loged in or not.
 * If user is not logged in, id = null
 *
 * @flow
 * */

import Sequelize from 'sequelize';
import redis from '../redis';
import { randomDice } from '../../utils/random';
import logger from '../../core/logger';

import Model from '../sequelize';
import RegUser from './RegUser';

import { ADMIN_IDS } from '../../core/config';

class User {
  id: string;
  ip: string;
  wait: ?number;
  regUser: Object;

  constructor(id: string = null, ip: string = '127.0.0.1') {
    // id should stay null if unregistered, and user email if registered
    this.id = id;
    this.ip = ip;
    this.wait = null;
    this.regUser = null;
  }

  async setWait(coolDown: number, canvasId: number): Promise<boolean> {
    if (coolDown == 0) return false;
    this.wait = Date.now() + coolDown;
    // PX is milliseconds expire
    await redis.setAsync(`cd:${canvasId}:ip:${this.ip}`, '', 'PX', coolDown);
    if (this.id != null) {
      await redis.setAsync(`cd:${canvasId}:id:${this.id}`, '', 'PX', coolDown);
    }
    return true;
  }

  async getWait(canvasId: number): Promise<?number> {
    let ttl: number = await redis.pttlAsync(`cd:${canvasId}:ip:${this.ip}`);
    if (this.id != null && ttl < 0) {
      const ttlid: number = await redis.pttlAsync(
        `cd:${canvasId}:id:${this.id}`,
      );
      ttl = Math.max(ttl, ttlid);
    }
    logger.debug('ererer', ttl, typeof ttl);

    const wait = ttl < 0 ? null : Date.now() + ttl;
    this.wait = wait;
    return wait;
  }

  async incrementPixelcount(): Promise<boolean> {
    const { id } = this;
    if (!id) return false;
    if (this.isAdmin()) return false;
    try {
      await RegUser.update(
        {
          totalPixels: Sequelize.literal('totalPixels + 1'),
          dailyTotalPixels: Sequelize.literal('dailyTotalPixels + 1'),
        },
        {
          where: { id },
        },
      );
    } catch (err) {
      return false;
    }
    return true;
  }

  async getTotalPixels(): Promise<number> {
    const { id } = this;
    if (!id) return 0;
    if (this.isAdmin()) return 100000;
    if (this.regUser) {
      return this.regUser.totalPixels;
    }
    try {
      const userq = await Model.query(
        'SELECT totalPixels FROM Users WHERE id = $1',
        {
          bind: [id],
          type: Sequelize.QueryTypes.SELECT,
          raw: true,
          plain: true,
        },
      );
      return userq.totalPixels;
    } catch (err) {
      return 0;
    }
  }

  async updateLogInTimestamp(): Promise<boolean> {
    if (!this.regUser) return false;
    try {
      await this.regUser.update({
        lastLogIn: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    } catch (err) {
      return false;
    }
    return true;
  }

  isAdmin(): boolean {
    return ADMIN_IDS.includes(this.id);
  }

  getUserData(): Object {
    if (this.regUser == null) {
      return {
        name: null,
      };
    }
    const { regUser } = this;
    return {
      name: regUser.name,
      id: regUser.id,
      mailVerified: regUser.mailVerified,
      mcVerified: regUser.mcVerified,
      minecraftname: regUser.minecraftname,
      totalPixels: regUser.totalPixels,
      dailyTotalPixels: regUser.dailyTotalPixels,
      ranking: regUser.ranking,
      dailyRanking: regUser.dailyRanking,
      mailreg: !!regUser.password,
    };
  }
}

export default User;
