/**
 *
 * @flow
 */

import React from 'react';
import { connect } from 'react-redux';

import Modal from './Modal';

import type { State } from '../reducers';

import {
  showRegisterModal,
  showForgotPasswordModal,
  setName,
  setMailreg,
  receiveMe,
  resetUserFactions,
} from '../actions';
import LogInForm from './LogInForm';
import Tabs from './Tabs';
import UserArea from './UserArea';
import Rankings from './Rankings';

const logoStyle = {
  marginRight: 5,
};

const titleStyle = {
  color: '#4f545c',
  marginLeft: 0,
  marginRight: 10,
  overflow: 'hidden',
  wordWrap: 'break-word',
  lineHeight: '24px',
  fontSize: 16,
  fontWeight: 500,
  // marginTop: 0,
  marginBottom: 0,
};

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

const LogInArea = ({ register, forgot_password, me }) => (
  <p style={{ textAlign: 'center' }}>
    <p style={textStyle}>Login to access more features and stats.</p>
    <br />
    <h2>Login with Mail:</h2>
    <LogInForm me={me} />
    <p className="modallink" onClick={forgot_password}>
      I forgot my Password.
    </p>
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
        alt="vk"
      />
    </a>
    <a href="./api/auth/reddit">
      <img
        style={logoStyle}
        width={32}
        src={`${window.assetserver}/redditlogo.svg`}
        alt="vk"
      />
    </a>
    <h2>or register here:</h2>
    <button type="button" onClick={register}>
      Register
    </button>
  </p>
);

const UserAreaModal = ({
  name,
  register,
  forgot_password,
  doMe,
  logout,
  setName,
  setMailreg,
}) => (
  <Modal title="User Area">
    <p style={{ textAlign: 'center' }}>
      {name === null ? (
        <LogInArea
          register={register}
          forgot_password={forgot_password}
          me={doMe}
        />
      ) : (
        <Tabs>
          <div label="Profile">
            <UserArea
              logout={logout}
              set_name={setName}
              set_mailreg={setMailreg}
            />
          </div>
          <div label="Ranking">
            <Rankings />
          </div>
        </Tabs>
      )}
      <p>
        Also join our Discord:{' '}
        <a href="./discord" target="_blank">
          pixelplanet.fun/discord
        </a>
      </p>
    </p>
  </Modal>
);

function mapDispatchToProps(dispatch) {
  return {
    register() {
      dispatch(showRegisterModal());
    },
    forgot_password() {
      dispatch(showForgotPasswordModal());
    },
    doMe(me) {
      dispatch(receiveMe(me));
    },
    setName(name) {
      dispatch(setName(name));
    },
    setMailreg(mailreg) {
      dispatch(setMailreg(mailreg));
    },
    async logout() {
      const response = await fetch('./api/auth/logout', {
        credentials: 'include',
      });
      if (response.ok) {
        const resp = await response.json();
        dispatch(receiveMe(resp.me));
        dispatch(resetUserFactions());
      }
    },
  };
}

function mapStateToProps(state: State) {
  const { name } = state.user;
  return { name };
}

export default connect(mapStateToProps, mapDispatchToProps)(UserAreaModal);
