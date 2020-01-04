/**
 *
 * http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
 *
 * @flow
 */

import winston from 'winston';


const logger = winston;

export const proxyLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: '/var/log/pixelplace/proxies.log',
      json: true,
      maxsize: 2 * 52428800, // 100MB
      colorize: false,
    }),
  ],
});


export default logger;
