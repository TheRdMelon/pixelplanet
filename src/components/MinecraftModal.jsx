/*
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';


const MinecraftModal = () => (
  <p style={{ textAlign: 'center' }}>
    <p>You can also place pixels from our Minecraft Server at</p>
    <p><input type="text" value="mc.pixelplanet.fun" readOnly /></p>
    <p>Please Note that the Minecraft Server is down from time to time</p>
  </p>
);

function mapStateToProps(state: State) {
  const { center } = state.user;
  return { center };
}

const data = {
  content: connect(mapStateToProps)(MinecraftModal),
  title: 'PixelPlanet Minecraft Server',
};

export default data;
