/**
 *
 * @flow
 */

import React from 'react';

interface IProps {
  loadRoute: (route) => void;
}

function getErrorMessage(code) {
  switch (code) {
    case '001':
      return 'This faction does not exist.';
    case '003':
      return 'You are banned from this faction.';
    default:
      return 'Invalid error code.';
  }
}

const Error: React.FC<IProps> = (props) => {
  const { loadRoute, code } = props;
  function onReturn(e: Event) {
    e.preventDefault();
    loadRoute('/');
  }
  return (
    <>
      <div className="error-page">
        <div className="content">
          <h2>Error</h2>
          <h1>{getErrorMessage(code)}</h1>
          <a
            className="btn-return"
            href="https://pixelplanet.fun/"
            onClick={onReturn}
          >
            Return to PixelPlanet.fun
          </a>
        </div>
        <div className="error-logo">
          <img src="favicon.ico" alt="" />
          PixelPlanet.fun
        </div>
        <a
          className="bubble"
          href="https://pixelplanet.fun/"
          onClick={onReturn}
        >
          <span style={{ display: 'none' }}>Return to PixelPlanet.fun</span>
        </a>
      </div>
    </>
  );
};

export default Error;
