/**
 *
 * @flow
 */

import React from 'react';
import { IconContext } from 'react-icons';

import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox.js';
import CoordinatesBox from './CoordinatesBox';
import GlobeButton from './GlobeButton';
import CanvasSwitchButton from './CanvasSwitchButton';
import OnlineBox from './OnlineBox';
import PalselButton from './PalselButton.js';
import ChatButton from './ChatButton';
import Palette from './Palette';
import ChatBox from './ChatBox';
import Menu from './Menu';
import ReCaptcha from './ReCaptcha';
import ExpandMenuButton from './ExpandMenuButton';
import ModalRoot from './ModalRoot';

import baseCss from './base.tcss';

const position = 'absolute';
const left = '1em';
const right = left;

const App = () => (
  <div>
    <style dangerouslySetInnerHTML={{ __html: baseCss }} />
    <canvas id="gameWindow" />
    <div id="outstreamContainer" />
    <ReCaptcha />
    <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
      <CoolDownBox />
      <NotifyBox />
      <Menu />
      <GlobeButton />
      <CanvasSwitchButton />
      <PalselButton />
      <ChatButton />
      <Palette />
      <ChatBox />
      <OnlineBox />
      <CoordinatesBox />
      <ExpandMenuButton />
      <ModalRoot />
    </IconContext.Provider>
  </div>
);

export default App;
