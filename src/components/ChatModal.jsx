/**
 *
 * @flow
 */

import React from 'react';

import Chat from './Chat';


const ChatModal = () => (
  <div style={{
    position: 'fixed',
    top: 80,
    padding: 10,
    bottom: 10,
    left: 10,
    right: 10,
  }}
  >
    <p style={{ textAlign: 'center' }}>
      <p className="modaltext">Chat with other people here</p>
    </p>
    <div
      className="inarea"
      style={{
        position: 'absolute',
        bottom: 10,
        top: 50,
        left: 10,
        right: 10,
      }}
    >
      <Chat />
    </div>
  </div>
);

const data = {
  content: ChatModal,
  title: 'Chat',
};

export default data;
