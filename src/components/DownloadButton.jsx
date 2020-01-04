/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdFileDownload } from 'react-icons/md';
import fileDownload from 'react-file-download';

import type { State } from '../reducers';


/**
 * https://jsfiddle.net/AbdiasSoftware/7PRNN/
 */
function download(view) {
  // TODO id shouldnt be hardcoded
  const $viewport = document.getElementById('gameWindow');
  if (!$viewport) return;

  // TODO change name

  const [x, y] = view.map(Math.round);
  const filename = `pixelplanet-${x}-${y}.png`;

  $viewport.toBlob((blob) => fileDownload(blob, filename));
}


const DownloadButton = ({ view }) => (
  <div id="downloadbutton" className="actionbuttons" onClick={() => download(view)}>
    <MdFileDownload />
  </div>
);

// TODO optimize
function mapStateToProps(state: State) {
  const { view } = state.canvas;
  return { view };
}

export default connect(mapStateToProps)(DownloadButton);
