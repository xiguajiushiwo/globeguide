import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const password = process.env.DEMO_PASSWORD || randomBytes(15).toString('base64url');
if (password.length < 12 || password.length > 128) {
  console.error('DEMO_PASSWORD must be 12-128 characters when supplied.');
  process.exit(1);
}
if (process.argv[2] !== '--remote' || process.env.DEMO_SEED_CONFIRM !== 'globeguide-beta') {
  console.error('Demo seed requires --remote and DEMO_SEED_CONFIRM=globeguide-beta.');
  process.exit(1);
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const now = new Date().toISOString();
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 100_000, 32, 'sha256');
const storedPassword = `pbkdf2-sha256$100000$${salt.toString('base64')}$${hash.toString('base64')}`;
const users = [
  { id: 'demo-official', email: 'demo-official@globeguide.test', name: 'GlobeGuide Official', bio: 'Editorial travel notes from the GlobeGuide team.' },
  { id: 'demo-tokyo', email: 'demo-tokyo@globeguide.test', name: 'Tokyo Explorer', bio: 'Neighborhood walks, food stops, and calm city days.' },
  { id: 'demo-silk-road', email: 'demo-silk-road@globeguide.test', name: 'Silk Road Notes', bio: 'Slow travel notes across Central Asia and western China.' },
  { id: 'demo-weekend', email: 'demo-weekend@globeguide.test', name: 'Weekend Atlas', bio: 'Short trips and practical planning ideas.' },
];
const posts = [
  { id: 'demo-post-official', author: 'demo-official', type: 'guide', title: 'A gentle first day in Paris', body: 'Start with one neighborhood, one museum, and enough time to notice the streets between them. This example shows how a GlobeGuide editorial note can be saved and discussed.', destination: '22222222-2222-4222-8222-222222222222' },
  { id: 'demo-post-tokyo', author: 'demo-tokyo', type: 'moment', title: 'A quiet morning in Tokyo', body: 'The best part of an early Tokyo walk is the space between destinations. Follow the small streets, stop for breakfast, and leave the afternoon open.', destination: '11111111-1111-4111-8111-111111111111' },
  { id: 'demo-post-silk-road', author: 'demo-silk-road', type: 'guide', title: 'Planning a first Samarkand stop', body: 'Give the old city a full morning and keep the evening flexible. A short list of landmarks works better than trying to cross every item off at once.', destination: '20000000-0000-4000-8000-000000000105' },
  { id: 'demo-post-weekend', author: 'demo-weekend', type: 'moment', title: 'Notes from a weekend reset', body: 'A useful weekend plan starts with the return journey. Choose one anchor experience, leave room for a long meal, and keep the route easy to change.', destination: '33333333-3333-4333-8333-333333333333' },
];

const userSql = users.map((user) => `INSERT OR IGNORE INTO users (id,email,display_name,role,password_hash,email_verified_at,created_at,updated_at) VALUES (${quote(user.id)},${quote(user.email)},${quote(user.name)},'member',${quote(storedPassword)},${quote(now)},${quote(now)},${quote(now)});\nINSERT OR IGNORE INTO profiles (user_id,bio,avatar_initial,languages,travel_preferences,created_at,updated_at) VALUES (${quote(user.id)},${quote(user.bio)},${quote(user.name.slice(0, 1))},'en','city walks, local food',${quote(now)},${quote(now)});`).join('\n');
const postSql = posts.map((post) => `INSERT OR IGNORE INTO posts (id,author_id,type,title,body,language,destination_id,status,created_at,updated_at,submitted_at,published_at) VALUES (${quote(post.id)},${quote(post.author)},${quote(post.type)},${quote(post.title)},${quote(post.body)},'en',${quote(post.destination)},'published',${quote(now)},${quote(now)},${quote(now)},${quote(now)});`).join('\n');
const sql = `${userSql}\n${postSql}`;

const directory = dirname(fileURLToPath(import.meta.url));
const wrangler = join(directory, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const result = spawnSync(process.execPath, [wrangler, 'd1', 'execute', 'globeguide-beta', '--remote', '--command', sql], {
  cwd: join(directory, '..'),
  stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Seeded ${users.length} demo users and ${posts.length} published posts.`);
console.log(`Demo password (show once): ${password}`);
console.log('Emails: ' + users.map((user) => user.email).join(', '));
