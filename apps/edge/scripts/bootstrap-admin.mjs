import { pbkdf2Sync, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'GlobeGuide Admin';

if (!email || !/^[^\s@]{1,64}@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 16 || password.length > 128 || name.length > 48) {
  console.error('Set ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD (16-128 characters), and optionally ADMIN_BOOTSTRAP_NAME.');
  process.exit(1);
}
if (process.argv[2] !== '--remote' || process.env.ADMIN_BOOTSTRAP_CONFIRM !== 'globeguide-beta') {
  console.error('Remote bootstrap requires --remote and ADMIN_BOOTSTRAP_CONFIRM=globeguide-beta.');
  process.exit(1);
}

const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 600_000, 32, 'sha256');
const stored = `pbkdf2-sha256$600000$${salt.toString('base64')}$${hash.toString('base64')}`;
const now = new Date().toISOString();
const sql = `INSERT INTO users (id,email,display_name,role,password_hash,email_verified_at,created_at,updated_at)
SELECT ${quote(randomUUID())},${quote(email)},${quote(name)},'admin',${quote(stored)},${quote(now)},${quote(now)},${quote(now)}
WHERE NOT EXISTS (SELECT 1 FROM users WHERE role='admin');`;

const directory = dirname(fileURLToPath(import.meta.url));
const wrangler = join(directory, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'globeguide-beta', '--remote', '--command', sql], {
  cwd: join(directory, '..'),
  stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status || 1);
console.log('Bootstrap command completed. Confirm that exactly one admin user exists before publishing.');
