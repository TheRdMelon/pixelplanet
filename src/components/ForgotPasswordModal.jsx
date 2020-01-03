/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';

import type { State } from '../reducers';

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
  padding: 0,
  lineHeight: 'normal',
};

const ForgotPasswordModal = ({ login }) => (
  <Modal title="Restore my Password">
    <p style={textStyle}>Enter your mail adress and we will send you a new password:</p><br />
    <p style={{ textAlign: 'center' }}>
      <NewPasswordForm back={login} />
      <p>Also join our Discord: <a href="./discord" target="_blank">pixelplanet.fun/discord</a></p>
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

function mapStateToProps(state: State) {

}

export default connect(mapStateToProps, mapDispatchToProps)(ForgotPasswordModal);
