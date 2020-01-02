/*
 * send global ranking
 * @flow
 */

import type { Request, Response } from 'express';

import rankings from '../../core/ranking';


export default async (req: Request, res: Response) => {
  res.json(rankings.ranks);
};
