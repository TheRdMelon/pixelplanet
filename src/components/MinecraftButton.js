/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import Creeper from './Creeper.svg';

import { showMinecraftModal } from '../actions';

import type { State } from '../reducers';


const MinecraftButton = ({ open }) => (
  <div id="minecraftbutton" className="actionbuttons" onClick={open}>
    <Creeper />
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    open() {
      dispatch(showMinecraftModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(MinecraftButton);
