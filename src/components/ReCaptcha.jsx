/**
 *
 * @flow
 * Implement ReCaptcha
 * (the recaptcha sitekey gets received in the Html inline script sent by components/Html)
 */

import React from 'react';

import store from '../ui/store';
import { tryPlacePixel } from '../actions';


async function onCaptcha(token: string) {
  const body = JSON.stringify({
    token,
  });
  await fetch('/api/captcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    // https://github.com/github/fetch/issues/349
    credentials: 'include',
  });

  const {
    i, j, offset, color,
  } = window.pixel;
  store.dispatch(tryPlacePixel(i, j, offset, color));

  window.grecaptcha.reset();
}
// https://stackoverflow.com/questions/41717304/recaptcha-google-data-callback-with-angularjs
window.onCaptcha = onCaptcha;

const ReCaptcha = () => (
  <div
    className="g-recaptcha"
    data-sitekey={window.sitekey}
    data-callback="onCaptcha"
    data-size="invisible"
  />
);

export default ReCaptcha;
