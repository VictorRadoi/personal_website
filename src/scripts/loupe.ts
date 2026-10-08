/**
 * Loupe targets (design-system §12.5). OWNER: Agent B. Booted by Lightbox.astro (project pages).
 * Mouse: cursor.ts draws the loupe over [data-cursor="zoom"] links; this module only reports
 *   screenshot_zoom { method: 'loupe' } once the loupe has stayed on one image for 600ms.
 * Touch: press-and-hold 350ms (cancelled by > 8px of movement first, so scrolling and pinch-zoom
 *   still work) shows a 120px loupe 96px above the finger that follows it; release hides it without
 *   opening the lightbox. A tap opens the lightbox (lightbox.ts). Reports method 'long_press'.
 * Each method is reported at most once per image per page view.
 */
import { track } from './analytics';
import { hideLoupe, isOn, showLoupe } from './cursor';

const HOLD = 350;
const SLOP = 8;
const DWELL = 600;

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  const doc = document;
  const links = doc.querySelectorAll<HTMLAnchorElement>('a[data-zoom]');
  if (!links.length) return;
  const slug = doc.querySelector<HTMLElement>('main[data-slug]')?.dataset.slug;
  const sent = new Set<string>();
  const report = (link: HTMLElement, method: 'loupe' | 'long_press') => {
    const id = link.dataset.imageId ?? '';
    if (sent.has(method + id)) return;
    sent.add(method + id);
    track('screenshot_zoom', { slug, image_id: id, method });
  };
  const zoomOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>('a[data-zoom]') : null);

  /* mouse: dwell ≥ 600ms on one image */
  let dwellT = 0;
  doc.addEventListener('pointerover', (e) => {
    const link = zoomOf(e.target);
    if (!link || e.pointerType !== 'mouse' || link.contains(e.relatedTarget as Node | null)) return;
    clearTimeout(dwellT);
    dwellT = window.setTimeout(() => isOn() && report(link, 'loupe'), DWELL);
  }, { passive: true });
  doc.addEventListener('pointerout', (e) => {
    const link = zoomOf(e.target);
    if (link && !link.contains(e.relatedTarget as Node | null)) clearTimeout(dwellT);
  }, { passive: true });

  /* touch: long-press loupe */
  for (const link of links) {
    const img = link.querySelector('img');
    if (!img) continue;
    let holdT = 0;
    let active = false;
    let sx = 0;
    let sy = 0;
    const stop = () => {
      clearTimeout(holdT);
      if (!active) return false;
      active = false;
      hideLoupe();
      return true;
    };
    link.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) return void stop(); // pinch: leave it to the browser
      const p = e.touches[0];
      sx = p.clientX;
      sy = p.clientY;
      clearTimeout(holdT);
      holdT = window.setTimeout(() => {
        active = true;
        showLoupe(img, sx, sy, 'touch');
        report(link, 'long_press');
      }, HOLD);
    }, { passive: true });
    link.addEventListener('touchmove', (e) => {
      const p = e.touches[0];
      if (!active) {
        if (Math.hypot(p.clientX - sx, p.clientY - sy) > SLOP) clearTimeout(holdT);
        return;
      }
      e.preventDefault(); // the finger drives the loupe, not the page
      showLoupe(img, p.clientX, p.clientY, 'touch');
    }, { passive: false });
    link.addEventListener('touchend', (e) => {
      if (stop() && e.cancelable) e.preventDefault(); // no click → no lightbox after a long-press
    });
    link.addEventListener('touchcancel', stop);
    link.addEventListener('contextmenu', (e) => {
      if (active) e.preventDefault();
    });
  }
}
