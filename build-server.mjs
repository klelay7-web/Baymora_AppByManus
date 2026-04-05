import { build } from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

// Mark all npm packages as external (not bundled)
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  'node:path', 'node:fs', 'node:url', 'node:http', 'node:https',
  'node:os', 'node:crypto', 'node:stream', 'node:util', 'node:events',
  'node:buffer', 'node:child_process', 'node:module',
];

await build({
  entryPoints: ['./server/node-build.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  outfile: 'dist/server/production.mjs',
  format: 'esm',
  external,
  logLevel: 'info',
});

console.log('✓ Server build complete → dist/server/production.mjs');
