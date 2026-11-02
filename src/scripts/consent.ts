export type ConsentState = 'granted' | 'denied';

const KEY = 'consent_v1';
/** When the choice was made (ISO 8601). The slip asks again after 12 months (design-system §14).
 * Base.astro's head boot applies the same rule: a saved 'granted' counts (and gtag.js loads) only while
 * the timestamp is younger than 12 months. */
const KEY_AT = 'consent_v1_at';
const MAX_AGE_MONTHS = 12;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag;
    /** Defined by Base.astro's head boot: injects gtag.js once (no-op off the production hosts / without a GA ID). */
    loadGtag?: () => void;
  }
}

/** This page's choice when storage is unavailable (private mode, blocked storage). */
let memory: { v: ConsentState; at: Date } | null = null;

export function get(): ConsentState | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* storage unavailable */
  }
  return memory?.v ?? null;
}

/** When the stored choice was made, or null (none, unreadable, or saved before timestamps existed). */
export function savedAt(): Date | null {
  try {
    const raw = localStorage.getItem(KEY_AT);
    const at = raw ? new Date(raw) : null;
    if (at && !Number.isNaN(at.getTime())) return at;
  } catch {
    /* storage unavailable */
  }
  return memory?.at ?? null;
}

/** True when analytics may run: a stored "yes" younger than 12 months. */
export function isGranted(): boolean {
  return get() === 'granted' && !needsChoice();
}

/** True when the visitor should be asked: no stored choice, no timestamp, or older than 12 months. */
export function needsChoice(): boolean {
  const at = get() ? savedAt() : null;
  if (!at) return true;
  const expires = new Date(at);
  expires.setMonth(expires.getMonth() + MAX_AGE_MONTHS);
  return Date.now() >= expires.getTime();
}

/** Withdrawn consent: remove the GA cookies (_ga, _ga_<id>) on this host and its parent domains. */
function clearAnalyticsCookies(): void {
  try {
    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join('.')}`);
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim();
      if (!/^_ga(_|$)/.test(name)) continue;
      for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d}`;
    }
  } catch {
    /* ignore */
  }
}

function apply(v: ConsentState): void {
  // Only analytics can ever be granted; ad signals stay denied (no ads on this site).
  window.gtag?.('consent', 'update', { analytics_storage: v });
  // Google is contacted only after a "yes": gtag.js is injected now, never before.
  if (v === 'granted') window.loadGtag?.();
  else clearAnalyticsCookies();
  document.dispatchEvent(new CustomEvent('site:consent', { detail: v }));
}

function set(v: ConsentState): void {
  memory = { v, at: new Date() };
  try {
    localStorage.setItem(KEY, v);
    localStorage.setItem(KEY_AT, new Date().toISOString());
  } catch {
    /* storage unavailable: choice lasts for this page only */
  }
  apply(v);
}

export const consent = {
  get,
  savedAt,
  needsChoice,
  isGranted,
  grant: () => set('granted'),
  deny: () => set('denied'),
};
