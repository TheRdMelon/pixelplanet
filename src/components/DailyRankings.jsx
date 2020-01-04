/*
 * Rankings Tabs
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

const DailyRankings = ({ totalDailyRanking }) => (
  <div style={{ overflowY: 'auto' }}>
    <table>
      <tr>
        <th>#</th>
        <th>user</th>
        <th>Pixels</th>
        <th># Total</th>
        <th>Total Pixels</th>
      </tr>
      {
        totalDailyRanking.map((rank) => (
          <tr>
            <td>{rank.dailyRanking}</td>
            <td>{rank.name}</td>
            <td>{rank.dailyTotalPixels}</td>
            <td>{rank.ranking}</td>
            <td>{rank.totalPixels}</td>
          </tr>
        ))
      }
    </table>
  </div>
);

function mapStateToProps(state: State) {
  const { totalDailyRanking } = state.user;
  return { totalDailyRanking };
}

export default connect(mapStateToProps)(DailyRankings);
