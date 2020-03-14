/**
 *
 * @flow
 */

import React, { useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import { FaCrown } from 'react-icons/fa';

import type { State } from '../reducers';

import useFactionSelect from '../reacthooks/useFactionSelect';
import {
  showConfirmationModal,
  closeConfirmationModal,
  deleteLocalFaction,
  setUserFactionRank,
  removeUserFromFaction,
} from '../actions';
import { parseAPIresponse } from '../utils/validation';

const squareParentStyle: React.CSSStyleDeclaration = {
  width: '40%',
  flexBasis: '40%',
  flexShrink: 0,
  flexGrow: 1,
  position: 'relative',
};

const squareStretcherStyle: React.CSSStyleDeclaration = {
  paddingBottom: '100%',
};

const squareChildStyle: React.CSSStyleDeclaration = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const factionNameStyle: React.CSSStyleDeclaration = {
  wordBreak: 'break-word',
  display: 'block',
  paddingTop: '10px',
  paddingLeft: '0',
};
async function leaveFaction(id) {
  const response = await fetch(`./api/factions/${id}/leave`, {
    credentials: 'include',
    method: 'PATCH',
  });

  return parseAPIresponse(response);
}

async function deleteFaction(id) {
  const response = await fetch(`./api/factions/${id}`, {
    credentials: 'include',
    method: 'DELETE',
  });

  return parseAPIresponse(response);
}

async function kickMember(memberId, factionId) {
  const body = JSON.stringify({
    userId: memberId,
  });
  const response = await fetch(`./api/factions/${factionId}/kick`, {
    body,
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

async function banMember(memberId, factionId) {
  const body = JSON.stringify({
    userId: memberId,
  });
  const response = await fetch(`./api/factions/${factionId}/bans`, {
    body,
    credentials: 'include',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

async function promoteMember(memberId, factionId) {
  const body = JSON.stringify({
    userId: memberId,
  });
  const response = await fetch(`./api/factions/${factionId}/promote`, {
    body,
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

async function demoteMember(memberId, factionId) {
  const body = JSON.stringify({
    userId: memberId,
  });
  const response = await fetch(`./api/factions/${factionId}/demote`, {
    body,
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

const FactionInfo = ({
  confirm_leave: confirmLeave,
  confirm_delete: confirmDelete,
  confirm_kick: confirmKick,
  confirm_ban: confirmBan,
  delete_faction: dispatchDeleteFaction,
  close_confirmation: closeConfirmation,
  reset_tabs: resetTabs,
  own_factions: ownFactions,
  own_id: ownId,
  user_left_faction: leftFaction,
  confirm_promotion: confirmPromotion,
  confirm_demotion: confirmDemotion,
  user_rank_change: userRankChange,
}) => {
  const { Selector, selectedFactionInfo } = useFactionSelect();
  const self = selectedFactionInfo.Users.find((u) => u.id === ownId);

  const inviteTooltipRef = useRef(null);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [leaveErrors, setLeaveErrors] = useState<string[]>([]);

  useEffect(() => {
    if (leaveErrors.length > 0) {
      setLeaveErrors([]);
    }
  }, [selectedFactionInfo]);

  useEffect(() => {
    if (inviteTooltipRef.current) {
      inviteTooltipRef.current.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        inviteTooltipRef.current.focus();
      };
    }
  }, [inviteTooltipRef.current]);

  const onInviteFocus = (e) => {
    e.preventDefault();
    if (e.target.value) {
      e.target.select();
      document.execCommand('copy');
      setShowCopied(true);
      ReactTooltip.show(inviteTooltipRef.current);
    }
  };

  const onInviteMouseEnter = () => {
    setShowCopied(false);
  };

  const onInviteBlur = () => {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
    ReactTooltip.hide(inviteTooltipRef.current);
  };

  const doResetTabs = () => {
    if (ownFactions.length < 1) {
      resetTabs();
    }
  };

  const onLeave = () => {
    const callback = async () => {
      const response = await leaveFaction(selectedFactionInfo.id);
      closeConfirmation();
      if (response.success) {
        dispatchDeleteFaction(
          selectedFactionInfo.id,
          !selectedFactionInfo.private,
        );
      } else {
        setLeaveErrors(response.errors);
      }
      doResetTabs();
    };

    confirmLeave(callback);
  };

  const onDelete = () => {
    const callback = async () => {
      const response = await deleteFaction(selectedFactionInfo.id);
      closeConfirmation();
      if (response.success) {
        dispatchDeleteFaction(selectedFactionInfo.id);
      } else {
        setLeaveErrors(response.errors);
      }
      doResetTabs();
    };

    confirmDelete(callback, selectedFactionInfo.name);
  };

  const onKick = async (memberId, memberName) => {
    const thisFaction = selectedFactionInfo.id;
    const doKick = async () => {
      const response = await kickMember(memberId, thisFaction);
      closeConfirmation();
      if (response.success) {
        leftFaction(memberId, thisFaction);
      } else {
        // show errors
      }
    };

    confirmKick(doKick, memberName);
  };

  const onBan = async (memberId, memberName) => {
    const thisFaction = selectedFactionInfo.id;
    const doBan = async () => {
      const response = await banMember(memberId, selectedFactionInfo.id);
      closeConfirmation();
      if (response.success) {
        leftFaction(memberId, thisFaction);
      } else {
        // show errors
      }
    };

    confirmBan(doBan, memberName);
  };

  const onPromote = async (memberId, memberName) => {
    const thisFaction = selectedFactionInfo.id;
    const doPromotion = async () => {
      const response = await promoteMember(memberId, selectedFactionInfo.id);
      closeConfirmation();
      if (response.success) {
        userRankChange(memberId, thisFaction, true);
      } else {
        // show errors
      }
    };

    confirmPromotion(doPromotion, memberName);
  };

  const onDemote = async (memberId, memberName) => {
    const thisFaction = selectedFactionInfo.id;
    const doPromotion = async () => {
      const response = await demoteMember(memberId, selectedFactionInfo.id);
      closeConfirmation();
      if (response.success) {
        userRankChange(memberId, thisFaction, false);
      } else {
        // show errors
      }
    };

    confirmDemotion(doPromotion, memberName);
  };

  const canDisplayActions = (user) => self.UserFactions.admin
    && (!user.UserFactions.admin
      || (selectedFactionInfo.leaderId === ownId && ownId !== user.id));

  return (
    <>
      <Selector />
      <div />
      <br />
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
          {selectedFactionInfo.private && (
            <>
              <h4>(Private)</h4>
              <div className="hr" />
            </>
          )}
          <h4>
            Leader:
            <span style={factionNameStyle}>
              {
                selectedFactionInfo.Users.find(
                  (u) => u.id === selectedFactionInfo.leaderId,
                ).name
              }
            </span>
          </h4>
          <div
            className={`hr ${selectedFactionInfo.private ? 'dashed' : ''}`}
          />
          <h4>
            Members:
            <span>
              {selectedFactionInfo.Users
                ? selectedFactionInfo.Users.length
                : null}
            </span>
          </h4>
        </div>
      </div>
      {selectedFactionInfo.private || (
        <>
          <h3 style={{ margin: '12px 0' }}>Invite</h3>
          <div className="copy-input">
            <input
              value={`https://pixelplanet.fun/invite/${selectedFactionInfo.id}`}
              onFocus={onInviteFocus}
              onBlur={onInviteBlur}
              onMouseEnter={onInviteMouseEnter}
              data-tip
              data-for="publicInvCopiedTooltip"
              readOnly
              ref={inviteTooltipRef}
            />
          </div>
          <div className={`tooltip ${showCopied ? 'show' : ''}`}>
            <ReactTooltip
              id="publicInvCopiedTooltip"
              place="bottom"
              effect="solid"
              type="dark"
            >
              Copied to Clipboard!
            </ReactTooltip>
          </div>
        </>
      )}
      <h3 style={{ margin: '12px 0' }}>Member List</h3>
      <table>
        <tr>
          <th style={{ width: '1px', paddingLeft: '5px', paddingRight: '5px' }}>
            Admin
          </th>
          <th style={{ textAlign: 'left' }}>Name</th>
          {self.UserFactions.admin && (
            <th style={{ textAlign: 'right' }}>Actions</th>
          )}
        </tr>
        {selectedFactionInfo.Users
          ? selectedFactionInfo.Users.map((user) => (
            <React.Fragment key={user.id}>
              <tr>
                <td>
                  {user.UserFactions.admin ? (
                    <FaCrown
                      className={
                          user.id === selectedFactionInfo.leaderId
                            ? 'leader'
                            : 'admin'
                        }
                    />
                  ) : null}
                </td>
                <td style={{ textAlign: 'left' }}>{user.name}</td>
                {canDisplayActions(user) ? (
                  <>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ margin: '0 -5px 0 -10px' }}>
                        {selectedFactionInfo.leaderId === ownId && (
                        <button
                          type="button"
                          className="buttonlink"
                          onClick={() => (user.UserFactions.admin
                            ? onDemote(user.id, user.name)
                            : onPromote(user.id, user.name))}
                          style={{ margin: '0 10px' }}
                        >
                          {user.UserFactions.admin ? 'Demote' : 'Promote'}
                        </button>
                        )}
                        <button
                          type="button"
                          className="buttonlink"
                          onClick={() => onKick(user.id, user.name)}
                          style={{ margin: '0 5px' }}
                        >
                            Kick
                        </button>
                        <button
                          type="button"
                          className="buttonlink"
                          onClick={() => onBan(user.id, user.name)}
                          style={{ margin: '0 5px' }}
                        >
                            Ban
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  self.UserFactions.admin && <td />
                )}
              </tr>
            </React.Fragment>
          ))
          : null}
      </table>
      <button
        className="red-btn faction-leave"
        type="button"
        onClick={selectedFactionInfo.leaderId === ownId ? onDelete : onLeave}
      >
        {selectedFactionInfo.leaderId === ownId ? 'Delete' : 'Leave'}
      </button>
      <div className="leave-errors">
        {leaveErrors.map((err) => (
          <React.Fragment key={err.replace(' ', '_')}>
            <p className="error">{err}</p>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

function mapStateToProps(state: State) {
  return {
    own_factions: state.user.ownFactions,
    own_id: state.user.id,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    confirm_leave(confirmCB) {
      dispatch(
        showConfirmationModal(
          'Are you sure you want to leave?',
          'Leave Faction',
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    confirm_delete(confirmCB, factionName) {
      dispatch(
        showConfirmationModal(
          'Are you sure you want to delete this faction?',
          'Delete Faction',
          confirmCB,
          () => dispatch(closeConfirmationModal()),
          factionName,
        ),
      );
    },
    confirm_kick(confirmCB, user) {
      dispatch(
        showConfirmationModal(
          `Are you sure you want to kick ${user}?`,
          `Kick ${user}`,
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    confirm_ban(confirmCB, user) {
      dispatch(
        showConfirmationModal(
          `Are you sure you want to ban ${user}?`,
          `Ban ${user}`,
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    delete_faction(id, onlyOwn) {
      dispatch(deleteLocalFaction(id, onlyOwn));
    },
    close_confirmation() {
      dispatch(closeConfirmationModal());
    },
    user_left_faction(userId, factionId) {
      dispatch(removeUserFromFaction(userId, factionId));
    },
    confirm_promotion(confirmCB, user) {
      dispatch(
        showConfirmationModal(
          `Are you sure you want to promote ${user}?`,
          `Promote ${user}`,
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    confirm_demotion(confirmCB, user) {
      dispatch(
        showConfirmationModal(
          `Are you sure you want to demote ${user}?`,
          `Demote ${user}`,
          confirmCB,
          () => dispatch(closeConfirmationModal()),
        ),
      );
    },
    user_rank_change(userId, factionId, admin) {
      dispatch(setUserFactionRank(userId, factionId, admin));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(FactionInfo);
