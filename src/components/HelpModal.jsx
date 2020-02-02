/**
 *
 * @flow
 */

import React from 'react';
// import FaFacebook from 'react-icons/lib/fa/facebook';
// import FaTwitter from 'react-icons/lib/fa/twitter';
// import FaRedditAlien from 'react-icons/lib/fa/reddit-alien';

/* eslint-disable max-len */

import Modal from './Modal';


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


const HelpModal = () => (
  <Modal title="Welcome to PixelPlanet.fun">
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Place color pixels on a large canvas with other players online!
        Our main canvas is a huge worldmap, you can place wherever you like, but you will have to wait a specific
        Cooldown between pixels. You can check out the cooldown and requiremnts on the Canvas Selection menu (globe button on top).
        Some canvases have a different cooldown for replacing a user-set pixels than placing on a unset pixel. i.e. 4s/7s means 4s on fresh
        pixels and 7s on already set pixels.
        Higher zoomlevels take some time to update, the 3D globe gets updated at least once per day.
      Have fun!</p>
      <p>Discord: <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
      <p>Source on <a href="https://github.com/pixelplanetdev/pixelplanet" target="_blank">github</a></p>
      <p>Reddit: <a href="https://www.reddit.com/r/PixelPlanetFun/" target="_blank">r/PixelPlanetFun</a></p>
      <p>Image Converter: <a href="./convert" target="_blank">pixelplanet.fun/convert</a></p>
      <p>Image Converter for 2nd Planet: <a href="./convert2" target="_blank">pixelplanet.fun/convert2</a></p>
      <p style={titleStyle}>Map Data</p>
      <p style={textStyle}>The bare map data that we use, together with converted OpenStreetMap tiles for orientation,
        can be downloaded from mega.nz here: <a href="https://mega.nz/#!JpkBwAbJ!EnSLlZmKv3kEBE0HDhakTgAZZycD3ELjduajJxPGaXo">pixelplanetmap.zip</a> (422MB)</p>
      <p style={titleStyle}>GIMP Palette</p>
      <p style={textStyle}>The Palettes for <a href="https://www.gimp.org">GIMP</a> can be found <a href="./palette0.gpl">here</a> and <a href="./palette1.gpl">here</a>. Credit for the Palette of the second planet goes to <a href="https://twitter.com/starhousedev">starhouse</a>.</p>
      <p style={titleStyle}>Detected as Proxy?</p>
      <p style={textStyle}>If you got detected as proxy, but you are none, please send us an e-mail with <a href="https://www.whatismyip.com/">your IP</a> to pixelplanetdev@gmail.com. Do not post your IP anywhere else. We are sorry for the inconvenience.</p>
      <h3 style={titleStyle}>2D Controls</h3>
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
      <p style={textStyle}>Click or tap to place a pixel</p>
      <h3 style={titleStyle}>3D Controls</h3>
      <p style={textStyle}>Press <kbd>W</kbd>,<kbd>A</kbd>,<kbd>S</kbd>, <kbd>D</kbd> to move</p>
      <p style={textStyle}>Press <kbd>↑</kbd>,<kbd>←</kbd>,<kbd>↓</kbd>, <kbd>→</kbd> to move</p>
      <p style={textStyle}>Scroll mouse wheel to zoom</p>
      <p style={textStyle}>Left click and drag mouse to rotate</p>
      <p style={textStyle}>Middle click and drag mouse to zoom</p>
      <p style={textStyle}>Right click and drag mouse to pan</p>
      <p style={textStyle}>Left Click or tap to place a pixel</p>
      <p style={textStyle}>Right Click of double tap to remove a pixel</p>
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

export default HelpModal;
