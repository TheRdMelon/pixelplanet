/*
 * Change Name Form
 * @flow
 */

import React from 'react';
import { validateName, parseAPIresponse } from '../utils/validation';


function validate(name) {
  const errors = [];

  const nameerror = validateName(name);
  if (nameerror) errors.push(nameerror);

  return errors;
}

async function submitNamechange(name) {
  const body = JSON.stringify({
    name,
  });
  const response = await fetch('./api/auth/change_name', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body,
    credentials: 'include',
  });

  return parseAPIresponse(response);
}

class ChangeName extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      submitting: false,

      errors: [],
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();

    const { name, submitting } = this.state;
    if (submitting) return;

    const errors = validate(name);

    this.setState({ errors });
    if (errors.length > 0) return;
    this.setState({ submitting: true });

    const { errors: resperrors } = await submitNamechange(name);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    const { setName, done } = this.props;
    setName(name);
    done();
  }

  render() {
    const { errors, name, submitting } = this.state;
    const { done } = this.props;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          <input
            value={name}
            onChange={(evt) => this.setState({ name: evt.target.value })}
            type="text"
            placeholder="New Username"
          />
          <br />
          <button type="submit">
            {(submitting) ? '...' : 'Save'}
          </button>
          <button type="button" onClick={done}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default ChangeName;
