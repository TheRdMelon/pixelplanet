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
    this.caseCheck = /^[A-Z !.]*$/;
    this.filters = [
      {
        regexp: /ADMIN/gi,
        matches: 2,
      },
      {
        regexp: /FUCK/gi,
        matches: 3,
      },
      {
        regexp: /FACK/gi,
        matches: 3,
      },
    ];
    this.substitutes = [
      {
        regexp: /http[s]?:\/\/(old.)?pixelplanet\.fun\/#/g,
        replace: '#',
      },
    ];
    this.mutedCountries = [];
  }

  addMessage(name, message, country, channelId = 0) {
    if (this.history.length > 20) {
      this.history.shift();
    }
    this.history.push([name, message, country, channelId]);
  }

  async sendMessage(user, message, channelId: number = 0) {
    const name = (user.regUser) ? user.regUser.name : null;
    const country = (name.endsWith('berg') || name.endsWith('stein'))
      ? 'il'
      : (user.country || 'xx');

    if (!name) {
      // eslint-disable-next-line max-len
      return 'Couldn\'t send your message, pls log out and back in again.';
    }
    if (!user.regUser.verified) {
      return 'Your mail has to be verified in order to chat';
    }

    if (message.length > 1
      && message === message.toUpperCase()
      && message !== message.toLowerCase()
    ) {
      return 'Stop shouting';
    }

    for (let i = 0; i < this.filters.length; i += 1) {
      const filter = this.filters[i];
      const count = (message.match(filter.regexp) || []).length;
      if (count >= filter.matches) {
        ChatProvider.mute(name, channelId, 30);
        return 'Ow no! Spam protection decided to mute you';
      }
    }

    for (let i = 0; i < this.substitutes.length; i += 1) {
      const subsitute = this.substitutes[i];
      message = message.replace(subsitute.regexp, subsitute.replace);
    }

    if (message.includes('http')) {
      return 'no shitty links pls';
    }

    if (message.length > 200) {
      // eslint-disable-next-line max-len
      return 'You can\'t send a message this long :(';
    }

    if (user.isAdmin() && message.charAt(0) === '/') {
      // admin commands
      const cmdArr = message.split(' ');
      const cmd = cmdArr[0].substr(1);
      const args = cmdArr.slice(1);
      if (cmd === 'mute') {
        const timeMin = Number(args.slice(-1));
        if (Number.isNaN(timeMin)) {
          return ChatProvider.mute(args.join(' '), channelId);
        }
        return ChatProvider.mute(
          args.slice(0, -1).join(' '),
          channelId,
          timeMin,
        );
      } if (cmd === 'unmute') {
        return ChatProvider.unmute(args.join(' '), channelId);
      } if (cmd === 'mutec' && args[0]) {
        const cc = args[0].toLowerCase();
        this.mutedCountries.push(cc);
        webSockets.broadcastChatMessage(
          'info',
          `Country ${cc} has been muted`,
          channelId,
        );
        return null;
      } if (cmd === 'unmutec' && args[0]) {
        const cc = args[0].toLowerCase();
        if (!this.mutedCountries.includes(cc)) {
          return `Country ${cc} is not muted`;
        }
        this.mutedCountries = this.mutedCountries.filter((c) => c !== cc);
        webSockets.broadcastChatMessage(
          'info',
          `Country ${cc} has been unmuted`,
          channelId,
        );
        return null;
      }
    }

    if (this.mutedCountries.includes(country)) {
      return 'Your country is temporary muted from chat';
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
    this.addMessage(name, message, country, channelId);
    webSockets.broadcastChatMessage(name, message, country, channelId);
    return null;
  }

  broadcastChatMessage(
    name,
    message,
    country: string = 'xx',
    channelId: number = 0,
    sendapi: boolean = true,
  ) {
    this.addMessage(name, message, country, channelId);
    webSockets.broadcastChatMessage(name, message, country, channelId, sendapi);
  }

  /*
   * that is really just because i do not like to import the class AND the
   * singleton
   */
  // eslint-disable-next-line class-methods-use-this
  automute(name, channelId = 0) {
    ChatProvider.mute(name, channelId, 600);
  }

  static async checkIfMuted(user) {
    const key = `mute:${user.id}`;
    const ttl: number = await redis.ttlAsync(key);
    return ttl;
  }

  static async mute(name, channelId = 0, timeMin = null) {
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    if (timeMin) {
      const ttl = timeMin * 60;
      await redis.setAsync(key, '', 'EX', ttl);
      if (timeMin !== 600) {
        webSockets.broadcastChatMessage(
          'info',
          `${name} has been muted for ${timeMin}min`,
          channelId,
        );
      }
    } else {
      await redis.setAsync(key, '');
      webSockets.broadcastChatMessage(
        'info',
        `${name} has been muted forever`,
        channelId,
      );
    }
    logger.info(`Muted user ${id}`);
    return null;
  }

  static async unmute(name, channelId = 0) {
    const id = await User.name2Id(name);
    if (!id) {
      return `Couldn't find user ${name}`;
    }
    const key = `mute:${id}`;
    const delKeys = await redis.delAsync(key);
    if (delKeys !== 1) {
      return `User ${name} is not muted`;
    }
    webSockets.broadcastChatMessage(
      'info',
      `${name} has been unmuted`,
      channelId,
    );
    logger.info(`Unmuted user ${id}`);
    return null;
  }
}

const chatProvider = new ChatProvider();
export default chatProvider;
