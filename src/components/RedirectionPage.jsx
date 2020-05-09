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
    <p>You will be automatically redirected after 15s</p>
    <p>Or <a href={host}>Click here</a> to go back to pixelplanet</p>
  </div>
);

function getHtml(description, text, host) {
  const title = 'PixelPlanet.fun Accounts';
  const body = <RedirectionPage text={text} host={host} />;
  // eslint-disable-next-line max-len
  const code = `window.setTimeout(function(){window.location.href="${host}";},15000)`;

  const index = `<!doctype html>${
    ReactDOM.renderToStaticMarkup(
      <Html title={title} description={description} body={body} code={code} />,
    )
  }`;
  return index;
}

export default getHtml;
