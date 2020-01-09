/**
 *
 * @flow
 */

import Sequelize from 'sequelize';
import type { Request, Response } from 'express';

import factions from '../../../core/factions';
import { Faction, RegUser } from '../../../data/models';

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

  const existingFaction = await Faction.findOne({
    where: {
      name,
      private: false,
    },
  });

  const userFaction = await Faction.findOne({
    where: {
      leader: user.regUser.id,
      private: priv,
    },
  });

  // Validation
  const errors = [];
  const ownCheck = !userFaction;
  const existCheck = !(existingFaction && !existingFaction.private && !priv);

  if (!ownCheck) {
    errors.push(`You already lead a ${priv ? 'private' : 'public'} faction.`);
  }

  if (!existCheck) {
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

  const createdFaction = await Faction.create({
    name,
    leader: user.regUser.id,
    private: priv,
    icon,
  });

  await createdFaction.addUser(user.regUser);
  await factions.update();

  res.json({
    success: true,
    faction: createdFaction,
    info: factions.factionInfo.find(
      (faction) => faction.id === createdFaction.id,
    ),
  });
};

const deleteFaction = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const toDelete = await Faction.findByPk(factionIdParam);

  // Validation
  const errors = [];
  const validationCheck = !(!toDelete || toDelete.leader !== user.regUser.id);

  if (!validationCheck) {
    errors.push('You do not own this faction or it does not exist.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await toDelete.destroy();
  await factions.update();

  res.json({
    success: true,
  });
};

const transferFaction = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { to } = req.body;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const toTransfer = await Faction.findByPk(factionIdParam);
  const toUser = await RegUser.findOne({ where: { name: to } });

  // Validation
  const errors = [];
  const factionCheck = !(!toTransfer || toTransfer.leader !== user.regUser.id);
  const userCheck = !!toUser;

  if (!factionCheck) {
    errors.push('You do not own this faction or it does not exist.');
  }

  if (!userCheck) {
    errors.push('Target user does not exist.');
  }

  if (factionCheck && userCheck) {
    if (
      await Faction.findOne({
        where: {
          leader: toUser.id,
          private: toTransfer.private,
        },
      })
    ) {
      errors.push(
        `Target user already owns a ${
          toTransfer.private ? 'private' : 'public'
        } faction.`,
      );
    }
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await toTransfer.update({
    leader: toUser.id,
  });
  await factions.update();

  res.json({
    success: true,
    faction: factions.factionInfo.find((faction) => faction === factionIdParam),
  });
};

const factionIcon = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;

  const faction = factions.factions.find((f) => f.id === factionIdParam);

  // Validation
  const errors = [];
  const existCheck = !!faction;

  if (!existCheck) {
    errors.push('This faction does not exist.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
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

  // Validation
  const errors = [];
  const existCheck = !(!faction || faction.private);

  if (!existCheck) {
    errors.push('This faction does not exist.');
  }

  if (existCheck) {
    if (await faction.hasUser(user.regUser)) {
      errors.push('You are already a member of this faction.');
    }
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.addUser(user.regUser);
  await factions.update();

  res.json({
    success: true,
    info: factions.factionInfo.find((f) => f.id === faction.id),
  });
};

const ownFactions = async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  res.json(
    await user.regUser.getFactions({
      attributes: ['id', 'name'],
      order: ['name'],
    }),
  );
};

export default async (req: Request, res: Response) => {
  res.json(factions.factions);
};

export {
  newFaction,
  deleteFaction,
  factionIcon,
  joinFaction,
  transferFaction,
  ownFactions,
};
