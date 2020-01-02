/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaGlobe, FaGlobeAfrica } from 'react-icons/fa';

import { switchCanvas } from '../actions';

import type { State } from '../reducers';


function globe(canvasId, canvasIdent, canvasSize, view) {
  const [x, y] = view.map(Math.round);
  window.location.href = `globe/#${canvasIdent},${canvasId},${canvasSize},${x},${y}`;
}


const CanvasSwitchButton = ({ canvasId, switchCanvas }) => (
  <div id="canvasbutton" className="actionbuttons" onClick={() => switchCanvas(canvasId)}>
    {(canvasId == 0) ? <FaGlobe /> : <FaGlobeAfrica />}
  </div>
);

function mapStateToProps(state: State) {
  const { canvasId } = state.canvas;
  return { canvasId };
}

function mapDispatchToProps(dispatch) {
  return {
    switchCanvas(canvasId) {
      const newCanvasId = (canvasId == 0) ? 1 : 0;
      dispatch(switchCanvas(newCanvasId));
    },
  };
}

export default connect(mapStateToProps,
  mapDispatchToProps)(CanvasSwitchButton);
