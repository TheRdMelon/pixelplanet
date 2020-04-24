/* @flow */

import type {
  Action,
  ThunkAction,
  PromiseAction,
} from './types';
import type { Cell } from '../core/Cell';
import type { ColorIndex } from '../core/Palette';

export function sweetAlert(
  title: string,
  text: string,
  icon: string,
  confirmButtonText: string,
): Action {
  return {
    type: 'ALERT',
    title,
    text,
    icon,
    confirmButtonText,
  };
}

export function toggleChatBox(): Action {
  return {
    type: 'TOGGLE_CHAT_BOX',
  };
}

export function toggleHistoricalView(): Action {
  return {
    type: 'TOGGLE_HISTORICAL_VIEW',
  };
}

export function toggleGrid(): Action {
  return {
    type: 'TOGGLE_GRID',
  };
}

export function togglePixelNotify(): Action {
  return {
    type: 'TOGGLE_PIXEL_NOTIFY',
  };
}

export function toggleAutoZoomIn(): Action {
  return {
    type: 'TOGGLE_AUTO_ZOOM_IN',
  };
}

export function toggleMute(): Action {
  return {
    type: 'TOGGLE_MUTE',
  };
}

export function toggleCompactPalette(): Action {
  return {
    type: 'TOGGLE_COMPACT_PALETTE',
  };
}

export function toggleChatNotify(): Action {
  return {
    type: 'TOGGLE_CHAT_NOTIFY',
  };
}

export function togglePotatoMode(): Action {
  return {
    type: 'TOGGLE_POTATO_MODE',
  };
}

export function toggleLightGrid(): Action {
  return {
    type: 'TOGGLE_LIGHT_GRID',
  };
}

export function toggleOpenPalette(): Action {
  return {
    type: 'TOGGLE_OPEN_PALETTE',
  };
}

export function toggleOpenMenu(): Action {
  return {
    type: 'TOGGLE_OPEN_MENU',
  };
}

export function setPlaceAllowed(placeAllowed: boolean): Action {
  return {
    type: 'SET_PLACE_ALLOWED',
    placeAllowed,
  };
}

export function setNotification(notification: string): Action {
  return {
    type: 'SET_NOTIFICATION',
    notification,
  };
}

export function unsetNotification(): Action {
  return {
    type: 'UNSET_NOTIFICATION',
  };
}

export function setHover(hover: Cell): Action {
  return {
    type: 'SET_HOVER',
    hover,
  };
}

export function unsetHover(): Action {
  return {
    type: 'UNSET_HOVER',
  };
}

export function setWait(wait: ?number): Action {
  return {
    type: 'SET_WAIT',
    wait,
  };
}

export function setMobile(mobile: boolean): Action {
  return {
    type: 'SET_MOBILE',
    mobile,
  };
}

export function selectColor(color: ColorIndex): Action {
  return {
    type: 'SELECT_COLOR',
    color,
  };
}

export function selectCanvas(canvasId: number): Action {
  return {
    type: 'SELECT_CANVAS',
    canvasId,
  };
}

export function placePixel(coordinates: Cell, color: ColorIndex): Action {
  return {
    type: 'PLACE_PIXEL',
    coordinates,
    color,
  };
}

export function pixelWait(coordinates: Cell, color: ColorIndex): Action {
  return {
    type: 'PIXEL_WAIT',
    coordinates,
    color,
  };
}

export function pixelFailure(): Action {
  return {
    type: 'PIXEL_FAILURE',
  };
}

export function receiveOnline(online: number): Action {
  return {
    type: 'RECEIVE_ONLINE',
    online,
  };
}

export function receiveChatMessage(name: string, text: string): Action {
  return {
    type: 'RECEIVE_CHAT_MESSAGE',
    name,
    text,
  };
}

export function receiveChatHistory(data: Array): Action {
  return {
    type: 'RECEIVE_CHAT_HISTORY',
    data,
  };
}

let lastNotify = null;
export function notify(notification: string) {
  return async (dispatch) => {
    dispatch(setNotification(notification));
    if (lastNotify) {
      clearTimeout(lastNotify);
      lastNotify = null;
    }
    lastNotify = setTimeout(() => {
      dispatch(unsetNotification());
    }, 1500);
  };
}

export function requestPlacePixel(
  canvasId: number,
  coordinates: Cell,
  color: ColorIndex,
  token: ?string = null,
): ThunkAction {
  const [x, y, z] = coordinates;

  return async (dispatch) => {
    const body = JSON.stringify({
      cn: canvasId,
      x,
      y,
      z,
      clr: color,
      token,
    });

    dispatch(setPlaceAllowed(false));
    try {
      const response = await fetch('/api/pixel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        // https://github.com/github/fetch/issues/349
        credentials: 'include',
      });
      const {
        success,
        waitSeconds,
        coolDownSeconds,
        errors,
        errorTitle,
      } = await response.json();

      if (waitSeconds) {
        dispatch(setWait(waitSeconds * 1000));
      }
      const coolDownNotify = Math.round(coolDownSeconds);
      if (coolDownSeconds) {
        dispatch(notify(coolDownNotify));
      }
      if (response.ok) {
        if (success) {
          dispatch(placePixel(coordinates, color));
        } else {
          dispatch(pixelWait(coordinates, color));
        }
        return;
      }

      if (response.status === 422) {
        window.pixel = { canvasId, coordinates, color };
        window.grecaptcha.execute();
        return;
      }

      dispatch(pixelFailure());
      dispatch(sweetAlert(
        (errorTitle || `Error ${response.status}`),
        errors[0].msg,
        'error',
        'OK',
      ));
    } finally {
      dispatch(setPlaceAllowed(true));
    }
  };
}

export function tryPlacePixel(
  coordinates: Cell,
  color: ?ColorIndex = null,
): ThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const {
      canvasId,
    } = state.canvas;
    const selectedColor = (color === undefined || color === null)
      ? state.gui.selectedColor
      : color;

    dispatch(requestPlacePixel(canvasId, coordinates, selectedColor));
  };
}

export function setViewCoordinates(view: Cell): Action {
  return {
    type: 'SET_VIEW_COORDINATES',
    view,
  };
}

export function move([dx, dy]: Cell): ThunkAction {
  return (dispatch, getState) => {
    const { view } = getState().canvas;

    const [x, y] = view;
    dispatch(setViewCoordinates([x + dx, y + dy]));
  };
}

export function moveDirection([vx, vy]: Cell): ThunkAction {
  // TODO check direction is unitary vector
  return (dispatch, getState) => {
    const { viewscale } = getState().canvas;

    const speed = 100.0 / viewscale;
    dispatch(move([speed * vx, speed * vy]));
  };
}

export function moveNorth(): ThunkAction {
  return (dispatch) => {
    dispatch(moveDirection([0, -1]));
  };
}

export function moveWest(): ThunkAction {
  return (dispatch) => {
    dispatch(moveDirection([-1, 0]));
  };
}

export function moveSouth(): ThunkAction {
  return (dispatch) => {
    dispatch(moveDirection([0, 1]));
  };
}

export function moveEast(): ThunkAction {
  return (dispatch) => {
    dispatch(moveDirection([1, 0]));
  };
}


export function setScale(scale: number, zoompoint: Cell): Action {
  return {
    type: 'SET_SCALE',
    scale,
    zoompoint,
  };
}

export function zoomIn(zoompoint): ThunkAction {
  return (dispatch, getState) => {
    const { scale } = getState().canvas;
    const zoomscale = scale >= 1.0 ? scale * 1.1 : scale * 1.04;
    dispatch(setScale(zoomscale, zoompoint));
  };
}

export function zoomOut(zoompoint): ThunkAction {
  return (dispatch, getState) => {
    const { scale } = getState().canvas;
    const zoomscale = scale >= 1.0 ? scale / 1.1 : scale / 1.04;
    dispatch(setScale(zoomscale, zoompoint));
  };
}

export function requestBigChunk(center: Cell): Action {
  return {
    type: 'REQUEST_BIG_CHUNK',
    center,
  };
}

export function preLoadedBigChunk(
  center: Cell,
): Action {
  return {
    type: 'PRE_LOADED_BIG_CHUNK',
    center,
  };
}

export function receiveBigChunk(
  center: Cell,
): Action {
  return {
    type: 'RECEIVE_BIG_CHUNK',
    center,
  };
}

export function receiveBigChunkFailure(center: Cell, error: Error): Action {
  return {
    type: 'RECEIVE_BIG_CHUNK_FAILURE',
    center,
    error,
  };
}

