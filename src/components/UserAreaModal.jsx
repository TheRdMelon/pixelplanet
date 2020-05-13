/**
 *
 * @flow
 */

import React, { Suspense } from 'react';
import { connect } from 'react-redux';

import type { State } from '../reducers';


import {
  showRegisterModal, showForgotPasswordModal, setName, setMailreg, receiveMe,
} from '../actions';
import LogInForm from './LogInForm';
import Tabs from './Tabs';
import UserArea from './UserArea';
import Rankings from './Rankings';

// eslint-disable-next-line max-len
const Converter = React.lazy(() => import(/* webpackChunkName: "converter" */ './Converter'));

const logoStyle = {
  marginRight: 5,
};

const LogInArea = ({ register, forgotPassword, me }) => (
  <p style={{ textAlign: 'center' }}>
    <p className="modaltext">Login to access more features and stats.</p><br />
    <h2>Login with Mail:</h2>
    <LogInForm me={me} />
    <p
      className="modallink"
      onClick={forgotPassword}
      role="presentation"
    >
      I forgot my Password.</p>
    <h2>or login with:</h2>
    <a href="./api/auth/discord">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/discordlogo.svg`}
        alt="Discord"
      />
    </a>
    <a href="./api/auth/google">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/googlelogo.svg`}
        alt="Google"
      />
    </a>
    <a href="./api/auth/facebook">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/facebooklogo.svg`}
        alt="Facebook"
      />
    </a>
    <a href="./api/auth/vk">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/vklogo.svg`}
        alt="VK"
      />
    </a>
    <a href="./api/auth/reddit">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/redditlogo.svg`}
        alt="Reddit"
      />
    </a>
    <h2>or register here:</h2>
    <button type="button" onClick={register}>Register</button>
  </p>
);

const UserAreaModal = ({
  name, register, forgotPassword, doMe, logout, setUserName, setUserMailreg,
}) => (
  <p style={{ textAlign: 'center' }}>
    {(name === null)
      ? (
        <LogInArea
          register={register}
          forgotPassword={forgotPassword}
          me={doMe}
        />
      )
      : (
        <Tabs>
          <div label="Profile">
            <UserArea
              logout={logout}
              setName={setUserName}
              setMailreg={setUserMailreg}
            />
          </div>
          <div label="Ranking">
            <Rankings />
          </div>
          <div label="Converter">
            <Suspense fallback={<div>Loading...</div>}>
              <Converter />
            </Suspense>
          </div>
        </Tabs>
      )}
    <p>Also join our Discord:&nbsp;
      <a href="./discord" target="_blank">pixelplanet.fun/discord</a>
    </p>
  </p>
);

function mapDispatchToProps(dispatch) {
  return {
    register() {
      dispatch(showRegisterModal());
    },
    forgotPassword() {
      dispatch(showForgotPasswordModal());
    },
    doMe(me) {
      dispatch(receiveMe(me));
    },
    setUserName(name) {
      dispatch(setName(name));
    },
    setUserMailreg(mailreg) {
      dispatch(setMailreg(mailreg));
    },
    async logout() {
      const response = await fetch(
        './api/auth/logout',
        { credentials: 'include' },
      );
      if (response.ok) {
        const resp = await response.json();
        dispatch(receiveMe(resp.me));
      }
    },
  };
}

function mapStateToProps(state: State) {
  const { name } = state.user;
  return { name };
}

const data = {
  content: connect(mapStateToProps, mapDispatchToProps)(UserAreaModal),
  title: 'User Area',
};

export default data;
