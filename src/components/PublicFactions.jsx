/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import 'intersection-observer';
import { withIsVisible } from 'react-is-visible';

import type { State } from '../reducers';
import {
  fetchFactionIcon,
  recieveJoinedFaction,
  showUserAreaModal,
} from '../actions';
import { parseAPIresponse } from '../utils/validation';

const iconStyle: React.CSSStyleDeclaration = {
  width: '32px',
  maxHeight: '32px',
  display: 'block',
  margin: 'auto',
  objectFit: 'contain',
};

async function joinFaction(id) {
  const response = await fetch(`./api/factions/${id}/join`, {
    credentials: 'include',
    method: 'PATCH',
  });

  return parseAPIresponse(response);
}

function isMemberOf(ownFactions, factionId) {
  return !!ownFactions.find((f) => f.id === factionId);
}

const FactionRow = ({
  isVisible,
  faction,
  fetch_icon: fetchIcon,
  join_faction: joinFactionDispatch,
  member_of: memberOf,
  open_login: openLogin,
  own_name: ownName,
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
      <td>
        {faction.leader
          || faction.Users.find((user) => user.id === faction.leaderId).name}
      </td>
      <td>
        <div style={{ position: 'relative', padding: '0 5px' }}>
          {ownName === null ? (
            <>
              <button type="button" onClick={openLogin} className="buttonlink">
                Login
              </button>
            </>
          ) : (
            <>
              {memberOf && (
                <a
                  href={`https://pixelplanet.fun/invite/${faction.id}`}
                  className="faction-joined"
                >
                  Joined
                </a>
              )}
              <a
                href={`https://pixelplanet.fun/invite/${faction.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (!memberOf) {
                    joinFaction(faction.id).then((factionInfo) => {
                      if (factionInfo.success) {
                        joinFactionDispatch(factionInfo.info);
                      }
                    });
                  }
                }}
                className={memberOf ? 'faction-joined' : ''}
              >
                {memberOf ? 'Joined' : 'Join'}
              </a>
            </>
          )}
        </div>
      </td>
    </tr>
  );
};

const VisibleFactionRow = withIsVisible(FactionRow);

const PublicFactions = ({
  factions,
  fetch_icon: fetchIcon,
  join_faction: joinFactionDispatch,
  own_factions: ownFactions,
  open_login: openLogin,
  own_name: ownName,
}) => (
  <div style={{ overflowY: 'auto' }}>
    <table>
      <tr>
        <th> </th>
        <th>Faction</th>
        <th>Leader</th>
        <th style={{ width: '1px' }}> </th>
      </tr>
      {factions
        .filter((f) => f.private === false) // Make sure private is FALSE, not just undefined
        .map((faction) => (
          <VisibleFactionRow
            faction={faction}
            fetch_icon={fetchIcon}
            join_faction={joinFactionDispatch}
            member_of={isMemberOf(ownFactions, faction.id)}
            open_login={openLogin}
            own_name={ownName}
          />
        ))}
    </table>
  </div>
);

function mapStateToProps(state: State) {
  return {
    factions: state.user.factions,
    own_factions: state.user.ownFactions,
    own_name: state.user.name,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    fetch_icon(id) {
      dispatch(fetchFactionIcon(id));
    },
    join_faction(info) {
      dispatch(recieveJoinedFaction(info));
    },
    open_login() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublicFactions);