export function receiveCoolDown(
  waitSeconds: number,
): Action {
  return {
    type: 'RECEIVE_COOLDOWN',
    waitSeconds,
  };
}

export function receivePixelUpdate(
  i: number,
  j: number,
  offset: number,
  color: ColorIndex,
): Action {
  return {
    type: 'RECEIVE_PIXEL_UPDATE',
    i,
    j,
    offset,
    color,
  };
}

export function receiveMe(
  me: Object,
): Action {
  const {
    name,
    messages,
    mailreg,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
    minecraftname,
    canvases,
  } = me;
  return {
    type: 'RECEIVE_ME',
    name: (name) || null,
    messages: (messages) || [],
    mailreg: (mailreg) || false,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
    minecraftname,
    canvases,
  };
}

export function receiveStats(
  rankings: Object,
): Action {
  const { ranking: totalRanking, dailyRanking: totalDailyRanking } = rankings;
  return {
    type: 'RECEIVE_STATS',
    totalRanking,
    totalDailyRanking,
  };
}

export function setName(
  name: string,
): Action {
  return {
    type: 'SET_NAME',
    name,
  };
}

export function setMinecraftName(
  minecraftname: string,
): Action {
  return {
    type: 'SET_MINECRAFT_NAME',
    minecraftname,
  };
}

export function setMailreg(
  mailreg: boolean,
): Action {
  return {
    type: 'SET_MAILREG',
    mailreg,
  };
}

export function remFromMessages(
  message: string,
): Action {
  return {
    type: 'REM_FROM_MESSAGES',
    message,
  };
}

export function fetchStats(): PromiseAction {
  return async (dispatch) => {
    const response = await fetch('api/ranking', { credentials: 'include' });
    if (response.ok) {
      const rankings = await response.json();

      dispatch(receiveStats(rankings));
    }
  };
}

export function fetchMe(): PromiseAction {
  return async (dispatch) => {
    const response = await fetch('/api/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const me = await response.json();
      dispatch(receiveMe(me));
    }
  };
}

function setCoolDown(coolDown): Action {
  return {
    type: 'COOLDOWN_SET',
    coolDown,
  };
}

function endCoolDown(): Action {
  return {
    type: 'COOLDOWN_END',
  };
}

function getPendingActions(state): Array<Action> {
  const actions = [];

  const { wait } = state.user;
  if (wait === null || wait === undefined) return actions;

  const coolDown = wait - Date.now();

  if (coolDown > 0) actions.push(setCoolDown(coolDown));
  else actions.push(endCoolDown());

  return actions;
}

export function initTimer(): ThunkAction {
  return (dispatch, getState) => {
    function tick() {
      const state = getState();
      const actions = getPendingActions(state);
      dispatch(actions);
    }

    // something shorter than 1000 ms
    setInterval(tick, 333);
  };
}

export function showModal(modalType: string, modalProps: Object = {}): Action {
  return {
    type: 'SHOW_MODAL',
    modalType,
    modalProps,
  };
}

export function showSettingsModal(): Action {
  return showModal('SETTINGS');
}

export function showUserAreaModal(): Action {
  return showModal('USERAREA');
}

export function showMinecraftModal(): Action {
  return showModal('MINECRAFT');
}

export function showRegisterModal(): Action {
  return showModal('REGISTER');
}

export function showForgotPasswordModal(): Action {
  return showModal('FORGOT_PASSWORD');
}

export function showHelpModal(): Action {
  return showModal('HELP');
}

export function showCanvasSelectionModal(): Action {
  return showModal('CANVAS_SELECTION');
}

export function showChatModal(): Action {
  if (window.innerWidth > 604) { return toggleChatBox(); }
  return showModal('CHAT');
}

export function hideModal(): Action {
  return {
    type: 'HIDE_MODAL',
  };
}

export function reloadUrl(): Action {
  return {
    type: 'RELOAD_URL',
  };
}

export function onViewFinishChange(): Action {
  return {
    type: 'ON_VIEW_FINISH_CHANGE',
  };
}

export function selectHistoricalTime(date: string, time: string) {
  return {
    type: 'SET_HISTORICAL_TIME',
    date,
    time,
  };
}

export function urlChange(): PromiseAction {
  return (dispatch) => {
    dispatch(reloadUrl());
  };
}
