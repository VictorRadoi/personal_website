/**
 * POST /api/brief (multipart/form-data), the contract shared with the Worker (worker/**):
 *   answers   JSON { building: string[], stage: string, features: string[], kind: string[], timing: string,
 *             notes: string, link: string } — values are the visible option labels
 *   summary   the (edited) plain-language brief, ≤ 4000 chars
 *   name, email (required) · company, whatsapp (optional)
 *   sketch    optional PNG (≤ 1.5 MB) · photo  optional JPEG (≤ 2 MB, downscaled client-side)
 *   cf-turnstile-response · website (honeypot, empty)
 * Responses: 200 {ok:true} · 400 invalid · 403 turnstile · 429 rate_limited · 502 email_failed.
 * Anything else (offline, timeout, 404/405/5xx without JSON) is reported as "network".
 *
 * Dev only (`astro dev` has no Worker): a 404 is answered by a mock after logging the payload;
 * add ?mock=invalid|turnstile|rate_limited|email_failed|network to the URL to see an error state.
 * import.meta.env.DEV is false in builds, so none of that ships.
 */
import { BRIEF_ENDPOINT } from '../../config';

export type SendError = 'invalid' | 'turnstile' | 'rate_limited' | 'email_failed' | 'network';
export type SendResult = { ok: true } | { ok: false; error: SendError };

const KNOWN = new Set<string>(['invalid', 'turnstile', 'rate_limited', 'email_failed']);
const TIMEOUT = 30_000;

function byStatus(status: number): SendError {
  if (status === 429) return 'rate_limited';
  if (status === 403) return 'turnstile';
  if (status === 400 || status === 413) return 'invalid';
  if (status === 502) return 'email_failed';
  return 'network';
}

export async function send(body: FormData): Promise<SendResult> {
  if (import.meta.env.DEV) {
    const shown: Record<string, unknown> = {};
    body.forEach((v, k) => {
      shown[k] = typeof v === 'string' ? (k === 'answers' ? JSON.parse(v) : v) : `${v.type}, ${v.size} bytes`;
    });
    console.info('[brief] POST', BRIEF_ENDPOINT, shown);
  }

  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), TIMEOUT);
  let res: Response;
  try {
    res = await fetch(BRIEF_ENDPOINT, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: ctl.signal,
    });
  } catch {
    return { ok: false, error: 'network' };
  } finally {
    window.clearTimeout(timer);
  }

  if (import.meta.env.DEV && res.status === 404) {
    const mock = new URLSearchParams(location.search).get('mock');
    await new Promise((r) => setTimeout(r, 700));
    return mock ? { ok: false, error: (KNOWN.has(mock) ? mock : 'network') as SendError } : { ok: true };
  }

  let json: { ok?: unknown; error?: unknown } = {};
  try {
    json = await res.json();
  } catch {
    /* not JSON (static 404/405 page, proxy error) */
  }
  if (res.ok && json.ok === true) return { ok: true };
  const error = typeof json.error === 'string' && KNOWN.has(json.error) ? (json.error as SendError) : byStatus(res.status);
  return { ok: false, error };
}
