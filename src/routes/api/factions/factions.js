/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import uuid from 'uuid';
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
    invite: priv ? null : '',
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

  const faction = factions.factionInfo.find((f) => f.id === factionIdParam);

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

const generatePrivateInvite = async (req: Request, res: Response) => {
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const { selectedFaction } = req.body;
  const faction = await Faction.findByPk(selectedFaction);

  // Validation
  const errors = [];
  const leadCheck = !(!faction || faction.leader !== user.regUser.id);
  let privateCheck = true;

  if (!leadCheck) {
    errors.push('You do not lead this faction or it does not exist.');
  }

  if (leadCheck) {
    privateCheck = faction.private;
  }

  if (!privateCheck) {
    errors.push('Invites cannot be generated for public invites.');
  }

  if (leadCheck && privateCheck && faction.invite === null) {
    errors.push('Invites are not enabled for this faction.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.update({
    invite: uuid.v4(),
  });

  await factions.updateFactionInfo();

  res.json({
    success: true,
    invite: faction.invite,
  });
};

const modifyFaction = async (req: Request, res: Response) => {
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
  const leadCheck = !(!faction || faction.leader !== user.regUser.id);

  if (!leadCheck) {
    errors.push('You do not lead this faction or it does not exist.');
  }

  if (leadCheck && !faction.private) {
    errors.push('Invite enabled cannot be changed for public factions.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  const { set, value } = req.body;

  switch (set) {
    case 'inviteEnabled':
      await faction.update({
        invite: value === true ? '' : null,
      });
      break;

    default:
      res.status(400);
      res.json({
        success: false,
        errors: ['Invalid field.'],
      });
      return;
  }

  await factions.updateFactionInfo();

  res.json({
    success: true,
  });
};

const leaveFaction = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  const faction = await Faction.findByPk(factionIdParam);

  // Validation
  const errors = [];
  const ownFactionCheck = faction && (await faction.hasUser(user.regUser));

  if (!ownFactionCheck) {
    errors.push('This factions does not exist or you are not a member of it.');
  }

  if (ownFactionCheck && faction.leader === user.regUser.id) {
    errors.push('You cannot leave a faction you lead.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.removeUser(user.regUser);
  await factions.update();

  res.json({
    success: true,
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

  let faction = await Faction.findByPk(factionIdParam);

  // Validation
  let errorCode = '';
  const errors = [];
  let existCheck = !(!faction || faction.private);

  if (!existCheck) {
    if (factionIdParam) {
      faction = await Faction.findOne({
        where: {
          invite: factionIdParam,
        },
      });

      existCheck = !!faction;
    }
    if (!existCheck) {
      errors.push('This faction does not exist.');
      errorCode = 'ER001';
    }
  }

  if (existCheck) {
    if (await faction.hasUser(user.regUser)) {
      errors.push('You are already a member of this faction.');
      errorCode = 'ER002';
    }
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
      errorCode,
      info: existCheck
        ? factions.factionInfo.find((f) => f.id === faction.id)
        : undefined,
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
  const { selected } = req.query;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  const userFactions = await user.regUser.getFactions({
    attributes: ['id', 'name'],
    order: ['name'],
    joinTableAttributes: [],
  });

  if (selected === undefined) {
    res.json(userFactions);
    return;
  }

  let getDetailedInfoFor;

  if (userFactions.find((f) => f.id === selected)) {
    getDetailedInfoFor = selected;
  } else if (userFactions.length === 0) {
    getDetailedInfoFor = undefined;
  } else {
    getDetailedInfoFor = userFactions[0].id;
  }

  res.json({
    ownFactions: userFactions,
    selected:
      getDetailedInfoFor !== undefined
        ? factions.factionInfo.find((f) => f.id === getDetailedInfoFor)
        : undefined,
  });
};

const factionInfo = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  // Validation
  const errors = [];
  const ownFactionCheck = await user.regUser.hasFaction(factionIdParam);

  if (!ownFactionCheck) {
    errors.push('You do not belong to this faction, or it does not exist.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  const info = factions.factionInfo.find((f) => f.id === factionIdParam);

  res.json({
    success: true,
    faction: info,
  });
};

export default async (req: Request, res: Response) => {
  res.json(
    factions.factions.map((f) => ({
      ...f.dataValues,
      icon: undefined,
    })),
  );
};

export {
  newFaction,
  deleteFaction,
  factionIcon,
  joinFaction,
  transferFaction,
  ownFactions,
  factionInfo,
  modifyFaction,
  generatePrivateInvite,
  leaveFaction,
};
