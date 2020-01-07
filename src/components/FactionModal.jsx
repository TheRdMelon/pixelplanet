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
import { fetchFactions, recieveFactionInfo } from '../actions';

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

const JoinFaction = ({
  recieve_faction_info: recieveFactionInfoDisp,
  fetch_factions: fetchFactionsDisp,
}) => {
  fetchFactionsDisp();
  return (
    <p style={{ textAlign: 'center' }}>
      <p style={textStyle}>Join a faction to gain perks and work together.</p>
      <br />
      <h2>Join Private Faction:</h2>
      <JoinFactionForm recieve_faction_info={recieveFactionInfoDisp} />
      <h2>Or Join a Public Faction:</h2>
      <PublicFactions />
    </p>
  );
};

const CreateFaction = ({ recieve_faction_info: recieveFactionInfoDisp }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Create and lead your own faction.</p>
    <br />
    <h2>Create Faction:</h2>
    <CreateFactionForm recieve_faction_info={recieveFactionInfoDisp} />
  </p>
);

const FactionModal = ({
  recieve_faction_info: recieveFactionInfoDisp,
  fetch_factions: fetchFactionsDisp,
}) => (
  <Modal title="Faction Area">
    <p style={{ textAlign: 'center' }}>
      <Tabs>
        <div label="Info">{/* <FactionInfo /> */}</div>
        <div label="Templates">{/* <Templates /> */}</div>
        <div label="Admin">{/* <Admin /> */}</div>
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

function mapDispatchToProps(dispatch) {
  return {
    recieve_faction_info(factionInfo) {
      dispatch(recieveFactionInfo(factionInfo));
    },
    fetch_factions() {
      dispatch(fetchFactions());
    },
  };
}

export default connect(null, mapDispatchToProps)(FactionModal);
