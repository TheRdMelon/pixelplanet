/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';

import { showUserAreaModal, receiveMe } from '../actions';

// import { send_registration } from '../ui/register';
import SignUpForm from './SignUpForm';


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

const RegisterModal = ({ login, doMe }) => (
  <Modal title="Register New Account">
    <p style={textStyle}>Register new account here</p><br />
    <p style={{ textAlign: 'center' }}>
      <SignUpForm userarea={login} me={doMe} />
      <button type="button" onClick={login}>Cancel</button>
      <p>Also join our Discord:&nbsp;
        <a href="./discord" target="_blank">pixelplanet.fun/discord</a>
      </p>
    </p>
  </Modal>
);

function mapDispatchToProps(dispatch) {
  return {
    login() {
      dispatch(showUserAreaModal());
    },
    doMe(me) {
      dispatch(receiveMe(me));
    },
  };
}

export default connect(null, mapDispatchToProps)(RegisterModal);
