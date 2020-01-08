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
    this.update = this.update.bind(this);

    this.factions = [];
    this.factionInfo = [];
  }

  async update() {
    await this.updateFactions();
    await this.updateFactionInfo();
  }

  async updateFactions() {
    const dbFactions = await Faction.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.col('Users.name'), 'leader'],
        'icon',
      ],
      include: [
        {
          model: RegUser,
          attributes: [],
        },
      ],
      where: { private: false },
      order: ['name'],
    });

    this.factions = dbFactions;
  }

  async updateFactionInfo() {
    const dbFactions = await Faction.findAll({
      attributes: ['id', 'name', [Sequelize.col('Users.name'), 'leader']],
      include: [
        {
          model: RegUser,
          attributes: ['name'],
        },
      ],
    });

    this.factionInfo = dbFactions;
  }
}

const factions = new Factions();

export default factions;
