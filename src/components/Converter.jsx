/**
 *
 * @flow
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';
import fileDownload from 'js-file-download';

import type { State } from '../reducers';

const titleStyle = {
  color: '#4f545c',
  marginLeft: 0,
  marginRight: 10,
  overflow: 'hidden',
  wordWrap: 'break-word',
  lineHeight: '24px',
  fontSize: 16,
  fontWeight: 500,
  // marginTop: 0,
  marginBottom: 0,
};

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  lineHeight: 'normal',
};

function appendNumberText(number) {
  let appendStr = `${number} `;
  if (number < 10) appendStr += '  ';
  else if (number < 100) appendStr += ' ';
  return appendStr;
}
function appendHexColorText(clr) {
  let appendStr = ' #';
  clr.forEach((z) => {
    if (z < 16) appendStr += '0';
    appendStr += z.toString(16);
  });
  return appendStr;
}


function printGIMPPalette(title, description, colors) {
  let text = `GIMP Palette
#Palette Name: Pixelplanet${title}
#Description: ${description}
#Colors: ${colors.length}`;
  colors.forEach((clr) => {
    text += '\n';
    clr.forEach((z) => {
      text += appendNumberText(z);
    });
    text += appendHexColorText(clr);
  });
  fileDownload(text, `Pixelplanet${title}.gpl`);
}


function Converter({
  canvasId,
  canvases,
}) {
  const [selectedCanvas, selectCanvas] = useState(canvasId);

  return (
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Choose Canvas:&nbsp;
        <select
          onChange={(e) => {
            const sel = e.target;
            selectCanvas(sel.options[sel.selectedIndex].value);
          }}
        >
          {
          Object.keys(canvases).map((canvas) => ((canvases[canvas].v)
            ? null
            : (
              <option
                selected={canvas === selectedCanvas}
                value={canvas}
              >
                {
              canvases[canvas].title
            }
              </option>
            )))
        }
        </select>
      </p>
      <p style={textStyle}>
        Palette for <a href="https://www.gimp.org">GIMP</a>:&nbsp;
        <button
          style={{ display: 'inline' }}
          onClick={() => {
            const canvas = canvases[selectedCanvas];
            const {
              title, desc, colors, cli,
            } = canvas;
            printGIMPPalette(title, desc, colors.slice(cli));
          }}
        >
          Download Palette
        </button>
        <p>Credit for the Palette of the Moon goes to <a href="https://twitter.com/starhousedev">starhouse</a>.</p>
      </p>
    </p>
  );
}

function mapStateToProps(state: State) {
  const { canvasId, canvases } = state.canvas;
  return { canvasId, canvases };
}

export default connect(mapStateToProps)(Converter);
