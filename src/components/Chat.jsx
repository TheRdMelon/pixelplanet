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
import { colorFromText, splitChatMessage } from '../core/utils';


function ChatMessage({ name, msgArray, country }) {
  if (!name || !msgArray) {
    return null;
  }

  const isInfo = (name === 'info');
  let className = 'msg';
  if (isInfo) {
    className += ' info';
  } else if (msgArray[0][1].charAt(0) === '>') {
    className += ' greentext';
  }

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
        msgArray.map((msgPart) => {
          const [type, txt] = msgPart;
          if (type === 't') {
            return (<span className={className}>{txt}</span>);
          } if (type === 'c') {
            return (<a href={`./${txt}`}>{txt}</a>);
          } if (type === 'p') {
            return (<span className="ping">{txt}</span>);
          } if (type === 'm') {
            return (
              <span
                className="mention"
                style={{
                  color: colorFromText(txt),
                }}
              >{txt}</span>
            );
          }
          return null;
        })
      }
    </p>
  );
}

const Chat = ({ chatMessages, chatChannel, ownName }) => {
  const listRef = useRef();
  const [selection, setSelection] = useState(null);
  const [nameRegExp, setNameRegExp] = useState(null);
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
  }, [channelMessages]);

  useEffect(() => {
    const regExp = (ownName)
      ? new RegExp(`(^|\\s+)(@${ownName})(\\s+|$)`, 'g')
      : null;
    setNameRegExp(regExp);
  }, [ownName]);

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
            />
          ))
        }
      </ul>
      <ChatInput />
    </div>
  );
};

function mapStateToProps(state: State) {
  const { chatMessages, name } = state.user;
  const { chatChannel } = state.gui;
  return { chatMessages, chatChannel, ownName: name };
}

export default connect(mapStateToProps)(Chat);
