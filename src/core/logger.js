/**
 *
 * http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
 *
 * @flow
 */

import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.splat(),
    format.simple(),
  ),
  transports: [
    new transports.Console(),
  ],
});

export const proxyLogger = createLogger({
  transports: [
    new transports.File({
      level: 'info',
      filename: './proxies.log',
      maxsize: 10428800, // 10MB
      colorize: false,
    }),
  ],
});


export default logger;
