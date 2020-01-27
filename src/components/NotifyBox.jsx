/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

let style = {};
function getStyle(notification) {
  if (notification) {
    style = {
      backgroundColor: notification >= 0 ? '#a9ffb0cc' : '#ffa9a9cc',
    };
  }
  return style;
}

const NotifyBox = ({ notification }) => (
  <div
    className={notification ? 'notifyboxvis' : 'notifyboxhid'}
    style={getStyle(notification)}
  >
    {notification}
  </div>
);

function mapStateToProps(state: State) {
  const { notification } = state.gui;
  return { notification };
}

export default connect(mapStateToProps)(NotifyBox);
