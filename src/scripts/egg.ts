/**
 * The upside-down note (design-system §12.6). OWNER: Agent B. Booted by UpsideDownNote.astro (home).
 *
 * Mouse + fancy cursor: entering [data-egg-zone] records E; the cursor is drawn at clamp(2E − P) (a
 *   point reflection, i.e. motion turned 180° like the note; cursor.setMirror). The zone takes the
 *   clicks: a press counts only if the mirrored dot is on [data-egg-button]. Leaving springs the cursor
 *   back; Esc does the same and the zone ignores the pointer until the next exit and re-entry.
 * Touch: a tap shows "press and hold, then drag"; a 300ms hold (cancelled by > 8px of movement first,
 *   so scrolling works) starts mirror mode: touchmove is prevented only while active and a red dot is
 *   drawn at 2E − P. Lifting with the dot on the button wins; elsewhere the dot springs back and fades.
 * Keyboard / screen readers (detail 0 click) and the plain cursor (a normal click): the real button.
 * Hint after 3 misses or 10s inside. Success: easter_egg_found, the note pivots upright (150ms fade
 * with reduced motion), the back is announced, localStorage egg_upside_down=found (later visits start
 * upright with the FOUND stamp). easter_egg_enter once per session on the first mirror entry.
 */
import { track } from './analytics';
import { clearMirror, isOn, mirrorPoint, setMirror, store } from './cursor';

const FOUND_KEY = 'egg_upside_down';
const ENTER_KEY = 'egg_entered';
const HOLD = 300;
const SLOP = 8;
const HINT_AFTER = 10_000;
const MISSES = 3;
const EDGE = 6;

