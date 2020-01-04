/*
 * Rankings Tabs
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

const TotalRankings = ({ totalRanking }) => (
  <div style={{ overflowY: 'auto' }}>
    <table>
      <tr>
        <th>#</th>
        <th>user</th>
        <th>Pixels</th>
        <th># Today</th>
        <th>Pixels Today</th>
      </tr>
      {
        totalRanking.map((rank) => (
          <tr>
            <td>{rank.ranking}</td>
            <td>{rank.name}</td>
            <td>{rank.totalPixels}</td>
            <td>{rank.dailyRanking}</td>
            <td>{rank.dailyTotalPixels}</td>
          </tr>
        ))
      }
    </table>
  </div>
);

function mapStateToProps(state: State) {
  const { totalRanking } = state.user;
  return { totalRanking };
}

export default connect(mapStateToProps)(TotalRankings);
