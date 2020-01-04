/*
 * Change Password Form
 * @flow
 */

import React from 'react';
import { validatePassword, parseAPIresponse } from '../utils/validation';

function validate(mailreg, password, new_password, confirm_password) {
  const errors = [];

  if (mailreg) {
    const oldpasserror = validatePassword(password);
    if (oldpasserror) errors.push(oldpasserror);
  }
  if (new_password != confirm_password) {
    errors.push('Passwords do not match.');
    return errors;
  }
  const passerror = validatePassword(new_password);
  if (passerror) errors.push(passerror);

  return errors;
}

async function submit_passwordchange(new_password, password) {
  const body = JSON.stringify({
    password,
    new_password,
  });
  const response = await fetch('./api/auth/change_passwd', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}


class ChangePassword extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      new_password: '',
      confirm_password: '',
      success: false,
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const {
      password, new_password, confirm_password, submitting,
    } = this.state;
    if (submitting) return;

    const errors = validate(this.props.mailreg, password, new_password, confirm_password);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submit_passwordchange(new_password, password);
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
          <p className="modalmessage">Changed Password successfully.</p>
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
          {(this.props.mailreg)
          && (
          <input
            value={this.state.password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder="Old Password"
          />
          )}
          <br />
          <input
            value={this.state.new_password}
            onChange={(evt) => this.setState({ new_password: evt.target.value })}
            type="password"
            placeholder="New Password"
          />
          <br />
          <input
            value={this.state.confirm_password}
            onChange={(evt) => this.setState({ confirm_password: evt.target.value })}
            type="password"
            placeholder="Confirm New Password"
          />
          <br />
          <button type="submit">{(this.state.submitting) ? '...' : 'Save'}</button>
          <button type="button" onClick={this.props.cancel}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default ChangePassword;
