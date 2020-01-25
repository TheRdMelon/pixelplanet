/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import type { State } from '../reducers';

async function switchVoxel() {
  await import(/* webpackChunkName: "voxel" */ '../voxel');
  console.log("Chunk voxel loaded");
}


const VoxelButton = ({
  canvasId, canvasIdent, canvasSize, view,
}) => (
  <div id="voxelbutton" className="actionbuttons" onClick={switchVoxel}>
  ♠
  </div>
);

export default VoxelButton;
