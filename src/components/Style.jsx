/*
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

function Style({ style }) {
  const cssUri = window.availableStyles[style];
  return (style === 'default') ? null
    : (<link rel="stylesheet" type="text/css" href={cssUri} />);
}

function mapStateToProps(state: State) {
  const {
    style,
  } = state.gui;
  return { style };
}

export default connect(mapStateToProps)(Style);
