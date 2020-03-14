/**
 *
 * @flow
 */

import Sequelize from 'sequelize';
import { Faction, RegUser } from '../data/models';

export function isMemberOfFaction(faction, user) {
  return faction.hasUser(user, {
    where: {
      '$UserFactions.banned$': false,
    },
    joinTableAttributes: ['banned'],
  });
}

class Factions {
  factions: Array;
  factionInfo: Array;
  factionBans: Array;

  constructor() {
    this.updateFactions = this.updateFactions.bind(this);
    this.updateFactionInfo = this.updateFactionInfo.bind(this);
    this.updateBans = this.updateBans.bind(this);
    this.update = this.update.bind(this);

    this.factions = [];
    this.factionInfo = [];
    this.factionBans = [];
  }

  async update() {
    await this.updateFactions();
    await this.updateFactionInfo();
  }

  // eslint-disable-next-line class-methods-use-this
  async updateBans() {
    const dbBans = await Faction.findAll({
      attributes: ['id'],
      include: [
        {
          model: RegUser,
          attributes: ['id', 'name'],
          through: {
            attributes: [],
            where: {
              banned: true,
            },
          },
        },
      ],
    });

    this.factionBans = dbBans;
  }

  async updateFactions() {
    const dbFactions = await Faction.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.col('Users.name'), 'leader'],
        'icon',
      ],
      where: {
        private: false,
        '$Users.id$': {
          [Sequelize.Op.eq]: Sequelize.col('Faction.leader'),
        },
      },
      include: [
        {
          model: RegUser,
          attributes: [],
        },
      ],
      order: ['name'],
    });

    this.factions = dbFactions;
  }

  async updateFactionInfo() {
    const dbFactions = await Faction.findAll({
      attributes: [
        'id',
        'name',
        ['leader', 'leaderId'],
        'icon',
        'private',
        'invite',
      ],
      include: [
        {
          model: RegUser,
          attributes: ['name', 'id'],
          through: {
            attributes: ['admin'],
            where: {
              banned: false,
            },
          },
        },
      ],
      /* raw: true, */
      /* nest: true, */
    });

    this.factionInfo = dbFactions.map((faction) => faction.toJSON());
  }
}

const factions = new Factions();

export default factions;
