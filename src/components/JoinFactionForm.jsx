/**
 *
 * @flow
 */

import React from 'react';
import { validateFactionPassword, parseAPIresponse } from '../utils/validation';

function validate(password) {
  const errors = [];
  const passworderror = validateFactionPassword(password);
  if (passworderror) errors.push(passworderror);

  return errors;
}

async function join_faction(password) {
  const body = JSON.stringify({
    password
  });
  const response = await fetch('./api/faction/join', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return parseAPIresponse(response);
}

const inputStyles = {
  display: 'block',
  width: '100%'
};

class JoinFactionForm extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      joining: false,

      errors: []
    };

    this.handleJoin = this.handleJoin.bind(this);
  }

  async handleJoin(e) {
    e.preventDefault();

    const { password, joining } = this.state;
    if (joining) return;

    const errors = validate(password);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ joining: true });
    const { errors: resperrors, factionInfo } = await join_faction(password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        joining: null
      });
      return;
    }
    this.props.joined_faction(factionInfo);
  }

  render() {
    const { errors } = this.state;
    return (
      <form onSubmit={this.handleJoin}>
        {errors.map(error => (
          <p key={error}>Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={this.state.password}
          onChange={e => this.setState({ password: e.target.value })}
          type="text"
          placeholder="Join Password"
        />

        <button type="submit">{this.state.joining ? '...' : 'Join'}</button>
      </form>
    );
  }
}

export default JoinFactionForm;
