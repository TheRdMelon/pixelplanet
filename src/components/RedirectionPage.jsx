/*
 * Make basic redirection page
 * @flow
 */

import React from 'react';
import ReactDOM from 'react-dom/server';
import Html from './Html';

const RedirectionPage = ({ text, host }) => (
  <div>
    <h3>{text}</h3>
    <p>You will be automatically redirected after 5s</p>
    <p>Or <a href={host}>Click here</a> to go back to pixelplanet</p>
  </div>
);

export function getHtml(description, text, host) {
  const data = {
    title: 'PixelPlanet.fun Accounts',
    description,
    body: <RedirectionPage text={text} host={host} />,
    code: `window.setTimeout(function(){window.location.href="${host}";},4000)`,
  };
  const index = `<!doctype html>${ReactDOM.renderToStaticMarkup(<Html {...data} />)}`;
  return index;
}
