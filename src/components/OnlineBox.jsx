/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { FaUser, FaPaintBrush } from 'react-icons/fa';
import { numberToString } from '../core/utils';


import type { State } from '../reducers';


const OnlineBox = ({ online, totalPixels, name }) => (
  <div>
    {(online || name)
      ? (
        <div className="onlinebox">
          {(online) && <span>{online} <FaUser /></span>}
          {(name != null) && <span>{numberToString(totalPixels)} <FaPaintBrush /></span>}
        </div>
      ) : null}
  </div>
);

function mapStateToProps(state: State) {
  const { online, totalPixels, name } = state.user;
  return { online, totalPixels, name };
}

export default connect(mapStateToProps)(OnlineBox);
