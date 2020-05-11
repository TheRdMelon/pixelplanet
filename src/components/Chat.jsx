/**
 *
 * @flow
 */

import React, { useRef, useLayoutEffect } from 'react';
import useStayScrolled from 'react-stay-scrolled';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import ChatInput from './ChatInput';
import { colorFromText, splitCoordsInString } from '../core/utils';

function ChatMessage({ name, text, country }) {
  const msgText = text.trim();
  let className = 'msg';
  const isInfo = (name === 'info');
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
        <img
          alt=""
          title={country}
          src={`${window.assetserver}/cf/${country}.gif`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = './cf/xx.gif';
          }}
        />
        )
      }
      {
        (!isInfo)
        && (
        <span
          className="chatname"
          style={{
            color: colorFromText(name),
          }}
        >
              &nbsp;
          {name}
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
  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
  });

  const channelMessages = chatMessages[chatChannel];

  useLayoutEffect(() => {
    stayScrolled();
  }, [channelMessages.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ul className="chatarea" ref={listRef} style={{ flexGrow: 1 }}>
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
