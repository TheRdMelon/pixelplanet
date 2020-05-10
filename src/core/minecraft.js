/*
 *
 * Minecraft user handling
 *
 * @flow
 */

import { User, RegUser } from '../data/models';


class Minecraft {
  online: Object;

  constructor() {
    this.online = {};
  }

  async reportLogin(minecraftid, minecraftname) {
    const user = new User();
    user.minecraftname = minecraftname;
    const reguser = await RegUser.findOne({ where: { minecraftid } });
    if (reguser && reguser.mcVerified) {
      user.id = reguser.id;
      user.regUser = reguser;
      reguser.update({ minecraftname });
    }
    this.online[minecraftid] = user;
    // this.updateRedisOnlineList();
    return user;
  }

  /*
   * TODO: whole online list should be handled by redis
  updateRedisOnlineList() {
  }
  */

  reportLogout(minecraftid) {
    delete this.online[minecraftid];
  }

  reportUserlist(list) {
    this.online = {};
    list.forEach((user) => {
      const [minecraftid, minecraftname] = user;
      this.reportLogin(minecraftid, minecraftname);
    });
  }

  static async linkacc(minecraftid, minecraftname, name) {
    try {
      const finduser = await RegUser.findOne({ where: { minecraftid } });
      if (finduser) {
        if (finduser.name === name) {
          if (finduser.mcVerified) {
            return 'You are already verified';
          }
          // eslint-disable-next-line max-len
          return 'You already got a verification message in the pixelplanet UserArea. Please refresh the page if you do not see it.';
        }
        return `You already linked to other account ${finduser.name}.`;
      }
      const reguser = await RegUser.findOne({ where: { name } });
      if (reguser) {
        if (reguser.minecraftid) {
          // eslint-disable-next-line max-len
          return `This pixelplanet account is already linked to ${reguser.minecraftname}`;
        }
        reguser.update({ minecraftname, minecraftid });
        return null;
      }
      return `Can not find user ${name} on pixelplanet.`;
    } catch (err) {
      return 'An unexpected error occured :(';
    }
  }

  minecraftid2User(minecraftid: string): User {
    if (this.online[minecraftid]) {
      return this.online[minecraftid];
    }

    const user = new User();
    if (minecraftid) {
      RegUser.findOne({ where: { minecraftid } }).then((reguser) => {
        if (reguser && reguser.mcVerified) {
          user.id = reguser.id;
          user.minecraftname = reguser.minecraftname;
          user.regUser = reguser;
        } else {
          user.minecraftname = minecraftid;
        }
      });
    }
    return user;
  }

  minecraftname2User(minecraftname: string): User {
    const searchstring = minecraftname;
    const onlineIds = Object.keys(this.online);
    for (let i = 0; i < onlineIds.length; i += 1) {
      const id = onlineIds[i];
      const user = this.online[id];
      if (user.minecraftname === searchstring) { return user; }
    }

    const user = new User();
    user.minecraftname = searchstring;
    if (minecraftname) {
      RegUser.findOne({ where: { minecraftname } }).then((reguser) => {
        if (reguser && reguser.mcVerified) {
          user.id = reguser.id;
          user.regUser = reguser;
          // this.online[reguser.minecraftid] = user;
        }
      });
    }
    return user;
  }
}


export default Minecraft;
