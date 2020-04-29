/*
 * Chat input field
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import ProtocolClient from '../socket/ProtocolClient';

import { showUserAreaModal, setChatChannel } from '../actions';
import { CHAT_CHANNELS } from '../core/constants';

class ChatInput extends React.Component {
  constructor() {
    super();
    this.state = {
      message: '',
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e, channelId) {
    e.preventDefault();

    const { message } = this.state;
    if (!message) return;
    // send message via websocket
    ProtocolClient.sendChatMessage(message, channelId);
    this.setState({
      message: '',
    });
  }

  render() {
    const {
      name, chatChannel, open, setChannel,
    } = this.props;
    const {
      message,
    } = this.state;
    const selectedChannel = CHAT_CHANNELS[chatChannel];

    if (name) {
      return (
        <div className="chatinput">
          <form onSubmit={(e) => { this.handleSubmit(e, chatChannel); }}>
            <input
              style={{ maxWidth: '80%', width: '240px' }}
              value={message}
              onChange={(evt) => this.setState({ message: evt.target.value })}
              type="text"
              placeholder="Chat here"
            />
            <button id="chatmsginput" type="submit">Send</button>
          </form>
          <select
            onChange={(evt) => setChannel(evt.target.selectedIndex)}
          >
            {
              CHAT_CHANNELS.map((ch) => (
                <option selected={ch === selectedChannel}>ch</option>
              ))
            }
          </select>
        </div>
      );
    }
    return (
      <div
        className="modallink"
        onClick={open}
        style={{ textAlign: 'center', fontSize: 13 }}
        role="button"
        tabIndex={0}
      >
        You must be logged in to chat
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { name } = state.user;
  const { chatChannel } = state.gui;
  return { name, chatChannel };
}

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showUserAreaModal());
    },
    setChannel(channelId) {
      dispatch(setChatChannel(channelId));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatInput);
