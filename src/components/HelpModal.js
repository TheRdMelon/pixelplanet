/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
// import FaFacebook from 'react-icons/lib/fa/facebook';
// import FaTwitter from 'react-icons/lib/fa/twitter';
// import FaRedditAlien from 'react-icons/lib/fa/reddit-alien';

import Modal from './Modal';
import { social, MIN_COOLDOWN, BLANK_COOLDOWN } from '../core/constants';

import type { State } from '../reducers';


const linkStyle = {
  textDecoration: 'none',
  color: '#428bca',
};

const titleStyle = {
  color: '#4f545c',
  marginLeft: 0,
  marginRight: 10,
  overflow: 'hidden',
  wordWrap: 'break-word',
  lineHeight: '24px',
  fontSize: 16,
  fontWeight: 500,
  // marginTop: 0,
  marginBottom: 0,
};

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
  lineHeight: 'normal',
};


const HelpModal = ({ center }) => (
  <Modal title="Welcome to PixelPlanet.fun">
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Place color pixels on a large canvas with other players online!
        Cooldown is {(BLANK_COOLDOWN / 1000) | 0} seconds for fresh pixels and {(MIN_COOLDOWN / 1000) | 0}s for overwriting existing pixels!
        The current canvas size is from -32768 to +32768 in x and y.
        Higher zoomlevels take some time to update, the 3D globe gets updated at least once per day.
		Have fun!</p>
      <p>New Discord: <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
      <p>Reddit: <a href="https://www.reddit.com/r/PixelPlanetFun/" target="_blank">r/PixelPlanetFun</a></p>
      <p>Image Converter: <a href="./convert" target="_blank">pixelplanet.fun/convert</a></p>
      <p>Image Converter for 2nd Planet: <a href="./convert2" target="_blank">pixelplanet.fun/convert2</a></p>
      <p style={titleStyle}>Map Data</p>
      <p style={textStyle}>The bare map data that we use, together with converted OpenStreetMap tiles for orientation,
        can be downloaded from mega.nz here: <a href="https://mega.nz/#!JpkBwAbJ!EnSLlZmKv3kEBE0HDhakTgAZZycD3ELjduajJxPGaXo">pixelplanetmap.zip</a> (422MB)</p>
      <p style={titleStyle}>GIMP Palette</p>
      <p style={textStyle}>The Palettes for <a href="https://www.gimp.org">GIMP</a> can be found <a href="./palette0.gpl">here</a> and <a href="./palette1.gpl">here</a>. Credit for the Palette of the second planet goes to <a href="https://twitter.com/starhousedev">starhouse</a>.</p>
      <p style={titleStyle}>Detected as Proxy?</p>
      <p style={textStyle}>If you got detected as proxy, but you are none, please send us an e-mail with <a href="https://www.whatismyip.com/">your IP</a> to pixelplanetdev@gmail.com. Don't post your IP anywhere else. We are sorry for the inconvenience.</p>
      <h3 style={titleStyle}>Controls</h3>
      <p style={textStyle}>Click a color in palette to select</p>
      <p style={textStyle}>Press <kbd>G</kbd> to toggle grid</p>
      <p style={textStyle}>Press <kbd>C</kbd> to toggle showing of pixel activity</p>
      <p style={textStyle}>Press <kbd>q</kbd> or <kbd>e</kbd> to zoom</p>
      <p style={textStyle}>Press <kbd>W</kbd>,<kbd>A</kbd>,<kbd>S</kbd>, <kbd>D</kbd> to move</p>
      <p style={textStyle}>Press <kbd>↑</kbd>,<kbd>←</kbd>,<kbd>↓</kbd>, <kbd>→</kbd> to move</p>
      <p style={textStyle}>Drag mouse to move</p>
      <p style={textStyle}>Scroll mouse wheel to zoom</p>
      <p style={textStyle}>Click middle mouse button to current hovering color</p>
      <p style={textStyle}>Pinch to zoom (on touch devices)</p>
      <p style={textStyle}>Pan to move (on touch devices)</p>
      <p style={textStyle}>Click or tab to place a pixel</p>
      <p>Partners: <a href="https://www.crazygames.com/c/io" target="_blank">crazygames.com</a></p>
      <p style={textStyle}>
        <small>This site is protected by reCAPTCHA and the Google
          <a href="https://policies.google.com/privacy">Privacy Policy</a> and
          <a href="https://policies.google.com/terms">Terms of Service</a> apply.
        </small>
      </p>
    </p>
  </Modal>
);

function mapStateToProps(state: State) {
  const { center } = state.user;
  return { center };
}

export default connect(mapStateToProps)(HelpModal);
