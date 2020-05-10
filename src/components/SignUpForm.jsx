/*
 * SignUp Form to register new user by mail
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import {
  validateEMail, validateName, validatePassword, parseAPIresponse,
} from '../utils/validation';

import { showUserAreaModal, receiveMe } from '../actions';


function validate(name, email, password, confirmPassword) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  if (password !== confirmPassword) {
    errors.push('Passwords do not match');
  }
  return errors;
}


async function submitRegistration(name, email, password) {
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
  display: 'inline-block',
  width: '100%',
  maxWidth: '35em',
};

class SignUpForm extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const {
      name, email, password, confirmPassword, submitting,
    } = this.state;
    if (submitting) return;

    const errors = validate(name, email, password, confirmPassword);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors, me } = await submitRegistration(
      name,
      email,
      password,
    );
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const { doMe, userarea } = this.props;
    doMe(me);
    userarea();
  }

  render() {
    const {
      errors,
      name,
      email,
      password,
      confirmPassword,
      submitting,
    } = this.state;
    const {
      back,
    } = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error} className="errormessage">Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={name}
          onChange={(evt) => this.setState({ name: evt.target.value })}
          type="text"
          placeholder="Name"
        /><br />
        <input
          style={inputStyles}
          value={email}
          onChange={(evt) => this.setState({ email: evt.target.value })}
          type="text"
          placeholder="Email"
        /><br />
        <input
          style={inputStyles}
          value={password}
          onChange={(evt) => this.setState({ password: evt.target.value })}
          type="password"
          placeholder="Password"
        /><br />
        <input
          style={inputStyles}
          value={confirmPassword}
          onChange={(evt) => this.setState({
            confirmPassword: evt.target.value,
          })}
          type="password"
          placeholder="Confirm Password"
        /><br />
        <button type="submit">
          {(submitting) ? '...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={back}
        >
          Cancel
        </button>
      </form>
    );
  }
}


function mapDispatchToProps(dispatch) {
  return {
    doMe(me) {
      dispatch(receiveMe(me));
    },
    userarea() {
      dispatch(showUserAreaModal());
    },
  };
}

export default connect(null, mapDispatchToProps)(SignUpForm);
