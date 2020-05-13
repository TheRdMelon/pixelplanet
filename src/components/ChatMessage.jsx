/*
 *
 * @flow
 */
import React from 'react';
import { connect } from 'react-redux';

import { colorFromText, setBrightness } from '../core/utils';


function ChatMessage({
  name,
  msgArray,
  country,
  insertText,
  darkMode,
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
              color: setBrightness(colorFromText(name), darkMode),
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
            return (
              <span
                className="ping"
                style={{
                  color: setBrightness(colorFromText(txt.substr(1)), darkMode),
                }}
              >{txt}</span>
            );
          } if (type === 'm') {
            return (
              <span
                className="mention"
                style={{
                  color: setBrightness(colorFromText(txt.substr(1)), darkMode),
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

function mapStateToProps(state: State) {
  const { style } = state.gui;
  const darkMode = style.indexOf('dark') !== -1;
  return { darkMode };
}

export default connect(mapStateToProps)(ChatMessage);
