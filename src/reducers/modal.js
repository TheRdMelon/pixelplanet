/**
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import type { Action } from '../actions/types';

export type ConfirmationOptions = {
  text: ?string,
  open: boolean,
  heading: ?string,
  cancelCB: ?() => void,
  confirmCB: ?() => void,
  msg: ?string,
};

export type ModalState = {
  modalType: ?string,
  modalProps: object,
  chatOpen: boolean,
  confirmationModalOptions: ConfirmationOptions,
};

const initialState: ModalState = {
  modalType: null,
  modalProps: {},
  chatOpen: false,
  confirmationModalOptions: {},
};

export default function modal(
  state: ModalState = initialState,
  action: Action,
): ModalState {
  switch (action.type) {
    // clear hover when placing a pixel
    // fixes a bug with iPad
    case 'SHOW_MODAL': {
      const { modalType, modalProps } = action;
      const chatOpen = modalType === 'CHAT' ? false : state.chatOpen;
      return {
        ...state,
        modalType,
        modalProps,
        chatOpen,
      };
    }

    case 'SELECT_CANVAS':
    case 'HIDE_MODAL':
      return {
        ...state,
        modalType: null,
        modalProps: {},
      };

    case 'TOGGLE_CHAT_BOX': {
      return {
        ...state,
        chatOpen: !state.chatOpen,
      };
    }

    case 'RECEIVE_ME': {
      const { name } = action;
      const chatOpen = name ? state.chatOpen : false;
      return {
        ...state,
        chatOpen,
      };
    }

    case 'SHOW_CONFIRMATION': {
      const { options } = action;
      return {
        ...state,
        confirmationModalOptions: options,
      };
    }

    case 'CLOSE_CONFIRMATION': {
      return {
        ...state,
        confirmationModalOptions: { open: false },
      };
    }

    default:
      return state;
  }
}
