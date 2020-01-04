/*
 * Form for requesting password-reset mail
 * @flow
 */
import React from 'react';
import { validateEMail, parseAPIresponse } from '../utils/validation';

function validate(email) {
  const errors = [];
  const mailerror = validateEMail(email);
  if (mailerror) errors.push(mailerror);
  return errors;
}

async function submit_newpass(email, component) {
  const body = JSON.stringify({
    email,
  });
  const response = await fetch('./api/auth/restore_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  return parseAPIresponse(response);
}

const inputStyles = {
  display: 'block',
  width: '100%',
};

class NewPasswordForm extends React.Component {
  constructor() {
    super();
    this.state = {
      email: '',
      submitting: false,
      success: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { email, submitting } = this.state;
    if (submitting) return;

    const errors = validate(email);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ submitting: true });
    const { errors: resperrors } = await submit_newpass(email);
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
    const { errors } = this.state;
    if (this.state.success) {
      return (
        <div>
          <p className="modalmessage">Sent you a mail with instructions to reset your password.</p>
          <button type="button" onClick={this.props.back}>Back</button>
        </div>
      );
    }
    return (
      <form onSubmit={this.handleSubmit}>
        {errors.map((error) => (
          <p key={error}>Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={this.state.email}
          onChange={(evt) => this.setState({ email: evt.target.value })}
          type="text"
          placeholder="Email"
        />

        <button type="submit">{(this.state.submitting) ? '...' : 'Submit'}</button>
        <button type="button" onClick={this.props.back}>Cancel</button>
      </form>
    );
  }
}

export default NewPasswordForm;
