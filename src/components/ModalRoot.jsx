/**
 *
 * https://stackoverflow.com/questions/35623656/how-can-i-display-a-modal-dialog-in-redux-that-performs-asynchronous-actions/35641680#35641680
 *
 * @flow
 */

import React from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { MdClose } from 'react-icons/md';

import {
  hideModal,
} from '../actions';

import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import UserAreaModal from './UserAreaModal';
import RegisterModal from './RegisterModal';
import CanvasSelectModal from './CanvasSelectModal';
import ChatModal from './ChatModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import MinecraftModal from './MinecraftModal';


const MODAL_COMPONENTS = {
  NONE: { content: <div />, title: '' },
  HELP: HelpModal,
  SETTINGS: SettingsModal,
  USERAREA: UserAreaModal,
  REGISTER: RegisterModal,
  FORGOT_PASSWORD: ForgotPasswordModal,
  CHAT: ChatModal,
  MINECRAFT: MinecraftModal,
  CANVAS_SELECTION: CanvasSelectModal,
  /* other modals */
};

const ModalRoot = ({ modalType, modalOpen, close }) => {
  const choice = MODAL_COMPONENTS[modalType || 'NONE'];
  const { content: SpecificModal, title } = choice;
  return (
    <Modal
      isOpen={modalOpen}
      onClose={close}
      className="Modal"
      overlayClassName="Overlay"
      contentLabel={`${title} Modal`}
      closeTimeoutMS={200}
      onRequestClose={close}
    >
      <h2 style={{ paddingLeft: '5%' }}>{title}</h2>
      <div
        onClick={close}
        className="ModalClose"
        role="button"
        label="close"
        tabIndex={-1}
      ><MdClose /></div>
      <SpecificModal />
    </Modal>
  );
};

function mapStateToProps(state: State) {
  const { modalType, modalOpen } = state.modal;
  return { modalType, modalOpen };
}

function mapDispatchToProps(dispatch) {
  return {
    close() {
      dispatch(hideModal());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ModalRoot);
