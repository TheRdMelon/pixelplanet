/**
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


function MyModal({ close, title, children }) {
  return (
    <Modal
      isOpen
      onClose={close}
      className="Modal"
      overlayClassName="Overlay"
      contentLabel={`${title} Modal`}
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
      {children}
    </Modal>
  );
}

function mapDispatchToProps(dispatch) {
  return {
    close() {
      dispatch(hideModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(MyModal);
