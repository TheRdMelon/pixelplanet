/**
 *
 * @flow
 */

import React, { useRef } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { MdClose } from 'react-icons/md';

import { hideModal } from '../actions';

import type { State } from '../reducers';

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
function MyModal({
  close, title, children, modal_ref: modalRef,
}) {
  return (
    <Modal
      isOpen
      onClose={close}
      className="Modal"
      overlayClassName="Overlay"
      contentLabel={`${title} Modal`}
      onRequestClose={close}
      ref={modalRef}
    >
      <h2>{title}</h2>
      <div style={closeStyles} onClick={close}>
        <MdClose />
      </div>
      {children}
    </Modal>
  );
}

function mapStateToProps(state: State) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    close() {
      dispatch(hideModal());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(MyModal);
