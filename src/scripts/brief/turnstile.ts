/**
 * Cloudflare Turnstile for the brief form, explicit rendering. api.js is injected only when the review
 * step is first shown (never on other pages, never earlier). CSP: script-src + frame-src
 * https://challenges.cloudflare.com (astro.config.mjs). Site key from src/config.ts; on localhost the
 * documented always-pass test key is used (its tokens only verify against the test secret).
 * Tokens are single-use: reset() after every submit attempt that reached the Worker.
 */
import { TURNSTILE_SITE_KEY, TURNSTILE_TEST_SITE_KEY } from '../../config';

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string | undefined;
  reset(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<TurnstileApi> | null = null;
let widget: string | undefined;
let token = '';
let failed = false;
let waiters: [(t: string) => void, () => void][] = [];

function load(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
    s.onerror = () => {
      loading = null;
      s.remove();
      reject(new Error('turnstile'));
    };
    document.head.append(s);
  });
  return loading;
}

function settle(ok: boolean): void {
  const list = waiters;
  waiters = [];
  for (const [resolve, reject] of list) ok ? resolve(token) : reject();
}

/** Render the widget once into `el` (interaction-only: most visitors never see it). */
export async function mount(el: HTMLElement): Promise<void> {
  if (widget !== undefined) return;
  try {
    const api = await load();
    if (widget !== undefined) return;
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    widget = api.render(el, {
      sitekey: local ? TURNSTILE_TEST_SITE_KEY : TURNSTILE_SITE_KEY,
      action: 'brief',
      appearance: 'interaction-only',
      size: 'flexible',
      theme: 'light',
      callback: (t: string) => {
        token = t;
        failed = false;
        settle(true);
      },
      'expired-callback': () => {
        token = '';
      },
      'error-callback': () => {
        token = '';
        failed = true;
        settle(false);
        return true; // handled: show our own message instead of an uncaught error
      },
    });
  } catch {
    failed = true;
    settle(false);
  }
}

/** The current token, or wait for one (rejects when Turnstile failed or nothing arrives in time). */
export function getToken(timeout = 20_000): Promise<string> {
  if (token) return Promise.resolve(token);
  if (failed) return Promise.reject(new Error('turnstile'));
  return new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      waiters = waiters.filter((w) => w[0] !== done);
      reject(new Error('turnstile'));
    }, timeout);
    const done = (t: string) => {
      window.clearTimeout(timer);
      resolve(t);
    };
    waiters.push([
      done,
      () => {
        window.clearTimeout(timer);
        reject(new Error('turnstile'));
      },
    ]);
  });
}

/** Ask for a fresh token (after a submit, or to retry after an error). */
export function reset(el?: HTMLElement): void {
  token = '';
  failed = false;
  if (widget !== undefined) {
    try {
      window.turnstile?.reset(widget);
    } catch {
      /* widget gone */
    }
  } else if (el) {
    void mount(el);
  }
}
