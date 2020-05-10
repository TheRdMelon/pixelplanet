/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import Creeper from './Creeper.svg';

import { showMinecraftModal } from '../actions';

const MinecraftButton = ({ open }) => (
  <div
    id="minecraftbutton"
    className="actionbuttons"
    onClick={open}
    role="button"
    tabIndex={-1}
  >
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
