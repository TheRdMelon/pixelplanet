/**
 *
 * Button to open/close palette
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdPalette } from 'react-icons/md';

import { toggleOpenPalette } from '../actions';

const PalselButton = ({
  palette, onToggle, selectedColor, paletteOpen,
}) => (
  <div
    id="palselbutton"
    className={`actionbuttons ${(paletteOpen) ? '' : 'pressed'}`}
    style={{
      color: palette.isDark(selectedColor) ? 'white' : 'black',
      backgroundColor: palette.colors[selectedColor],
    }}
    role="button"
    tabIndex={0}
    onClick={onToggle}
  >
    <MdPalette />
  </div>
);

// TODO simplify...
function mapStateToProps(state: State) {
  const { paletteOpen } = state.gui;
  const { palette, selectedColor } = state.canvas;
  return { palette, selectedColor, paletteOpen };
}

function mapDispatchToProps(dispatch) {
  return {
    onToggle() {
      dispatch(toggleOpenPalette());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PalselButton);
