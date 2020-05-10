/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { Md3DRotation } from 'react-icons/md';

import type { State } from '../reducers';


/**
 * https://jsfiddle.net/AbdiasSoftware/7PRNN/
 */
function globe(canvasId, canvasIdent, canvasSize, view) {
  const [x, y] = view.map(Math.round);
  // eslint-disable-next-line max-len
  window.location.href = `globe#${canvasIdent},${canvasId},${canvasSize},${x},${y}`;
}


const GlobeButton = ({
  canvasId, canvasIdent, canvasSize, view,
}) => (
  <div
    role="button"
    tabIndex={-1}
    id="globebutton"
    className="actionbuttons"
    onClick={() => globe(canvasId, canvasIdent, canvasSize, view)}
  >
    <Md3DRotation />
  </div>
);

function mapStateToProps(state: State) {
  const {
    canvasId, canvasIdent, canvasSize, view,
  } = state.canvas;
  return {
    canvasId, canvasIdent, canvasSize, view,
  };
}

export default connect(mapStateToProps)(GlobeButton);
