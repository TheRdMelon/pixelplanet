/*
 * Change Password Form
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import { validatePassword, parseAPIresponse } from '../utils/validation';
import { resetUserFactions } from '../actions';

function validate(password) {
  const errors = [];

  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

async function submit_delete_account(password) {
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

    const { errors: resperrors } = await submit_delete_account(password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const {
      set_name: setName,
      reset_own_factions: resetOwnFactions,
    } = this.props;
    setName(null);
    resetOwnFactions();
  }

  render() {
    const { errors } = this.state;
    return (
      <div className="inarea" style={{ backgroundColor: '#ff6666' }}>
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">
              Error: {error}
            </p>
          ))}
          <input
            value={this.state.password}
            onChange={(evt) => this.setState({ password: evt.target.value })}
            type="password"
            placeholder="Password"
          />
          <br />
          <button type="submit">
            {this.state.submitting ? '...' : 'Yes, Delete My Account!'}
          </button>
          <button type="button" onClick={this.props.done}>
            Cancel
          </button>
        </form>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    reset_own_factions() {
      dispatch(resetUserFactions());
    },
  };
}

export default connect(mapDispatchToProps)(DeleteAccount);
