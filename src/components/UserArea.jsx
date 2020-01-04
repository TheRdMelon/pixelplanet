/*
 * Menu to change user credentials
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';

import UserMessages from './UserMessages';
import ChangePassword from './ChangePassword';
import ChangeName from './ChangeName';
import ChangeMail from './ChangeMail';
import DeleteAccount from './DeleteAccount';

import { numberToString } from '../core/utils';

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  padding: 0,
  lineHeight: 'normal',
};

const Stat = ({ text, value, rank }) => (
  <p>
    <span className="stattext">{(rank) ? `${text}: #` : `${text}: `}</span>
    <span className="statvalue">{numberToString(value)}</span>
  </p>
);

class UserArea extends React.Component {
  constructor() {
    super();
    this.state = {
      // that should be an ENUM tbh
      change_name_extended: false,
      change_mail_extended: false,
      change_passwd_extended: false,
      delete_account_extended: false,
    };
  }

  render() {
    return (
      <p style={{ textAlign: 'center' }}>
        <UserMessages />
        <Stat text="Todays Placed Pixels" value={this.props.stats.dailyTotalPixels} />
        <Stat text="Daily Rank" value={this.props.stats.dailyRanking} rank />
        <Stat text="Placed Pixels" value={this.props.stats.totalPixels} />
        <Stat text="Total Rank" value={this.props.stats.ranking} rank />
        <p style={textStyle}>
          <p>Your name is: {this.props.name}</p>(
          <span
            className="modallink"
            onClick={this.props.logout}
          > Log out</span> |
          <span
            className="modallink"
            onClick={(evt) => this.setState({
              change_name_extended: true,
              change_mail_extended: false,
              change_passwd_extended: false,
              delete_account_extended: false,
            })}
          > Change Username</span> |
          {(this.props.mailreg)
            && (
            <span>
              <span
                className="modallink"
                onClick={(evt) => this.setState({
                  change_name_extended: false,
                  change_mail_extended: true,
                  change_passwd_extended: false,
                  delete_account_extended: false,
                })}
              > Change Mail</span> |
            </span>
            )}
          <span
            className="modallink"
            onClick={(evt) => this.setState({
              change_name_extended: false,
              change_mail_extended: false,
              change_passwd_extended: true,
              delete_account_extended: false,
            })}
          > Change Password</span> |
          <span
            className="modallink"
            onClick={(evt) => this.setState({
              change_name_extended: false,
              change_mail_extended: false,
              change_passwd_extended: false,
              delete_account_extended: true,
            })}
          > Delete Account</span> )
        </p>
        {(this.state.change_passwd_extended)
          && (
          <ChangePassword
            mailreg={this.props.mailreg}
            done={() => { this.props.set_mailreg(true); this.setState({ change_passwd_extended: false }); }}
            cancel={() => { this.setState({ change_passwd_extended: false }); }}
          />
          )}
        {(this.state.change_name_extended)
          && (
          <ChangeName
            set_name={this.props.set_name}
            done={() => { this.setState({ change_name_extended: false }); }}
          />
          )}
        {(this.state.change_mail_extended)
          && (
          <ChangeMail
            done={() => { this.setState({ change_mail_extended: false }); }}
          />
          )}
        {(this.state.delete_account_extended)
          && (
          <DeleteAccount
            set_name={this.props.set_name}
            done={() => { this.setState({ delete_account_extended: false }); }}
          />
          )}
      </p>
    );
  }
}


function mapStateToProps(state: State) {
  const {
    name,
    mailreg,
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
  } = state.user;
  const stats = {
    totalPixels,
    dailyTotalPixels,
    ranking,
    dailyRanking,
  };

  return { name, mailreg, stats };
}

export default connect(mapStateToProps)(UserArea);
