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
import FactionSelector from './FactionSelector';
import TemplateSettings from './TemplateSettings';
import Mobile3DControls from './Mobile3DControls';

const UI = ({ isHistoricalView, is3D, isOnMobile }) => {
  if (isHistoricalView) {
    return <HistorySelect />;
  }
  return (
    <div>
      <PalselButton />
      <Palette />
      {is3D ? null : <GlobeButton />}
      {is3D && isOnMobile ? <Mobile3DControls /> : null}
      <CoolDownBox />
      <NotifyBox />
      <FactionSelector />
      <TemplateSettings />
    </div>
  );
};

function mapStateToProps(state: State) {
  const { isHistoricalView, is3D } = state.canvas;
  const { isOnMobile } = state.user;
  return {
    isHistoricalView,
    is3D,
    isOnMobile,
  };
}

export default connect(mapStateToProps)(UI);
