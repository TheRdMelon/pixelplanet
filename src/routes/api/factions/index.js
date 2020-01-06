/**
 *
 * @flow
 */

import express from 'express';

import factions, { newFaction, deleteFaction, factionIcon } from './factions';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);
router.post('/delete', deleteFaction);
router.get('/icon/:f(.+)', factionIcon);

export default router;
