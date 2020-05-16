/* @flow */
/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/* eslint-disable max-len */

import React from 'react';
import { CAPTCHA_METHOD, CAPTCHA_SITEKEY } from '../core/config';

const Html = ({
  title,
  description,
  body,
  // array of css stylesheet urls
  css,
  // array of script urls
  scripts,
  // style as string
  styles,
  // code as string
  code,
  // if recaptcha should get loaded
  useCaptcha,
}) => (
  <html className="no-js" lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <meta
        name="viewport"
        content="user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0"
      />
      <link rel="apple-touch-icon" href="apple-touch-icon.png" />
      {styles && styles.map((style) => (
        <style
          key={style.id}
          id={style.id}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: style.cssText }}
        />
      ))}
      {(CAPTCHA_METHOD === 1) && CAPTCHA_SITEKEY && useCaptcha
          && <script src="https://www.google.com/recaptcha/api.js" async defer />}
      {(CAPTCHA_METHOD === 2) && CAPTCHA_SITEKEY && useCaptcha
          && <script src="https://hcaptcha.com/1/api.js" async defer />}
      {code && (
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: code }}
      />
      )}
      {css && css.map((stylesheet) => (
        <link rel="stylesheet" type="text/css" id={stylesheet.id} href={stylesheet.uri} />
      ))}
    </head>
    <body>
      <div id="app">
        {body}
      </div>
      {scripts && scripts.map((script) => <script key={script} src={script} />)}
      {(CAPTCHA_METHOD === 2) && CAPTCHA_SITEKEY && useCaptcha
          && (
          <div
            className="h-captcha"
            data-sitekey={CAPTCHA_SITEKEY}
            data-callback="onCaptcha"
            data-size="invisible"
          />
          )}
      {(CAPTCHA_METHOD === 1) && CAPTCHA_SITEKEY && useCaptcha
          && (
          <div
            className="g-recaptcha"
            data-sitekey={CAPTCHA_SITEKEY}
            data-callback="onCaptcha"
            data-size="invisible"
          />
          )}
    </body>
  </html>
);


export default Html;
