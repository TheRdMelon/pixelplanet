/**
 *
 * @flow
 */

import React from 'react';

import Modal from './Modal';
import Chat from './Chat';


const ChatModal = () => (
  <Modal title="Chat">
    <p style={{ textAlign: 'center' }}>
      <p className="modaltext">Chat with other people here</p>
    </p>
    <div className="inarea" style={{ height: '65%' }}>
      <Chat />
    </div>
  </Modal>
);

export default ChatModal;
