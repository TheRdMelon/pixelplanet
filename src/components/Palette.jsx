/**
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { selectColor } from '../actions';
import type { State } from '../reducers';
import useWindowSize from '../utils/reactHookResize';


/*
 * defines the style of the palette
 * based on windowSize
 */
function getStylesByWindowSize(
  paletteOpen,
  windowSize,
  colors,
  clrIgnore,
  compactPalette,
) {
  const {
    width: windowWidth,
    height: windowHeight,
  } = windowSize;
  const numCal = colors.length - clrIgnore;

  let flexDirection;
  let spanSize;
  let paletteCols;
  if (windowWidth <= 300 || windowHeight <= 432) {
    // tiny compact palette
    spanSize = 24;
    paletteCols = 5;
    flexDirection = 'row';
  } else if (numCal > 30 || compactPalette) {
    // compact palette
    spanSize = 28;
    paletteCols = 5;
    flexDirection = 'row';
  } else {
    // ordinary palette (one or two colums)
    spanSize = 24;
    paletteCols = (windowHeight < 801) ? 2 : 1;
    flexDirection = 'column';
  }
  const height = Math.ceil(numCal / paletteCols) * spanSize;
  const width = spanSize * paletteCols;

  if (!paletteOpen) {
    return [{
      display: 'flex',
      flexWrap: 'wrap',
      textAlign: 'center',
      lineHeight: 0,
      height: 0,
      width,
      flexDirection,
      visibility: 'hidden',
    }, {
      display: 'block',
      height: 0,
      width: spanSize,
      margin: 0,
      padding: 0,
      visibility: 'hidden',
    }];
  }

  return [{
    display: 'flex',
    flexWrap: 'wrap',
    textAlign: 'center',
    lineHeight: 0,
    height,
    width,
    flexDirection,
    visibility: 'visible',
  }, {
    display: 'block',
    width: spanSize,
    height: spanSize,
    margin: 0,
    padding: 0,
    cursor: 'pointer',
    visibility: 'visible',
  }];
}

function Palette({
  colors,
  selectedColor,
  paletteOpen,
  compactPalette,
  select,
  clrIgnore,
}) {
  const [render, setRender] = useState(false);

  useEffect(() => {
    window.setTimeout(() => {
      if (paletteOpen) setRender(true);
    }, 10);
  }, [paletteOpen]);

  const onTransitionEnd = () => {
    if (!paletteOpen) setRender(false);
  };

  const [paletteStyle, spanStyle] = getStylesByWindowSize(
    (render && paletteOpen),
    useWindowSize(),
    colors,
    clrIgnore,
    compactPalette,
  );

  return (
    (render || paletteOpen) && (
      <div
        id="palettebox"
        style={paletteStyle}
        onTransitionEnd={onTransitionEnd}
      >
        {colors.slice(clrIgnore).map((color, index) => (
          <span
            style={{
              backgroundColor: color,
              ...spanStyle,
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
    )
  );
}

function mapStateToProps(state: State) {
  const { paletteOpen, compactPalette } = state.gui;
  const { palette, clrIgnore, selectedColor } = state.canvas;
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
