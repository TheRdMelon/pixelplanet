/**
 *
 * @flow
 */

import React, {
  useRef, useLayoutEffect, useState, useEffect,
} from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { connect } from 'react-redux';

import { MAX_CHAT_MESSAGES } from '../core/constants';
import type { State } from '../reducers';
import ChatInput from './ChatInput';
import { saveSelection, restoreSelection } from '../utils/storeSelection';
import { colorFromText, splitCoordsInString } from '../core/utils';


function ChatMessage({ name, text, country }) {
  if (!name || !text) {
    return null;
  }

  const msgText = text.trim();
  const isInfo = (name === 'info');
  let className = 'msg';
  if (isInfo) {
    className += ' info';
  } else if (text.charAt(0) === '>') {
    className += ' greentext';
  }
  const splitMsg = splitCoordsInString(msgText);

  return (
    <p className="chatmsg">
      {
        (!isInfo)
        && (
        <span>
          <img
            alt=""
            title={country}
            src={`${window.assetserver}/cf/${country}.gif`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = './cf/xx.gif';
            }}
          />
          <span
            className="chatname"
            style={{
              color: colorFromText(name),
            }}
          >
                &nbsp;
            {name}
          </span>
          :&nbsp;
        </span>
        )
      }
      {
        splitMsg.map((txt, i) => {
          if (i % 2 === 0) {
            return (
              <span
                className={className}
              >
                {txt}
              </span>
            );
          }
          return (<a href={`./${txt}`}>{txt}</a>);
        })
      }
    </p>
  );
}

const Chat = ({ chatMessages, chatChannel }) => {
  const listRef = useRef();
  const [selection, setSelection] = useState(null);
  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
  });

  const channelMessages = chatMessages[chatChannel];

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.slice(-1)]);

  useEffect(() => {
    if (channelMessages.length === MAX_CHAT_MESSAGES) {
      restoreSelection(selection);
    }
  });

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
              text={message[1]}
              country={message[2]}
            />
          ))
        }
      </ul>
      <ChatInput />
    </div>
  );
};

function mapStateToProps(state: State) {
  const { chatMessages } = state.user;
  const { chatChannel } = state.gui;
  return { chatMessages, chatChannel };
}

export default connect(mapStateToProps)(Chat);
