/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaGlobe } from 'react-icons/fa';

import { showCanvasSelectionModal } from '../actions';

import type { State } from '../reducers';


const CanvasSwitchButton = ({ open }) => (
  <div
    id="canvasbutton"
    className="actionbuttons"
    onClick={open}
  >
    <FaGlobe />
  </div>
);

function mapStateToProps(state: State) {
  const { canvasId } = state.canvas;
  return { canvasId };
}

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showCanvasSelectionModal());
    },
  };
}

export default connect(null,
  mapDispatchToProps)(CanvasSwitchButton);
