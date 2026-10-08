/**
 * OWNER: Agent C. Live local-time line ([data-local-time], LocalTime.astro).
 * Text comes from data-tpl-base / data-tpl-asleep (23:00-06:59) with {time} filled, in the element's
 * data-time-zone (config TIME_ZONE, Europe/London). The clock is wrapped in <time datetime="HH:MM">. Updates on the
 * minute boundary and when the tab becomes visible again. Without JS the server fallback stays.
 * Contract: no-ops when the selector is absent, idempotent, never throws.
 */
let started = false;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat | null {
  let fmt = formatters.get(timeZone);
  if (fmt) return fmt;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  } catch {
    return null;
  }
  formatters.set(timeZone, fmt);
  return fmt;
}

function render(els: HTMLElement[]): void {
  const now = new Date();
  for (const el of els) {
    const fmt = formatter(el.dataset.timeZone || 'Europe/London');
    if (!fmt) continue;
    const parts = fmt.formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? NaN) % 24;
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
    if (Number.isNaN(hour) || !minute) continue;
    const time = `${String(hour).padStart(2, '0')}:${minute}`;
    const asleep = hour >= 23 || hour < 7;
    const tpl = (asleep && el.dataset.tplAsleep) || el.dataset.tplBase || '';
    const at = tpl.indexOf('{time}');
    if (at < 0) continue;
    const key = `${tpl}|${time}`;
    if (el.dataset.rendered === key) continue;
    const clock = document.createElement('time');
    clock.dateTime = time;
    clock.textContent = time;
    el.replaceChildren(tpl.slice(0, at), clock, tpl.slice(at + '{time}'.length));
    el.dataset.rendered = key;
  }
}

export function init(): void {
  if (started) return;
  started = true;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-local-time]'));
  if (!els.length) return;
  const tick = () => {
    try {
      render(els);
    } catch {
      /* keep the server fallback */
    }
  };
  tick();
  const schedule = () => {
    window.setTimeout(() => {
      tick();
      schedule();
    }, 60_000 - (Date.now() % 60_000) + 50);
  };
  schedule();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tick();
  });
}