type Input = 'mouse' | 'touch' | 'keyboard' | 'plain';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  const zone = document.querySelector<HTMLElement>('[data-egg-zone]');
  const btn = zone?.querySelector<HTMLButtonElement>('[data-egg-button]');
  const back = zone?.querySelector<HTMLElement>('[data-egg-back]');
  if (!zone || !btn || !back) return;
  const note = zone.querySelector<HTMLElement>('.sticky-note');
  const hint = zone.querySelector<HTMLElement>('[data-egg-hint]');
  const dot = zone.querySelector<HTMLElement>('[data-egg-dot]');
  if (dot) document.body.append(dot); // position: fixed must mean the viewport
  const text = zone.dataset;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  if (text.eggConsole) console.log(text.eggConsole);

  let found = store.get(FOUND_KEY) === 'found';
  let misses = 0;
  let firstAt = 0;
  let hintT = 0;
  let ignore = false; // after Esc, until the pointer leaves the zone
  let mirroring = false;
  let entry = { x: 0, y: 0 };
  let rect = zone.getBoundingClientRect();
  let tapAt = -1e9; // time of the last touch tap on the zone

  const showHint = (msg = text.eggHintText) => {
    if (found || !hint || !msg) return;
    hint.textContent = msg;
    zone.classList.add('show-hint');
  };

  const entered = (input: 'mouse' | 'touch') => {
    firstAt ||= performance.now();
    if (store.get(ENTER_KEY, true)) return;
    store.set(ENTER_KEY, '1', true);
    track('easter_egg_enter', { egg: 'upside_down', input });
  };

  const flip = (animate: boolean) => {
    zone.classList.toggle('no-anim', !animate || reduce.matches);
    zone.classList.remove('show-hint', 'mirror-on');
    zone.classList.add('is-found');
    back.hidden = false;
    if (animate && reduce.matches) note?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'linear' });
  };
  if (found) flip(false);

  /* ---------------- mirror (mouse) ---------------- */

  const startMirror = (e: PointerEvent) => {
    if (found || ignore || mirroring || !isOn()) return;
    mirroring = true;
    entry = { x: e.clientX, y: e.clientY };
    rect = zone.getBoundingClientRect();
    setMirror(entry, rect);
    zone.classList.add('mirror-on');
    entered('mouse');
    clearTimeout(hintT);
    hintT = window.setTimeout(() => showHint(), HINT_AFTER);
  };

  const endMirror = (instant = false) => {
    if (!mirroring) return;
    mirroring = false;
    zone.classList.remove('mirror-on');
    clearTimeout(hintT);
    clearMirror(instant);
  };

  const success = (input: Input) => {
    if (found) return;
    found = true;
    const hadFocus = zone.contains(document.activeElement);
    endMirror(true);
    clearTimeout(hintT);
    flip(true);
    store.set(FOUND_KEY, 'found');
    track('easter_egg_found', {
      egg: 'upside_down',
      attempts: misses + 1,
      seconds: Math.round((performance.now() - firstAt) / 1000),
      input,
    });
    if (hadFocus) {
      // The button is gone: move focus to the message so keyboard users keep their place.
      back.tabIndex = -1;
      back.focus({ preventScroll: true });
    } else if (hint) {
      hint.textContent = back.textContent; // announce (aria-live); the hint itself stays invisible
      window.setTimeout(() => (hint.textContent = ''), 5000);
    }
  };

  const miss = () => {
    if (++misses >= MISSES) showHint();
  };

  zone.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && startMirror(e));
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (mirroring && !isOn()) endMirror(true); // switched to plain / touch meanwhile
    else startMirror(e); // e.g. the cursor turned on while already inside
  }, { passive: true });
  zone.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    ignore = false;
    endMirror();
  });
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return endMirror(true);
    if (!mirroring || e.button !== 0) return;
    e.preventDefault();
    const p = mirrorPoint();
    const r = btn.getBoundingClientRect();
    if (p && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom) success('mouse');
    else miss();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !mirroring) return;
    ignore = true;
    endMirror();
  });
  // Scrolling (wheel) while inside: keep E and the zone box attached to the page.
  addEventListener('scroll', () => {
    if (!mirroring) return;
    const r = zone.getBoundingClientRect();
    entry = { x: entry.x + r.left - rect.left, y: entry.y + r.top - rect.top };
    rect = r;
    setMirror(entry, rect);
  }, { passive: true });

  /* ---------------- the real button: keyboard, screen readers, plain cursor ---------------- */

  btn.addEventListener('click', (e) => {
    if (found) return;
    if (e.detail === 0) return success('keyboard'); // Enter / Space / assistive tech
    if (performance.now() - tapAt < 800) return; // a touch tap: that path is long-press + drag
    firstAt ||= performance.now();
    success(isOn() ? 'mouse' : 'plain');
  });

  /* ---------------- touch: long-press, then drag a mirrored dot ---------------- */

  let holdT = 0;
  let holding = false;
  let moved = false;
  let sx = 0;
  let sy = 0;
  let fx = 0;
  let fy = 0;
  let tx = 0;
  let ty = 0;

  const placeDot = (px: number, py: number) => {
    const r = zone.getBoundingClientRect();
    fx = px;
    fy = py;
    tx = clamp(2 * sx - px, r.left + EDGE, r.right - EDGE);
    ty = clamp(2 * sy - py, r.top + EDGE, r.bottom - EDGE);
    if (dot) dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  };

  const dropDot = (springBack: boolean) => {
    if (!dot) return;
    if (!springBack || reduce.matches) {
      dot.classList.remove('is-on', 'is-returning');
      return;
    }
    dot.classList.add('is-returning');
    dot.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
    window.setTimeout(() => dot.classList.remove('is-on', 'is-returning'), 240);
  };

  const cancelHold = () => {
    clearTimeout(holdT);
    if (holding) dropDot(false);
    holding = false;
  };

  zone.addEventListener('touchstart', (e) => {
    if (found || e.touches.length > 1) return cancelHold();
    const p = e.touches[0];
    sx = p.clientX;
    sy = p.clientY;
    moved = false;
    clearTimeout(holdT);
    holdT = window.setTimeout(() => {
      holding = true;
      entered('touch');
      dot?.classList.remove('is-returning');
      dot?.classList.add('is-on');
      placeDot(sx, sy);
    }, HOLD);
  }, { passive: true });

  zone.addEventListener('touchmove', (e) => {
    const p = e.touches[0];
    if (!holding) {
      if (Math.hypot(p.clientX - sx, p.clientY - sy) > SLOP) {
        moved = true;
        clearTimeout(holdT);
      }
      return;
    }
    e.preventDefault(); // only while the mirror is active; scrolling works otherwise
    placeDot(p.clientX, p.clientY);
  }, { passive: false });

  zone.addEventListener('touchend', (e) => {
    clearTimeout(holdT);
    if (!holding) {
      tapAt = performance.now();
      if (!moved) showHint(text.eggTouchHint);
      return;
    }
    if (e.cancelable) e.preventDefault();
    holding = false;
    const r = btn.getBoundingClientRect();
    const hit = tx >= r.left - EDGE && tx <= r.right + EDGE && ty >= r.top - EDGE && ty <= r.bottom + EDGE;
    dropDot(!hit);
    if (hit) success('touch');
    else {
      if (hint && zone.classList.contains('show-hint')) hint.textContent = text.eggHintText ?? '';
      miss();
    }
  });
  zone.addEventListener('touchcancel', cancelHold);
  zone.addEventListener('contextmenu', (e) => {
    if (holding) e.preventDefault();
  });

  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    ignore = false;
    endMirror(true);
    cancelHold();
  });
}
