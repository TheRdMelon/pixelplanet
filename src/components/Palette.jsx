/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { selectColor } from '../actions';

import type { State } from '../reducers';

function getHeightOfPalette(colors, clrIgnore, compactPalette) {
  const numCal = colors.length - clrIgnore;
  if (numCal > 30 || compactPalette) {
    // compact Palette
    return Math.ceil(numCal / 5 * 28);
  } if (window.innerHeight < 801) {
    // Palette one width
    return numCal * 24;
  }
  // Palette two width
  return numCal * 24 / 2;
}

function getWidthOfPalette(colors, clrIgnore, compactPalette) {
  const numCal = colors.length - clrIgnore;
  if (numCal > 30 || compactPalette) {
    // compact Palette
    return 140;
  } if (window.innerHeight < 801) {
    // Palette one width
    return 24;
  }
  // Palette two width
  return 48;
}

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
      height: getHeightOfPalette(colors, clrIgnore, compactPalette),
      width: getWidthOfPalette(colors, clrIgnore, compactPalette),
    }}
  >
    {colors.slice(2).map((color, index) => (
      <span
        style={{
          backgroundColor: color,
        }}
        role="button"
        tabIndex={0}
        aria-label={`color ${index + 2}`}
        key={color}
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
