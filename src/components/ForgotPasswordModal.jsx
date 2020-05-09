/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';

import { showUserAreaModal } from '../actions';
import NewPasswordForm from './NewPasswordForm';

const textStyle = {
  color: 'hsla(218, 5%, 47%, .6)',
  fontSize: 14,
  fontWeight: 500,
  position: 'relative',
  textAlign: 'inherit',
  float: 'none',
  margin: 0,
  paddingLeft: '5%',
  lineHeight: 'normal',
};

const ForgotPasswordModal = ({ login }) => (
  <Modal title="Restore my Password">
    <p style={{ paddingLeft: '5%', paddingRight: '5%' }}>
      <p style={textStyle}>
        Enter your mail adress and we will send you a new password:
      </p><br />
      <p style={{ textAlign: 'center' }}>
        <NewPasswordForm back={login} />
        <p>Also join our Discord:&nbsp;
          <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
      </p>
    </p>
  </Modal>
);

function mapDispatchToProps(dispatch) {
  return {
    login() {
      dispatch(showUserAreaModal());
    },
  };
}


export default connect(null, mapDispatchToProps)(ForgotPasswordModal);
