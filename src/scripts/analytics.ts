/**
 * GA4 events (site-spec §9). `track(name, params)` is the only way events are sent; no PII in params.
 * Consent Mode v2 is set inline in Base.astro <head> (denied by default). gtag.js loads only after a "yes"
 * (stored < 12 months, or given on this page), and track() sends nothing without that "yes": no event is
 * sent before consent. The page-load events (page_view, case_study_open, not_found) are held back and sent
 * once if the visitor says yes on this page.
 *
 * Attribute-driven events (site-spec §8), wired once by initAnalytics():
 *   [data-track="<event>"] + [data-track-<param>]  click/auxclick → track(event, params) (kebab → snake_case)
 *   [data-cs-source]                               click → sessionStorage, read as `source` of the next case_study_open
 *   main[data-track-depth][data-slug]              case_study_open on load + project_scroll_depth 25/50/75/100
 *   [data-track-section]                           section_view once per session at ≥ 40% visible
 *   main[data-not-found]                           not_found { path }
 * Other events are fired by their owners: email_copy (copy.ts), screenshot_zoom (loupe/lightbox),
 * easter_egg_* (egg.ts), cursor_pref_change (cursor.ts).
 */
import { consent } from './consent';

export type EventParams = Record<string, string | number | boolean | undefined>;

const debug = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

/** Page-load events held back until a "yes" on this page (then sent once, in order). */
const LOAD_EVENTS = new Set(['page_view', 'case_study_open', 'not_found']);
const heldBack: [string, EventParams][] = [];

/** Safe no-op when analytics is unconfigured (no real GA ID), blocked, or the visitor has not said yes. */
export function track(event: string, params: EventParams = {}): void {
  try {
    const enabled = document.documentElement.dataset.analytics === 'on';
    const granted = consent.isGranted();
    const clean: EventParams = {};
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') clean[k] = v;
    if (debug) console.debug('[track]', event, clean, granted ? '' : '(no consent)', enabled ? '' : '(analytics disabled)');
    if (!granted) {
      if (LOAD_EVENTS.has(event)) heldBack.push([event, clean]);
      return;
    }
    if (!enabled || typeof window.gtag !== 'function') return;
    window.gtag('event', event, clean);
  } catch {
    /* never break the page for analytics */
  }
}

export function trackPageView(): void {
  track('page_view', {
    page_path: location.pathname + location.search,
    page_title: document.title,
    page_location: location.href,
  });
}

/* ------------------------------- storage helpers (never throw) ------------------------------- */

function sessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function sessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
function sessionRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------- click events ------------------------------- */

const PREFIX = 'data-track-';
/** Attributes that look like params but belong to other features. */
const RESERVED = new Set(['data-track-section', 'data-track-depth']);

/** Reads data-track-<param> attributes into { param: value } (kebab → snake_case). */
export function paramsFrom(el: Element): EventParams {
  const params: EventParams = {};
  for (const attr of Array.from(el.attributes)) {
    if (!attr.name.startsWith(PREFIX) || RESERVED.has(attr.name)) continue;
    params[attr.name.slice(PREFIX.length).replace(/-/g, '_')] = attr.value;
  }
  return params;
}

const CS_KEY = 'cs_source';

function slugFromHref(href: string): string | null {
  try {
    const m = new URL(href, location.href).pathname.match(/^\/work\/([^/]+)\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function onClick(e: MouseEvent): void {
  if (e.type === 'auxclick' && e.button !== 1) return; // middle click only
  const target = e.target instanceof Element ? e.target : null;
  if (!target) return;

  const tracked = target.closest('[data-track]');
  if (tracked) {
    const name = tracked.getAttribute('data-track');
    if (name) track(name, paramsFrom(tracked));
  }

  const source = target.closest('a[data-cs-source]');
  if (source) {
    const slug = slugFromHref(source.getAttribute('href') ?? '');
    const value = source.getAttribute('data-cs-source');
    if (slug && value) sessionSet(CS_KEY, JSON.stringify({ slug, source: value }));
  }
}

/* ------------------------------- project pages ------------------------------- */

function initProjectPage(main: HTMLElement): void {
  const slug = main.dataset.slug;
  if (!slug) return;

  // case_study_open: source from the link that brought us here, else "direct".
  let source = 'direct';
  const raw = sessionGet(CS_KEY);
  if (raw) {
    try {
      const saved = JSON.parse(raw) as { slug?: string; source?: string };
      if (saved.slug === slug && saved.source) source = saved.source;
    } catch {
      /* ignore */
    }
    sessionRemove(CS_KEY);
  }
  track('case_study_open', { slug, source });

  // project_scroll_depth: once per threshold per page view.
  const thresholds = [25, 50, 75, 100];
  const sent = new Set<number>();
  let queued = false;
  const measure = () => {
    queued = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - innerHeight;
    const percent = max <= 0 ? 100 : (scrollY / max) * 100;
    for (const t of thresholds) {
      if (percent + 0.5 >= t && !sent.has(t)) {
        sent.add(t);
        track('project_scroll_depth', { slug, percent: t });
      }
    }
    if (sent.size === thresholds.length) removeEventListener('scroll', onScroll);
  };
  const onScroll = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(measure);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  // Short pages may already be fully visible.
  requestAnimationFrame(measure);
}

/* ------------------------------- section views ------------------------------- */

function initSectionViews(): void {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-track-section]'));
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const key = (name: string) => `sv_${name}`;
  const pending = sections.filter((s) => s.dataset.trackSection && !sessionGet(key(s.dataset.trackSection)));
  if (!pending.length) return;

  // "≥ 40% visible": 40% of the section, or 40% of the viewport for sections taller than 2.5 screens.
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const name = el.dataset.trackSection;
        if (!name) continue;
        const visible = entry.intersectionRect.height;
        const needed = Math.min(entry.boundingClientRect.height, innerHeight) * 0.4;
        if (visible < needed) continue;
        io.unobserve(el);
        if (sessionGet(key(name))) continue;
        sessionSet(key(name), '1');
        track('section_view', { section: name });
      }
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
  );
  pending.forEach((s) => io.observe(s));
}

/* ------------------------------- boot ------------------------------- */

let started = false;
/** Call once per page load: page_view, click delegation, project/section/404 events. */
export function initAnalytics(): void {
  if (started) return;
  started = true;
  try {
    trackPageView();
    // A "yes" given on this page counts the page it was given on (once).
    document.addEventListener('site:consent', (e) => {
      if ((e as CustomEvent<string>).detail !== 'granted') return;
      for (const [event, params] of heldBack.splice(0)) track(event, params);
    });
    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('auxclick', onClick, { capture: true });

    const projectMain = document.querySelector<HTMLElement>('main[data-track-depth][data-slug]');
    if (projectMain) initProjectPage(projectMain);

    if (document.querySelector('main[data-not-found]')) track('not_found', { path: location.pathname });

    initSectionViews();
  } catch {
    /* never break the page for analytics */
  }
}

export { consent };
