import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
}).split('\0').filter(Boolean))].filter((name) => existsSync(resolve(root, name)));
const problems = [];
const generated = /(^|\/)(node_modules|\.next|\.turbo|\.wrangler|dist|coverage|test-results|playwright-report)(\/|$)|^apps\/web\/out\/|^apps\/api\/openapi\/|^apps\/web\/public\/maplibre-gl-(worker|LICENSE)|\.(tsbuildinfo|bak|sqlite(?:-wal|-shm)?)$/;
const privateConfig = /(^|\/)(\.env(?:\..*)?|\.dev\.vars(?:\..*)?)$/;
const textFile = /\.(?:[cm]?js|tsx?|jsonc?|ya?ml|md|sql|css|txt|example)$|(^|\/)(\.gitignore|\.editorconfig)$/;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{60,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
];

for (const name of files) {
  if (generated.test(name)) problems.push(`${name}: generated or local-only file included`);
  if (privateConfig.test(name) && !name.endsWith('.example')) problems.push(`${name}: private configuration included`);
  const absolute = resolve(root, name);
  if (!statSync(absolute).isFile() || !textFile.test(name)) continue;
  const text = readFileSync(absolute, 'utf8');
  if (/^(?:<{7} |={7}$|>{7} )/m.test(text)) problems.push(`${name}: unresolved conflict marker`);
  if (secretPatterns.some((pattern) => pattern.test(text))) problems.push(`${name}: possible credential; inspect locally`);
  if (!name.endsWith('.md')) continue;
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1].trim().replace(/^<|>$/g, '').split(/[?#]/)[0];
    if (!href || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) continue;
    const target = resolve(dirname(absolute), decodeURIComponent(href));
    const location = relative(root, target);
    if (isAbsolute(location) || location === '..' || location.startsWith(`..${sep}`) || !existsSync(target)) {
      problems.push(`${name}: broken or external local link ${href}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Repository checks passed for ${files.length} files: no excluded artifacts, detected credentials, conflict markers, or broken document links.`);
}
