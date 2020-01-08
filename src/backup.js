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

import process from 'process';
import { spawn } from 'child_process';

import { DailyCron } from './utils/cron';
import {
  updateBackupRedis,
  createPngBackup,
  incrementialBackupRedis,
} from './core/tilesBackup';
import canvases from './canvases.json';

/*
 * use low cpu priority
 */
const priority = 15;
const proc = spawn('renice', [priority, process.pid]);
proc.on('exit', (code) => {
  if (code !== 0) {
    console.log(`renice failed with code ${code}`);
  }
  console.log('Useing low cpu priority');
});
// -------------------


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

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


function getDateFolder() {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`Backup directory ${BACKUP_DIR} does not exist!`);
  }
  const date = new Date();
  // eslint-disable-next-line max-len
  const dayDir = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  const backupDir = `${BACKUP_DIR}/${dayDir}`;
  return backupDir;
}

function dailyBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  backupRedis.flushall('ASYNC', async () => {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    await updateBackupRedis(canvasRedis, backupRedis, canvases);
    await createPngBackup(backupRedis, canvases, backupDir);
    console.log('Daily backup done');
  });
}

function incrementialBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  incrementialBackupRedis(
    canvasRedis,
    backupRedis,
    canvases,
    backupDir,
  );
}

async function startCronJobs() {
  if (!fs.existsSync(BACKUP_DIR)) {
    throw new Error(`Backup directory ${BACKUP_DIR} does not exist!`);
  }
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    await dailyBackup();
  }

  console.log(
    'Creating one full PNG backup per day and incremential backups every hour.',
  );
  DailyCron.hook(dailyBackup);
  setInterval(incrementialBackup, 15 * 60 * 1000);
}

startCronJobs();
