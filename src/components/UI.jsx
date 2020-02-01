/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';
import CoolDownBox from './CoolDownBox';
import NotifyBox from './NotifyBox';
import GlobeButton from './GlobeButton';
import PalselButton from './PalselButton';
import Palette from './Palette';
import HistorySelect from './HistorySelect';
import Mobile3DControls from './Mobile3DControls';


const UI = ({ isHistoricalView, is3D }) => {
  if (isHistoricalView) {
    return <HistorySelect />;
  }
  return (
    <div>
      <PalselButton />
      <Palette />
      {(is3D) ? null : <GlobeButton />}
      <Mobile3DControls />
      <CoolDownBox />
      <NotifyBox />
    </div>
  );
};

function mapStateToProps(state: State) {
  const {
    isHistoricalView,
    is3D,
  } = state.canvas;
  return {
    isHistoricalView,
    is3D,
  };
}

export default connect(mapStateToProps)(UI);
