/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import {
  durationToString,
} from '../core/utils';
import type { State } from '../reducers';


const CoolDownBox = ({ coolDown }) => (
  <div
    className="cooldownbox"
    style={{
      display: (coolDown) ? 'block' : 'none',
    }}
  >
    {coolDown && durationToString(coolDown, true)}
  </div>
);

function mapStateToProps(state: State) {
  const { coolDown } = state.user;
  return { coolDown };
}

export default connect(mapStateToProps)(CoolDownBox);
