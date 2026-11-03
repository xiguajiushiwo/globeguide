import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageDirectory = dirname(require.resolve('maplibre-gl/package.json'));
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));

await mkdir(publicDirectory, { recursive: true });
for (const [source, target] of [
  ['dist/maplibre-gl-worker.mjs', 'maplibre-gl-worker.js'],
  ['dist/maplibre-gl-worker.mjs.map', 'maplibre-gl-worker.mjs.map'],
  ['LICENSE.txt', 'maplibre-gl-LICENSE.txt'],
]) {
  await copyFile(join(packageDirectory, source), join(publicDirectory, target));
}
