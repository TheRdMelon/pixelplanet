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
  <div id="palselbutton" className={`actionbuttons ${(paletteOpen) ? '' : 'pressed'}`} style={{ color: palette.isDark(selectedColor) ? 'white' : 'black', backgroundColor: palette.colors[selectedColor] }} onClick={onToggle}>
    <MdPalette />
  </div>
);

// TODO simplify...
function mapStateToProps(state: State) {
  const { selectedColor, paletteOpen } = state.gui;
  const { palette } = state.canvas;
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
