/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import factions from '../../../core/factions';
import { Faction } from '../../../data/models';

const newFaction = async (req: Request, res: Response) => {
  const { name, icon, private: priv } = req.body;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const errors = [];

  const existingFaction = await Faction.findOne({ where: { name } });
  const userFaction = await Faction.findOne({
    where: { leader: user.regUser.name },
  });

  if (userFaction) {
    errors.push('You already lead a faction.');
  }

  if (existingFaction && !existingFaction.private) {
    errors.push('A public faction already exists with that name.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  const newfaction = await Faction.create({
    name,
    leader: user.regUser.name,
    private: priv,
    icon,
  })
    .then((faction) => {
      faction.addUser(user.regUser);
    })
    .then(() => {
      factions.updateFactions();
    });

  res.json({ success: true, faction: newfaction });
};

const deleteFaction = async (req: Request, res: Response) => {
  const { name } = req.body;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  const toDelete = await Faction.findOne({
    where: { leader: user.regUser.name, name },
  });

  if (!toDelete) {
    res.status(400);
    res.json({
      success: false,
      errors: ['You do not own this faction or it does not exist.'],
    });
  }

  toDelete.destroy().then(() => {
    factions.updateFactions();
  });

  res.json({
    success: true,
  });
};

const factionIcon = async (req: Request, res: Response) => {
  const { f: factionIdParam } = req.params;

  const faction = await Faction.findByPK(factionIdParam);

  if (!faction) {
    res.status(400);
    res.json({
      success: false,
      errors: ['This faction does not exist.'],
    });
  }

  res.json({
    success: true,
    icon: faction.icon,
  });
};

export default async (req: Request, res: Response) => {
  res.json(factions.factions);
};

export { newFaction, deleteFaction, factionIcon };
