/*
 * Menu with Buttons on the top left
 */

import React from 'react';
import { connect } from 'react-redux';

import HelpButton from './HelpButton';
import SettingsButton from './SettingsButton';
import LogInButton from './LogInButton';
import DownloadButton from './DownloadButton';
import MinecraftTPButton from './MinecraftTPButton.js';
import MinecraftButton from './MinecraftButton';

const Menu = ({ menuOpen, minecraftname, messages, canvasId }) => (
  <div>
    {(menuOpen) ? <SettingsButton /> : null}
    {(menuOpen) ? <LogInButton /> : null}
    {(menuOpen) ? <DownloadButton /> : null}
    {(menuOpen) ? <MinecraftButton /> : null}
    {(menuOpen) ? <HelpButton /> : null}
    {(minecraftname && !messages.includes('not_mc_verified') && canvasId == 0) ? <MinecraftTPButton /> : null}
  </div>
);

function mapStateToProps(state: State) {
  const { menuOpen } = state.gui;
  const { minecraftname, messages } = state.user;
  const { canvasId } = state.canvas;
  return { menuOpen, minecraftname, messages, canvasId };
}

export default connect(mapStateToProps)(Menu);
