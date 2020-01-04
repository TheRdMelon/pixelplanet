/**
 *
 * @flow
 */

import React from "react";
import { connect } from "react-redux";

import type { State } from "../reducers";

const iconStyle = {
  width: "32px"
};

const PublicFactions = ({ factions }) => (
  <div style={{ overflowY: "auto" }}>
    <table>
      <tr>
        <th />
        <th>Faction</th>
        <th>Leader</th>
        <th />
      </tr>
      {factions.map(faction => (
        <tr>
          <td>
            <img
              style={iconStyle}
              width={32}
              src={`data:image/png;base64,${faction.icon}`}
              alt="Faction Icon"
            />
          </td>
          <td>{faction.name}</td>
          <td>{faction.leader}</td>
          <td>
            <a /* onClick={() => join_faction(faction.id)} */>Join</a>
          </td>
        </tr>
      ))}
    </table>
  </div>
);

function mapStateToProps(state: State) {
  const { factions } = state.user;
  return { factions };
}

export default connect(mapStateToProps)(PublicFactions);
