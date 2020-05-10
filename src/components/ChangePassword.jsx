/*
 * Change Password Form
 * @flow
 */

import React from 'react';
import { validatePassword, parseAPIresponse } from '../utils/validation';

function validate(mailreg, password, newPassword, confirmPassword) {
  const errors = [];

  if (mailreg) {
    const oldpasserror = validatePassword(password);
    if (oldpasserror) errors.push(oldpasserror);
  }
  if (newPassword !== confirmPassword) {
    errors.push('Passwords do not match.');
    return errors;
  }
  const passerror = validatePassword(newPassword);
  if (passerror) errors.push(passerror);

  return errors;
}

async function submitPasswordChange(newPassword, password) {
  const body = JSON.stringify({
    password,
    newPassword,
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
      newPassword: '',
      confirmPassword: '',
      success: false,
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const {
      password, newPassword, confirmPassword, submitting,
    } = this.state;
    if (submitting) return;

    const { mailreg } = this.props;
    const errors = validate(
      mailreg,
      password,
      newPassword,
      confirmPassword,
    );

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submitPasswordChange(
      newPassword,
      password,
    );
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
    const { success } = this.state;
    if (success) {
      const { done } = this.props;
      return (
        <div className="inarea">
          <p className="modalmessage">Changed Password successfully.</p>
          <button type="button" onClick={done}>Close</button>
        </div>
      );
    }
    const {
      errors,
      password,
      newPassword,
      confirmPassword,
      submitting,
    } = this.state;
    const { cancel, mailreg } = this.props;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          {(mailreg)
          && (
          <input
            value={password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder="Old Password"
          />
          )}
          <br />
          <input
            value={newPassword}
            onChange={(evt) => this.setState({ newPassword: evt.target.value })}
            type="password"
            placeholder="New Password"
          />
          <br />
          <input
            value={confirmPassword}
            onChange={(evt) => this.setState({
              confirmPassword: evt.target.value,
            })}
            type="password"
            placeholder="Confirm New Password"
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : 'Save'}
          </button>
          <button type="button" onClick={cancel}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default ChangePassword;
