/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { IconContext } from 'react-icons';

import type { State } from '../reducers';
import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox';
import CoordinatesBox from './CoordinatesBox';
import GlobeButton from './GlobeButton';
import CanvasSwitchButton from './CanvasSwitchButton';
import OnlineBox from './OnlineBox';
import PalselButton from './PalselButton';
import ChatButton from './ChatButton';
import Palette from './Palette';
import ChatBox from './ChatBox';
import Menu from './Menu';
import ReCaptcha from './ReCaptcha';
import ExpandMenuButton from './ExpandMenuButton';
import ModalRoot from './ModalRoot';
import HistorySelect from './HistorySelect';

import baseCss from './base.tcss';

const App = ({ isHistoricalView }) => (
  <div>
    <style dangerouslySetInnerHTML={{ __html: baseCss }} />
    <canvas id="gameWindow" />
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
      {
        (isHistoricalView)
          ? <HistorySelect />
          : (
            <div>
              <PalselButton />
              <Palette />
              <GlobeButton />
              <CoolDownBox />
              <NotifyBox />
            </div>
          )
      }
      <ModalRoot />
    </IconContext.Provider>
  </div>
);

function mapStateToProps(state: State) {
  const {
    isHistoricalView,
  } = state.canvas;
  return {
    isHistoricalView,
  };
}

export default connect(mapStateToProps)(App);
