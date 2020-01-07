/*
 * Creates regular backups of the canvas in png tiles
 * In order to run huge redis operations, you have to allow redis to use
 * more virtual memory, with:
 * vm.overcommit_memory = 1 in /etc/sysctl.conf and `sysctl vm.overcommit_memory=1`
 * also:
 * echo never > /sys/kernel/mm/transparent_hugepage/enabled
 *
 * @flow
 */

/* eslint-disable no-console */

import fs from 'fs';
import redis from 'redis';
import bluebird from 'bluebird';

/*
 * use low cpu priority
 */
import process from 'process';
import { spawn } from 'child_process';
const priority  = 15;
const proc= spawn("renice", [priority, process.pid]);
proc.on('exit', function (code) {
  if (code !== 0){
    console.log("renice failed with code - " +code);
  }
  console.log('Useing low cpu priority');
});
// -------------------


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

import canvases from './canvases.json';
import {
  updateBackupRedis,
  createPngBackup,
  incrementialBackupRedis,
} from './core/tilesBackup';

const {
  CANVAS_REDIS_URL,
  BACKUP_REDIS_URL,
  BACKUP_DIR,
} = process.env;
if (!CANVAS_REDIS_URL || !BACKUP_REDIS_URL || !BACKUP_DIR) {
  throw new Error(
    'You did not set CANVAS_REDIS_URL, BACKUP_REDIS_URL or BACKUP_DIR',
  );
}

const canvasRedis = redis
  .createClient(CANVAS_REDIS_URL, { return_buffers: true });
const backupRedis = redis
  .createClient(BACKUP_REDIS_URL, { return_buffers: true });
canvasRedis.on('error', () => {
  throw new Error('Could not connect to canvas redis');
});
backupRedis.on('error', () => {
  throw new Error('Could not connect to backup redis');
});


function dailyBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`Backup directory ${backupDir} does not exist!`);
  }

  backupRedis.flushall('ASYNC', async () => {
    const date = new Date();
    const dayDir = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
    const backupDir = `${BACKUP_DIR}/${dayDir}`;
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    await updateBackupRedis(canvasRedis, backupRedis, canvases);
    await createPngBackup(backupRedis, canvases, backupDir);
    await incrementialBackupRedis(canvasRedis, backupRedis, canvases, backupDir);
    console.log(`Daily backup ${dayDir} done`);
  });
}

dailyBackup();
