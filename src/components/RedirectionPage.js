/*
 * Make basic redirection page
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import Html from '../components/Html';

const RedirectionPage = ({ text }) => (
  <div>
    <h3>{text}</h3>
    <p>You will be automatically redirected after 5s</p>
    <p>Or <a href="https://pixelplanet.fun">Click here</a> to go back to pixelplanet</p>
  </div>
);

export function getHtml(description, text) {
  const data = {
    title: 'PixelPlanet.fun Accounts',
    description,
    body: <RedirectionPage text={text} />,
    code: 'window.setTimeout(function(){window.location.href="https://pixelplanet.fun";},4000)',
  };
  const index = `<!doctype html>${ReactDOM.renderToStaticMarkup(<Html {...data} />)}`;
  return index;
}

