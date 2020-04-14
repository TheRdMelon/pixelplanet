/**
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { selectColor } from '../actions';

import type { State } from '../reducers';


/*
 * defines the style of the palette
 * based on windowSize
 */
function getStylesByWindowSize(
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

  let width;
  let height;
  let flexDirection;
  let spanSize;
  if (windowWidth <= 300 || windowHeight <= 432) {
    // tiny compact palette
    spanSize = 24;
    height = Math.ceil(numCal / 5 * spanSize);
    width = 5 * spanSize;
    flexDirection = 'row';
  } else if (numCal > 30 || compactPalette) {
    // compact palette
    spanSize = 28;
    height = Math.ceil(numCal / 5 * spanSize);
    width = 5 * spanSize;
    flexDirection = 'row';
  } else {
    // ordinary palette (one or two colums)
    spanSize = 24;
    const paletteCols = (windowHeight < 801) ? 2 : 1;
    height = numCal * spanSize / paletteCols;
    width = spanSize * paletteCols;
    flexDirection = 'column';
  }

  return [{
    display: 'flex',
    flexWrap: 'wrap',
    textAlign: 'center',
    lineHeight: 0,
    height,
    width,
    flexDirection,
  }, {
    display: 'block',
    width: spanSize,
    height: spanSize,
    margin: 0,
    padding: 0,
    cursor: 'pointer',
  }];
}

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

function Palette({
  colors,
  selectedColor,
  paletteOpen,
  compactPalette,
  select,
  clrIgnore,
}) {
  if (!paletteOpen) {
    return null;
  }

  const [paletteStyle, spanStyle] = getStylesByWindowSize(
    useWindowSize(),
    colors,
    clrIgnore,
    compactPalette,
  );

  return (
    <div
      className="palettebox"
      id="colors"
      style={paletteStyle}
    >
      {colors.slice(2).map((color, index) => (
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
  );
}

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
