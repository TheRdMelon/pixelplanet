/* @flow */

import type { Cell } from '../core/Cell';
import type { ColorIndex } from '../core/Palette';
import type { State } from '../reducers';


export type Action =
    { type: 'LOGGED_OUT' }
  // my actions
  | { type: 'ALERT',
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
  | { type: 'SELECT_STYLE', style: string }
  | { type: 'SET_NOTIFICATION', notification: string }
  | { type: 'UNSET_NOTIFICATION' }
  | { type: 'SET_PLACE_ALLOWED', placeAllowed: boolean }
  | { type: 'SET_HOVER', hover: Cell }
  | { type: 'UNSET_HOVER' }
  | { type: 'SET_WAIT', wait: ?number }
  | { type: 'RECEIVE_COOLDOWN', wait: number }
  | { type: 'SET_MOBILE', mobile: boolean }
  | { type: 'COOLDOWN_END' }
  | { type: 'COOLDOWN_SET', coolDown: number }
  | { type: 'SELECT_COLOR', color: ColorIndex }
  | { type: 'SELECT_CANVAS', canvasId: number }
  | { type: 'REQUEST_PLACE_PIXEL',
    i: number,
    j: number,
    offset: number,
    color: ColorIndex,
  }
  | { type: 'PLACE_PIXEL' }
  | { type: 'PIXEL_WAIT' }
  | { type: 'PIXEL_FAILURE' }
  | { type: 'SET_VIEW_COORDINATES', view: Cell }
  | { type: 'SET_SCALE', scale: number, zoompoint: Cell }
  | { type: 'REQUEST_BIG_CHUNK', center: Cell }
  | { type: 'PRE_LOADED_BIG_CHUNK', center: Cell }
  | { type: 'RECEIVE_BIG_CHUNK', center: Cell }
  | { type: 'RECEIVE_BIG_CHUNK_FAILURE', center: Cell, error: Error }
  | { type: 'RECEIVE_PIXEL_UPDATE',
    i: number,
    j: number,
    offset: number,
    color: ColorIndex,
  }
  | { type: 'RECEIVE_ONLINE', online: number }
  | { type: 'RECEIVE_CHAT_MESSAGE',
    name: string,
    text: string,
    country: string,
    channel: number,
    isPing: boolean,
  }
  | { type: 'RECEIVE_CHAT_HISTORY', data: Array }
  | { type: 'SET_CHAT_CHANNEL', channelId: number }
  | { type: 'RECEIVE_ME',
    name: string,
    waitSeconds: number,
    messages: Array,
    mailreg: boolean,
    totalPixels: number,
    dailyTotalPixels: number,
    ranking: number,
    dailyRanking: number,
    minecraftname: string,
    canvases: Object
  }
  | { type: 'RECEIVE_STATS', totalRanking: Object, totalDailyRanking: Object }
  | { type: 'SET_NAME', name: string }
  | { type: 'SET_MINECRAFT_NAME', minecraftname: string }
  | { type: 'SET_MAILREG', mailreg: boolean }
  | { type: 'REM_FROM_MESSAGES', message: string }
  | { type: 'SHOW_MODAL', modalType: string }
  | { type: 'HIDE_MODAL' }
  | { type: 'RELOAD_URL' }
  | { type: 'SET_HISTORICAL_TIME', date: string, time: string }
  | { type: 'ON_VIEW_FINISH_CHANGE' };
export type PromiseAction = Promise<Action>;
export type GetState = () => State;
