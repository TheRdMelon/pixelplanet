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


const UI = ({ isHistoricalView, is3D }) => {
  if (isHistoricalView) {
    return <HistorySelect />;
  }
  return (
    <div>
      <PalselButton />
      <Palette />
      {(is3D) ? null : <GlobeButton />}
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
