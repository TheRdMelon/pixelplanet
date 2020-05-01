/**
 *
 * http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
 *
 * @flow
 */

import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

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

export const pixelLogger = createLogger({
  format: format.printf(({ message }) => message),
  transports: [
    new DailyRotateFile({
      level: 'info',
      filename: './log/pixels-%DATE%.log',
      maxSize: '20m',
      maxFiles: '14d',
      colorize: false,
    }),
  ],
});

export const proxyLogger = createLogger({
  format: format.combine(
    format.splat(),
    format.simple(),
  ),
  transports: [
    new DailyRotateFile({
      level: 'info',
      filename: './log/proxycheck-%DATE%.log',
      maxsize: '10m',
      maxFiles: '14d',
      colorize: false,
    }),
  ],
});


export default logger;
