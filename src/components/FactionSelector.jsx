/**
 *
 * @flow
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

const FactionSelector = ({ factions }: { factions: Array }) => {
  const [hoveredFaction, setHoveredFaction] = useState<number>(-1);

  return (
    <>
      <div id="factionselector">
        {factions.map((faction, index) => (
          <div
            key={faction.name.replace(' ', '_')}
            className="factionsselectorrow"
            onFocus={() => {}}
            onMouseOver={() => setHoveredFaction(index)}
            onMouseLeave={() => setHoveredFaction(-1)}
          >
            <div className="factionselectorname">{faction.name}</div>
            {hoveredFaction === index && (
              <>
                <div className="factionselectorlogo">
                  <img
                    src={`data:image/png;base64,${faction.icon}`}
                    alt="logo"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

function mapStateToProps(state: State) {
  return {
    factions: state.user.factions,
  };
}

export default connect(mapStateToProps)(FactionSelector);
