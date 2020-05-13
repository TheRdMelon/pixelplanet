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
    className={(coolDown && coolDown >= 300)
      ? 'cooldownbox show' : 'cooldownbox'}
  >
    {coolDown && durationToString(coolDown, true)}
  </div>
);

function mapStateToProps(state: State) {
  const { coolDown } = state.user;
  return { coolDown };
}

export default connect(mapStateToProps)(CoolDownBox);
