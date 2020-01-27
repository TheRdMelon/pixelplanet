/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
// import FaFacebook from 'react-icons/lib/fa/facebook';
// import FaTwitter from 'react-icons/lib/fa/twitter';
// import FaRedditAlien from 'react-icons/lib/fa/reddit-alien';

import Modal from './Modal';
import CanvasItem from './CanvasItem';

import type { State } from '../reducers';

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
  lineHeight: 'normal',
};

const CanvasSelectModal = ({ canvases }) => (
  <Modal title="Canvas Selection">
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>
        Select the canvas you want to use. Every canvas is unique and has
        different palettes, cooldown and requirements.
      </p>
      {Object.keys(canvases).map((canvasId) => (
        <CanvasItem canvasId={canvasId} canvas={canvases[canvasId]} />
      ))}
    </p>
  </Modal>
);

function mapStateToProps(state: State) {
  const { canvases } = state.canvas;
  return { canvases };
}

export default connect(mapStateToProps)(CanvasSelectModal);
