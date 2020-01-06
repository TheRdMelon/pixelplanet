/**
 *
 * @flow
 */

import Sequelize from 'sequelize';
import Faction from '../data/models/Faction';
import { RegUser } from '../data/models';

class Factions {
  factions: Array;
  factionInfo: Array;

  constructor() {
    this.updateFactions = this.updateFactions.bind(this);
    this.updateFactionInfo = this.updateFactionInfo.bind(this);

    this.factions = [];
    this.factionInfo = [];
  }

  async updateFactions() {
    const dbFactions = await Faction.findAll({
      attributes: ['id', 'name', [Sequelize.col('users.name'), 'leader']],
      include: [
        {
          model: RegUser,
          attributes: [],
        },
      ],
      where: { private: false },
      order: ['name'],
      raw: true,
    });

    this.factions = dbFactions;
  }

  async updateFactionInfo() {
    const dbFactions = await Faction.findAll({
      attributes: ['id', 'name', [Sequelize.col('users.name'), 'leader']],
      include: [
        {
          model: RegUser,
          attributes: [],
        },
      ],
    });

    this.factionInfo = dbFactions;
  }
}

const factions = new Factions();

export default factions;
