/**
 * The consent slip (design-system §14). OWNER: Agent B.
 * - [data-consent-slip] (banner, rendered `hidden`): shown 1.2s after `load` when consent.needsChoice()
 *   (no choice, or older than 12 months). Not modal: no backdrop, no scroll lock, no focus trap.
 * - [data-consent-choice="granted"|"denied"] (banner + privacy page inline control) → consent.grant() /
 *   deny() (Consent Mode update + site:consent event, consent.ts); the banner slides out and focus goes
 *   back to where it was before it entered the slip.
 * - [data-consent-open] (footer "Cookie settings", a real link to /privacy/#consent-choice without JS):
 *   preventDefault, reopen the banner with its status line and move focus into it. Esc closes it.
 * - [data-consent-status] lines (data-status-on / data-status-off) follow the current choice.
 */
import { consent, type ConsentState } from './consent';

const SHOW_DELAY = 1200;
const LEAVE_MS = 200;

let started = false;

export function init(): void {
  if (started) return;
  started = true;
  const doc = document;
  const slip = doc.querySelector<HTMLElement>('[data-consent-slip]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current: ConsentState | null = consent.get();
  let returnTo: HTMLElement | null = null;
  let leaveT = 0;
  let chosen = false;

  const paint = () => {
    for (const line of doc.querySelectorAll<HTMLElement>('[data-consent-status]')) {
      const inBanner = !!slip?.contains(line);
      line.textContent = (current === 'granted' ? line.dataset.statusOn : line.dataset.statusOff) ?? '';
      // The banner states the current choice only when reopened; the inline control always does.
      if (!inBanner) line.hidden = false;
    }
  };
  paint();

  if (!slip) {
    doc.addEventListener('site:consent', (e) => {
      current = (e as CustomEvent<ConsentState>).detail;
      paint();
    });
    doc.addEventListener('click', choose);
    return;
  }
  const bannerStatus = slip.querySelector<HTMLElement>('[data-consent-status]');

  function show(withStatus: boolean): void {
    clearTimeout(leaveT);
    if (bannerStatus) bannerStatus.hidden = !(withStatus && current);
    const wasHidden = slip!.hidden;
    slip!.classList.remove('is-leaving');
    slip!.hidden = false;
    if (wasHidden && !reduce.matches) {
      slip!.classList.remove('is-entering');
      void slip!.offsetWidth; // restart the entrance
      slip!.classList.add('is-entering');
    }
  }

  function hide(): void {
    if (slip!.hidden) return;
    const hadFocus = slip!.contains(doc.activeElement);
    slip!.classList.remove('is-entering');
    slip!.classList.add('is-leaving');
    leaveT = window.setTimeout(() => {
      slip!.hidden = true;
      slip!.classList.remove('is-leaving');
    }, reduce.matches ? 0 : LEAVE_MS);
    if (hadFocus) {
      if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
      else (doc.activeElement as HTMLElement | null)?.blur();
    }
    returnTo = null;
  }

  function choose(e: Event): void {
    const b = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-consent-choice]') : null;
    if (!b) return;
    if (b.dataset.consentChoice === 'granted') consent.grant();
    else if (b.dataset.consentChoice === 'denied') consent.deny();
  }

  doc.addEventListener('click', (e) => {
    choose(e);
    const opener = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-consent-open]') : null;
    if (!opener || (e as MouseEvent).button > 0 || (e as MouseEvent).metaKey || (e as MouseEvent).ctrlKey) return;
    e.preventDefault();
    returnTo = opener;
    show(true);
    slip.focus({ preventScroll: true });
  });

  doc.addEventListener('site:consent', (e) => {
    current = (e as CustomEvent<ConsentState>).detail;
    chosen = true;
    paint();
    hide();
  });

  // Remember where focus came from, so a choice can hand it back.
  slip.addEventListener('focusin', (e) => {
    const from = e.relatedTarget;
    if (from instanceof HTMLElement && !slip.contains(from) && !returnTo) returnTo = from;
  });
  slip.addEventListener('focusout', (e) => {
    const to = e.relatedTarget;
    if (to instanceof Node && !slip.contains(to)) returnTo = null;
  });
  slip.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  if (!consent.needsChoice()) return;
  // Skip the first-visit slip if a choice was made in the meantime (e.g. on the privacy page).
  const later = () => window.setTimeout(() => !chosen && show(false), SHOW_DELAY);
  if (doc.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}
