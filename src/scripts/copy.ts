/**
 * Copy buttons (button[data-copy]). OWNER: Agent A.
 * Success: the label becomes data-copy-done for ~1.8s, a polite status is announced and
 * track('email_copy', { location: data-copy-location }) fires.
 * Failure (no clipboard API / blocked): the nearest .selectable text is selected and data-copy-failed
 * appears in the sibling [role=status].
 * Contract: no-op without selectors, idempotent, never throws on missing APIs.
 */
import { track } from './analytics';

let started = false;
const timers = new WeakMap<HTMLElement, number>();

function statusOf(btn: HTMLElement): HTMLElement | null {
  return btn.parentElement?.querySelector<HTMLElement>('[role="status"]') ?? null;
}

function selectText(btn: HTMLElement): void {
  const scope = btn.closest('.copy-field') ?? btn.parentElement;
  const target = scope?.querySelector<HTMLElement>('.selectable') ?? document.querySelector<HTMLElement>('.selectable');
  const sel = window.getSelection?.();
  if (!target || !sel) return;
  const range = document.createRange();
  range.selectNodeContents(target);
  sel.removeAllRanges();
  sel.addRange(range);
}

async function copy(btn: HTMLElement): Promise<void> {
  const value = btn.dataset.copy ?? '';
  const status = statusOf(btn);
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      ok = true;
    }
  } catch {
    ok = false;
  }

  window.clearTimeout(timers.get(btn));
  if (ok) {
    // Swap the visible label via data-state (both labels are always laid out, so width never changes).
    btn.dataset.state = 'done';
    if (status) {
      delete status.dataset.tone;
      status.textContent = btn.dataset.copyDone ?? 'Copied';
    }
    track('email_copy', { location: btn.dataset.copyLocation });
    timers.set(
      btn,
      window.setTimeout(() => {
        delete btn.dataset.state;
        if (status) status.textContent = '';
      }, 1800),
    );
  } else {
    selectText(btn);
    if (status) {
      status.dataset.tone = 'error';
      status.textContent = btn.dataset.copyFailed ?? '';
    }
  }
}

export function init(): void {
  if (started) return;
  started = true;
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest<HTMLElement>('button[data-copy]');
    if (btn) void copy(btn);
  });
}
