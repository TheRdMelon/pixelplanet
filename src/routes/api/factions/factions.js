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
      errors,
    });
  }

  const newfaction = await Faction.create({
    name,
    leader: user.regUser.name,
    private: priv,
    icon,
  }).then((faction) => {
    faction.addUser(user.regUser);
  });

  res.json({ success: true, faction: newfaction });
};

export default async (req: Request, res: Response) => {
  res.json(factions.factions);
};

export { newFaction };
