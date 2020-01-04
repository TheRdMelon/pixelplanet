/*
 * Change Mail Form
 * @flow
 */

import React from 'react';
import {
  validateName, validateEMail, validatePassword, parseAPIresponse,
} from '../utils/validation';

function validate(email, password) {
  const errors = [];

  const passerror = validatePassword(password);
  if (passerror) errors.push(passerror);
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);

  return errors;
}

async function submit_mailchange(email, password) {
  const body = JSON.stringify({
    email,
    password,
  });
  const response = await fetch('./api/auth/change_mail', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

class ChangeMail extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      email: '',
      submitting: false,
      success: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { email, password, submitting } = this.state;
    if (submitting) return;

    const errors = validate(email, password);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submit_mailchange(email, password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.setState({
      success: true,
    });
  }

  render() {
    if (this.state.success) {
      return (
        <div className="inarea">
          <p className="modalmessage">Changed Mail successfully. We sent you a verification mail, please verify your new mail adress.</p>
          <button type="button" onClick={this.props.done}>Close</button>
        </div>
      );
    }
    const { errors } = this.state;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          <input
            value={this.state.password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder="Password"
          />
          <br />
          <input
            value={this.state.email}
            onChange={(evt) => this.setState({ email: evt.target.value })}
            type="text"
            placeholder="New Mail"
          />
          <br />
          <button type="submit">{(this.state.submitting) ? '...' : 'Save'}</button>
          <button type="button" onClick={this.props.done}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default ChangeMail;
