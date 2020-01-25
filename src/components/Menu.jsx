/*
 * Menu with Buttons on the top left
 */

import React from 'react';
import { connect } from 'react-redux';

import HelpButton from './HelpButton';
import SettingsButton from './SettingsButton';
import LogInButton from './LogInButton';
import DownloadButton from './DownloadButton';
import MinecraftTPButton from './MinecraftTPButton';
import MinecraftButton from './MinecraftButton';
import FactionButton from './FactionButton';
import VoxelButton from './VoxelButton';

const Menu = ({
  menuOpen, minecraftname, messages, canvasId,
}) => (
  <div>
    <div id="menuitems">
      {menuOpen ? (
        <>
          <SettingsButton />
          <LogInButton />
          <FactionButton />
          <DownloadButton />
          <MinecraftButton />
          <HelpButton />
          <VoxelButton />
        </>
      ) : null}
    </div>
    {minecraftname
    && !messages.includes('not_mc_verified')
    && canvasId === 0 ? (
      <MinecraftTPButton />
      ) : null}
  </div>
);

function mapStateToProps(state: State) {
  const { menuOpen } = state.gui;
  const { minecraftname, messages } = state.user;
  const { canvasId } = state.canvas;
  return {
    menuOpen,
    minecraftname,
    messages,
    canvasId,
  };
}

export default connect(mapStateToProps)(Menu);
