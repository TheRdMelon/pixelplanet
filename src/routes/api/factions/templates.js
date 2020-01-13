/**
 *
 * @flow
 */

import type { Request, Response } from 'express';

import sharp from 'sharp';
import canvases from '../../../canvases.json';

import { getIdFromObject } from '../../../core/utils';
import { Faction } from '../../../data/models/index';
import { imageABGR2Canvas } from '../../../core/Image';

const templates = async (req: Request, res: Response) => {};

const newTemplate = async (req: Request, res: Response) => {
  const { faction: factionIdParam } = req.params;
  const { user, file } = req;
  const { canvasindent, x: xIn, y: yIn } = req.body;

  if (!user) {
    res.status(401);
    res.json({
      errors: ['You are not authenticated.'],
    });
  }

  const x = parseInt(xIn, 10);
  const y = parseInt(yIn, 10);
  const faction = await Faction.findOne({
    where: {
      leader: user.regUser.id,
      id: factionIdParam,
    },
  });

  let canvasId;
  let canvas;
  let imageInfo;
  let imageData;

  // Validation
  const errors = [];
  const xNumber = !Number.isNaN(x);
  const yNumber = !Number.isNaN(y);
  const canvasCheck = !!canvasindent;
  const factionCheck = !!faction;

  let canvasExists;
  let imageCheck;
  let boundsCheck;

  if (canvasCheck) {
    canvasId = getIdFromObject(canvases, canvasindent);
    canvasExists = canvasId !== null;

    if (canvasExists) {
      canvas = canvases[canvasId];
    }
  }

  if (!xNumber) errors.push('X coordinate is not a number.');
  if (!yNumber) errors.push('Y coordinate is not a number.');
  if (!canvasCheck) errors.push('No canvas specified.');
  if (canvasExists === false) errors.push('This canvas does not exist');
  if (!factionCheck) {
    errors.push(
      'This faction does not exist or you do not have permission to create templates for it.',
    );
  }

  if (errors.length === 0) {
    const { err, data, info } = await sharp(file.buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (err) {
      errors.push(err);
    } else {
      imageCheck = true;
      imageInfo = info;
      imageData = data;
    }
  }

  if (imageCheck) {
    const canvasMaxXY = canvas.size / 2;
    const canvasMinXY = -canvasMaxXY;
    boundsCheck = x >= canvasMinXY
      && y >= canvasMinXY
      && x + imageInfo.width < canvasMaxXY
      && y + imageInfo.height < canvasMaxXY;
  }

  if (boundsCheck === false) {
    errors.push(
      'One or more image corner is out-of-bounds on the selected canvas',
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

  await imageABGR2Canvas(
    canvasId,
    x,
    y,
    imageData,
    imageInfo.width,
    imageInfo.height,
    false,
    false,
    0,
  );

  res.json({ success: true });
};

export default templates;
export { newTemplate };
