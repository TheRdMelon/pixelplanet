/*
 * Cron job of argumentless functions that will get run in a specific interval,
 * per default just one will get created which runs daily,
 * hook it up to some timer function that causes the least load
 * @flow
 */
import { HOUR, MINUTE } from '../core/constants';

import logger from '../core/logger';

class Cron {
  last_run: number;
  interval: number;
  functions: Array;
  timeout;

  // interval = how many hours between runs
  // last_run = when this cron job was last run
  constructor(interval: number, last_run: number = 0) {
    this.check_for_execution = this.check_for_execution.bind(this);
    this.interval = interval;
    this.last_run = last_run;
    this.functions = [];

    this.timeout = setInterval(this.check_for_execution, HOUR);
  }

  check_for_execution() {
    const cur_time = Date.now();
    if (cur_time > this.last_run + this.interval * HOUR) {
      logger.info(`Run cron events for interval: ${this.interval}h`);
      this.last_run = cur_time;
      this.functions.forEach(async (item) => {
        item();
      });
    }
  }

  hook(func) {
    this.functions.push(func);
  }
}


function initialize_daily_cron() {
  const now = new Date();
  // make it first run at midnight
  const last_run = now.getTime() - now.getHours() * HOUR;
  const cron = new Cron(24, last_run);
  return cron;
}

function initialize_hourly_cron() {
  const cron = new Cron(1, Date.now());
  return cron;
}

export const DailyCron = initialize_daily_cron();

export const HourlyCron = initialize_hourly_cron();
