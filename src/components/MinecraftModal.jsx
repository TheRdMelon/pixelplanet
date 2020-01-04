/*
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';


const MinecraftModal = () => (
  <Modal title="PixelPlanet Minecraft Server">
    <p style={{ textAlign: 'center' }}>
      <p>You can also place pixels from our Minecraft Server at</p>
      <p><input type="text" value="mc.pixelplanet.fun" readOnly /></p>
      <p>Please Note that the Minecraft Server is down from time to time</p>
    </p>
  </Modal>
);

function mapStateToProps(state: State) {
  const { center } = state.user;
  return { center };
}

export default connect(mapStateToProps)(MinecraftModal);
