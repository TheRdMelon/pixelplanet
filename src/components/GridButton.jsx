/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaTh } from 'react-icons/fa';

import { toggleGrid } from '../actions';


const GridButton = ({ onToggleGrid }) => (
  <div
    role="button"
    tabIndex={-1}
    className="actionbuttons"
    onClick={onToggleGrid}
  >
    <FaTh />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(toggleGrid());
    },
  };
}

export default connect(null, mapDispatchToProps)(GridButton);
