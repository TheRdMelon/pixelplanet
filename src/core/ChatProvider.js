/* @flow */


import logger from '../core/logger';
import redis from '../data/redis';
import User from '../data/models/User';
import webSockets from '../socket/websockets';


class ChatProvider {
  /*
   * TODO:
   * history really be saved in redis
   */
  history: Array;

  constructor() {
    this.history = [];
  }

  addMessage(name, message) {
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.history.push([name, message]);
  }

  async sendMessage(user, message) {
    if (message.length > 300) {
      // eslint-disable-next-line max-len
      return 'You can\'t send a message this long :(';
    }
    const name = (user.regUser) ? user.regUser.name : null;
    if (!name) {
      // eslint-disable-next-line max-len
      return 'Couldn\'t send your message, pls log out and back in again.';
    }

    if (user.isAdmin() && message.charAt(0) === '/') {
      // admin commands
      const cmd = message.split(' ', 3);
      if (cmd[0] === '/mute') {
        return ChatProvider.mute(cmd[1], cmd[2]);
      } if (cmd[0] === '/unmute') {
        return ChatProvider.unmute(cmd[1]);
      }
    }

    const muted = await ChatProvider.checkIfMuted(user);
    if (muted === -1) {
      return 'You are permanently muted, join our discord to apppeal the mute';
    }
    if (muted > 0) {
      if (muted > 120) {
        const timeMin = Math.round(muted / 60);
        return `You are muted for another ${timeMin} minutes`;
      }
      return `You are muted for another ${muted} seconds`;
    }
    this.addMessage(name, message);
    webSockets.broadcastChatMessage(name, message);
    return null;
  }

  broadcastChatMessage(name, message, sendapi: boolean = true) {
    this.addMessage(name, message);
    webSockets.broadcastChatMessage(name, message, sendapi);
  }

  static async checkIfMuted(user) {
    const key = `mute:${user.id}`;
    const ttl: number = await redis.ttlAsync(key);
    return ttl;
  }

  static async mute(name, timeMin) {
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    if (timeMin) {
      const ttl = timeMin * 60;
      await redis.setAsync(key, '', 'EX', ttl);
      webSockets.broadcastChatMessage('info',
        `${name} has been muted for ${timeMin}min`);
    } else {
      await redis.setAsync(key, '');
      webSockets.broadcastChatMessage('info',
        `${name} has been muted forever`);
    }
    logger.info(`Muted user ${id}`);
    return null;
  }

  static async unmute(name) {
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    const delKeys = await redis.delAsync(key);
    if (delKeys !== 1) {
      return `User ${name} is not muted`;
    }
    webSockets.broadcastChatMessage('info',
      `${name} has been unmuted`);
    logger.info(`Unmuted user ${id}`);
    return null;
  }
}

const chatProvider = new ChatProvider();
export default chatProvider;
