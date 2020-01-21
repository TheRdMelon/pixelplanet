/**
 *
 * @flow
 */

import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import { FaCrown } from 'react-icons/fa';

import Tabs from './Tabs';
import JoinFactionForm from './JoinFactionForm';
import PublicFactions from './PublicFactions';

import Modal from './Modal';
import CreateFactionForm from './CreateFactionForm';
import {
  fetchFactions,
  recieveFactionInfo,
  fetchOwnFactions,
  selectFaction,
  fetchFactionInfo,
} from '../actions';

import type { State } from '../reducers';

const textStyle: CSSStyleDeclaration = {
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

const squareParentStyle: CSSStyleDeclaration = {
  width: '40%',
  flexBasis: '40%',
  flexShrink: 0,
  flexGrow: 1,
  position: 'relative',
};

const squareStretcherStyle: CSSStyleDeclaration = {
  paddingBottom: '100%',
};

const squareChildStyle: CSSStyleDeclaration = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const factionNameStyle: CSSStyleDeclaration = {
  wordBreak: 'break-word',
  display: 'block',
  paddingTop: '10px',
  paddingLeft: '0',
};

const JoinFaction = ({ recieve_faction_info: recieveFactionInfoDisp }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Join a faction to gain perks and work together.</p>
    <br />
    <h2>Join Private Faction:</h2>
    <JoinFactionForm recieve_faction_info={recieveFactionInfoDisp} />
    <h2>Or Join a Public Faction:</h2>
    <PublicFactions />
  </p>
);

const CreateFaction = ({ recieve_faction_info: recieveFactionInfoDisp }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Create and lead your own faction.</p>
    <br />
    <h2>Create Faction:</h2>
    <CreateFactionForm recieve_faction_info={recieveFactionInfoDisp} />
  </p>
);

const FactionInfo = ({
  own_factions: ownFactions,
  selected_faction: selectedFaction,
  select_faction: selectFactionDisp,
  factions,
  fetch_faction_info: fetchFactionInfoDisp,
}) => {
  // useRef - local storage, persistant between renders, updating doesn't cause re-render
  const lastSelected = useRef<string>(selectFaction);
  // useState - local storage, requires render to update to new value, causes re-render
  const [selectedFactionInfo, setSelectedFactionInfo] = useState(
    factions.find((f) => f.id === selectedFaction),
  );

  // Run every re-render that either of the elements of the 2nd parameter change (only works on states, refs(?), props I believe).
  useEffect(() => {
    // See if new faction info is available
    const selectedFactionInfo1 = factions.find((f) => f.id === selectedFaction);
    if (selectedFactionInfo1) {
      // If available
      lastSelected.current = selectedFaction;
      setSelectedFactionInfo(selectedFactionInfo1);
    } else {
      // Unavaiable, use last faction info until it comes through
      setSelectedFactionInfo(
        factions.find((f) => f.id === lastSelected.current),
      );
    }
  }, [selectedFaction, factions]);

  return (
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

      <div style={{ display: 'flex' }}>
        <div style={squareParentStyle}>
          <div style={squareStretcherStyle} />
          <div style={squareChildStyle}>
            <img
              style={{
                imageRendering: 'pixelated',
                objectFit: 'contain',
                width: '100%',
                height: '100%',
              }}
              src={
                selectedFactionInfo.icon
                  ? `data:image/png;base64,${selectedFactionInfo.icon}`
                  : './loading0.png'
              }
              alt="Faction Icon"
            />
          </div>
        </div>
        <div className="factioninfobox">
          <h4>
            Leader:<span style={factionNameStyle}>{selectedFactionInfo.leader}</span>
          </h4>
          <div className="hr" />
          <h4>
            Members:<span>{selectedFactionInfo.Users.length}</span>
          </h4>
        </div>
      </div>
      <h3>Member List</h3>
      <table>
        <tr>
          <th style={{ maxWidth: 0 }}>Admin</th>
          <th style={{ textAlign: 'left' }}>Name</th>
        </tr>
        {selectedFactionInfo.Users.map((user) => (
          <>
            <tr>
              <td>
                {user === selectedFactionInfo.leader ? <FaCrown /> : null}
              </td>
              <td style={{ textAlign: 'left' }}>{user}</td>
            </tr>
          </>
        ))}
      </table>
    </>
  );
};

const Admin = ({ selected_faction: selectedFaction }) => {
  const formRef = useRef(null);

  return (
    <>
      <form
        encType="multipart/form-data"
        onSubmit={(e) => {
          e.preventDefault();
          const req = new XMLHttpRequest();
          const formData = new FormData(formRef.current);

          req.open('POST', `./api/factions/${selectedFaction}/templates`);
          req.send(formData);
        }}
        ref={formRef}
      >
        <input type="file" name="image" />
        <br />
        <label htmlFor="radio-d" style={{ display: 'inline' }}>
          <input
            type="radio"
            name="canvasindent"
            id="radio-d"
            value="d"
            style={{ display: 'inline' }}
          />
          Default
        </label>
        <label htmlFor="radio-m" style={{ dispatch: 'inline' }}>
          <input
            type="radio"
            name="canvasindent"
            id="radio-m"
            value="m"
            style={{ display: 'inline' }}
          />
          Moon
        </label>
        <br />
        <label htmlFor="x-input">
          Top Left X:
          <br />
          <input type="number" name="x" id="x-input" min={-32768} max={32768} />
        </label>
        <br />
        <label htmlFor="y-input">
          Top Left Y:
          <br />
          <input type="number" name="y" id="y-input" min={-32768} max={32768} />
        </label>
        <br />
        <button type="submit" name="upload">
          Create
        </button>
      </form>
    </>
  );
};

const FactionModal = ({
  recieve_faction_info: recieveFactionInfoDisp,
  fetch_factions: fetchFactionsDisp,
  fetch_own_factions: fetchOwnFactionsDisp,
  own_factions: ownFactions,
  selected_faction: selectedFaction,
  select_faction: selectFactionDisp,
  factions,
  fetch_faction_info: fetchFactionInfoDisp,
}) => {
  // New react hook, 2nd parameter of empty array makes it equivelant to componentDidMount
  useEffect(() => {
    fetchOwnFactionsDisp();
  }, []);

  if (ownFactions === undefined) return null;

  return (
    <Modal title="Faction Area">
      <p style={{ textAlign: 'center' }}>
        <Tabs
          on_tab_click={(tab) => (tab === 'Join'
            ? fetchFactionsDisp()
            : tab !== 'Create' && fetchOwnFactionsDisp())}
        >
          {ownFactions.length > 0 ? (
            <div label="Info">
              <FactionInfo
                own_factions={ownFactions}
                selected_faction={selectedFaction}
                select_faction={selectFactionDisp}
                factions={factions}
                fetch_faction_info={fetchFactionInfoDisp}
              />
            </div>
          ) : (
            undefined
          )}
          {ownFactions.length > 0 ? (
            <div label="Templates">{/* <Templates /> */}</div>
          ) : (
            undefined
          )}
          {ownFactions.length > 0 ? (
            <div label="Admin">
              <Admin selected_faction={selectedFaction} />
            </div>
          ) : (
            undefined
          )}
          <div label="Join">
            <JoinFaction
              recieve_faction_info={recieveFactionInfoDisp}
              fetch_factions={fetchFactionsDisp}
            />
          </div>
          <div label="Create">
            <CreateFaction recieve_faction_info={recieveFactionInfoDisp} />
          </div>
        </Tabs>
        <p>
          Expand your faction on our Discord:{' '}
          <a href="./discord" target="_blank">
            pixelplanet.fun/discord
          </a>
        </p>
      </p>
    </Modal>
  );
};

function mapStateToProps(state: State) {
  return {
    selected_faction: state.gui.selectedFaction,
    own_factions: state.user.ownFactions,
    factions: state.user.factions,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    recieve_faction_info(factionInfo) {
      dispatch(recieveFactionInfo(factionInfo));
    },
    fetch_factions() {
      dispatch(fetchFactions());
    },
    fetch_own_factions_dispatch(id) {
      dispatch(fetchOwnFactions(id));
    },
    select_faction(select) {
      dispatch(selectFaction(select));
    },
    fetch_faction_info(id) {
      dispatch(fetchFactionInfo(id));
    },
  };
}

function mergeProps(propsFromState, propsFromDispatch) {
  return {
    fetch_own_factions() {
      propsFromDispatch.fetch_own_factions_dispatch(
        propsFromState.selected_faction,
      );
    },
    selected_faction: propsFromState.selected_faction,
    fetch_factions: propsFromDispatch.fetch_factions,
    recieve_faction_info: propsFromDispatch.recieve_faction_info,
    own_factions: propsFromState.own_factions,
    select_faction: propsFromDispatch.select_faction,
    factions: propsFromState.factions,
    fetch_faction_info: propsFromDispatch.fetch_faction_info,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(FactionModal);
