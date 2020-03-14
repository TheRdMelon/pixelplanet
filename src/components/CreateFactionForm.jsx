/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';
import {
  validateFactionName,
  validateFactionIcon,
  parseAPIresponse,
} from '../utils/validation';
import { recieveJoinedFaction } from '../actions';

function validate(name, icon) {
  const errors = [];
  const nameError = validateFactionName(name);
  if (nameError) errors.push(nameError);
  const iconError = validateFactionIcon(icon);
  if (iconError) errors.push(iconError);

  return errors;
}

const getIconBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (img.height > img.width) {
        canvas.height = 64;
        canvas.width = canvas.height * (img.width / img.height);
      } else {
        canvas.width = 64;
        canvas.height = canvas.width * (img.height / img.width);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(
        canvas.toDataURL('image/png').replace('data:image/png;base64,', ''),
      );
    };

    img.src = e.target.result;
  };
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

async function createFaction(name, priv, icon) {
  const body = JSON.stringify({
    name,
    private: priv,
    icon,
  });
  const response = await fetch('./api/factions/create', {
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
  marginBottom: '5px',
};

class CreateFactionForm extends React.Component {
  constructor() {
    super();
    this.state = {
      name: '',
      private: false,
      icon: '',
      creating: false,

      errors: [],
    };

    this.handleCreate = this.handleCreate.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  async handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { errors } = this.state;
    const result = await getIconBase64(e.target.files[0]).catch((e1) => e1);
    if (result instanceof Error) {
      errors.push('Error loading icon file.');
    } else {
      this.setState({ icon: result });
    }
  }

  async handleCreate(e) {
    e.preventDefault();

    const {
      name, private: priv, icon, creating,
    } = this.state;
    if (creating) return;

    const errors = validate(name, icon);

    this.setState({ errors });
    if (errors.length > 0) return;

    this.setState({ creating: true });
    const { errors: resperrors, info } = await createFaction(name, priv, icon);
    if (resperrors) {
      this.setState({
        errors: resperrors,
        creating: false,
      });
      return;
    }
    const {
      reset_tabs: resetTabs,
      join_faction: dispatchJoinFaction,
    } = this.props;
    dispatchJoinFaction(info);
    resetTabs();
  }

  render() {
    const {
      errors, name, private: priv, creating,
    } = this.state;
    return (
      <form onSubmit={this.handleCreate} style={{ textAlign: 'left' }}>
        {errors.map((error) => (
          <p key={error}>Error: {error}</p>
        ))}
        <label htmlFor="name">
          <div>Name: </div>
          <input
            id="name"
            style={inputStyles}
            value={name}
            onChange={(e) => this.setState({ name: e.target.value })}
            type="text"
            placeholder="Faction Name"
          />
        </label>
        <label htmlFor="privateCheckbox" style={inputStyles}>
          Private Faction?
          <input
            id="privateCheckbox"
            value={priv}
            onChange={
              (e) => this.setState({ private: e.currentTarget.checked })
            }
            type="checkbox"
          />
        </label>
        <label htmlFor="newfactionicon">
          <div>Icon: (64x64)</div>
          <input
            id="newfactionicon"
            type="file"
            accept="image/*"
            onChange={this.handleFileChange}
            stlye={inputStyles}
          />
        </label>
        <button type="submit" style={{ display: 'block', margin: 'auto' }}>
          {creating ? '...' : 'Create'}
        </button>
      </form>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    join_faction(info) {
      dispatch(recieveJoinedFaction(info));
    },
  };
}

export default connect(null, mapDispatchToProps)(CreateFactionForm);
