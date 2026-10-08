/**
 * Custom cursor (design-system §12). OWNER: Agent B.
 *
 * html.has-cursor (which hides the native cursor) is set only while ALL hold:
 *   (hover: hover) and (pointer: fine) · the latest pointer event came from a mouse (touch/pen switch it
 *   off instantly) · localStorage.cursor_pref !== 'plain' · no top-layer element (modal dialog, popover)
 *   is open (the cursor layer cannot paint above the top layer, so the native cursor takes over).
 * States come from the closest [data-cursor] on pointerover; inputs, .selectable and
 * [data-cursor="native"] hide the custom cursor (native I-beam). Tracking is 1:1, one write per frame.
 * Writes styles only through the CSSOM (CSP). Storage access never throws.
 *
 * Public API (egg.ts, loupe.ts, lightbox.ts, magnetic.ts):
 *   setMirror(entry, rect) · clearMirror(instant?) · mirrorPoint() · showLoupe(img, x, y, mode?) ·
 *   hideLoupe() · isOn() · refresh() · store
 */
import { track } from './analytics';

export interface Point {
  x: number;
  y: number;
}

type State = 'idle' | 'link' | 'open' | 'zoom' | 'cta' | 'native' | 'mirror';
type Pref = 'fancy' | 'plain';

/** localStorage / sessionStorage that never throws (private mode, blocked site data). */
export const store = {
  get(key: string, session = false): string | null {
    try {
      return (session ? sessionStorage : localStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string, session = false): void {
    try {
      (session ? sessionStorage : localStorage).setItem(key, value);
    } catch {
      /* storage unavailable: the value lasts for this page only */
    }
  },
};

const PREF_KEY = 'cursor_pref';
const HINT_KEY = 'loupe_hints';
const ZOOM = 2.2;
const EDGE = 6; // mirrored dot stays this far inside the zone
const NATIVE = 'input, textarea, [contenteditable]:not([contenteditable="false"]), .selectable, [data-cursor="native"]';
const STATES = new Set<string>(['link', 'open', 'zoom', 'cta', 'native']);

const doc = document;
const root = doc.documentElement;
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

let el: HTMLElement | null = null;
let label: HTMLElement | null = null;
let loupe: HTMLElement | null = null;
let pref: Pref = 'fancy';
let on = false;
let mouse = false;
let suspended = false;
let state: State = 'idle';
let x = -200;
let y = -200;
let raf = 0;
let uhohT = 0;
let snapT = 0;
let mirror: { ex: number; ey: number; rect: DOMRect; dx: number; dy: number } | null = null;
let lens: { img: HTMLImageElement; x: number; y: number; half: number; touch: boolean } | null = null;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const cssUrl = (src: string) => `url("${src.replace(/["\\\n]/g, '')}")`;

/* --------------------------------- rendering --------------------------------- */

function render(): void {
  raf = 0;
  if (!el) return;
  let px = x;
  let py = y;
  if (lens?.touch) {
    px = lens.x;
    py = lens.y - 96; // the loupe floats above the finger
  } else if (mirror) {
    const r = mirror.rect;
    px = mirror.dx = clamp(2 * mirror.ex - x, r.left + EDGE, r.right - EDGE);
    py = mirror.dy = clamp(2 * mirror.ey - y, r.top + EDGE, r.bottom - EDGE);
  }
  el.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  if (lens && loupe) {
    const r = lens.img.getBoundingClientRect();
    const lx = lens.touch ? lens.x : x;
    const ly = lens.touch ? lens.y : y;
    loupe.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
    loupe.style.backgroundPosition = `${lens.half - (lx - r.left) * ZOOM}px ${lens.half - (ly - r.top) * ZOOM}px`;
  }
}

function schedule(): void {
  if (!raf) raf = requestAnimationFrame(render);
}

function setState(next: State, text?: string): void {
  if (next !== 'zoom' && lens && !lens.touch) dropLens();
  if (next === state && !text) return;
  state = next;
  if (!el) return;
  el.dataset.state = next;
  if (next === 'open' && text && label && label.textContent !== text) label.textContent = text;
}

/** Applies the on/off rule (§12.1). */
function update(): void {
  const next = mouse && pref === 'fancy' && fine.matches && !suspended;
  if (next === on) return;
  on = next;
  root.classList.toggle('has-cursor', on);
  if (!on && !lens?.touch) {
    clearMirror(true);
    setState('idle');
  }
}

/** Re-checks the top layer (lightbox dialog, menu popover). Call after showModal()/close(). */
export function refresh(): void {
  let open = false;
  try {
    open = !!doc.querySelector(':modal, :popover-open');
  } catch {
    open = !!doc.querySelector('dialog[open]');
  }
  suspended = open;
  update();
}

export function isOn(): boolean {
  return on;
}

/* --------------------------------- mirror (egg.ts) --------------------------------- */

/** Start (or re-anchor) mirror mode: the cursor is drawn at clamp(2E − P, rect). */
export function setMirror(entry: Point, rect: DOMRect): void {
  if (!el || !on) return;
  const first = !mirror;
  mirror = { ex: entry.x, ey: entry.y, rect, dx: entry.x, dy: entry.y };
  if (first) {
    setState('mirror');
    el.classList.add('show-uhoh');
    clearTimeout(uhohT);
    uhohT = window.setTimeout(() => el?.classList.remove('show-uhoh'), 1200);
  }
  schedule();
}

/** Leave mirror mode; the cursor springs back to the real pointer unless `instant` (or reduced motion). */
export function clearMirror(instant = false): void {
  if (!mirror || !el) return;
  mirror = null;
  clearTimeout(uhohT);
  el.classList.remove('show-uhoh');
  setState('idle');
  if (!instant && !reduce.matches) {
    el.classList.add('snapback');
    clearTimeout(snapT);
    snapT = window.setTimeout(() => el?.classList.remove('snapback'), 240);
  }
  schedule();
}

/** Where the mirrored cursor is drawn right now (null outside mirror mode). */
export function mirrorPoint(): Point | null {
  return mirror ? { x: mirror.dx, y: mirror.dy } : null;
}

/* --------------------------------- loupe (loupe.ts) --------------------------------- */

function dropLens(): void {
  lens = null;
  if (loupe) loupe.style.backgroundImage = '';
}

/**
 * Show the loupe for `img` at viewport point (x, y). 'pointer' follows the mouse (zoom state);
 * 'touch' shows the 120px loupe 96px above the finger, even when the custom cursor is off.
 */
export function showLoupe(img: HTMLImageElement, px: number, py: number, mode: 'pointer' | 'touch' = 'pointer'): void {
  if (!el || !loupe) return;
  const touch = mode === 'touch';
  if (lens?.img !== img || lens.touch !== touch) {
    const src = img.closest<HTMLElement>('[data-zoom]')?.dataset.zoomSrc;
    const shown = img.currentSrc || img.src;
    // The large file paints over the already-loaded thumbnail as soon as it arrives.
    loupe.style.backgroundImage = [src, shown].filter(Boolean).map((s) => cssUrl(s as string)).join(', ');
    el.classList.toggle('is-touch-loupe', touch);
    lens = { img, x: px, y: py, half: 0, touch };
    setState('zoom');
    lens.half = loupe.clientWidth / 2;
  }
  lens.x = px;
  lens.y = py;
  schedule();
}

export function hideLoupe(): void {
  if (!lens) return;
  const touch = lens.touch;
  dropLens();
  if (touch) el?.classList.remove('is-touch-loupe');
  if (state === 'zoom') setState('idle');
}

/* --------------------------------- events --------------------------------- */

function onMove(e: PointerEvent): void {
  if (e.pointerType !== 'mouse') {
    mouse = false;
    update();
    return;
  }
  const was = on;
  mouse = true;
  update();
  el?.classList.remove('is-away');
  x = e.clientX;
  y = e.clientY;
  if (!on) return;
  if (!was) onOver(e); // first mouse move: pick up the state under the pointer
  schedule();
}

function onDown(e: PointerEvent): void {
  if (e.pointerType !== 'mouse') {
    mouse = false;
    update();
    return;
  }
  if (!el || !on) return;
  el.classList.add('is-down');
  if (reduce.matches) return;
  el.classList.remove('blot');
  void el.offsetWidth; // restart the ink-blot ring
  el.classList.add('blot');
}

function onOver(e: PointerEvent): void {
  if (!el || e.pointerType !== 'mouse' || mirror) return;
  const t = e.target instanceof Element ? e.target : null;
  if (!t) return;
  el.classList.toggle('on-night', !!t.closest('.surface-night'));
  if (t.closest(NATIVE)) return setState('native');
  const c = t.closest<HTMLElement>('[data-cursor]');
  const kind = c?.dataset.cursor ?? '';
  if (!c || !STATES.has(kind)) return setState('idle');
  if (kind === 'open' || kind === 'visit') {
    return setState('open', c.dataset.cursorLabel || (kind === 'visit' ? el.dataset.labelVisit : el.dataset.labelOpen));
  }
  if (kind === 'zoom') {
    const img = c.querySelector('img');
    if (!img || !on) return setState('idle');
    if (lens?.img !== img) {
      const seen = Number(store.get(HINT_KEY, true)) || 0;
      el.classList.toggle('show-hint', seen < 2);
      if (seen < 2) store.set(HINT_KEY, String(seen + 1), true);
    }
    return showLoupe(img, e.clientX, e.clientY);
  }
  setState(kind as State);
}

function paintToggles(): void {
  for (const b of doc.querySelectorAll<HTMLElement>('[data-cursor-toggle]')) {
    const fancy = pref === 'fancy';
    const text = fancy ? b.dataset.labelFancy : b.dataset.labelPlain;
    if (text) b.textContent = text;
    b.setAttribute('aria-pressed', String(fancy));
  }
}

function onClick(e: MouseEvent): void {
  const t = e.target instanceof Element ? e.target.closest('[data-cursor-toggle]') : null;
  if (!t) return;
  pref = pref === 'fancy' ? 'plain' : 'fancy';
  store.set(PREF_KEY, pref);
  paintToggles();
  update();
  track('cursor_pref_change', { fancy: pref === 'fancy' });
}

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  pref = store.get(PREF_KEY) === 'plain' ? 'plain' : 'fancy';
  paintToggles();
  doc.addEventListener('click', onClick);

  el = doc.querySelector<HTMLElement>('.cursor');
  if (!el) return;
  label = el.querySelector('.cursor__label');
  loupe = el.querySelector('.cursor__loupe');

  const opts = { passive: true } as const;
  addEventListener('pointermove', onMove, opts);
  addEventListener('pointerdown', onDown, opts);
  const up = () => el?.classList.remove('is-down');
  addEventListener('pointerup', up, opts);
  addEventListener('pointercancel', up, opts);
  doc.addEventListener('pointerover', onOver, opts);
  // Leaving the window hides the cursor; it comes back on the next move.
  doc.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget && e.pointerType === 'mouse') el?.classList.add('is-away');
  }, opts);
  fine.addEventListener?.('change', update);
  // Popovers fire `toggle`, dialogs `close` (neither bubbles: listen in the capture phase).
  doc.addEventListener('toggle', refresh, true);
  doc.addEventListener('close', refresh, true);
  // Back/forward cache: start clean, hidden until the next move.
  addEventListener('pageshow', (e) => {
    if (!e.persisted || !el) return;
    clearMirror(true);
    hideLoupe();
    setState('idle');
    el.classList.add('is-away');
    refresh();
  });
}
