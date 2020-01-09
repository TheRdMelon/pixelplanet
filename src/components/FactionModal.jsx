/**
 *
 * @flow
 */

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
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
}) => (
  <>
    <p style={{ display: 'inline', fontSize: '32px' }}>Faction: </p>
    <select
      style={{ display: 'inline', fontWeight: 'bold', fontSize: '26px' }}
      value={selectedFaction}
    >
      {ownFactions.map((f) => (
        <option key={`f_opt_${f.id}`} value={f.id}>
          <div onChange={(e) => selectFactionDisp(e.target.value)}>
            {f.name}
          </div>
        </option>
      ))}
    </select>
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
            factions.find((f) => f.id === selectedFaction).icon
              ? `data:image/png;base64,${
                factions.find((f) => f.id === selectedFaction).icon
              }`
              : './loading0.png'
          }
          alt="Faction Icon"
        />
      </div>
    </div>
  </>
);

const FactionModal = ({
  recieve_faction_info: recieveFactionInfoDisp,
  fetch_factions: fetchFactionsDisp,
  fetch_own_factions: fetchOwnFactionsDisp,
  own_factions: ownFactions,
  selected_faction: selectedFaction,
  select_faction: selectFactionDisp,
  factions,
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
            <div label="Admin">{/* <Admin /> */}</div>
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
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(FactionModal);
