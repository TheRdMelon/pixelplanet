/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import Tabs from './Tabs';
import JoinFactionForm from './JoinFactionForm';
import PublicFactions from './PublicFactions';

import Modal from './Modal';
import CreateFactionForm from './CreateFactionForm';
import { fetchFactions } from '../actions';

const textStyle = {
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

const JoinFaction = ({ joined_faction, fetch_factions }) => {
  fetch_factions();
  return (
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Join a faction to gain perks and work together.</p>
      <br />
      <h2>Join Private Faction:</h2>
      <JoinFactionForm joined_faction={joined_faction} />
      <h2>Or Join a Public Faction:</h2>
      <PublicFactions joined_faction={joined_faction} />
    </p>
  );
};

const CreateFaction = ({ created_faction }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Create and lead your own faction.</p>
    <br />
    <h2>Create Faction:</h2>
    <CreateFactionForm created_faction={created_faction} />
  </p>
);

const FactionModal = ({ joined_faction, created_faction, fetch_factions }) => (
  <Modal title="Faction Area">
    <p style={{ textAlign: 'center' }}>
      <Tabs>
        <div label="Info">{/* <FactionInfo /> */}</div>
        <div label="Templates">{/* <Templates /> */}</div>
        <div label="Admin">{/* <Admin /> */}</div>
        <div label="Join">
          <JoinFaction
            joined_faction={joined_faction}
            fetch_factions={fetch_factions}
          />
        </div>
        <div label="Create">
          <CreateFaction created_faction={created_faction} />
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

function mapDispatchToProps(dispatch) {
  return {
    joined_faction(factionInfo) {
      dispatch(joinedFaction(factionInfo));
    },
    created_faction(factionInfo) {
      dispatch(createdFaction(factionInfo));
    },
    fetch_factions() {
      dispatch(fetchFactions());
    },
  };
}

function mapStateToProps(state: State) {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(FactionModal);
