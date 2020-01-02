/*
 * Rankings Tabs
 * @flow
 */

import React from 'react';

import TotalRankings from './TotalRankings';
import DailyRankings from './DailyRankings';

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
  lineHeight: 'normal',
};

class Rankings extends React.Component {
  constructor() {
    super();
    this.state = {
      order_daily: false,
    };
  }

  render() {
    return (
      <div>
        <p>
          <span
            className={(!this.state.order_daily) ? 'modallinkselected' : 'modallink'}
            onClick={() => { this.setState({ order_daily: false }); }}
          >Total</span> |
          <span
            className={(this.state.order_daily) ? 'modallinkselected' : 'modallink'}
            onClick={() => { this.setState({ order_daily: true }); }}
          >Daily</span>
        </p>
        {(this.state.order_daily) ? <DailyRankings /> : <TotalRankings />}
        <p style={textStyle}>Ranking updates every 5 min. Daily rankings get reset at midnight UTC.</p>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  const { totalRanking } = state.user;
  return { totalRanking };
}

export default Rankings;
