/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { selectColor } from '../actions';

import type { State } from '../reducers';


const Palette = ({
  colors, selectedColor, paletteOpen, compactPalette, select, clrIgnore,
}) => (
  <div
    className={`palettebox ${
      ((colors.length - clrIgnore) > 30 || compactPalette)
        ? 'compalette'
        : 'widpalette'
    }`}
    id="colors"
    style={{
      display: (paletteOpen) ? 'flex' : 'none',
      height: ((colors.length - clrIgnore) > 30 || compactPalette)
        ? Math.ceil((colors.length - clrIgnore) / 5 * 28)
        : undefined,
    }}
  >
    {colors.slice(2).map((color, index) => (
      <span
        style={{
          backgroundColor: color,
        }}
        key={index + 2}
        className={selectedColor === (index + clrIgnore)
          ? 'selected'
          : 'unselected'}
        color={color}
        onClick={() => select(index + clrIgnore)}
      />
    ))}
  </div>
);

function mapStateToProps(state: State) {
  const { selectedColor, paletteOpen, compactPalette } = state.gui;
  const { palette, clrIgnore } = state.canvas;
  return {
    colors: palette.colors,
    selectedColor,
    paletteOpen,
    compactPalette,
    clrIgnore,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select(color) {
      dispatch(selectColor(color));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Palette);
