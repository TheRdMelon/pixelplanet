/**
 *
 * @flow
 */

import express from 'express';

import factions, { newFaction } from './factions';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);

export default router;
