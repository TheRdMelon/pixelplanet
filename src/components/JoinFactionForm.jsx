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

async function joinFaction(password) {
  const body = JSON.stringify({
    password,
  });
  const response = await fetch('./api/factions/join', {
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

class JoinFactionForm extends React.Component {
  constructor() {
    super();
    this.state = {
      password: '',
      joining: false,

      errors: [],
    };

    this.handleJoin = this.handleJoin.bind(this);
  }

  async handleJoin(e) {
    e.preventDefault();

    const { recieve_faction_info: recieveFactionInfoDisp } = this.props;
    const { password, joining } = this.state;

    if (joining) return;

    const errors = validate(password);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ joining: true });
    const { errors: resperrors, factionInfo } = await joinFaction(password);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        joining: false,
      });
      return;
    }
    recieveFactionInfoDisp(factionInfo);
  }

  render() {
    const { password, joining, errors } = this.state;
    return (
      <form onSubmit={this.handleJoin}>
        {errors.map((error) => (
          <p key={error}>Error: {error}</p>
        ))}
        <input
          style={inputStyles}
          value={password}
          onChange={(e) => this.setState({ password: e.target.value })}
          type="text"
          placeholder="Join Password"
        />

        <button type="submit" style={{ marginTop: '12px' }}>
          {joining ? '...' : 'Join'}
        </button>
      </form>
    );
  }
}

export default JoinFactionForm;
