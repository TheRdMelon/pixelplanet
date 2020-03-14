/**
 *
 * @flow
 */
import { connect } from 'react-redux';

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import type { State } from '../reducers';

const ConfirmModal = ({ options }) => {
  const [text, setText] = useState<string>('');
  const [disabled, setDisabled] = useState<boolean>(options.text !== undefined);

  useEffect(() => {
    setText('');
  }, [options.open]);

  useEffect(() => {
    setDisabled(options.text !== undefined);
  }, [options.text]);

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
            <p>
              To confirm, please type &quot;<span>{options.text}</span>&quot; in
              the box below:
            </p>
            <input
              value={text}
              onChange={onTextChange}
              placeholder="Type confirmation text here"
            />
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
