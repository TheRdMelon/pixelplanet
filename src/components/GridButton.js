/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaTh } from 'react-icons/fa';

import { toggleGrid } from '../actions';


const GridButton = ({ onToggleGrid }) => (
  <div className="actionbuttons" onClick={onToggleGrid}>
    <FaTh />
  </div>
);

// TODO simplify...
function mapStateToProps(state: State) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(toggleGrid());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GridButton);
