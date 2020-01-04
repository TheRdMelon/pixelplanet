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
      resent_verify: false,
      sent_link: false,
      verify_answer: null,
      link_answer: null,
    };

    this.submit_resend_verify = this.submit_resend_verify.bind(this);
    this.submit_mc_link = this.submit_mc_link.bind(this);
  }

  async submit_resend_verify() {
    if (this.state.resent_verify) return;
    this.setState({
      resent_verify: true,
    });

    const response = await fetch('./api/auth/resend_verify', {
      credentials: 'include',
    });

    const { errors } = await parseAPIresponse(response);
    const verify_answer = (errors) ? errors[0] : 'A new verification mail is getting sent to you.';
    this.setState({
      verify_answer,
    });
  }

  async submit_mc_link(accepted) {
    if (this.state.sent_link) return;
    this.setState({
      sent_link: true,
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
        link_answer: errors[0],
      });
      return;
    }
    if (!accepted) {
      this.props.setMCName(null);
    }
    this.props.rem_from_messages('not_mc_verified');
    this.setState({
      link_answer: (accepted) ? 'You successfully linked your mc account.' : 'You denied.',
    });
  }

  render() {
    if (!this.props.messages) return null;
    // state variable is not allowed to be changed, make copy
    const messages = [...this.props.messages];

    return (
      <div>
        {(messages.includes('not_verified') && messages.splice(messages.indexOf('not_verified'), 1))
          ? (
            <p className="usermessages">
            Please verify your mail address or your account could get deleted after a few days.
              {(this.state.verify_answer)
                ? <span className="modallink">{this.state.verify_answer}</span>
                : <span className="modallink" onClick={this.submit_resend_verify}>Click here to request a new verification mail.</span>}
            </p>
          ) : null}
        {(messages.includes('not_mc_verified') && messages.splice(messages.indexOf('not_mc_verified'), 1))
          ? (
            <p className="usermessages">You requested to link your mc account {this.props.minecraftname}.
              {(this.state.link_answer)
                ? <span className="modallink">{this.state.link_answer}</span>
                : (
                  <span>
                    <span className="modallink" onClick={() => { this.submit_mc_link(true); }}>Accept</span> or <span className="modallink" onClick={() => { this.submit_mc_link(false); }}>Deny</span>.
                  </span>
                )}
            </p>
          ) : null}
        {messages.map((message) => (
          <p className="usermessages" key={message} className="message">{message}</p>
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
    rem_from_messages(message) {
      dispatch(remFromMessages(message));
    },
  };
}

function mapStateToProps(state: State) {
  const { messages, minecraftname } = state.user;
  return { messages, minecraftname };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserMessages);
