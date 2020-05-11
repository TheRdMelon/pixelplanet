/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import { showUserAreaModal } from '../actions';

// import { send_registration } from '../ui/register';
import SignUpForm from './SignUpForm';


const RegisterModal = ({ login }) => (
  <p style={{ paddingLeft: '5%', paddingRight: '5%' }}>
    <p className="modaltext">Register new account here</p><br />
    <p style={{ textAlign: 'center' }}>
      <SignUpForm back={login} />
      <p>Also join our Discord:&nbsp;
        <a href="./discord" target="_blank">pixelplanet.fun/discord</a>
      </p>
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
  content: connect(null, mapDispatchToProps)(RegisterModal),
  title: 'Register New Account',
};

export default data;
