/*
 * Chat input field
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import ProtocolClient from '../socket/ProtocolClient';

import { showUserAreaModal } from '../actions';

class ChatInput extends React.Component<{}, { message: string }> {
  constructor() {
    super();
    this.state = {
      message: '',
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const { message } = this.state;
    if (!message) return;
    // send message via websocket
    ProtocolClient.sendMessage(message);
    this.setState({
      message: '',
    });
  }

  render() {
    if (this.props.name) {
      return (
        <div className="chatinput">
          <form onSubmit={this.handleSubmit}>
            <input
              style={{ maxWidth: '80%', width: '240px' }}
              value={this.state.message}
              onChange={(evt) => this.setState({ message: evt.target.value })}
              type="text"
              placeholder="Chat here"
            />
            <button id="chatmsginput" type="submit">
              Send
            </button>
          </form>
        </div>
      );
    }
    return (
      <div
        className="modallink"
        onClick={this.props.open}
        style={{ textAlign: 'center', fontSize: 13 }}
      >
        You must be logged in to chat
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { name } = state.user;
  return { name };
}

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChatInput);
