/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import {
  handleFactionMemberUnbanned,
  showConfirmationModal,
  closeConfirmationModal,
} from '../actions';
import { parseAPIresponse } from '../utils/validation';

async function doUnban(factionId, userId) {
  const body = JSON.stringify({ userId });
  const response = await fetch(`./api/factions/${factionId}/bans`, {
    method: 'DELETE',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

const BanList: React.FC = ({
  ban_list: banList,
  selected_faction_id: selectedFactionId,
  handle_member_unban: handleMemberUnbanned,
  confirm_unban: confirmUnban,
  close_confirmation: closeConfirmation,
}) => {
  const onUnban = async (userId, userName) => {
    const callback = async () => {
      const response = await doUnban(selectedFactionId, userId);
      closeConfirmation();
      if (!response.success) {
        // handle error message
      } else {
        handleMemberUnbanned(userId);
      }
    };

    confirmUnban(callback, userName);
  };

  return (
    <>
      <h2>Banned Members</h2>
      {banList.length > 0 ? (
        <div>
          <table>
            <tr>
              <th>User</th>
              <th> </th>
            </tr>
            {banList.map((banned) => (
              <React.Fragment key={`unban-${banned.name}-${banned.id}`}>
                <tr>
                  <td>{banned.name}</td>
                  <td>
                    <button
                      type="button"
                      className="buttonlink"
                      onClick={() => onUnban(banned.id, banned.name)}
                    >
                      Unban
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </table>
        </div>
      ) : (
        <h4>No banned members</h4>
      )}
    </>
  );
};

function mapStateToProps(state: State) {
  return {
    selectedFactionId: state.gui.selectedFaction,
    banList: state.user.bannedFactionMembers,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleMemberUnbanned(factionId, userId) {
      dispatch(handleFactionMemberUnbanned(factionId, userId));
    },
    confirmUnban(confirmCB, name) {
      dispatch(
        showConfirmationModal(
          `Are you sure you want to unban ${name}?`,
          `Unban ${name}`,
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    closeConfirmation() {
      dispatch(closeConfirmationModal());
    },
  };
}

function mergeProps(propsFromState, propsFromDispatch) {
  const {
    handleMemberUnbanned,
    confirmUnban,
    closeConfirmation,
  } = propsFromDispatch;
  const { selectedFactionId, banList } = propsFromState;
  return {
    ban_list: banList.has(selectedFactionId)
      ? banList.get(selectedFactionId)
      : [],
    selected_faction_id: selectedFactionId,
    handle_member_unban(userId) {
      handleMemberUnbanned(selectedFactionId, userId);
    },
    confirm_unban: confirmUnban,
    close_confirmation: closeConfirmation,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(BanList);
