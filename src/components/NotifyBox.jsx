/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

function getStyle(notification) {
  if (!notification) return {};

  if (typeof notification === 'string') {
    return {
      width: 50,
    };
  }
  return {
    backgroundColor: (notification >= 0) ? '#a9ffb0cc' : '#ffa9a9cc',
  };
}

const NotifyBox = ({ notification }) => (
  <div
    className={(notification) ? 'notifyboxvis' : 'notifyboxhid'}
    style={getStyle(notification)}
  >
    {notification}
  </div>
);

function mapStateToProps(state: State) {
  const { notification } = state.user;
  return { notification };
}

export default connect(mapStateToProps)(NotifyBox);
