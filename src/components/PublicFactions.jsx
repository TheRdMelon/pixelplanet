/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import 'intersection-observer';
import { withIsVisible } from 'react-is-visible';

import type { State } from '../reducers';
import { fetchFactionIcon } from '../actions';

const iconStyle = {
  width: '32px',
  display: 'block',
  margin: 'auto',
};

const FactionRow = ({ isVisible, faction, fetch_icon }) => {
  if (isVisible && !faction.icon) {
    fetch_icon(faction.id);
  }

  return (
    <tr>
      <td>
        <img
          style={iconStyle}
          width={32}
          src={`data:image/png;base64,${faction.icon}`}
          alt=""
        />
      </td>
      <td>{faction.name}</td>
      <td>{faction.leader}</td>
      <td>
        <a>Join</a>
      </td>
    </tr>
  );
};

const VisibleFactionRow = withIsVisible(FactionRow);

const PublicFactions = ({ factions, fetch_icon }) => (
  <div style={{ overflowY: 'auto' }}>
    <table>
      <tr>
        <th> </th>
        <th>Faction</th>
        <th>Leader</th>
        <th> </th>
      </tr>
      {factions.map((faction) => (
        <VisibleFactionRow faction={faction} fetch_icon={fetch_icon} />
      ))}
    </table>
  </div>
);

function mapStateToProps(state: State) {
  const { factions } = state.user;
  return { factions };
}

function mapDispatchToProps(dispatch) {
  return {
    fetch_icon(id) {
      dispatch(fetchFactionIcon(id));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicFactions);
