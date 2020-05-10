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

const Stat = ({ text, value, rank }) => (
  <p>
    <span className="stattext">{(rank) ? `${text}: #` : `${text}: `}</span>
    &nbsp;
    <span className="statvalue">{numberToString(value)}</span>
  </p>
);

class UserArea extends React.Component {
  constructor() {
    super();
    this.state = {
      // that should be an ENUM tbh
      changeNameExtended: false,
      changeMailExtended: false,
      changePasswdExtended: false,
      deleteAccountExtended: false,
    };
  }

  render() {
    const {
      stats, name, logout, mailreg, setMailreg, setName,
    } = this.props;
    const {
      changeNameExtended,
      changeMailExtended,
      changePasswdExtended,
      deleteAccountExtended,
    } = this.state;
    return (
      <p style={{ textAlign: 'center' }}>
        <UserMessages />
        <Stat
          text="Todays Placed Pixels"
          value={stats.dailyTotalPixels}
        />
        <Stat
          text="Daily Rank"
          value={stats.dailyRanking}
          rank
        />
        <Stat
          text="Placed Pixels"
          value={stats.totalPixels}
        />
        <Stat
          text="Total Rank"
          value={stats.ranking}
          rank
        />
        <p className="modaltext">
          <p>Your name is: {name}</p>(
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={logout}
          > Log out</span> |
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: true,
              changeMailExtended: false,
              changePasswdExtended: false,
              deleteAccountExtended: false,
            })}
          > Change Username</span> |
          {(mailreg)
            && (
            <span>
              <span
                role="button"
                tabIndex={-1}
                className="modallink"
                onClick={() => this.setState({
                  changeNameExtended: false,
                  changeMailExtended: true,
                  changePasswdExtended: false,
                  deleteAccountExtended: false,
                })}
              > Change Mail</span> |
            </span>
            )}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: false,
              changeMailExtended: false,
              changePasswdExtended: true,
              deleteAccountExtended: false,
            })}
          > Change Password</span> |
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => this.setState({
              changeNameExtended: false,
              changeMailExtended: false,
              changePasswdExtended: false,
              deleteAccountExtended: true,
            })}
          > Delete Account</span> )
        </p>
        {(changePasswdExtended)
          && (
          <ChangePassword
            mailreg={mailreg}
            done={() => {
              setMailreg(true);
              this.setState({ changePasswdExtended: false });
            }}
            cancel={() => { this.setState({ changePasswdExtended: false }); }}
          />
          )}
        {(changeNameExtended)
          && (
          <ChangeName
            setName={setName}
            done={() => { this.setState({ changeNameExtended: false }); }}
          />
          )}
        {(changeMailExtended)
          && (
          <ChangeMail
            done={() => { this.setState({ changeMailExtended: false }); }}
          />
          )}
        {(deleteAccountExtended)
          && (
          <DeleteAccount
            setName={setName}
            done={() => { this.setState({ deleteAccountExtended: false }); }}
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
