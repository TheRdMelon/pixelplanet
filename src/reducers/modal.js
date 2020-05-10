/**
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type ModalState = {
  modalType: ?string,
  chatOpen: boolean,
};

const initialState: ModalState = {
  modalType: null,
  chatOpen: false,
};


export default function modal(
  state: ModalState = initialState,
  action: Action,
): ModalState {
  switch (action.type) {
    // clear hover when placing a pixel
    // fixes a bug with iPad
    case 'SHOW_MODAL': {
      const { modalType } = action;
      const chatOpen = (modalType === 'CHAT') ? false : state.chatOpen;
      return {
        ...state,
        modalType,
        chatOpen,
      };
    }

    case 'SELECT_CANVAS':
    case 'HIDE_MODAL':
      return {
        ...state,
        modalType: null,
      };

    case 'TOGGLE_CHAT_BOX': {
      return {
        ...state,
        chatOpen: !state.chatOpen,
      };
    }

    case 'RECEIVE_ME': {
      const { name } = action;
      const chatOpen = (name) ? state.chatOpen : false;
      return {
        ...state,
        chatOpen,
      };
    }

    default:
      return state;
  }
}
