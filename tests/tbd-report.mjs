#!/usr/bin/env node
/**
 * Prints the facts omitted from the built site under the launch rule (src/content/omissions.yaml),
 * grouped by file, so the owner knows what to send. Also fails (exit 1) if a ⟦TBD⟧ marker or a
 * TBD badge is present in a built page. Usage: node tests/tbd-report.mjs [distDir]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const raw = readFileSync(join(root, 'src/content/omissions.yaml'), 'utf8');

// Minimal parser for the flat "- id/where/what" list (no YAML dependency needed).
const items = [];
for (const line of raw.split('\n')) {
  if (/^\s*#/.test(line) || !line.trim()) continue;
  const m = line.match(/^\s*(-\s+)?(id|where|what):\s*(.*)$/);
  if (!m) continue;
  if (m[1]) items.push({});
  items[items.length - 1][m[2]] = m[3].replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
}

const byFile = new Map();
for (const it of items) {
  const file = (it.where ?? '').split(' → ')[0] || 'other';
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push(it);
}

console.log(`Omitted facts (${items.length}). Send these and they go back into the copy:\n`);
for (const [file, list] of byFile) {
  console.log(file);
  for (const it of list) console.log(`  - [${it.id}] ${it.what}${it.where?.includes('→') ? `  (${it.where.split(' → ')[1]})` : ''}`);
  console.log();
}

// Guard: nothing visible may still say TBD.
const dist = resolve(process.argv[2] ?? join(root, 'dist'));
let bad = 0;
if (existsSync(dist)) {
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.html')) {
        const html = readFileSync(p, 'utf8');
        if (/⟦TBD|class="tbd"|TBD/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) {
          console.error(`TBD marker found in ${p.replace(dist, '')}`);
          bad++;
        }
      }
    }
  };
  walk(dist);
  console.log(bad ? `FAIL: ${bad} page(s) show a TBD marker.` : `OK: no TBD markers in ${dist}.`);
} else console.log(`(no build at ${dist}; skipped the page check)`);
process.exit(bad ? 1 : 0);
