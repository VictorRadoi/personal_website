/**
 * Entrances (design-system §11.3). OWNER: Agent A.
 *
 * - [data-reveal=place|draw|swipe|stamp] that start BELOW the fold get `.reveal-armed`, then `.is-revealed`
 *   when they scroll into view (IntersectionObserver; 15% visible with a 15% bottom margin, stamps 50%).
 *   Anything already in (or above) the first viewport is left complete: nothing visible is ever hidden.
 * - Revealed ids (data-reveal-id) are remembered for the session; a returning visitor sees the finished state.
 * - Hero load sequence: [data-onload-seq][data-seq=1..4] after document.fonts.ready:
 *   1 highlighter swipe (+300ms), 2 hero note draws (+760ms), 3 to-do ticks (+1500ms, 220ms apart),
 *   4 the to-do pen circle (+2000ms). Elements with data-onload-seq are never IO-observed.
 * - Reduced motion, no IntersectionObserver or no JS: nothing is armed. The sequence elements are marked
 *   revealed at once so the pen circle shows complete.
 * Contract: no-op without selectors, idempotent, never throws on missing storage.
 */
const KEY = 'rv.revealed';
const HERO_KEY = 'hero-seq';

let started = false;
let seen: Set<string> | null = null;

function loadSeen(): Set<string> {
  if (seen) return seen;
  seen = new Set();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) for (const id of JSON.parse(raw) as string[]) seen.add(id);
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return seen;
}

function remember(id: string | undefined): void {
  if (!id) return;
  try {
    const set = loadSeen();
    set.add(id);
    sessionStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* storage unavailable */
  }
}

/** will-change only while the entrance runs (design-system §11.4). */
function busy(el: HTMLElement, ms: number): void {
  try {
    el.style.willChange = el.dataset.reveal === 'place' ? 'transform, opacity' : 'auto';
    window.setTimeout(() => el.style.removeProperty('will-change'), ms);
  } catch {
    /* ignore */
  }
}

function reveal(el: HTMLElement): void {
  requestAnimationFrame(() => {
    el.classList.add('is-revealed');
    el.classList.remove('reveal-armed');
    busy(el, 1400);
  });
}

function heroSequence(reduce: boolean): void {
  const seq = Array.from(document.querySelectorAll<HTMLElement>('[data-onload-seq]'));
  if (!seq.length) return;
  const finish = () => seq.forEach((el) => el.classList.add('is-revealed'));
  if (reduce || loadSeen().has(HERO_KEY)) return finish();

  const by = (n: string) => seq.filter((el) => el.dataset.seq === n);
  seq.forEach((el) => el.classList.add('reveal-armed'));
  const at = (ms: number, els: HTMLElement[]) =>
    window.setTimeout(() => els.forEach((el) => reveal(el)), ms);

  let started = false;
  const play = () => {
    if (started) return;
    started = true;
    at(300, by('1'));
    at(760, by('2'));
    by('3').forEach((el, i) => at(1500 + i * 220, [el]));
    at(2000, by('4'));
    window.setTimeout(() => remember(HERO_KEY), 2400);
  };
  // Fonts first so the highlighter measures the final text; never wait longer than 2s.
  const timeout = window.setTimeout(play, 2000);
  const go = () => {
    window.clearTimeout(timeout);
    play();
  };
  if (document.fonts?.ready) document.fonts.ready.then(go, go);
  else go();
}

function scrollReveals(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-onload-seq])'));
  if (!els.length) return;
  const done = loadSeen();
  const body = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        body.unobserve(el);
        reveal(el);
        remember(el.dataset.revealId);
      }
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 0.15 },
  );
  const stamps = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        stamps.unobserve(el);
        reveal(el);
        remember(el.dataset.revealId);
      }
    },
    { threshold: 0.5 },
  );
  for (const el of els) {
    const id = el.dataset.revealId;
    if (id && done.has(id)) continue; // seen this session: stays complete
    const r = el.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) continue; // hidden at this width (mobile caption presets)
    if (r.top < window.innerHeight) {
      remember(id);
      continue; // already in the first viewport (or above it): complete at rest
    }
    el.classList.add('reveal-armed');
    (el.dataset.reveal === 'stamp' ? stamps : body).observe(el);
  }
}

export function init(): void {
  if (started) return;
  started = true;
  try {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      document.querySelectorAll<HTMLElement>('[data-onload-seq]').forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    heroSequence(false);
    scrollReveals();
  } catch {
    /* entrances are decoration: never break the page */
    document.querySelectorAll('.reveal-armed').forEach((el) => {
      el.classList.remove('reveal-armed');
      el.classList.add('is-revealed');
    });
  }
}
