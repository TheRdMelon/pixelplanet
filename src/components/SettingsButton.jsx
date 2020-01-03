/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaCog } from 'react-icons/fa';

import { showSettingsModal } from '../actions';

import type { State } from '../reducers';


const SettingsButton = ({ open }) => (
  <div id="settingsbutton" className="actionbuttons" onClick={open}>
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
