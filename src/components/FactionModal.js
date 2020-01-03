/**
 * 
 * @flow
 */

import React from 'react';
import Tabs from './Tabs';
import { connect } from 'react-redux';
import JoinFactionForm from './JoinFactionForm';

const JoinFaction = ({ factionInfo }) => (
    <p style={{ textAlign: 'center' }}>
        <p style={textStyle}>Join a faction to gain perks and work together.</p><br />
        <h2>Join Private Faction:</h2>
        <JoinFactionForm faction_info={factionInfo} />
        <h2>Or Join a Public Faction:</h2>
        
    </p>
)

const FactionModal = ({ }) => (
    <Modal title="Faction Area">
        <p style={{ textAlign: 'center' }}>
            {(factions.length === 0) ?
                <JoinFaction /> :
                <Tabs>
                    <div label="Info">
                        <FactionInfo />
                    </div>
                    <div label="Templates">
                        <Templates />
                    </div>
                    <div label="Admin">
                        <Admin />
                    </div>
                    <div label="Join">
                        <JoinFaction />
                    </div>
                </Tabs>}
            <p>Expand your faction on our Discord: <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
        </p>
    </Modal>
);

function mapDispatchToProps(dispatch) {
    return {
    };
}

function mapStateToProps(state: State) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(FactionModal);