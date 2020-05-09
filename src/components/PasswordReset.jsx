/*
 * Make basic reset_password forms
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import Html from './Html';

const PasswordReset = ({ name, code }) => (
  <form method="post" action="reset_password">
    <h3>Reset Password</h3>
    <p>Hello {name}, you can set your new password here:</p>
    <input
      type="password"
      name="pass"
      placeholder="New Password"
      style={{
        maxWidth: '35em',
      }}
    />
    <input
      type="password"
      name="passconf"
      placeholder="Confirm New Password"
      style={{
        maxWidth: '35em',
      }}
    />
    <input type="hidden" name="code" value={code} />
    <button type="submit" name="submit">Submit</button>
  </form>
);

const PasswordResetError = ({ message }) => (
  <div>
    <h3>Reset Password</h3>
    <p>{message}</p>
    <p><a href="./">Click here</a> to go back to pixelplanet</p>
  </div>
);

export default function getPasswordResetHtml(name, code, message = null) {
  const title = 'PixelPlanet.fun Password Reset';
  const description = 'reset your password here';
  const body = (message)
    ? <PasswordResetError message={message} />
    : <PasswordReset name={name} code={code} />;
  const index = `<!doctype html>${
    ReactDOM.renderToStaticMarkup(<Html
      title={title}
      description={description}
      body={body}
    />)}`;
  return index;
}
