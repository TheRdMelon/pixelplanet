/**
 *
 * @flow
 */

import React, { useRef } from 'react';
import { connect } from 'react-redux';

import { MdLock } from 'react-icons/md';
import Tabs from './Tabs';
import JoinFactionForm from './JoinFactionForm';
import PublicFactions from './PublicFactions';

import Modal from './Modal';
import CreateFactionForm from './CreateFactionForm';
import {
  fetchFactions,
  fetchOwnFactions,
  fetchFactionBannedMembers,
} from '../actions';

import type { State } from '../reducers';

import FactionInfo from './FactionInfo';
import FactionAdmin from './FactionAdmin';

const textStyle: React.CSSStyleDeclaration = {
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

const JoinFaction = () => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Join a faction to gain perks and work together.</p>
    <br />
    <h2>Join Private Faction:</h2>
    <JoinFactionForm />
    <h2>Or Join a Public Faction:</h2>
    <PublicFactions />
  </p>
);

const CreateFaction = ({ reset_tabs: resetTabs }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Create and lead your own faction.</p>
    <br />
    <h2>Create Faction:</h2>
    <CreateFactionForm reset_tabs={resetTabs} />
  </p>
);

const FactionModal = ({
  fetch_factions: fetchFactionsDisp,
  fetch_own_factions: fetchOwnFactionsDisp,
  fetch_ban_list: fetchBanList,
  own_factions: ownFactions,
  own_name: ownName,
}) => {
  const tabsRef = useRef<Tabs>(null);
  const modalRef = useRef<Modal>(null);

  const resetTabs = () => {
    if (tabsRef.current) {
      const tab = tabsRef.current.props.children.find(
        (c) => c !== null && c !== undefined,
      );
      if (tab) {
        tabsRef.current.onClickTabItem(tab.props.label);
      }
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'Join') {
      fetchFactionsDisp();
    } else if (tab !== 'Create') {
      fetchOwnFactionsDisp();
    }

    if (tab === 'Admin') {
      fetchBanList();
    }
  };

  if (ownFactions === undefined) {
    fetchOwnFactionsDisp();
    return null;
  }

  return (
    <Modal title="Faction Area" modal_ref={modalRef}>
      <p style={{ textAlign: 'center' }}>
        <Tabs
          on_tab_click={handleTabClick}
          onloaded={(activeTab) => {
            if (activeTab === 'Join') {
              fetchFactionsDisp();
            } else if (activeTab !== 'Create') {
              fetchOwnFactionsDisp();
            }
          }}
          ref={tabsRef}
        >
          {ownFactions.length > 0 ? (
            <div label="Info">
              <FactionInfo reset_tabs={resetTabs} />
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
              <FactionAdmin modal_ref={modalRef} />
            </div>
          ) : (
            undefined
          )}
          <div label="Join">
            <JoinFaction />
          </div>
          {ownName !== null && (
            <div label="Create">
              <CreateFaction reset_tabs={resetTabs} />
            </div>
          )}
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
    own_factions: state.user.ownFactions,
    selected_faction: state.gui.selectedFaction,
    own_name: state.user.name,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    fetch_factions() {
      dispatch(fetchFactions());
    },
    fetch_own_factions_dispatch(id) {
      dispatch(fetchOwnFactions(id));
    },
    fetchBanList(id) {
      dispatch(fetchFactionBannedMembers(id));
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
    fetch_ban_list() {
      propsFromDispatch.fetchBanList(propsFromState.selected_faction);
    },
    fetch_factions: propsFromDispatch.fetch_factions,
    own_factions: propsFromState.own_factions,
    own_name: propsFromState.own_name,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(FactionModal);
