/**
 *
 * @flow
 */

import React from 'react';
import { IconContext } from 'react-icons';

import CoordinatesBox from './CoordinatesBox';
import CanvasSwitchButton from './CanvasSwitchButton';
import OnlineBox from './OnlineBox';
import ChatButton from './ChatButton';
import ChatBox from './ChatBox';
import Menu from './Menu';
import UI from './UI';
import ReCaptcha from './ReCaptcha';
import ExpandMenuButton from './ExpandMenuButton';
import ModalRoot from './ModalRoot';

import baseCss from './base.tcss';

const App = () => (
  <div>
    {/* eslint-disable-next-line react/no-danger */}
    <style dangerouslySetInnerHTML={{ __html: baseCss }} />
    <div id="outstreamContainer" />
    <ReCaptcha />
    <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
      <CanvasSwitchButton />
      <Menu />
      <ChatButton />
      <ChatBox />
      <OnlineBox />
      <CoordinatesBox />
      <ExpandMenuButton />
      <UI />
      <ModalRoot />
    </IconContext.Provider>
  </div>
);

export default App;
