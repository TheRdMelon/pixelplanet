/**
 *
 * @flow
 */
import { connect } from 'react-redux';

import React, { useState } from 'react';
import Modal from 'react-modal';
import type { State } from '../reducers';

const ConfirmModal = ({ options }) => {
  const [text, setText] = useState<string>('');
  const [disabled, setDisabled] = useState<boolean>(options.text !== undefined);

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (options.text !== undefined) {
      setDisabled(e.target.value !== options.text);
    }
    setText(e.target.value);
  };

  return options.open ? (
    <>
      <Modal
        isOpen
        onRequestClose={options.cancelCB}
        className="Modal confirmation"
        overlayClassName="Overlay confirmation"
      >
        <h3>{options.header}</h3>
        <p>{options.msg}</p>
        {options.text !== undefined && (
          <>
            <p>To confirm, please type {options.text} in the box below:</p>
            <input value={text} onChange={onTextChange} placeholder="" />
          </>
        )}
        <div className="confirmation-btns">
          <button
            onClick={options.cancelCB}
            type="button"
            className="red-btn confirmation-cancel"
          >
            Cancel
          </button>
          <button
            onClick={options.confirmCB}
            type="button"
            className="red-btn confirmation-confirm"
            disabled={disabled}
          >
            Confirm
          </button>
        </div>
      </Modal>
    </>
  ) : null;
};

function mapStateToProps(state: State) {
  return {
    options: state.modal.confirmationModalOptions,
  };
}

export default connect(mapStateToProps)(ConfirmModal);
