/**
 *
 * @flow
 */

import React, { useState, useEffect } from 'react';

import { connect, useSelector } from 'react-redux';

import type { State } from '../reducers';
import { fetchFactionInfo, selectFaction } from '../actions';

const FactionSelect = ({
  own_factions: ownFactions,
  select_faction: selectFactionDisp,
  selected_faction: selectedFaction,
  fetch_faction_info: fetchFactionInfoDisp,
}) => (
  <>
    <h3 style={{ display: 'inline', fontSize: '32px' }}>Faction: </h3>
    <select
      style={{ display: 'inline', fontWeight: 'bold', fontSize: '26px' }}
      value={selectedFaction}
      onChange={(e) => {
        fetchFactionInfoDisp(e.target.value);
        selectFactionDisp(e.target.value);
      }}
    >
      {ownFactions.map((f) => (
        <option key={`f_opt_${f.id}`} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  </>
);

function mapStateToProps(state: State) {
  return {
    own_factions: state.user.ownFactions,
    selected_faction: state.gui.selectedFaction,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    select_faction(select) {
      dispatch(selectFaction(select));
    },
    fetch_faction_info(id) {
      dispatch(fetchFactionInfo(id));
    },
  };
}

const FactionSelectEl = connect(
  mapStateToProps,
  mapDispatchToProps,
)(FactionSelect);

export default function useFactionSelect(): {
  Selector: () => JSX.Element,
  selectedFactionInfo: any,
  } {
  const factions = useSelector((state) => state.user.factions);
  const selectedFaction = useSelector((state) => state.gui.selectedFaction);

  // useState - local storage, requires render to update to new value, causes re-render
  const [selectedFactionInfo, setSelectedFactionInfo] = useState(
    factions.find((f) => f.id === selectedFaction),
  );

  // Run every re-render that either of the elements of the 2nd parameter change.
  useEffect(() => {
    // See if new faction info is available
    const selectedFactionInfo1 = factions.find((f) => f.id === selectedFaction);
    if (selectedFactionInfo1 && selectedFactionInfo1.Users) {
      // If available
      setSelectedFactionInfo(selectedFactionInfo1);
    }
    // Otherwise, use last faction info until it comes through
  }, [selectedFaction, factions]);

  return {
    Selector: FactionSelectEl,
    selectedFactionInfo,
  };
}
