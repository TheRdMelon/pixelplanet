/**
 *
 * @flow
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';


const NotifyBox = ({ notification }) => {
  const [className, setClassName] = useState('notifybox');
  const [value, setValue] = useState(notification);

  if (notification) {
    let newClassName = 'notifybox';
    if (notification && typeof notification !== 'string') {
      if (notification > 0) newClassName += ' green';
      else newClassName += ' red';
    }
    if (newClassName !== className) {
      setClassName(newClassName);
    }
    if (notification !== value) {
      setValue(notification);
    }
  }

  return (
    <div
      className={(notification) ? `${className} show` : className}
    >
      {value}
    </div>
  );
};

function mapStateToProps(state: State) {
  const { notification } = state.user;
  return { notification };
}

export default connect(mapStateToProps)(NotifyBox);
