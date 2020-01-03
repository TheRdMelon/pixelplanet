/**
 * 
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

const PublicFactions = ({ public_factions, join_faction }) => (
    <div style={{ overflowY: 'auto' }}>
        <table>
            <tr>
                <th />
                <th>Faction</th>
                <th>Leader</th>
                <th />
            </tr>
            {
                public_factions.map(faction => (
                    <tr>
                        <td>
                            <img style={iconStyle} width={32} src={`data:image/png;base64,${faction.icon}` alt="Faction Icon"} />
                        </td>
                        <td>{faction.name}</td>
                        <td>{faction.leader}</td>
                        <td>
                            <a onClick={() => join_faction(faction.id)}>
                                Join
                            </a>
                        </td>
                    </tr>
                ))
            }
        </table>
    </div>
);

function mapStateToProps(state: State) {
    const { public_factions, join_faction } = state.factions;
    return { public_factions, join_faction };
}

export default connect(mapStateToProps)(PublicFactions);