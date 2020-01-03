/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaQuestion } from 'react-icons/fa';

import { showHelpModal } from '../actions';


const HelpButton = ({ open }) => (
  <div id="helpbutton" className="actionbuttons" onClick={open}>
    <FaQuestion />
  </div>
);


function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showHelpModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(HelpButton);
