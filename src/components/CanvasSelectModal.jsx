/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import CanvasItem from './CanvasItem';

import type { State } from '../reducers';


const CanvasSelectModal = ({ canvases }) => (
  <p style={{
    textAlign: 'center',
    paddingLeft: '5%',
    paddingRight: '5%',
    paddingTop: 20,
  }}
  >
    <p className="modaltext">
      Select the canvas you want to use.
      Every canvas is unique and has different palettes,
      cooldown and requirements.
    </p>
    {
      Object.keys(canvases).map((canvasId) => (
        <CanvasItem canvasId={canvasId} canvas={canvases[canvasId]} />
      ))
    }
  </p>
);

function mapStateToProps(state: State) {
  const { canvases } = state.canvas;
  return { canvases };
}

const data = {
  content: connect(mapStateToProps)(CanvasSelectModal),
  title: 'Canvas Selection',
};

export default data;
