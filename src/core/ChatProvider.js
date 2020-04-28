/* @flow */


import logger from './logger';
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
    this.filters = [
      {
        regexp: /ADMIN/gi,
        matches: 2,
      },
      {
        regexp: /FUCK/gi,
        matches: 2,
      },
      {
        regexp: /FACK/gi,
        matches: 3,
      },
    ];
    this.substitutes = [];
  }

  addMessage(name, message) {
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.history.push([name, message]);
  }

  async sendMessage(user, message) {
    if (message.length > 200) {
      // eslint-disable-next-line max-len
      return 'You can\'t send a message this long :(';
    }
    const name = (user.regUser) ? user.regUser.name : null;

    if (!name) {
      // eslint-disable-next-line max-len
      return 'Couldn\'t send your message, pls log out and back in again.';
    }
    if (!user.regUser.verified) {
      return 'Your mail has to be verified in order to chat';
    }

    if (message === message.toUpperCase()) {
      return 'Stop shouting';
    }

    for (let i = 0; i < this.filters.length; i += 1) {
      const filter = this.filters[i];
      const count = (message.match(filter.regexp) || []).length;
      if (count >= filter.matches) {
        ChatProvider.mute(name, 30);
        return 'Ow no! Spam protection decided to mute you';
      }
    }

    for (let i = 0; i < this.substitutes.length; i += 1) {
      const subsitute = this.substitutes[i];
      message = message.replace(subsitute.regexp, subsitute.replace);
    }

    if (user.isAdmin() && message.charAt(0) === '/') {
      // admin commands
      const cmd = message.split(' ');
      if (cmd[0] === '/mute') {
        const timeMin = Number(cmd.slice(-1));
        if (Number.isNaN(timeMin)) {
          return ChatProvider.mute(cmd.slice(1).join(' '));
        }
        return ChatProvider.mute(cmd.slice(1, -1).join(' '), timeMin);
      } if (cmd[0] === '/unmute') {
        return ChatProvider.unmute(cmd.slice(1).join(' '));
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

  /*
   * that is really just because i do not like to import the class AND the
   * singleton
   */
  // eslint-disable-next-line class-methods-use-this
  automute(name) {
    ChatProvider.mute(name, 600);
  }

  static async checkIfMuted(user) {
    const key = `mute:${user.id}`;
    const ttl: number = await redis.ttlAsync(key);
    return ttl;
  }

  static async mute(name, timeMin = null) {
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
