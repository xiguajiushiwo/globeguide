#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { resolve } from 'node:path';

const repository = 'https://github.com/xiguajiushiwo/globeguide.git';
const usage = `Usage:
  gbg init <directory>  Clone the private repository and install dependencies
  gbg doctor            Check local development prerequisites
  gbg --help            Show this help`;

function run(command, args, options = {}) {
  if (process.platform === 'win32' && (command === 'corepack' || command === 'pnpm')) {
    const script = [command, ...args].join(' ');
    return spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', script], {
      encoding: 'utf8',
      ...options,
    });
  }
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function available(command, args = ['--version']) {
  const result = run(command, args, { stdio: 'pipe' });
  return !result.error && result.status === 0;
}

function localPostgresReachable() {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port: 5432 });
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      done(true);
    });
    socket.once('error', () => done(false));
    socket.once('timeout', () => {
      socket.destroy();
      done(false);
    });
  });
}

async function doctor() {
  const nodeReady = Number(process.versions.node.split('.')[0]) >= 22;
  const gitReady = available('git');
  const corepackReady = available('corepack');
  const pnpmReady = corepackReady || available('pnpm');
  const postgresReady = await localPostgresReachable();

  console.log(`Node.js 22+: ${nodeReady ? 'ready' : 'install Node.js 22 or newer'}`);
  console.log(`Git: ${gitReady ? 'ready' : 'install Git and authenticate with GitHub'}`);
  console.log(`Corepack or pnpm: ${pnpmReady ? 'ready' : 'install Corepack or pnpm 11'}`);
  console.log(`PostgreSQL on 127.0.0.1:5432: ${postgresReady ? 'reachable' : 'not reachable (needed for the local API)'}`);
  console.log('PostGIS: checked when database migrations run.');
  if (!nodeReady || !gitReady || !pnpmReady || !postgresReady) process.exitCode = 1;
}

function init(directory) {
  const target = resolve(directory);
  if (existsSync(target)) {
    console.error(`Target directory already exists: ${target}`);
    process.exitCode = 1;
    return;
  }
  if (Number(process.versions.node.split('.')[0]) < 22 || !available('git')) {
    console.error('Node.js 22+ and Git are required. Run gbg doctor for details.');
    process.exitCode = 1;
    return;
  }
  const manager = available('corepack') ? 'corepack' : available('pnpm') ? 'pnpm' : null;
  if (!manager) {
    console.error('Corepack or pnpm 11 is required. Run gbg doctor for details.');
    process.exitCode = 1;
    return;
  }

  console.log('Cloning the private GlobeGuide repository. GitHub access is required.');
  const clone = run('git', ['clone', repository, target], { stdio: 'inherit' });
  if (clone.error || clone.status !== 0) {
    console.error('Clone failed. Confirm that GitHub authentication and repository access are configured.');
    process.exitCode = 1;
    return;
  }

  console.log('Installing workspace dependencies...');
  const args = manager === 'corepack' ? ['pnpm', 'install', '--frozen-lockfile'] : ['install', '--frozen-lockfile'];
  const install = run(manager, args, { cwd: target, stdio: 'inherit' });
  if (install.error || install.status !== 0) {
    console.error('Dependency installation failed. Retry from the cloned directory with pnpm install --frozen-lockfile.');
    process.exitCode = 1;
    return;
  }

  console.log(`GlobeGuide is ready in ${target}`);
  console.log('See README.md for PostgreSQL/PostGIS setup, migration, seed, and start commands.');
}

const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === '--help' || args[0] === '-h' || args[0] === 'help')) {
  console.log(usage);
} else if (args.length === 1 && args[0] === 'doctor') {
  await doctor();
} else if (args.length === 2 && args[0] === 'init' && !args[1].startsWith('-')) {
  init(args[1]);
} else {
  console.error(usage);
  process.exitCode = 1;
}
