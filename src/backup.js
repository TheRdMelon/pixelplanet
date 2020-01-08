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
import path from 'path';
import redis from 'redis';
import bluebird from 'bluebird';

import process from 'process';
import { spawn } from 'child_process';

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
  console.log('Using low cpu priority');
});
// -------------------


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const [
  CANVAS_REDIS_URL,
  BACKUP_REDIS_URL,
  BACKUP_DIR,
  INTERVAL,
  CMD,
] = process.argv.slice(2);

if (!CANVAS_REDIS_URL || !BACKUP_REDIS_URL || !BACKUP_DIR) {
  console.error(
    'Usage: node backup.js original_canvas backup_canvas backup_directory',
  );
  process.exit(1);
}

const canvasRedis = redis
  .createClient(CANVAS_REDIS_URL, { return_buffers: true });
const backupRedis = redis
  .createClient(BACKUP_REDIS_URL, { return_buffers: true });
canvasRedis.on('error', () => {
  console.error('Could not connect to canvas redis');
  process.exit(1);
});
backupRedis.on('error', () => {
  console.error('Could not connect to backup redis');
  process.exit(1);
});


function runCmd(cmd: string) {
  const startTime = Date.now();
  console.log(`Executing ${cmd}`);
  const cmdproc = spawn(cmd);
  cmdproc.on('exit', (code) => {
    if (code !== 0) {
      console.log(`${cmd} failed with code ${code}`);
    }
    const time = Date.now() - startTime;
    console.log(`${cmd} done in ${time}ms`);
  });
  cmdproc.stdout.on('data', (data) => {
    console.log(`${cmd}: ${data}`);
  });
  cmdproc.stderr.on('data', (data) => {
    console.log(`${cmd} error: ${data}`);
  });
}


function getDateFolder() {
  const dir = path.resolve(__dirname, BACKUP_DIR);
  if (!fs.existsSync(dir)) {
    console.error(`Backup directory ${BACKUP_DIR} does not exist!`);
    process.exit(1);
  }
  const date = new Date();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  const dayDir = `${date.getFullYear()}${month}${day}`;
  const backupDir = `${dir}/${dayDir}`;
  return backupDir;
}

async function dailyBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  await backupRedis.flushallAsync('ASYNC');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  await updateBackupRedis(canvasRedis, backupRedis, canvases);
  await createPngBackup(backupRedis, canvases, backupDir);
  console.log('Daily full backup done');
}

async function incrementialBackup() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  await incrementialBackupRedis(
    canvasRedis,
    backupRedis,
    canvases,
    backupDir,
  );
}

async function trigger() {
  const backupDir = getDateFolder();
  if (!fs.existsSync(backupDir)) {
    await dailyBackup();
  } else {
    await incrementialBackup();
  }
  if (CMD) {
    runCmd(CMD);
  }
  if (!INTERVAL) {
    process.exit(0);
  }
  console.log(`Creating next backup in ${INTERVAL} minutes`);
  setTimeout(trigger, INTERVAL * 60 * 1000);
}

console.log('Starting backup...');
trigger();
