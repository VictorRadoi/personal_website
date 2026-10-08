/**
 * OWNER: Agent C. Header + menu behaviour (site-spec §2, design-system §11.3).
 * - [data-headroom]: .is-scrolled after 8px (rule line); .is-hidden after 120px of continuous downward
 *   scroll, removed on any upward scroll. Never hidden with reduced motion, while the menu is open or
 *   while focus is inside the header. Passive scroll listener batched in rAF.
 * - #menu (popover): hidden when one of its links is followed (same-page anchors included), and when
 *   keyboard focus leaves it (the sheet covers the page, so focus must never move behind it).
 * Contract: no-ops when selectors are absent, idempotent, never throws.
 */
let started = false;

const HIDE_AFTER = 120;
const SCROLLED_AT = 8;

function isOpen(menu: HTMLElement | null): boolean {
  try {
    return Boolean(menu?.matches(':popover-open'));
  } catch {
    return false;
  }
}

export function init(): void {
  if (started) return;
  started = true;

  const menu = document.getElementById('menu');
  menu?.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!link || !isOpen(menu)) return;
    try {
      menu.hidePopover();
    } catch {
      /* not a popover in this browser */
    }
  });

  menu?.addEventListener('focusout', (event) => {
    const to = event.relatedTarget;
    if (!(to instanceof Node) || menu.contains(to) || !isOpen(menu)) return;
    if (to instanceof Element && to.matches('[popovertarget="menu"]')) return; // the toggle closes it itself
    try {
      menu.hidePopover();
    } catch {
      /* not a popover in this browser */
    }
  });

  const header = document.querySelector<HTMLElement>('[data-headroom]');
  if (!header) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY = Math.max(0, window.scrollY);
  let travelled = 0;
  let queued = false;

  const show = () => {
    travelled = 0;
    header.classList.remove('is-hidden');
  };

  const update = () => {
    queued = false;
    const y = Math.max(0, window.scrollY);
    const dy = y - lastY;
    lastY = y;
    header.classList.toggle('is-scrolled', y > SCROLLED_AT);
    if (reduce.matches || isOpen(menu) || header.contains(document.activeElement)) {
      show();
      return;
    }
    if (dy > 0) {
      travelled += dy;
      if (travelled >= HIDE_AFTER && y > header.offsetHeight) header.classList.add('is-hidden');
    } else if (dy < 0) {
      show();
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    },
    { passive: true },
  );
  header.addEventListener('focusin', show);
  menu?.addEventListener('toggle', show);
  update();
}
