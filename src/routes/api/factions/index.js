/**
 *
 * @flow
 */

import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';

import factions, {
  newFaction,
  deleteFaction,
  factionIcon,
  joinFaction,
  transferFaction,
  ownFactions,
  factionInfo,
} from './factions';

import templates, { newTemplate } from './templates';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);
router.get('/icon/:faction', factionIcon);
router.patch('/:faction', joinFaction);
router.delete('/:faction', deleteFaction);
router.put('/:faction', transferFaction);
router.get('/mine', ownFactions);
router.get('/:faction', factionInfo);

router.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();

router.get('/:faction/templates', templates);
router.post('/:faction/templates', upload.single('image'), newTemplate);

export default router;
