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
  modifyFaction,
  generatePrivateInvite,
} from './factions';

import templates, { newTemplate } from './templates';

const router = express.Router();

router.get('/', factions);
router.post('/create', newFaction);
router.post('/generateinvite', generatePrivateInvite);
router.get('/icon/:faction', factionIcon);
router.patch('/:faction/join', joinFaction);
router.patch('/:faction', modifyFaction);
router.delete('/:faction', deleteFaction);
router.put('/:faction', transferFaction);
router.get('/mine', ownFactions);
router.get('/:faction', factionInfo);

router.use(bodyParser.urlencoded({ extended: true }));
const upload = multer();

router.get('/:faction/templates', templates);
router.post('/:faction/templates', upload.single('image'), newTemplate);

export default router;
