/* @flow */

import { persistCombineReducers, persistStore } from 'redux-persist';
import localForage from 'localforage';
import audio from './audio';
import canvas from './canvas';
import gui from './gui';
import modal from './modal';
import user from './user';

import type { AudioState } from './audio';
import type { CanvasState } from './canvas';
import type { GUIState } from './gui';
import type { ModalState } from './modal';
import type { UserState } from './user';

export type State = {
  audio: AudioState,
  canvas: CanvasState,
  gui: GUIState,
  modal: ModalState,
  user: UserState,
};

const config = {
  key: 'primary',
  storage: localForage,
  blacklist: ['user', 'canvas', 'modal'],
};

export default persistCombineReducers(config, {
  audio,
  canvas,
  gui,
  modal,
  user,
});
