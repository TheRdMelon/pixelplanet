/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaCog } from 'react-icons/fa';

import { showSettingsModal } from '../actions';


const SettingsButton = ({ open }) => (
  <div
    id="settingsbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    tabIndex={-1}
  >
    <FaCog />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showSettingsModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(SettingsButton);
