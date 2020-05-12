/*
 *
 * @flow
 */
import React from 'react';

import { colorFromText } from '../core/utils';


function ChatMessage({
  name,
  msgArray,
  country,
  insertText,
}) {
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

  let pinged = false;
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
          &nbsp;
          <span
            className="chatname"
            style={{
              color: colorFromText(name),
              cursor: 'pointer',
            }}
            role="button"
            tabIndex={-1}
            onClick={() => {
              insertText(`@${name} `);
            }}
          >
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
            if (!pinged) {
              pinged = true;
              // TODO notify of ping
              // ahmm. does that do this on every rerender? :peepowerid:
              // better put nameRegexp in the store or something
            }
            return (
              <span
                className="ping"
                style={{
                  color: colorFromText(txt.substr(1)),
                }}
              >{txt}</span>
            );
          } if (type === 'm') {
            return (
              <span
                className="mention"
                style={{
                  color: colorFromText(txt.substr(1)),
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

export default ChatMessage;
