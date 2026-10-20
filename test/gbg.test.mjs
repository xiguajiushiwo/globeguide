import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/gbg.mjs', import.meta.url));

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    ...options,
  });
}

test('help shows the supported commands', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /gbg init <directory>/);
  assert.match(result.stdout, /gbg doctor/);
});

test('invalid commands and arguments fail with usage', () => {
  for (const args of [[], ['unknown'], ['init'], ['doctor', 'extra'], ['init', '--help']]) {
    const result = run(args);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, /Usage:/);
  }
});

test('init refuses an existing directory without changing it', () => {
  const root = mkdtempSync(join(tmpdir(), 'gbg-test-'));
  const target = join(root, 'existing');
  try {
    mkdirSync(target);
    const result = run(['init', target]);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /already exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('doctor reports prerequisites without exposing environment values', () => {
  const marker = 'secret-do-not-print';
  const result = run(['doctor'], {
    env: { ...process.env, DATABASE_URL: marker },
  });
  const output = result.stdout + result.stderr;
  assert.match(output, /Node\.js/);
  assert.match(output, /Git/);
  assert.match(output, /Corepack|pnpm/);
  assert.match(output, /PostgreSQL/);
  assert.doesNotMatch(output, new RegExp(marker));
});
