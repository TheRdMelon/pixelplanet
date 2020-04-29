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


const Chat = ({ chatMessages, chatChannel }) => {
  const listRef = useRef();
  const { stayScrolled } = useStayScrolled(listRef, {
    initialScroll: Infinity,
  });

  useLayoutEffect(() => {
    stayScrolled();
  }, [chatMessages.length]);

  return (
    <div style={{ height: '100%' }}>
      <ul className="chatarea" ref={listRef}>
        {
          chatMessages[chatChannel].map((message) => (
            <p className="chatmsg">
              {(message[0] === 'info')
                ? <span style={{ color: '#cc0000' }}>{message[1]}</span>
                : (
                  <div>
                    <img
                      alt=""
                      title={`${message[2]}`}
                      src={`${window.assetserver}/cf/${message[2]}.gif`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = './cf/xx.gif';
                      }}
                    />
                    &nbsp;
                    <span
                      className="chatname"
                      style={{
                        color: colorFromText(message[0]),
                      }}
                    >
                      {`${message[0]}`}
                    </span>
                    : &nbsp;
                    {
                    splitCoordsInString(message[1]).map((text, i) => {
                      if (i % 2 === 0) {
                        return (<span className="msg">{text}</span>);
                      }
                      return (<a href={`./${text}`}>{text}</a>);
                    })
                    }
                  </div>
                )}
            </p>
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
