/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { selectColor } from '../actions';

import type { State } from '../reducers';


const Palette = ({ colors, selectedColor, paletteOpen, compactPalette, select }) => (
  <div className={`palettebox ${(compactPalette) ? 'compalette' : 'widpalette'}`} id="colors" style={{ display: (paletteOpen) ? 'flex' : 'none' }}>
    {colors.slice(2).map((color, index) => (<span
      style={{ backgroundColor: color }}
      key={index + 2}
      className={selectedColor === (index + 2) ? 'selected' : 'unselected'}
      color={color}
      onClick={() => select(index + 2)}
    />),
    )}
  </div>
);

function mapStateToProps(state: State) {
  const { selectedColor, paletteOpen, compactPalette } = state.gui;
  const { palette } = state.canvas;
  return { colors: palette.colors, selectedColor, paletteOpen, compactPalette };
}

function mapDispatchToProps(dispatch) {
  return {
    select(color) {
      dispatch(selectColor(color));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Palette);
