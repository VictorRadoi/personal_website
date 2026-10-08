/**
 * Magnetic contact CTAs + pen circle (design-system §12.4). OWNER: Agent B.
 * - Every svg.pen-circle (magnetic CTAs, the to-do "your app" link) gets its circleLoose path rewritten
 *   to the measured box (viewBox in px, so the 2px stroke stays even) and .is-scaled; a ResizeObserver
 *   keeps it fitted. Without JS there is no circle (base.css hides unscaled circles).
 * - [data-magnetic] (fancy cursor on, mouse, no reduced motion): within the button rect + 28px the
 *   button is pulled by (pointer − center) × .22 (clamped 8px) and its label by × .12 (clamped 3px),
 *   written as --mx/--my/--lx/--ly (CSSOM only) + .is-tracking; leaving springs back (CSS transition).
 * - [data-cursor="cta"]: .is-circled while a mouse hovers; on touch/pen press .is-circled + .is-pressed
 *   and scale .97, released on pointerup (circle stays briefly as feedback) or cancel (scroll).
 */
import { isOn } from './cursor';

const FIELD = 28;
const PULL = 0.22;
const PULL_MAX = 8;
const LABEL = 0.12;
const LABEL_MAX = 3;
const VARS = ['--mx', '--my', '--lx', '--ly'] as const;

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v)).toFixed(2) + 'px';

/** Map the 0-100 path data onto the svg's real box. */
function fit(svg: SVGSVGElement, w: number, h: number): void {
  if (!w || !h) return;
  for (const p of svg.querySelectorAll('path')) {
    const d = p.dataset.d ?? (p.dataset.d = p.getAttribute('d') ?? '');
    p.setAttribute(
      'd',
      d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, a: string, b: string) => `${((+a * w) / 100).toFixed(1)},${((+b * h) / 100).toFixed(1)}`),
    );
  }
  svg.setAttribute('viewBox', `0 0 ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.removeAttribute('preserveAspectRatio');
  svg.classList.add('is-scaled');
}

function ctaOf(t: EventTarget | null): HTMLElement | null {
  return t instanceof Element ? t.closest<HTMLElement>('[data-cursor="cta"]') : null;
}

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  const doc = document;
  const opts = { passive: true } as const;

  /* ---- pen circles ---- */
  const circles = [...doc.querySelectorAll<SVGSVGElement>('svg.pen-circle')];
  if (circles.length) {
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver((entries) => {
        for (const e of entries) fit(e.target as SVGSVGElement, e.contentRect.width, e.contentRect.height);
      });
      circles.forEach((s) => ro.observe(s));
    } else {
      circles.forEach((s) => fit(s, s.clientWidth, s.clientHeight));
    }
  }

  /* ---- hover / press circle ---- */
  // Only classes added here are removed here (reveal.ts may circle the to-do link for good).
  const circled = new Set<HTMLElement>();
  const circle = (b: HTMLElement, cls: string[]) => {
    if (b.classList.contains('is-circled') && !circled.has(b)) return;
    circled.add(b);
    b.classList.add('is-circled', ...cls);
  };
  const uncircle = (b: HTMLElement) => {
    if (!circled.delete(b)) return;
    b.classList.remove('is-circled', 'is-pressed');
  };
  doc.addEventListener('pointerover', (e) => {
    const b = ctaOf(e.target);
    if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget as Node | null)) circle(b, []);
  }, opts);
  doc.addEventListener('pointerout', (e) => {
    const b = ctaOf(e.target);
    if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget as Node | null)) uncircle(b);
  }, opts);

  let pressed: HTMLElement | null = null;
  let pressT = 0;
  doc.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const b = ctaOf(e.target);
    if (!b) return;
    clearTimeout(pressT);
    if (pressed && pressed !== b) uncircle(pressed);
    pressed = b;
    circle(b, ['is-pressed']);
    b.style.scale = '.97';
  }, opts);
  const release = (keep: boolean) => {
    const b = pressed;
    if (!b) return;
    b.style.scale = '';
    pressed = null;
    if (keep) pressT = window.setTimeout(() => uncircle(b), 900);
    else uncircle(b);
  };
  doc.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && release(true), opts);
  doc.addEventListener('pointercancel', () => release(false), opts);
  addEventListener('pageshow', (e) => e.persisted && circled.forEach(uncircle));

  /* ---- magnetic pull ---- */
  const mags = [...doc.querySelectorAll<HTMLElement>('[data-magnetic]')];
  if (!mags.length) return;
  const tracking = new Set<HTMLElement>();
  let px = 0;
  let py = 0;
  let raf = 0;

  const rest = (b: HTMLElement) => {
    tracking.delete(b);
    b.classList.remove('is-tracking');
    for (const v of VARS) b.style.setProperty(v, '0px');
  };
  const restAll = () => tracking.forEach(rest);

  const frame = () => {
    raf = 0;
    const rects = mags.map((b) => b.getBoundingClientRect()); // all reads, then all writes
    mags.forEach((b, i) => {
      const r = rects[i];
      const inField =
        r.width > 0 && px > r.left - FIELD && px < r.right + FIELD && py > r.top - FIELD && py < r.bottom + FIELD;
      if (!inField) {
        if (tracking.has(b)) rest(b);
        return;
      }
      const dx = px - (r.left + r.width / 2);
      const dy = py - (r.top + r.height / 2);
      if (!tracking.has(b)) {
        tracking.add(b);
        b.classList.add('is-tracking');
      }
      b.style.setProperty('--mx', clamp(dx * PULL, PULL_MAX));
      b.style.setProperty('--my', clamp(dy * PULL, PULL_MAX));
      b.style.setProperty('--lx', clamp(dx * LABEL, LABEL_MAX));
      b.style.setProperty('--ly', clamp(dy * LABEL, LABEL_MAX));
    });
  };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !isOn() || reduce.matches) {
      if (tracking.size) restAll();
      return;
    }
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(frame);
  }, opts);
  doc.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget) restAll(); // pointer left the window
  }, opts);
  addEventListener('pointerdown', (e) => e.pointerType !== 'mouse' && restAll(), opts);
  addEventListener('pageshow', (e) => e.persisted && restAll());
}
