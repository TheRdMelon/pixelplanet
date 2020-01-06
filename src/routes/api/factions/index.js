/**
 *
 * @flow
 */

import express from 'express';

import factions, {
  newFaction,
  deleteFaction,
  factionIcon,
  joinFaction,
} from './factions';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);
router.post('/delete', deleteFaction);
router.get('/icon/:faction', factionIcon);
router.post('/join/:faction', joinFaction);

export default router;
