/*
 * Cron job of argumentless functions that will get run in a specific interval,
 * per default just one will get created which runs daily,
 * hook it up to some timer function that causes the least load
 * @flow
 */
import { HOUR } from '../core/constants';

import logger from '../core/logger';

class Cron {
  lastRun: number;
  interval: number;
  functions: Array;
  timeout;

  // interval = how many hours between runs
  // lastRun = when this cron job was last run
  constructor(interval: number, lastRun: number = 0) {
    this.checkForExecution = this.checkForExecution.bind(this);
    this.interval = interval;
    this.lastRun = lastRun;
    this.functions = [];

    this.timeout = setInterval(this.checkForExecution, HOUR);
  }

  checkForExecution() {
    const curTime = Date.now();
    if (curTime > this.lastRun + this.interval * HOUR) {
      logger.info(`Run cron events for interval: ${this.interval}h`);
      this.lastRun = curTime;
      this.functions.forEach(async (item) => {
        item();
      });
    }
  }

  hook(func) {
    this.functions.push(func);
  }
}


function initializeDailyCron() {
  const now = new Date();
  // make it first run at midnight
  const lastRun = now.getTime() - now.getHours() * HOUR;
  const cron = new Cron(24, lastRun);
  return cron;
}

function initializeHourlyCron() {
  const cron = new Cron(1, Date.now());
  return cron;
}

export const DailyCron = initializeDailyCron();

export const HourlyCron = initializeHourlyCron();
