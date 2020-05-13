/**
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect,
} from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import ChatMessage from './ChatMessage';

import { showUserAreaModal, setChatChannel } from '../actions';
import { MAX_CHAT_MESSAGES, CHAT_CHANNELS } from '../core/constants';
import ProtocolClient from '../socket/ProtocolClient';
import { saveSelection, restoreSelection } from '../utils/storeSelection';
import splitChatMessage from '../core/chatMessageFilter';


const Chat = ({
  chatMessages,
  chatChannel,
  ownName,
  open,
  setChannel,
}) => {
  const listRef = useRef();
  const inputRef = useRef();
  const [inputMessage, setInputMessage] = useState('');
  const [selection, setSelection] = useState(null);
  const [nameRegExp, setNameRegExp] = useState(null);
  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
    inaccuracy: 10,
  });

  const channelMessages = chatMessages[chatChannel];

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.length]);

  useEffect(() => {
    if (channelMessages.length === MAX_CHAT_MESSAGES) {
      restoreSelection(selection);
    }
  }, [channelMessages]);

  useEffect(() => {
    const regExp = (ownName)
      ? new RegExp(`(^|\\s+)(@${ownName})(\\s+|$)`, 'g')
      : null;
    setNameRegExp(regExp);
  }, [ownName]);

  function padToInputMessage(txt) {
    const lastChar = inputMessage.substr(-1);
    const pad = (lastChar && lastChar !== ' ');
    let newMsg = inputMessage;
    if (pad) newMsg += ' ';
    newMsg += txt;
    setInputMessage(newMsg);
    inputRef.current.focus();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const msg = inputMessage.trim();
    if (!msg) return;
    // send message via websocket
    ProtocolClient.sendChatMessage(msg, chatChannel);
    setInputMessage('');
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ul
        className="chatarea"
        ref={listRef}
        style={{ flexGrow: 1 }}
        onMouseUp={() => { setSelection(saveSelection); }}
        role="presentation"
      >
        {
          channelMessages.map((message) => (
            <ChatMessage
              name={message[0]}
              msgArray={splitChatMessage(message[1], nameRegExp)}
              country={message[2]}
              insertText={(txt) => padToInputMessage(txt)}
            />
          ))
        }
      </ul>
      {(ownName) ? (
        <div classNam="chatinput">
          <form
            onSubmit={(e) => handleSubmit(e)}
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            <input
              style={{ flexGrow: 1, minWidth: 40 }}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              ref={inputRef}
              type="text"
              placeholder="Chat here"
            />
            <button
              style={{ flexGrow: 0 }}
              type="submit"
            >
              ‣
            </button>
            <select
              style={{ flexGrow: 0 }}
              onChange={(evt) => setChannel(evt.target.selectedIndex)}
            >
              {
                CHAT_CHANNELS.map((ch) => (
                  <option selected={ch === chatChannel}>{ch}</option>
                ))
              }
            </select>
          </form>
        </div>
      ) : (
        <div
          className="modallink"
          onClick={open}
          style={{ textAlign: 'center', fontSize: 13 }}
          role="button"
          tabIndex={0}
        >
          You must be logged in to chat
        </div>
      )}
    </div>
  );
};

function mapStateToProps(state: State) {
  const { chatMessages, name } = state.user;
  const { chatChannel } = state.gui;
  return { chatMessages, chatChannel, ownName: name };
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

export default connect(mapStateToProps, mapDispatchToProps)(Chat);
