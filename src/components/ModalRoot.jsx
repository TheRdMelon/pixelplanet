/**
 *
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import UserAreaModal from './UserAreaModal';
import RegisterModal from './RegisterModal';
import CanvasSelectModal from './CanvasSelectModal';
import ChatModal from './ChatModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import MinecraftModal from './MinecraftModal';
import FactionModal from './FactionModal';

const MODAL_COMPONENTS = {
  HELP: HelpModal,
  SETTINGS: SettingsModal,
  USERAREA: UserAreaModal,
  REGISTER: RegisterModal,
  FORGOT_PASSWORD: ForgotPasswordModal,
  CHAT: ChatModal,
  MINECRAFT: MinecraftModal,
  CANVAS_SELECTION: CanvasSelectModal,
  FACTION: FactionModal,
  /* other modals */
};

const ModalRoot = ({ modalType, modalProps }) => {
  if (!modalType) {
    return null;
  }

  const SpecificModal = MODAL_COMPONENTS[modalType];
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SpecificModal {...modalProps} />;
};

export default connect((state) => state.modal)(ModalRoot);
