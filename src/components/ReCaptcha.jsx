/**
 *
 * @flow
 * Implement ReCaptcha
 * (the recaptcha sitekey gets received in the Html inline script sent by components/Html)
 */

import React from 'react';

import store from '../ui/store';
import { requestPlacePixel } from '../actions';


function onCaptcha(token: string) {
  console.log('token', token);

  const { canvasId, coordinates, color } = window.pixel;

  store.dispatch(requestPlacePixel(canvasId, coordinates, color, token));
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
