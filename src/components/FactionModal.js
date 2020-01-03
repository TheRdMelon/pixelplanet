/**
 * 
 * @flow
 */

import React from 'react';
import Tabs from './Tabs';
import { connect } from 'react-redux';
import JoinFactionForm from './JoinFactionForm';

const JoinFaction = ({ joined_faction }) => (
    <p style={{ textAlign: 'center' }}>
        <p style={textStyle}>Join a faction to gain perks and work together.</p><br />
        <h2>Join Private Faction:</h2>
        <JoinFactionForm joined_faction={joined_faction} />
        <h2>Or Join a Public Faction:</h2>
        <PublicFaction joined_faction={joined_faction} />
    </p>
)

const FactionModal = ({ joined_faction }) => (
    <Modal title="Faction Area">
        <p style={{ textAlign: 'center' }}>
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
                        <JoinFaction joined_faction={joined_faction} />
                    </div>
                    <div label="Create">
                        <CreateFaction />
                    </div>
                </Tabs>
            <p>Expand your faction on our Discord: <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
        </p>
    </Modal>
);

function mapDispatchToProps(dispatch) {
    return {
        joined_faction(factionInfo) {
            dispatch(joinedFaction(factionInfo));
        }
    };
}

function mapStateToProps(state: State) {
    return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(FactionModal);