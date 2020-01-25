/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { THREE_CANVAS_HEIGHT } from '../core/constants';
import { selectCanvas } from '../actions';


const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 2,
  padding: 0,
  overflow: 'auto',
};

const infoStyle = {
  color: '#4f545c',
  fontSize: 15,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
};

const titleStyle = {
  color: '#4f545c',
  marginLeft: 0,
  marginRight: 10,
  overflow: 'hidden',
  wordWrap: 'break-word',
  lineHeight: '24px',
  fontSize: 16,
  marginTop: 5,
  marginBottom: 0,
  fontWeight: 'bold',
};

const buttonStyle = {
  marginTop: 10,
  marginBottom: 10,
  border: '#c5c5c5',
  borderStyle: 'solid',
  cursor: 'pointer',
};

const CanvasItem = ({ canvasId, canvas, changeCanvas }) => (
  <div
    style={buttonStyle}
    onClick={() => { changeCanvas(canvasId); }}
    role="button"
    tabIndex={0}
  >
    <p style={textStyle}>
      <img
        style={{
          float: 'left', maxWidth: '20%', margin: 5, opacity: 0.5,
        }}
        alt="preview"
        src={`/preview${canvasId}.png`}
      />
      <span style={titleStyle}>{canvas.title}</span><br />
      <span style={infoStyle}>{canvas.desc}</span><br />
      Cooldown:
      <span style={infoStyle}>
        {(canvas.bcd !== canvas.pcd)
          ? <span> {canvas.bcd / 1000}s / {canvas.pcd / 1000}s</span>
          : <span> {canvas.bcd / 1000}s</span>}
      </span><br />
      Stacking till
      <span style={infoStyle}> {canvas.cds / 1000}s</span><br />
      {(canvas.req !== -1) ? <span>Requirements:<br /></span> : null}
      <span style={infoStyle}>
        {(canvas.req !== -1) ? <span>User Account </span> : null}
        {(canvas.req > 0) ? <span> and {canvas.req} Pixels set</span> : null}
      </span>
      {(canvas.req !== -1) ? <br /> : null}
      Dimensions:
      <span style={infoStyle}> {canvas.size} x {canvas.size}
        {(canvas.v)
          ? <span> x {THREE_CANVAS_HEIGHT} Voxels</span>
          : <span> Pixels</span>}
      </span>
    </p>
  </div>
);

function mapDispatchToProps(dispatch) {
  return {
    changeCanvas(canvasId) {
      dispatch(selectCanvas(canvasId));
    },
  };
}

export default connect(null, mapDispatchToProps)(CanvasItem);
