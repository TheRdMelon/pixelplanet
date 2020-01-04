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

async function submit_namechange(name) {
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

    const { errors: resperrors } = await submit_namechange(name);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        submitting: false,
      });
      return;
    }
    this.props.set_name(name);
    this.props.done();
  }

  render() {
    const { errors } = this.state;
    return (
      <div className="inarea">
        <form onSubmit={this.handleSubmit}>
          {errors.map((error) => (
            <p key={error} className="errormessage">Error: {error}</p>
          ))}
          <input
            value={this.state.name}
            onChange={(evt) => this.setState({ name: evt.target.value })}
            type="text"
            placeholder="New Username"
          />
          <br />
          <button type="submit">{(this.state.submitting) ? '...' : 'Save'}</button>
          <button type="button" onClick={this.props.done}>Cancel</button>
        </form>
      </div>
    );
  }
}

export default ChangeName;
