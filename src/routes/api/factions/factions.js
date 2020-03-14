/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import uuid from 'uuid';
import factions, { isMemberOfFaction } from '../../../core/factions';
import { Faction, RegUser } from '../../../data/models';
import FactionPassword from '../../../data/models/FactionPassword';
import webSockets from '../../../socket/websockets';

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

  await createdFaction.addUser(user.regUser, {
    through: {
      admin: true,
    },
  });
  await factions.update();

  res.json({
    success: true,
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

const factionIcon = async (req: Request, res: Response, next) => {
  const { faction: factionIdParam } = req.params;
  const { user, _passport: passport } = req;

  const faction = factions.factionInfo.find((f) => f.id === factionIdParam);

  // Validation
  const errors = [];
  const existCheck = !!faction;
  let privateCheck = true;
  let belongsCheck = true;

  if (existCheck) {
    if (user) {
      const factionObj = await Faction.findByPk(factionIdParam);
      belongsCheck = await isMemberOfFaction(factionObj, user.regUser);
    } else if (passport) {
      belongsCheck = false;
    } else {
      privateCheck = !faction.private;
    }
  }

  if (!existCheck || (passport && !belongsCheck)) {
    errors.push('This faction does not exist.');
  } else if (!passport && !privateCheck) {
    next();
    return;
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

const generatePrivatePassword = async (req: Request, res: Response) => {
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
  const factionExistsCheck = !!faction;
  let adminCheck = true;
  let privateCheck = true;

  if (factionExistsCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
    privateCheck = faction.private;
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
  }

  if (!privateCheck) {
    errors.push('Passwords cannot be generated for public invites.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  const newPassword = await FactionPassword.create();
  await faction.addPassword(newPassword);

  res.json({
    success: true,
    password: newPassword.password,
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
  const factionExistsCheck = !!faction;
  let adminCheck = true;
  let privateCheck = true;

  if (factionExistsCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
    privateCheck = faction.private;
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
  }

  if (!privateCheck) {
    errors.push('Invites cannot be generated for public invites.');
  }

  if (
    factionExistsCheck
    && adminCheck
    && privateCheck
    && faction.invite === null
  ) {
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
  const factionExistsCheck = !!faction;
  let adminCheck = true;

  if (factionExistsCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
  }

  const { set, value } = req.body;

  switch (set) {
    case 'inviteEnabled':
      if (factionExistsCheck && adminCheck && !faction.private) {
        errors.push('Invite enabled cannot be changed for public factions.');
      }
      break;
    default:
      break;
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

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
  const ownFactionCheck = faction && (await isMemberOfFaction(faction, user.regUser));

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

const manageFactionMemberRank = async (
  req: Request,
  res: Response,
  admin: boolean,
) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;
  const { userId } = req.body;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const faction = await Faction.findByPk(factionIdParam);
  const promoteUser = await RegUser.findByPk(userId);

  // Validation
  const errors = [];
  const factionCheck = !(!faction || faction.leader !== user.regUser.id);
  const userCheck = !!promoteUser;
  let memberCheck = true;

  if (!factionCheck) {
    errors.push('You do not own this faction or it does not exist.');
  }

  if (!userCheck) {
    errors.push('This user does not exist.');
  }

  if (userCheck && factionCheck) {
    memberCheck = await faction.hasUser(promoteUser, {
      where: {
        '$UserFactions.admin$': !admin,
      },
      joinTableAttributes: ['admin'],
    });
  }

  if (!memberCheck) {
    errors.push(
      admin
        ? 'The user is already an admin, or not a member of this faction.'
        : "The user isn't an admin, or not member of this faction",
    );
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.removeUser(promoteUser);

  await faction.addUser(promoteUser, {
    through: {
      admin,
    },
  });

  await factions.updateFactionInfo();

  if (admin) {
    webSockets.notifyPromotedMember(promoteUser.id, faction.id);
  } else {
    webSockets.notifyDemotedMember(promoteUser.id, faction.id);
  }

  res.json({
    success: true,
  });
};

const unbanFactionMember = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;
  const { userId } = req.body;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const faction = await Faction.findByPk(factionIdParam);
  const unbanUser = await RegUser.findByPk(userId);

  // Validation
  const errors = [];
  const factionCheck = !!faction;
  const userCheck = !!unbanUser;
  let adminCheck = true;
  let memberCheck = true;

  if (factionCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
  }

  if (!userCheck) {
    errors.push('This user does not exist.');
  }

  if (userCheck && factionCheck) {
    memberCheck = !!(await faction.hasUser(unbanUser, {
      where: {
        '$UserFactions.banned$': true,
      },
      joinTableAttributes: ['banned'],
    }));
  }

  if (!memberCheck) {
    errors.push('The user is not banned from this faction.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.removeUser(unbanUser);
  await factions.updateBans();
  await factions.updateFactionInfo();

  res.json({
    success: true,
  });
};

const manageFactionMember = async (
  req: Request,
  res: Response,
  ban: boolean,
) => {
  const { faction: factionIdParam } = req.params;
  const { user } = req;
  const { userId } = req.body;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const faction = await Faction.findByPk(factionIdParam);
  const kickUser = await RegUser.findByPk(userId);

  // Validation
  const errors = [];
  const factionCheck = !!faction;
  const userCheck = !!kickUser;
  let adminCheck = true;
  let memberCheck = true;
  let selfCheck = true;

  if (factionCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
  }

  if (!userCheck) {
    errors.push('This user does not exist.');
  }

  if (userCheck && factionCheck) {
    memberCheck = !!(await faction.hasUser(kickUser, {
      where: {
        '$UserFactions.banned$': false,
      },
      joinTableAttributes: ['banned'],
    }));
  }

  if (userCheck) {
    selfCheck = user.regUser.id !== kickUser.id;
  }

  if (!selfCheck) {
    errors.push('You cannot kick or ban yourself.');
  }

  if (!memberCheck) {
    errors.push('The user is not a member of this faction.');
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
    });
    return;
  }

  await faction.removeUser(kickUser);

  if (ban) {
    await faction.addUser(kickUser, {
      through: {
        banned: true,
      },
    });

    await factions.updateBans();
  }

  await factions.updateFactionInfo();

  webSockets.notifyKickedMember(kickUser.id, faction.id);

  res.json({
    success: true,
  });
};

const promoteMember = (req: Request, res: Response) => manageFactionMemberRank(req, res, true);

const demoteMember = (req: Request, res: Response) => manageFactionMemberRank(req, res, false);

const kickFactionMember = (req: Request, res: Response) => manageFactionMember(req, res, false);

const banFactionMember = (req: Request, res: Response) => manageFactionMember(req, res, true);

const factionBans = async (req: Request, res: Response) => {
  const { user } = req;
  const { faction: factionIdParam } = req.params;

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
  const factionCheck = !!faction;
  let adminCheck = true;

  if (factionCheck) {
    adminCheck = await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    });
  } else {
    errors.push('This faction does not exist.');
  }

  if (!adminCheck) {
    errors.push('You do not have permission to perform this action.');
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
    banned: factions.factionBans.find((f) => f.id === factionIdParam).Users,
  });
};

const joinFactionPassword = async (req: Request, res: Response) => {
  const { user } = req;
  const { password } = req.body;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
    return;
  }

  const factionPassword = await FactionPassword.findOne({
    where: { password },
  });
  let faction;

  // Validation
  const errors = [];
  const existCheck = !!factionPassword;

  if (!existCheck) {
    errors.push('Invalid password.');
  } else {
    faction = await Faction.findByPk(factionPassword.FactionId);
    if (await isMemberOfFaction(faction, user.regUser)) {
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

  await factionPassword.destroy();
  await faction.addUser(user.regUser);
  await factions.update();

  res.json({
    success: true,
    info: factions.factionInfo.find((f) => f.id === faction.id),
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
  let bannedCheck = true;

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
    const banned = await faction.getUsers({
      attributes: [],
      joinTableAttributes: ['banned'],
      where: {
        id: user.regUser.id,
      },
    });
    if (banned[0]) {
      if (banned[0].UserFactions.banned) {
        bannedCheck = false;
      } else {
        errors.push('You are already a member of this faction.');
        errorCode = 'ER002';
      }
    }
  }

  if (!bannedCheck) {
    errors.push('You are banned from this faction.');
    errorCode = 'ER003';
  }

  if (errors.length > 0) {
    res.status(400);
    res.json({
      success: false,
      errors,
      errorCode,
      info:
        existCheck && bannedCheck
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
    return;
  }

  const userFactions = await user.regUser.getFactions({
    attributes: ['id', 'name'],
    order: ['name'],
    joinTableAttributes: ['banned'],
    where: {
      '$UserFactions.banned$': false,
    },
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

  let hideInvite = true;

  const info = getDetailedInfoFor !== undefined
    ? factions.factionInfo.find((f) => f.id === getDetailedInfoFor)
    : undefined;

  if (info.private) {
    const faction = await Faction.findByPk(info.id);
    hideInvite = !(await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    }));
  }

  // eslint-disable-next-line no-nested-ternary
  const invite = !info.invite ? info.invite : hideInvite ? '' : info.invite;

  res.json({
    ownFactions: userFactions,
    selected: { ...info, invite },
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
    return;
  }

  // Validation
  const errors = [];
  const ownFactionCheck = await user.regUser.hasFaction(factionIdParam, {
    where: {
      '$UserFactions.banned$': false,
    },
    joinTableAttributes: ['banned'],
  });

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

  let hideInvite = true;

  const info = factions.factionInfo.find((f) => f.id === factionIdParam);

  if (info.private) {
    const faction = await Faction.findByPk(info.id);
    hideInvite = !(await faction.hasUser(user.regUser, {
      where: {
        '$UserFactions.admin$': true,
      },
      joinTableAttributes: ['admin'],
    }));
  }

  // eslint-disable-next-line no-nested-ternary
  const invite = !info.invite ? info.invite : hideInvite ? '' : info.invite;

  res.json({
    success: true,
    faction: {
      ...info,
      invite,
    },
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
  generatePrivatePassword,
  leaveFaction,
  joinFactionPassword,
  kickFactionMember,
  banFactionMember,
  promoteMember,
  demoteMember,
  factionBans,
  unbanFactionMember,
};
