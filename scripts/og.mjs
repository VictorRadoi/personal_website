#!/usr/bin/env node
/**
 * Renders public/og/<id>.png (1200×630) from src/pages/og-template.astro with headless Chrome.
 * Usage: node scripts/og.mjs [id ...]      (default: all). Needs Google Chrome; set CHROME to override.
 * Builds the site once with OG_BUILD=1 into a temp dir (never dist/), serves it, screenshots #<id>.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['home', 'dream-pivot', 'teamboard', 'goparty', 'privacy'];
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = join(root, 'public/og');
const tmp = mkdtempSync(join(tmpdir(), 'og-build-'));
const PORT = Number(process.env.OG_PORT || 4410);

const build = spawnSync('npx', ['astro', 'build', '--outDir', tmp], { cwd: root, stdio: 'inherit', env: { ...process.env, OG_BUILD: '1' } });
if (build.status !== 0) process.exit(build.status ?? 1);

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(tmp, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

mkdirSync(out, { recursive: true });
let failed = false;
for (const id of ids) {
  const file = join(out, `${id}.png`);
  const status = await new Promise((done) => {
    const child = spawn(chrome, [
      '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1', '--virtual-time-budget=6000',
      `--screenshot=${file}`, '--window-size=1200,630', `http://127.0.0.1:${PORT}/og-template/#${id}`,
    ], { stdio: 'ignore' });
    child.on('exit', done);
  });
  const r = { status };
  if (r.status !== 0 || !existsSync(file)) { console.error(`og: failed ${id}`); failed = true; } else console.log(`og: public/og/${id}.png`);
}
server.close();
rmSync(tmp, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
