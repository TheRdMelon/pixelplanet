/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdFileDownload } from 'react-icons/md';
import fileDownload from 'react-file-download';

import { getRenderer } from '../ui/renderer';

import type { State } from '../reducers';


/**
 * https://jsfiddle.net/AbdiasSoftware/7PRNN/
 */
function download(view) {
  const renderer = getRenderer();
  const viewport = renderer.getViewport();
  if (!viewport) return;

  const [x, y] = view.map(Math.round);
  const filename = `pixelplanet-${x}-${y}.png`;

  viewport.toBlob((blob) => fileDownload(blob, filename));
}


const DownloadButton = ({ view }) => (
  <div
    id="downloadbutton"
    className="actionbuttons"
    role="button"
    tabIndex={0}
    onClick={() => download(view)}
  >
    <MdFileDownload />
  </div>
);

// TODO optimize
function mapStateToProps(state: State) {
  const { view } = state.canvas;
  return { view };
}

export default connect(mapStateToProps)(DownloadButton);
