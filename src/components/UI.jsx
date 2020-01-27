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

const UI = ({ isHistoricalView }) => {
  if (isHistoricalView) {
    return <HistorySelect />;
  }
  return (
    <div>
      <PalselButton />
      <Palette />
      <GlobeButton />
      <CoolDownBox />
      <NotifyBox />
      <FactionSelector />
      <TemplateSettings />
    </div>
  );
};

function mapStateToProps(state: State) {
  const { isHistoricalView } = state.canvas;
  return {
    isHistoricalView,
  };
}

export default connect(mapStateToProps)(UI);
