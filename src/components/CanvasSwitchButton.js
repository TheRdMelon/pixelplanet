/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaGlobe, FaGlobeAfrica } from 'react-icons/fa';

import { switchCanvas } from '../actions';

import type { State } from '../reducers';


const CanvasSwitchButton = ({ canvasId, changeCanvas }) => (
  <div id="canvasbutton" className="actionbuttons" onClick={() => changeCanvas(canvasId)}>
    {(canvasId == 0) ? <FaGlobe /> : <FaGlobeAfrica />}
  </div>
);

function mapStateToProps(state: State) {
  const { canvasId } = state.canvas;
  return { canvasId };
}

function mapDispatchToProps(dispatch) {
  return {
    changeCanvas(canvasId) {
      const newCanvasId = (canvasId == 0) ? 1 : 0;
      dispatch(switchCanvas(newCanvasId));
    },
  };
}

export default connect(mapStateToProps,
  mapDispatchToProps)(CanvasSwitchButton);
