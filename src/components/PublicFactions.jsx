/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import 'intersection-observer';
import { withIsVisible } from 'react-is-visible';

import type { State } from '../reducers';
import { fetchFactionIcon, recieveFactionInfo } from '../actions';
import { parseAPIresponse } from '../utils/validation';

const iconStyle = {
  width: '32px',
  maxHeight: '32px',
  display: 'block',
  margin: 'auto',
};

async function joinFaction(id) {
  const response = await fetch(`./api/factions/${id}`, {
    method: 'PATCH',
  });

  return parseAPIresponse(response);
}

const FactionRow = ({
  isVisible,
  recieve_faction_info: recieveFactionInfoDisp,
  faction,
  fetch_icon: fetchIcon,
}) => {
  if (isVisible && faction.icon === undefined) {
    fetchIcon(faction.id);
  }

  return (
    <tr style={{ height: '32px' }}>
      <td>
        <img
          style={iconStyle}
          width={32}
          src={
            faction.icon
              ? `data:image/png;base64,${faction.icon}`
              : './loading0.png'
          }
          alt=""
        />
      </td>
      <td>{faction.name}</td>
      <td>{faction.leader}</td>
      <td>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            joinFaction(faction.id).then((factionInfo) => {
              if (factionInfo.success) {
                recieveFactionInfoDisp(factionInfo.info);
              }
            });
          }}
        >
          Join
        </a>
      </td>
    </tr>
  );
};

const VisibleFactionRow = withIsVisible(FactionRow);

const PublicFactions = ({
  factions,
  fetch_icon: fetchIcon,
  recieve_faction_info: recieveFactionInfoDisp,
}) => (
  <div style={{ overflowY: 'auto' }}>
    <table>
      <tr>
        <th> </th>
        <th>Faction</th>
        <th>Leader</th>
        <th> </th>
      </tr>
      {factions.map((faction) => (
        <VisibleFactionRow
          faction={faction}
          fetch_icon={fetchIcon}
          recieve_faction_info={recieveFactionInfoDisp}
        />
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
    recieve_faction_info(info) {
      dispatch(recieveFactionInfo(info));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicFactions);