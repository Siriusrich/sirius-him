/**
 * content-watch.mjs — dev entry point.
 * Regenerates the HTML pages whenever a file in /content changes, then runs
 * Vite with stdio passed through. This keeps the local /admin experience
 * seamless: save in the editor → the page updates on its own.
 * (On the hosted site this step happens automatically during the build.)
 *
 *   npm run dev
 */
import { spawn, spawnSync } from 'node:child_process';
import { watch } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');

const rebuild = (why) => {
  const started = Date.now();
  const result = spawnSync(process.execPath, [join(ROOT, 'scripts/build-content.mjs'), '--dev'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status === 0) console.log(`[content] regenerated (${why}, ${Date.now() - started}ms)`);
  else console.error('[content] regeneration failed');
};

rebuild('initial');

let timer = null;
watch(CONTENT, { recursive: true }, (_event, filename) => {
  clearTimeout(timer);
  timer = setTimeout(() => rebuild(filename || 'change'), 150);
});

const vite = spawn(join(ROOT, 'node_modules/.bin/vite'), [], { cwd: ROOT, stdio: 'inherit' });
const shutdown = (signal) => {
  clearTimeout(timer);
  vite.kill(signal);
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
vite.on('exit', (code) => process.exit(code ?? 0));
