/*
 * Change Password Form
 * @flow
 */

import React from 'react';
import { validatePassword, parseAPIresponse } from '../utils/validation';

function validate(password) {
  const errors = [];

  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

async function submitDeleteAccount(password) {
  const body = JSON.stringify({
    password,
  });
  const response = await fetch('./api/auth/delete_account', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

class DeleteAccount extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { password, submitting } = this.state;
    if (submitting) return;

    const errors = validate(password);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submitDeleteAccount(password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const { setName } = this.props;
    setName(null);
  }

  render() {
    const { errors, password, submitting } = this.state;
    const { done } = this.props;
    return (
      <div className="inarea" style={{ backgroundColor: '#ff6666' }}>
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          <input
            value={password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder="Password"
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : 'Yes, Delete My Account!'}
          </button>
          <button type="button" onClick={done}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default DeleteAccount;
