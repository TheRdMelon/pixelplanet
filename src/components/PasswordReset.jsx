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
    <input type="password" name="pass" placeholder="New Password" />
    <input type="password" name="passconf" placeholder="Confirm New Password" />
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

export function getPasswordResetHtml(name, code, message = null) {
  const data = {
    title: 'PixelPlanet.fun Password Reset',
    description: 'reset your password here',
    body: (message) ? <PasswordResetError message={message} /> : <PasswordReset name={name} code={code} />,
  };
  const index = `<!doctype html>${ReactDOM.renderToStaticMarkup(<Html {...data} />)}`;
  return index;
}
