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


const CanvasSelectModal = ({ canvases }) => (
  <Modal title="Canvas Selection">
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
  </Modal>
);

function mapStateToProps(state: State) {
  const { canvases } = state.canvas;
  return { canvases };
}

export default connect(mapStateToProps)(CanvasSelectModal);
