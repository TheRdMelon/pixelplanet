/* @flow */

import type { Action } from '../actions/types';


export type AudioState = {
  mute: boolean,
  chatNotify: boolean,
};

const initialState: AudioState = {
  mute: false,
  chatNotify: true,
};


export default function audio(
  state: AudioState = initialState,
  action: Action,
): AudioState {
  switch (action.type) {
    case 'TOGGLE_MUTE':
      return {
        ...state,
        // TODO error prone
        mute: !state.mute,
      };

    case 'TOGGLE_CHAT_NOTIFY':
      return {
        ...state,
        chatNotify: !state.chatNotify,
      };

    default:
      return state;
  }
}
