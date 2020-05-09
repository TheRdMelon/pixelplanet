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


const closeStyles = {
  position: 'fixed',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: '0 0 36px',
  borderWidth: 2,
  borderStyle: 'solid',
  borderRadius: '50%',
  width: 36,
  height: 36,
  cursor: 'pointer',
  backgroundColor: '#f6f6f7',
  borderColor: '#dcddde',
  top: 30,
  right: 40,
};


// TODO appear with animation
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
        style={closeStyles}
        onClick={close}
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
