/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

function renderCoordinates(cell): string {
  return `(${cell.join(', ')})`;
}

const CoordinatesBox = ({ view, hover }) => (
  <div className="coorbox">
    {renderCoordinates(hover || view.map(Math.round))}
  </div>
);

function mapStateToProps(state: State) {
  const { view } = state.canvas;
  const { hover } = state.gui;
  return { view, hover };
}

export default connect(mapStateToProps)(CoordinatesBox);
