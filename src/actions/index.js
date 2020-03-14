/* @flow */

import type { Action, ThunkAction, PromiseAction } from './types';
import type { Cell } from '../core/Cell';

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
      if (coolDownSeconds) {
        dispatch(notify(Math.round(coolDownSeconds)));
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
      dispatch(
        sweetAlert(
          errorTitle || `Error ${response.status}`,
          errors[0].msg,
          'error',
          'OK',
        ),
      );
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
    const { canvasId } = state.canvas;
    const selectedColor = color === undefined || color === null ? state.gui.selectedColor : color;

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

export function requestBigTemplateChunk(center: Cell): Action {
  return {
    type: 'REQUEST_BIG_TEMPLATE_CHUNK',
    center,
  };
}

export function receiveBigChunk(center: Cell): Action {
  return {
    type: 'RECEIVE_BIG_CHUNK',
    center,
  };
}

export function recieveBigTemplateChunk(center: Cell): Action {
  return {
    type: 'RECIEVE_BIG_TEMPLATE_CHUNK',
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

export function recieveBigTemplateChunkFailure(
  center: Cell,
  error: Error,
): Action {
  return {
    type: 'RECIEVE_BIG_TEMPLATE_CHUNK_FAILURE',
    center,
    error,
  };
}

export function receiveCoolDown(waitSeconds: number): Action {
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

export function receiveMe(me: Object): Action {
  const {
    name,
    id,
    messages,
    mailreg,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
    minecraftname,
    canvases,
    factions,
  } = me;
  return {
    type: 'RECEIVE_ME',
    name: name || null,
    id,
    messages: messages || [],
    mailreg: mailreg || false,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
    minecraftname,
    canvases,
    factions: factions || [],
  };
}

export function receiveStats(rankings: Object): Action {
  const { ranking: totalRanking, dailyRanking: totalDailyRanking } = rankings;
  return {
    type: 'RECEIVE_STATS',
    totalRanking,
    totalDailyRanking,
  };
}

export function recieveFactions(factions: Array): Action {
  return {
    type: 'RECIEVE_FACTIONS',
    factions,
  };
}

export function selectFaction(select: string): Action {
  return {
    type: 'SELECT_FACTION',
    select,
  };
}

export function loadingIcon(id: string): Action {
  return {
    type: 'LOADING_ICON',
    id,
  };
}

export function recieveFactionIcon(icon: string, factionFor: string): Action {
  return {
    type: 'RECIEVE_FACTION_ICON',
    icon,
    factionFor,
  };
}

export function recieveFactionInfo(info: Object): Action {
  return {
    type: 'RECIEVE_FACTION_INFO',
    info,
  };
}

export function setOwnFactions(ownFactions: Array): Action {
  return {
    type: 'RECIEVE_OWN_FACTIONS',
    ownFactions,
  };
}

export function recieveOwnFaction(ownFaction: any): Action {
  return {
    type: 'RECIEVE_OWN_FACTION',
    ownFaction,
  };
}

export function selectNextFaction(fromId: ?string): ThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    const id = fromId !== undefined ? fromId : state.gui.selectedFaction;
    const index = state.user.ownFactions.findIndex((f) => f.id === id);
    const newIndex = index < state.user.ownFactions.length - 1 ? index + 1 : 0;
    dispatch(selectFaction(state.user.ownFactions[newIndex].id));
  };
}

function deleteLocalFactionIndex(index): Action {
  return {
    type: 'DELETE_FACTION',
    index,
  };
}

function deleteOwnLocalFactionIndex(index): Action {
  return {
    type: 'DELETE_OWN_FACTION',
    index,
  };
}

export function deleteLocalFaction(id, ownOnly): PromiseAction {
  return (dispatch, getState) => {
    const state = getState();
    const index = state.user.factions.findIndex((f) => f.id === id);
    dispatch(selectNextFaction(id));
    if (ownOnly) {
      dispatch(deleteOwnLocalFactionIndex(index));
    } else {
      dispatch(deleteLocalFactionIndex(index));
    }
  };
}

export function recieveOwnFactions(ownFactions: Array): ThunkAction {
  return (dispatch, getState) => {
    const state = getState();
    dispatch(setOwnFactions(ownFactions));
    if (!ownFactions.find((f) => f.id === state.gui.selectedFaction)) {
      dispatch(selectNextFaction());
    }
  };
}

export function setName(name: string): Action {
  return {
    type: 'SET_NAME',
    name,
  };
}

export function setMinecraftName(minecraftname: string): Action {
  return {
    type: 'SET_MINECRAFT_NAME',
    minecraftname,
  };
}

export function setMailreg(mailreg: boolean): Action {
  return {
    type: 'SET_MAILREG',
    mailreg,
  };
}

export function remFromMessages(message: string): Action {
  return {
    type: 'REM_FROM_MESSAGES',
    message,
  };
}

function setLocalFactionInvite(id, invite): Action {
  return {
    type: 'SET_FACTION_INVITE',
    id,
    invite,
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

export function fetchFactions(): PromiseAction {
  return async (dispatch) => {
    const response = await fetch('api/factions', { credentials: 'include' });
    if (response.ok) {
      const factions = await response.json();

      dispatch(recieveFactions(factions));
    }
  };
}

export function fetchFactionIcon(id): PromiseAction {
  return async (dispatch) => {
    dispatch(loadingIcon(id));
    const response = await fetch(`api/factions/icon/${id}`, {
      credentials: 'include',
    });
    if (response.ok) {
      const { success, icon } = await response.json();

      if (success) {
        dispatch(recieveFactionIcon(icon, id));
      }
    }
  };
}

export function fetchFactionInfo(id): PromiseAction {
  return async (dispatch) => {
    const response = await fetch(`/api/factions/${id}`, {
      credentials: 'include',
    });
    if (response.ok) {
      const { success, faction } = await response.json();

      if (success) {
        dispatch(recieveFactionInfo(faction));
      }
    }
  };
}

export function fetchOwnFactions(id, emptyIfNotLoggedIn): ThunkAction {
  return async (dispatch, getState) => {
    emptyIfNotLoggedIn = emptyIfNotLoggedIn !== undefined ? emptyIfNotLoggedIn : true;
    if (getState().user.name === null && emptyIfNotLoggedIn) {
      dispatch(recieveOwnFactions([]));
    }
    id = id !== undefined ? id : 'first';
    const response = await fetch(
      `/api/factions/mine${id !== undefined ? `?selected=${id}` : ''}`,
      {
        credentials: 'include',
      },
    );
    if (response.ok) {
      const { ownFactions, selected } = await response.json();

      if (selected) {
        dispatch(recieveFactionInfo(selected));
      }

      dispatch(recieveOwnFactions(ownFactions));
    }
  };
}

export function toggleFactionInvite(id): ThunkAction {
  return async (dispatch, getState) => {
    const isEnabled = getState().user.factions.find((f) => f.id === id).invite === null;
    const newState = isEnabled ? '' : null;
    dispatch(setLocalFactionInvite(id, newState));

    const response = await fetch(`/api/factions/${id}`, {
      body: JSON.stringify({ set: 'inviteEnabled', value: isEnabled }),
      headers: {
        'Content-type': 'application/json',
      },
      method: 'PATCH',
      credentials: 'include',
    });

    if (!response.ok || (response.ok && !(await response.json()).success)) {
      throw new Error('Failed to update faction information.');
    }
  };
}

export function setFactionInvite(id, invite): Action {
  return {
    type: 'SET_FACTION_INVITE',
    id,
    invite,
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

export function showFactionsAreaModal(): Action {
  return showModal('FACTION');
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
  if (window.innerWidth > 604) {
    return toggleChatBox();
  }
  return showModal('CHAT');
}

export function hideModal(): Action {
  return {
    type: 'HIDE_MODAL',
  };
}

export function joinFaction(id, callback, errorCallback): PromiseAction {
  return async (dispatch) => {
    const response = await fetch(`/api/factions/${id}/join`, {
      credentials: 'include',
      method: 'PATCH',
    });
    let errorCode = '';

    if (response.ok || response.status === 400) {
      const json = await response.json();
      if (!json.success) {
        errorCode = json.errorCode === 'ER002' ? '' : json.errorCode || response.status;
        if (json.errorCode === 'ER002') {
          id = json.info.id;
        }
      }
    } else {
      errorCode = response.status;
    }

    if (errorCode) {
      errorCallback(errorCode);
    } else {
      window.history.replaceState(undefined, undefined, '/');
      callback();
      await dispatch(fetchOwnFactions(id, false));
      dispatch(selectFaction(id));
      dispatch(showFactionsAreaModal());
    }
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

export function changeTemplateAlpha(alpha: number): Action {
  return {
    type: 'CHANGE_TEMPLATE_ALPHA',
    alpha,
  };
}

export function toggleTemplateOpen(): Action {
  return {
    type: 'TOGGLE_TEMPLATE_OPEN',
  };
}

export function toggleTemplateEnable(): Action {
  return {
    type: 'TOGGLE_TEMPLATE_ENABLE',
  };
}

export function showConfirmationModal(
  msg: string,
  header: string,
  confirmCB: () => void,
  cancelCB: () => void,
  text: ?string,
): Action {
  return {
    type: 'SHOW_CONFIRMATION',
    options: {
      msg,
      header,
      confirmCB,
      cancelCB,
      text,
      open: true,
    },
  };
}

export function closeConfirmationModal(): Action {
  return {
    type: 'CLOSE_CONFIRMATION',
  };
}

export function recieveJoinedFaction(factionInfo): ThunkAction {
  return (dispatch) => {
    dispatch(recieveFactionInfo(factionInfo));
    dispatch(recieveOwnFaction({ id: factionInfo.id, name: factionInfo.name }));
    dispatch(selectFaction(factionInfo.id));
  };
}

export function removeUserFromFaction(userId, factionId): Action {
  return {
    type: 'REMOVE_USER_FACTION',
    userId,
    factionId,
  };
}

export function setUserFactionRank(userId, factionId, admin): Action {
  return {
    type: 'SET_USER_RANK',
    userId,
    factionId,
    admin,
  };
}

export function resetUserFactions(): Action {
  return {
    type: 'RESET_USER_FACTIONS',
  };
}

function receiveFactionBannedMembers(factionId, banned): Action {
  return {
    type: 'RECEIVE_FACTION_BANNED_MEMBERS',
    factionId,
    banned,
  };
}

export function fetchFactionBannedMembers(id): PromiseAction {
  return async (dispatch) => {
    const response = await fetch(`/api/factions/${id}/bans`, {
      headers: {
        'Content-type': 'application/json',
      },
      method: 'GET',
      credentials: 'include',
    });

    let success = false;
    let json;

    if (response.ok) {
      json = await response.json();
      success = json.success;
    }

    if (!success) {
      throw new Error('Failed to fetch ban list.');
    }

    dispatch(receiveFactionBannedMembers(id, json.banned));
  };
}

export function handleFactionMemberUnbanned(factionId, userId): Action {
  return {
    type: 'HANDLE_FACTION_MEMBER_UNBAN',
    factionId,
    userId,
  };
}
