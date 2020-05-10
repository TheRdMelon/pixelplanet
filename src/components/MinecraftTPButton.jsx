/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { MdNearMe } from 'react-icons/md';

import type { State } from '../reducers';

async function submitMinecraftTp(view) {
  const [x, y] = view.map(Math.round);
  const body = JSON.stringify({
    x,
    y,
  });
  await fetch('./api/mctp', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });
}


const MinecraftTPButton = ({ view }) => (
  <div
    id="minecrafttpbutton"
    className="actionbuttons"
    role="button"
    tabIndex={-1}
    onClick={() => submitMinecraftTp(view)}
  >
    <MdNearMe />
  </div>
);

function mapStateToProps(state: State) {
  const { view } = state.canvas;
  return { view };
}

export default connect(mapStateToProps)(MinecraftTPButton);
