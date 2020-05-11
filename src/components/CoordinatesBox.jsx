/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import copy from '../utils/clipboard';
import { notify } from '../actions';

import type { State } from '../reducers';


function renderCoordinates(cell): string {
  return `(${cell.join(', ')})`;
}


const CoordinatesBox = ({ view, hover, notifyCopy }) => (
  <div
    className="coorbox"
    onClick={() => { copy(window.location.hash); notifyCopy(); }}
    role="button"
    title="Copy to Clipboard"
    tabIndex="0"
  >{
    renderCoordinates(hover
    || view.map(Math.round))
  }</div>
);

function mapDispatchToProps(dispatch) {
  return {
    notifyCopy() {
      dispatch(notify('Copied!'));
    },
  };
}

function mapStateToProps(state: State) {
  const { view } = state.canvas;
  const { hover } = state.gui;
  return { view, hover };
}

export default connect(mapStateToProps, mapDispatchToProps)(CoordinatesBox);
