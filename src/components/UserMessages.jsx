/*
 * Messages on top of UserArea
 * @flow
 */
import React from 'react';
import { connect } from 'react-redux';

import { parseAPIresponse } from '../utils/validation';
import { setMinecraftName, remFromMessages } from '../actions';


class UserMessages extends React.Component {
  constructor() {
    super();
    this.state = {
      resentVerify: false,
      sentLink: false,
      verifyAnswer: null,
      linkAnswer: null,
    };

    this.submitResendVerify = this.submitResendVerify.bind(this);
    this.submitMcLink = this.submitMcLink.bind(this);
  }

  async submitResendVerify() {
    const { resentVerify } = this.state;
    if (resentVerify) return;
    this.setState({
      resentVerify: true,
    });

    const response = await fetch('./api/auth/resend_verify', {
      credentials: 'include',
    });

    const { errors } = await parseAPIresponse(response);
    const verifyAnswer = (errors)
      ? errors[0]
      : 'A new verification mail is getting sent to you.';
    this.setState({
      verifyAnswer,
    });
  }

  async submitMcLink(accepted) {
    const { sentLink } = this.state;
    if (sentLink) return;
    this.setState({
      sentLink: true,
    });
    const body = JSON.stringify({ accepted });
    const rep = await fetch('./api/auth/mclink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
    });

    const { errors } = parseAPIresponse(rep);
    if (errors) {
      this.setState({
        linkAnswer: errors[0],
      });
      return;
    }
    const { setMCName, remFromUserMessages } = this.props;
    if (!accepted) {
      setMCName(null);
    }
    remFromUserMessages('not_mc_verified');
    this.setState({
      linkAnswer: (accepted)
        ? 'You successfully linked your mc account.'
        : 'You denied.',
    });
  }

  render() {
    const { messages: messagesr } = this.props;
    if (!messagesr) return null;
    // state variable is not allowed to be changed, make copy
    const messages = [...messagesr];
    const { verifyAnswer, linkAnswer } = this.state;
    const { minecraftname } = this.props;

    return (
      <div style={{ paddingLeft: '5%', paddingRight: '5%' }}>
        {(messages.includes('not_verified')
          && messages.splice(messages.indexOf('not_verified'), 1))
          ? (
            <p className="usermessages">
              Please verify your mail address&nbsp;
              or your account could get deleted after a few days.&nbsp;
              {(verifyAnswer)
                ? (
                  <span
                    className="modallink"
                  >
                    {verifyAnswer}
                  </span>
                )
                : (
                  <span
                    role="button"
                    tabIndex={-1}
                    className="modallink"
                    onClick={this.submitResendVerify}
                  >
                    Click here to request a new verification mail.
                  </span>
                )}
            </p>
          ) : null}
        {(messages.includes('not_mc_verified')
          && messages.splice(messages.indexOf('not_mc_verified'), 1))
          ? (
            <p className="usermessages">
              You requested to link your mc account {minecraftname}.
              &nbsp;
              {(linkAnswer)
                ? (
                  <span
                    className="modallink"
                  >
                    {linkAnswer}
                  </span>
                )
                : (
                  <span>
                    <span
                      role="button"
                      tabIndex={-1}
                      className="modallink"
                      onClick={() => {
                        this.submitMcLink(true);
                      }}
                    >
                      Accept
                    </span>&nbsp;or&nbsp;
                    <span
                      role="button"
                      tabIndex={-1}
                      className="modallink"
                      onClick={() => {
                        this.submitMcLink(false);
                      }}
                    >
                      Deny
                    </span>.
                  </span>
                )}
            </p>
          ) : null}
        {messages.map((message) => (
          <p className="usermessages" key={message}>{message}</p>
        ))}
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    setMCName(minecraftname) {
      dispatch(setMinecraftName(minecraftname));
    },
    remFromUserMessages(message) {
      dispatch(remFromMessages(message));
    },
  };
}

function mapStateToProps(state: State) {
  const { messages, minecraftname } = state.user;
  return { messages, minecraftname };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserMessages);
