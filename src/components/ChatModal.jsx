/**
 *
 * @flow
 */

import React from 'react';

import Modal from './Modal';
import Chat from './Chat';


const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
  lineHeight: 'normal',
};


const ChatModal = () => (
  <Modal title="Chat">
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Chat with other people here</p>
    </p>
    <div className="inarea" style={{ height: '65%' }}>
      <Chat />
    </div>
  </Modal>
);

export default ChatModal;
