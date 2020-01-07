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
  transferFaction,
} from './factions';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);
router.get('/icon/:faction', factionIcon);
router.patch('/:faction', joinFaction);
router.delete('/:faction', deleteFaction);
router.put('/:faction', transferFaction);

export default router;
