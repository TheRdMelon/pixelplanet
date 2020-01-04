/*
 * LogIn Form
 * @flow
 */
import React from 'react';
import {
  validateEMail, validateName, validatePassword, parseAPIresponse,
} from '../utils/validation';


function validate(nameoremail, password) {
  const errors = [];
  const mailerror = (nameoremail.indexOf('@') !== -1)
    ? validateEMail(nameoremail)
    : validateName(nameoremail);
  if (mailerror) errors.push(mailerror);
  const passworderror = validatePassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

async function submit_login(nameoremail, password, component) {
  const body = JSON.stringify({
    nameoremail,
    password,
  });
  const response = await fetch('./api/auth/local', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return parseAPIresponse(response);
}

const inputStyles = {
  display: 'block',
  width: '100%',
};

class LogInForm extends React.Component {
  constructor() {
    super();
    this.state = {
      nameoremail: '',
      password: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { nameoremail, password, submitting } = this.state;
    if (submitting) return;

    const errors = validate(nameoremail, password);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors, me } = await submit_login(nameoremail, password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.props.me(me);
  }

  render() {
    const { errors } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error}>Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={this.state.nameoremail}
          onChange={(evt) => this.setState({ nameoremail: evt.target.value })}
          type="text"
          placeholder="Name or Email"
        />
        <input
          style={inputStyles}
          value={this.state.password}
          onChange={(evt) => this.setState({ password: evt.target.value })}
          type="password"
          placeholder="Password"
        />

        <button type="submit">{(this.state.submitting) ? '...' : 'LogIn'}</button>
      </form>
    );
  }
}

export default LogInForm;
