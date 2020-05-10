/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { THREE_CANVAS_HEIGHT } from '../core/constants';
import { selectCanvas } from '../actions';


const buttonStyle = {
  marginTop: 8,
  marginBottom: 8,
  border: '#c5c5c5',
  borderStyle: 'solid',
  borderRadius: 8,
  cursor: 'pointer',
};

const imageStyle = {
  maxWidth: '20%',
  opacity: 0.3,
  padding: 2,
  display: 'inline-block',
  verticalAlign: 'middle',
};

const CanvasItem = ({ canvasId, canvas, changeCanvas }) => (
  <div
    style={buttonStyle}
    onClick={() => { changeCanvas(canvasId); }}
    role="button"
    tabIndex={0}
  >
    <img
      style={imageStyle}
      alt="preview"
      src={`/preview${canvasId}.png`}
    />
    <p className="modalcvtext">
      <span className="modaltitle">{canvas.title}</span><br />
      <span className="modalinfo">{canvas.desc}</span><br />
      Cooldown:
      &nbsp;
      <span className="modalinfo">
        {(canvas.bcd !== canvas.pcd)
          ? <span> {canvas.bcd / 1000}s / {canvas.pcd / 1000}s</span>
          : <span> {canvas.bcd / 1000}s</span>}
      </span><br />
      Stacking till
      <span className="modalinfo"> {canvas.cds / 1000}s</span><br />
      Ranked:
      &nbsp;
      <span className="modalinfo">{(canvas.ranked) ? 'Yes' : 'No'}</span><br />
      {(canvas.req !== -1) ? <span>Requirements:<br /></span> : null}
      <span className="modalinfo">
        {(canvas.req !== -1) ? <span>User Account </span> : null}
        {(canvas.req > 0) ? <span> and {canvas.req} Pixels set</span> : null}
      </span>
      {(canvas.req !== -1) ? <br /> : null}
      Dimensions:
      <span className="modalinfo"> {canvas.size} x {canvas.size}
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
