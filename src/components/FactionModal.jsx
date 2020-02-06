/**
 *
 * @flow
 */

import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import { FaCrown } from 'react-icons/fa';

import ReactTooltip from 'react-tooltip';

import Tabs from './Tabs';
import JoinFactionForm from './JoinFactionForm';
import PublicFactions from './PublicFactions';

import Modal from './Modal';
import CreateFactionForm from './CreateFactionForm';
import {
  fetchFactions,
  recieveFactionInfo,
  fetchOwnFactions,
  toggleFactionInvite,
  setFactionInvite,
  showConfirmationModal,
  closeConfirmationModal,
} from '../actions';

import type { State } from '../reducers';
import { parseAPIresponse } from '../utils/validation';
import useFactionSelect from '../reacthooks/useFactionSelect';
import MdToggleButtonHover from './MdToggleButtonHover';

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

const copyInputStyle: React.CSSStyleDeclaration = {
  textAlign: 'center',
  width: '100%',
  marginTop: '5px',
};

async function leaveFaction(id) {
  const response = await fetch(`./api/factions/${id}/leave`, {
    credentials: 'include',
    method: 'PATCH',
  });

  return parseAPIresponse(response);
}

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

const FactionInfo = ({ confirm_leave: confirmLeave }) => {
  const { Selector, selectedFactionInfo } = useFactionSelect();

  const inviteTooltipRef = useRef(null);
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [leaveErrors, setLeaveErrors] = useState<string[]>([]);

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

  const onLeave = () => {
    const callback = async () => {
      const response = await leaveFaction(selectedFactionInfo.id);
      if (!response.success) {
        setLeaveErrors(response.errors);
      }
    };

    confirmLeave(callback);
  };

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
            <span style={factionNameStyle}>{selectedFactionInfo.leader}</span>
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
          <input
            style={copyInputStyle}
            value={`https://pixelplanet.fun/invite/${selectedFactionInfo.id}`}
            onFocus={onInviteFocus}
            onBlur={onInviteBlur}
            onMouseEnter={onInviteMouseEnter}
            data-tip
            data-for="publicInvCopiedTooltip"
            readOnly
            ref={inviteTooltipRef}
          />
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
          <th style={{ maxWidth: 0 }}>Admin</th>
          <th style={{ textAlign: 'left' }}>Name</th>
        </tr>
        {selectedFactionInfo.Users
          ? selectedFactionInfo.Users.map((user) => (
            <>
              <tr>
                <td>
                  {user === selectedFactionInfo.leader ? <FaCrown /> : null}
                </td>
                <td style={{ textAlign: 'left' }}>{user}</td>
              </tr>
            </>
          ))
          : null}
      </table>

      <button className="red-btn faction-leave" type="button" onClick={onLeave}>
        Leave
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

const newTemplateLabelsStyles: React.CSSStyleDeclaration = {
  paddingRight: '10px',
  fontWeight: 'bold',
  display: 'inline-block',
  width: '140px',
  textAlign: 'right',
};

const Admin = ({
  selected_faction: selectedFaction,
  enable_faction_invite: dispatchEnableFactionInvite,
  set_faction_invite: dispatchSetFactionInvite,
}) => {
  const formRef = useRef(null);
  const passwordTooltipRef = useRef(null);
  const inviteTooltipRef = useRef(null);
  const [password, setPassword] = useState<string>('');
  const [showCopied, setShowCopied] = useState<boolean>(false);
  const [showInvCopied, setShowInvCopied] = useState<boolean>(false);

  const { Selector, selectedFactionInfo } = useFactionSelect();

  useEffect(() => {
    if (passwordTooltipRef.current) {
      passwordTooltipRef.current.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        passwordTooltipRef.current.focus();
      };
    }
  }, [passwordTooltipRef.current]);

  useEffect(() => {
    if (inviteTooltipRef.current) {
      inviteTooltipRef.current.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        inviteTooltipRef.current.focus();
      };
    }
  }, [inviteTooltipRef.current]);

  const onPasswordFocus = (e) => {
    e.preventDefault();
    if (e.target.value) {
      e.target.select();
      document.execCommand('copy');
      setShowCopied(true);
      ReactTooltip.show(passwordTooltipRef.current);
    }
  };

  const onInviteFocus = (e) => {
    e.preventDefault();
    if (e.target.value) {
      e.target.select();
      document.execCommand('copy');
      setShowInvCopied(true);
      ReactTooltip.show(inviteTooltipRef.current);
    }
  };

  const onPasswordMouseEnter = () => {
    setShowCopied(false);
  };

  const onInviteMouseEnter = () => {
    setShowInvCopied(false);
  };

  const onPasswordBlur = () => {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
    ReactTooltip.hide(passwordTooltipRef.current);
  };

  const onInviteBlur = () => {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    } else if (document.selection) {
      document.selection.empty();
    }
    ReactTooltip.hide(inviteTooltipRef.current);
  };

  const onGeneratePassword = async () => {
    const body = JSON.stringify({
      selectedFaction,
    });
    const response = await fetch('./api/factions/generatepassword', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setPassword((await parseAPIresponse(response)).password);
  };

  const onGenerateInvite = async () => {
    const body = JSON.stringify({
      selectedFaction,
    });
    const response = await fetch('./api/factions/generateinvite', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    dispatchSetFactionInvite(
      selectedFaction,
      (await parseAPIresponse(response)).invite,
    );
  };

  return (
    <>
      <Selector />

      <h2>Create A New Template</h2>
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
        style={{ textAlign: 'left', margin: 'auto', width: 'max-content' }}
      >
        <label htmlFor="imagefile">
          <div style={newTemplateLabelsStyles}>Template Image: </div>
          <input
            id="imagefile"
            type="file"
            name="image"
            accept="image/*"
            style={{ width: '238px' }}
          />
        </label>
        <div />
        <br />
        <div>
          <div style={newTemplateLabelsStyles}>Canvas: </div>
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
        </div>
        <br />
        <label htmlFor="x-input">
          <div style={newTemplateLabelsStyles}>Top Left X: </div>
          <input type="number" name="x" id="x-input" min={-32768} max={32768} />
        </label>
        <br />
        <label htmlFor="y-input">
          <div style={newTemplateLabelsStyles}>Top Left Y: </div>
          <input type="number" name="y" id="y-input" min={-32768} max={32768} />
        </label>
        <br />
        <button
          type="submit"
          name="upload"
          style={{ margin: '5px auto auto auto', display: 'block' }}
        >
          Create
        </button>
      </form>
      {selectedFactionInfo.private && (
        <>
          <div className="hr" style={{ margin: '10px 5px' }} />
          <h2 style={{ margin: '12px 0' }}>Private Faction Password</h2>
          <button type="button" onClick={onGeneratePassword}>
            Generate New
          </button>
          <input
            style={copyInputStyle}
            value={password}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            onMouseEnter={onPasswordMouseEnter}
            placeholder="Click generate for a single-use password (no expiry)"
            data-tip
            data-for="copiedTooltip"
            readOnly
            ref={passwordTooltipRef}
          />
          <div className={`tooltip ${showCopied ? 'show' : ''}`}>
            <ReactTooltip
              id="copiedTooltip"
              place="bottom"
              effect="solid"
              type="dark"
            >
              Copied to Clipboard!
            </ReactTooltip>
          </div>

          <div className="hr" style={{ margin: '10px 5px' }} />

          <h2 style={{ margin: '12px 0' }}>Private Faction Invite</h2>
          <p style={{ display: 'inline-block', margin: '0 10px' }}>Enable</p>
          <div style={{ display: 'inline-block', margin: '0 10px' }}>
            <MdToggleButtonHover
              value={selectedFactionInfo.invite !== null}
              onToggle={() => dispatchEnableFactionInvite(selectedFactionInfo.id)}
            />
          </div>

          <button
            type="button"
            onClick={onGenerateInvite}
            style={{ display: 'block', margin: '20px auto 0' }}
          >
            Replace
          </button>
          <input
            style={copyInputStyle}
            value={
              selectedFactionInfo.invite
                ? `https://pixelplanet.fun/invite/${selectedFactionInfo.invite}`
                : ''
            }
            onFocus={onInviteFocus}
            onBlur={onInviteBlur}
            onMouseEnter={onInviteMouseEnter}
            placeholder="Click replace to generate the invite"
            data-tip
            data-for="copiedInvTooltip"
            readOnly
            ref={inviteTooltipRef}
          />
          <div className={`tooltip ${showInvCopied ? 'show' : ''}`}>
            <ReactTooltip
              id="copiedInvTooltip"
              place="bottom"
              effect="solid"
              type="dark"
            >
              Copied to Clipboard!
            </ReactTooltip>
          </div>
        </>
      )}
    </>
  );
};

const FactionModal = ({
  recieve_faction_info: recieveFactionInfoDisp,
  fetch_factions: fetchFactionsDisp,
  fetch_own_factions: fetchOwnFactionsDisp,
  own_factions: ownFactions,
  selected_faction: selectedFaction,
  enable_faction_invite: dispatchEnableFactionInvite,
  set_faction_invite: dispatchSetFactionInvite,
  confirm_leave: confirmLeave,
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
              <FactionInfo confirm_leave={confirmLeave} />
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
              <Admin
                selected_faction={selectedFaction}
                enable_faction_invite={dispatchEnableFactionInvite}
                set_faction_invite={dispatchSetFactionInvite}
              />
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
    enable_faction_invite(id) {
      dispatch(toggleFactionInvite(id));
    },
    set_faction_invite(id, invite) {
      dispatch(setFactionInvite(id, invite));
    },
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
    enable_faction_invite: propsFromDispatch.enable_faction_invite,
    set_faction_invite: propsFromDispatch.set_faction_invite,
    confirm_leave: propsFromDispatch.confirm_leave,
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(FactionModal);
