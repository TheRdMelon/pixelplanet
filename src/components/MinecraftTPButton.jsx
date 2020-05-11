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


function MinecraftTPButton({
  view,
  canvasId,
  minecraftname,
  messages,
}) {
  if (minecraftname
    && !messages.includes('not_mc_verified')
    && canvasId === 0) {
    return (
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
  }
  return null;
}

function mapStateToProps(state: State) {
  const { view, canvasId } = state.canvas;
  const { minecraftname, messages } = state.user;
  return {
    view, canvasId, minecraftname, messages,
  };
}

export default connect(mapStateToProps)(MinecraftTPButton);
