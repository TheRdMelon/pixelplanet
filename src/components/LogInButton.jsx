/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdPerson } from 'react-icons/md';

import { showUserAreaModal } from '../actions';


const LogInButton = ({ open }) => (
  <div id="loginbutton" className="actionbuttons" onClick={open}>
    <MdPerson />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(LogInButton);
