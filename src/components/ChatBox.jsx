/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

import Chat from './Chat';


const ChatBox = ({ chatOpen }) => (
  <div>
    {(chatOpen)
      ? (
        <div className="chatbox">
          <Chat />
        </div>
      ) : null}
  </div>
);

// TODO optimize
function mapStateToProps(state: State) {
  const { chatOpen } = state.modal;
  return { chatOpen };
}

export default connect(mapStateToProps)(ChatBox);
