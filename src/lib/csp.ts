/**
 * CSP helpers. Astro's security.csp hashes the processed <script>/<style> elements it emits, but NOT
 * `is:inline` scripts (nor `define:vars` output). An inline script must therefore be rendered from an
 * exact string whose hash is registered for the route:
 *
 *   const boot = inlineScript(`console.log(1)`);
 *   Astro.csp?.insertScriptHash(boot.hash);
 *   <script is:inline set:html={boot.code} />
 *
 * Prefer processed <script> tags (bundled + hashed automatically) wherever possible.
 */
import { createHash } from 'node:crypto';

export type CspHash = `sha256-${string}`;

export function sha256(code: string): CspHash {
  return `sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}`;
}

export function inlineScript(code: string): { code: string; hash: CspHash } {
  return { code, hash: sha256(code) };
}
