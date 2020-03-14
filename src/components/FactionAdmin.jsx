/**
 *
 * @flow
 */

import React, { useRef, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import { MdLock } from 'react-icons/md';
import useFactionSelect from '../reacthooks/useFactionSelect';
import { parseAPIresponse } from '../utils/validation';

import type { State } from '../reducers';

import MdToggleButtonHover from './MdToggleButtonHover';
import { toggleFactionInvite, setFactionInvite } from '../actions';
import BanList from './BanList';

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
  own_id: ownId,
  modal_ref: modalRef,
}) => {
  const formRef = useRef(null);
  const passwordTooltipRef = useRef(null);
  const inviteTooltipRef = useRef(null);
  const banListRef = useRef(null);
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

      <div className="hr" style={{ margin: '10px 5px' }} />

      {/* eslint-disable-next-line no-nested-ternary */}
      {selectedFactionInfo.Users ? (
        selectedFactionInfo.Users.find((u) => u.id === ownId).UserFactions
          .admin ? (
            <>
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
                style={{
                  textAlign: 'left',
                  margin: 'auto',
                  width: 'max-content',
                }}
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
                  <input
                    type="number"
                    name="x"
                    id="x-input"
                    min={-32768}
                    max={32768}
                  />
                </label>
                <br />
                <label htmlFor="y-input">
                  <div style={newTemplateLabelsStyles}>Top Left Y: </div>
                  <input
                    type="number"
                    name="y"
                    id="y-input"
                    min={-32768}
                    max={32768}
                  />
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
                  <div
                    className="copy-input"
                  >
                    <input
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
                  </div>
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
                  <p style={{ display: 'inline-block', margin: '0 10px' }}>
                  Enable
                  </p>
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
                  <div
                    className="copy-input"
                  >
                    <input
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
                  </div>
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
              <div className="hr" style={{ margin: '10px 5px' }} />
              <BanList ref={banListRef} />
            </>
          ) : (
            <MdLock
              style={{
                width: '50%',
                height: 'auto',
                margin: '50px 0',
              }}
            />
          )
      ) : null}
    </>
  );
};

function mapStateToProps(state: State) {
  return {
    selected_faction: state.gui.selectedFaction,
    own_id: state.user.id,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    enable_faction_invite(id) {
      dispatch(toggleFactionInvite(id));
    },
    set_faction_invite(id, invite) {
      dispatch(setFactionInvite(id, invite));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Admin);
