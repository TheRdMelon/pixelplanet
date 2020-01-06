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
    leader: user.regUser.id,
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
    return;
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
    return;
  }

  toDelete.destroy().then(() => {
    factions.updateFactions();
  });

  res.json({
    success: true,
  });
};

const factionIcon = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;

  const faction = await Faction.findByPk(factionIdParam);

  if (!faction) {
    res.status(400);
    res.json({
      success: false,
      errors: ['This faction does not exist.'],
    });
    return;
  }

  res.json({
    success: true,
    icon: faction.icon,
  });
};

const joinFaction = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const faction = await Faction.findByPk(factionIdParam);

  if (!faction || faction.private) {
    res.status(400);
    res.json({
      success: false,
      errors: ['This faction does not exist.'],
    });
    return;
  }

  if (faction.has(user.regUser)) {
    res.status(400);
    res.json({
      success: false,
      errors: ['You are already a member of this faction.'],
    });
    return;
  }

  faction.addUser(user.regUser);
  res.json({
    success: true,
    info: factions.factionInfo,
  });
};

export default async (req: Request, res: Response) => {
  res.json(factions.factions);
};

export {
  newFaction, deleteFaction, factionIcon, joinFaction,
};
