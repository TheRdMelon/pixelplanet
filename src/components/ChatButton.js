/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdForum } from 'react-icons/md';

import { showChatModal } from '../actions';


const ChatButton = ({ open }) => (
  <div id="chatbutton" className="actionbuttons" onClick={open}>
    <MdForum />
  </div>: null
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showChatModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(ChatButton);
