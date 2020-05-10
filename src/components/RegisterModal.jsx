/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';

import { showUserAreaModal } from '../actions';

// import { send_registration } from '../ui/register';
import SignUpForm from './SignUpForm';


const RegisterModal = ({ login }) => (
  <Modal title="Register New Account">
    <p style={{ paddingLeft: '5%', paddingRight: '5%' }}>
      <p className="modaltext">Register new account here</p><br />
      <p style={{ textAlign: 'center' }}>
        <SignUpForm back={login} />
        <p>Also join our Discord:&nbsp;
          <a href="./discord" target="_blank">pixelplanet.fun/discord</a>
        </p>
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

export default connect(null, mapDispatchToProps)(RegisterModal);
