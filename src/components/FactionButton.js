/**
 * 
 * @flow
 */

import React from 'react';

import { TiGroup } from 'react-icons/ti'
import { connect } from 'react-redux';

import { showFactionsAreaModal } from '../actions';

import type { State } from '../reducers';

const FactionButton = ({ open }) => (
    <div id="factionbutton" className="actionbuttons" onClick={open}>
        <TiGroup />
    </div>
);

function mapDispatchToProps(dispatch) {
    return {
        open() {
            dispatch(showFactionsAreaModal());
        },
    };
}

export default connect(null, mapDispatchToProps)(FactionButton);