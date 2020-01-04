/*
 * SignUp Form to register new user by mail
 * @flow
 */

import React from 'react';
import {
  validateEMail, validateName, validatePassword, parseAPIresponse,
} from '../utils/validation';

function validate(name, email, password, confirm_password) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  if (password !== confirm_password) {
    errors.push('Passwords do not match');
  }
  return errors;
}


async function submit_registration(name, email, password, component) {
  const body = JSON.stringify({
    name,
    email,
    password,
  });
  const response = await fetch('./api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

const inputStyles = {
  display: 'block',
  width: '100%',
};

class SignUpForm extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const {
      name, email, password, confirm_password, submitting,
    } = this.state;
    if (submitting) return;

    const errors = validate(name, email, password, confirm_password);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors, me } = await submit_registration(name, email, password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.props.me(me);
    this.props.userarea();
  }

  render() {
    const { errors } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error} className="errormessage">Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={this.state.name}
          onChange={(evt) => this.setState({ name: evt.target.value })}
          type="text"
          placeholder="Name"
        />
        <input
          style={inputStyles}
          value={this.state.email}
          onChange={(evt) => this.setState({ email: evt.target.value })}
          type="text"
          placeholder="Email"
        />
        <input
          style={inputStyles}
          value={this.state.password}
          onChange={(evt) => this.setState({ password: evt.target.value })}
          type="password"
          placeholder="Password"
        />
        <input
          style={inputStyles}
          value={this.state.confirm_password}
          onChange={(evt) => this.setState({ confirm_password: evt.target.value })}
          type="password"
          placeholder="Confirm Password"
        />

        <button type="submit">{(this.state.submitting) ? '...' : 'Submit'}</button>
      </form>
    );
  }
}

export default SignUpForm;
