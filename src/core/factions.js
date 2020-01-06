/**
 *
 * @flow
 */

import Faction from '../data/models/Faction';

class Factions {
  factions: Array;

  constructor() {
    this.updateFactions = this.updateFactions.bind(this);

    this.factions = [];
  }

  async updateFactions() {
    const dbFactions = await Faction.findAll({
      attributes: ['id', 'name', 'leader'],
      where: { private: false },
      order: ['name'],
      raw: true,
    });

    this.factions = dbFactions;
  }
}

const factions = new Factions();

export default factions;
