/*
 * Menu with Buttons on the top left
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import HelpButton from './HelpButton';
import SettingsButton from './SettingsButton';
import LogInButton from './LogInButton';
import DownloadButton from './DownloadButton';
import MinecraftButton from './MinecraftButton';

const Menu = ({ menuOpen }) => (
  <div className={menuOpen ? 'menu show' : 'menu'}>
    <SettingsButton />
    <LogInButton />
    <DownloadButton />
    <MinecraftButton />
    <HelpButton />
  </div>
);

function mapStateToProps(state: State) {
  const { menuOpen } = state.gui;
  return { menuOpen };
}

export default connect(mapStateToProps)(Menu);
