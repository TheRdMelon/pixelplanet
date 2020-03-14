/* @flow */

import type { Cell } from '../core/Cell';
import type { ColorIndex } from '../core/Palette';
import type { State } from '../reducers';
import type { ConfirmationOptions } from '../reducers/modal';

export type Action =
  | { type: 'LOGGED_OUT' }
  // my actions
  | {
      type: 'ALERT',
      title: string,
      text: string,
      icon: string,
      confirmButtonText: string,
    }
  | { type: 'TOGGLE_GRID' }
  | { type: 'TOGGLE_PIXEL_NOTIFY' }
  | { type: 'TOGGLE_AUTO_ZOOM_IN' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_OPEN_PALETTE' }
  | { type: 'TOGGLE_COMPACT_PALETTE' }
  | { type: 'TOGGLE_CHAT_NOTIFY' }
  | { type: 'TOGGLE_POTATO_MODE' }
  | { type: 'TOGGLE_LIGHT_GRID' }
  | { type: 'TOGGLE_OPEN_MENU' }
  | { type: 'TOGGLE_HISTORICAL_VIEW' }
  | { type: 'SET_NOTIFICATION', notification: string }
  | { type: 'UNSET_NOTIFICATION' }
  | { type: 'SET_PLACE_ALLOWED', placeAllowed: boolean }
  | { type: 'SET_HOVER', hover: Cell }
  | { type: 'UNSET_HOVER' }
  | { type: 'SET_WAIT', wait: ?number }
  | { type: 'SET_MOBILE', mobile: boolean }
  | { type: 'COOLDOWN_END' }
  | { type: 'COOLDOWN_SET', coolDown: number }
  | { type: 'SELECT_COLOR', color: ColorIndex }
  | { type: 'SELECT_CANVAS', canvasId: number }
  | { type: 'PLACE_PIXEL', coordinates: Cell, color: ColorIndex, wait: string }
  | { type: 'PIXEL_WAIT', coordinates: Cell, color: ColorIndex, wait: string }
  | { type: 'PIXEL_FAILURE' }
  | { type: 'SET_VIEW_COORDINATES', view: Cell }
  | { type: 'SET_SCALE', scale: number, zoompoint: Cell }
  | { type: 'REQUEST_BIG_CHUNK', center: Cell }
  | { type: 'REQUEST_BIG_TEMPLATE_CHUNK', center: Cell }
  | { type: 'RECEIVE_BIG_CHUNK', center: Cell }
  | {
      type: 'RECIEVE_BIG_TEMPLATE_CHUNK',
      center: Cell,
    }
  | { type: 'RECEIVE_BIG_CHUNK_FAILURE', center: Cell, error: Error }
  | { type: 'RECIEVE_BIG_TEMPLATE_CHUNK_FAILURE', center: Cell, error: Error }
  | { type: 'RECEIVE_COOLDOWN', waitSeconds: number }
  | {
      type: 'RECEIVE_PIXEL_UPDATE',
      i: number,
      j: number,
      offset: number,
      color: ColorIndex,
    }
  | { type: 'RECEIVE_ONLINE', online: number }
  | { type: 'RECEIVE_CHAT_MESSAGE', name: string, text: string }
  | { type: 'RECEIVE_CHAT_HISTORY', data: Array }
  | {
      type: 'RECEIVE_ME',
      name: string,
      id: number,
      waitSeconds: number,
      messages: Array,
      mailreg: boolean,
      totalPixels: number,
      dailyTotalPixels: number,
      ranking: number,
      dailyRanking: number,
      minecraftname: string,
      canvases: Object,
    }
  | { type: 'RECEIVE_STATS', totalRanking: Object, totalDailyRanking: Object }
  | { type: 'RECIEVE_FACTIONS', factions: Array }
  | { type: 'SELECT_FACTION', select: string }
  | { type: 'LOADING_ICON', id: string }
  | { type: 'RECIEVE_FACTION_ICON', icon: string, factionFor: string }
  | { type: 'RECIEVE_FACTION_INFO', info: Object }
  | { type: 'RECIEVE_OWN_FACTIONS', ownFactions: Array }
  | { type: 'RECIEVE_OWN_FACTION', ownFaction: any }
  | { type: 'SET_NAME', name: string }
  | { type: 'SET_MINECRAFT_NAME', minecraftname: string }
  | { type: 'SET_MAILREG', mailreg: boolean }
  | { type: 'REM_FROM_MESSAGES', message: string }
  | { type: 'SHOW_MODAL', modalType: string, modalProps: obj }
  | { type: 'HIDE_MODAL' }
  | { type: 'RELOAD_URL' }
  | { type: 'ON_VIEW_FINISH_CHANGE' }
  | { type: 'CHANGE_TEMPLATE_ALPHA', alpha: number }
  | { type: 'SET_HISTORICAL_TIME', date: string, time: string }
  | { type: 'ON_VIEW_FINISH_CHANGE' }
  | { type: 'TOGGLE_TEMPLATE_OPEN' }
  | { type: 'TOGGLE_TEMPLATE_ENABLE' }
  | { type: 'CLOSE_CONFIRMATION' }
  | { type: 'SHOW_CONFIRMATION', options: ConfirmationOptions }
  | { type: 'REMOVE_USER_FACTION', userId: number, factionId: string }
  | { type: 'RESET_USER_FACTIONS' }
  | {
      type: 'RECEIVE_FACTION_BANNED_MEMBERS',
      factionId: string,
      banned: Array,
    }
  | { type: 'HANDLE_FACTION_MEMBER_UNBAN', factionId: string, userId: number };
export type PromiseAction = Promise<Action>;
export type Dispatch = (
  // eslint-disable-next-line no-use-before-define
  action: Action | ThunkAction | PromiseAction | Array<Action>,
) => any;
export type GetState = () => State;
export type ThunkAction = (dispatch: Dispatch, getState: GetState) => any;
