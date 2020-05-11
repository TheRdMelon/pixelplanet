/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { showUserAreaModal } from '../actions';
import NewPasswordForm from './NewPasswordForm';

const ForgotPasswordModal = ({ login }) => (
  <p style={{ paddingLeft: '5%', paddingRight: '5%' }}>
    <p className="modaltext">
      Enter your mail adress and we will send you a new password:
    </p><br />
    <p style={{ textAlign: 'center' }}>
      <NewPasswordForm back={login} />
      <p>Also join our Discord:&nbsp;
        <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
    </p>
  </p>
);

function mapDispatchToProps(dispatch) {
  return {
    login() {
      dispatch(showUserAreaModal());
    },
  };
}

const data = {
  content: connect(null, mapDispatchToProps)(ForgotPasswordModal),
  title: 'Restore my Password',
};

export default data;
