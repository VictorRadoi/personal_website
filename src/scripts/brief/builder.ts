/**
 * Brief builder (/start/, owner spec 2026-10-08). Markup: components/brief/*; copy: content/brief.yaml,
 * read from #brief-data. Contract: no-op without [data-brief], idempotent, never throws on storage.
 *
 * - Six steps (fieldsets). Chips are <button aria-pressed>; pick-one groups advance by themselves after
 *   a pointer tap (not after keyboard activation, WCAG 3.2.2); multi groups have exclusive "Not sure yet".
 * - Every step change pushes a history entry, so the phone's back gesture walks back through the steps.
 *   Each change jumps (instantly, never smooth: a moving page makes the next click miss) to the top of the
 *   new step, swallows trackpad momentum that was still running, then focuses the step's <h2> with
 *   preventScroll. Scroll restoration is manual, so browser Back lands on the step top too.
 * - Answers, the edited brief and the reply details live in sessionStorage (this tab only, cleared on
 *   success); attachments stay in memory.
 * - "Your brief" tray + dock count follow every pick. Review: generated summary (editable), picks with
 *   "Change", reply details, Turnstile (loaded only here), honeypot, Send → POST /api/brief (submit.ts).
 *   Failure keeps everything and offers mailto / wa.me / cal.com links carrying the summary.
 * - "Just email me instead" (v2) swaps the steps for the quick message panel (QuickMessage.astro): a history
 *   entry with #message, so Back (browser or "Back to the questions") returns to the same step with every
 *   answer kept. Its message starts as a plain sentence of the picks; name/email are shared with the review
 *   step. Send → the same endpoint with mode=quick (summary = the message, answers = the picks or {}).
 * - Every send carries answers.tech: the "Tech translation" lines for the owner's email (summary.ts).
 * - Napkin sketch (sketch.ts) and photo downscaling (photo.ts) are import()ed on first use.
 * - Analytics (track(), consent-gated, production hosts only): brief_start {source}, brief_step {step, name}
 *   (first time each step is reached), brief_quick_open {step}, sketch_open {device}, photo_attach,
 *   brief_submit {method: form|quick} (fallback links carry data-track brief_submit {method}),
 *   brief_error {error, mode}. Never any answers or PII.
 */
import { track } from '../analytics';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../../config';
import {
  AUTO,
  GROUPS,
  SINGLE,
  anyPicked,
  emptyAnswers,
  fill,
  labels,
  quickPrefill,
  summarize,
  techLines,
  type Answers,
  type Data,
  type Group,
} from './summary';
import { send, type SendError } from './submit';
import * as turnstile from './turnstile';

type ContactKey = 'name' | 'email' | 'company' | 'whatsapp';
type Contact = Record<ContactKey, string>;
type Mode = 'brief' | 'quick';
interface Draft {
  v: 1;
  step: number;
  a: Answers;
  summary: string;
  edited: boolean;
  c: Contact;
  /** The quick message; `edited` = typed by the visitor (otherwise it follows the picks). */
  q: { message: string; edited: boolean };
}
/** The review step's form or the quick message: same data-* hooks, looked up inside each. */
interface Panel {
  mode: Mode;
  el: HTMLElement;
  keys: string[];
  input: (key: string) => HTMLInputElement | HTMLTextAreaElement;
  contacts: HTMLInputElement[];
  honeypot: HTMLInputElement;
  ts: HTMLElement;
  error: HTMLElement;
  reason: HTMLElement;
  btn: HTMLButtonElement;
  label: HTMLElement;
  status: HTMLElement;
  sendText: string;
}
interface Attachment {
  blob: Blob;
  thumb: string;
}
type Kind = 'sketch' | 'photo';
type Fail = SendError | 'turnstile_load';

const KEY = 'brief_v1';
const STARTED = 'brief_started';
const REACHED = 'brief_reached';
const AUTO_ADVANCE = 420;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CONTACT: ContactKey[] = ['name', 'email', 'company', 'whatsapp'];

const ss = {
  get(k: string): string | null {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      sessionStorage.setItem(k, v);
    } catch {
      /* storage unavailable: answers last for this page only */
    }
  },
  del(k: string): void {
    try {
      sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

/** Shorten at a word boundary (URLs for mailto / wa.me / cal.com stay well under client limits). */
function clip(s: string, n: number): string {
  if (s.length <= n) return s;
  const cut = s.lastIndexOf(' ', n - 1);
  return s.slice(0, cut > n * 0.8 ? cut : n - 1).trimEnd() + '…';
}

let started = false;

export function init(): void {
  if (started) return;
  const found = document.querySelector<HTMLElement>('[data-brief]');
  const raw = document.getElementById('brief-data')?.textContent;
  if (!found || !raw) return;
  started = true;
  const root: HTMLElement = found;

  const d = JSON.parse(raw) as Data;
  const t = d.t;
  const REVIEW = d.steps.length - 1;
  const q = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

  const form = q<HTMLFormElement>('[data-brief-form]');
  const top = q('.brief__top');
  const steps = qa('[data-step]');
  const segs = qa('[data-seg]');
  const chips = qa<HTMLButtonElement>('[data-chip]');
  const progressLabel = q('[data-progress-label]');
  const dock = q('[data-dock]');
  const backBtn = q<HTMLButtonElement>('[data-back]');
  const nextBtn = q<HTMLButtonElement>('[data-next]');
  const nextLabel = q('[data-next-label]');
  const tray = q('[data-tray]');
  const trayToggle = q<HTMLButtonElement>('[data-tray-toggle]');
  const trayCount = q('[data-tray-count]');
  const trayEmpty = q('[data-tray-empty]');
  const trayRows = new Map(qa('[data-tray-row]').map((r) => [r.dataset.trayRow!, r]));
  const notes = q<HTMLTextAreaElement>('[data-notes]');
  const link = q<HTMLInputElement>('[data-link]');
  const summaryEl = q<HTMLTextAreaElement>('[data-summary]');
  const regen = q<HTMLButtonElement>('[data-regenerate]');
  const pickEls = new Map(qa('[data-pick]').map((e) => [e.dataset.pick!, e]));
  const done = q('[data-done]');
  const doneBody = q('[data-done-body]');
  const doneBodyBrief = doneBody.textContent ?? '';
  const quickEl = q('[data-quick]');
  const quickForm = q<HTMLFormElement>('[data-quick-form]');
  const quickTitle = q('#quick-title');

  function panel(mode: Mode, el: HTMLElement, keys: string[], sendText: string): Panel {
    const one = <T extends HTMLElement = HTMLElement>(sel: string) => el.querySelector<T>(sel)!;
    const contacts = [...el.querySelectorAll<HTMLInputElement>('[data-contact]')];
    const text = one<HTMLTextAreaElement>('[data-summary], [data-message]');
    return {
      mode,
      el,
      keys,
      contacts,
      sendText,
      input: (key) => (key === 'summary' || key === 'message' ? text : contacts.find((e) => e.dataset.contact === key)!),
      honeypot: one<HTMLInputElement>('[data-honeypot]'),
      ts: one('[data-turnstile]'),
      error: one('[data-error-panel]'),
      reason: one('[data-error-reason]'),
      btn: one<HTMLButtonElement>('[data-submit]'),
      label: one('[data-submit-label]'),
      status: one('[data-send-status]'),
    };
  }
  const review = panel('brief', q('[data-step="review"]'), ['summary', 'name', 'email'], t.send);
  const quick = panel('quick', quickEl, ['name', 'email', 'message'], t.quickSend);
  const messageEl = quick.input('message') as HTMLTextAreaElement;
  const sketchBtn = q<HTMLButtonElement>('[data-sketch-open]');
  const photoBtn = q<HTMLButtonElement>('[data-photo-pick]');
  const photoInput = q<HTMLInputElement>('[data-photo-input]');
  const extrasStatus = q('[data-extras-status]');
  const sketchDialog = q<HTMLDialogElement>('[data-sketch]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px)');

  /* ------------------------------- state ------------------------------- */

  const blank = (): Draft => ({
    v: 1,
    step: 0,
    a: emptyAnswers(),
    summary: '',
    edited: false,
    c: { name: '', email: '', company: '', whatsapp: '' },
    q: { message: '', edited: false },
  });

  /** Only known ids and plain strings survive a reload (the stored draft is untrusted input). */
  function restore(x: Partial<Draft> | null): Draft {
    const st = blank();
    if (!x || x.v !== 1) return st;
    for (const g of GROUPS) {
      const ids = new Set(d.groups[g].map((o) => o.id));
      const got = Array.isArray(x.a?.[g]) ? x.a[g].filter((id) => typeof id === 'string' && ids.has(id)) : [];
      st.a[g] = SINGLE.has(g) ? got.slice(0, 1) : got;
    }
    st.a.notes = String(x.a?.notes ?? '').slice(0, 2000);
    st.a.link = String(x.a?.link ?? '').slice(0, 300);
    for (const k of CONTACT) st.c[k] = String(x.c?.[k] ?? '').slice(0, 200);
    st.summary = String(x.summary ?? '').slice(0, 4000);
    st.edited = Boolean(x.edited) && Boolean(st.summary.trim());
    st.q.message = String(x.q?.message ?? '').slice(0, 4000);
    st.q.edited = Boolean(x.q?.edited) && Boolean(st.q.message.trim());
    st.step = Math.min(REVIEW, Math.max(0, Math.trunc(Number(x.step)) || 0));
    return st;
  }

  let st: Draft;
  try {
    st = restore(JSON.parse(ss.get(KEY) ?? 'null') as Partial<Draft> | null);
  } catch {
    st = blank();
  }
  const files: Partial<Record<Kind, Attachment>> = {};
  const has = () => ({ sketch: Boolean(files.sketch), photo: Boolean(files.photo) });

  let saveT = 0;
  function save(soon = false): void {
    window.clearTimeout(saveT);
    const write = () => ss.set(KEY, JSON.stringify(st));
    if (soon) saveT = window.setTimeout(write, 250);
    else write();
  }

  /* ------------------------------- entry: ?b=<building id>&from=<place> ------------------------------- */

  const params = new URLSearchParams(location.search);
  const source = (params.get('from') ?? '').replace(/[^a-z_]/g, '').slice(0, 24) || 'direct';
  function markStarted(): void {
    if (ss.get(STARTED)) return;
    ss.set(STARTED, '1');
    track('brief_start', { source });
  }
  const preset = params.get('b');
  if (preset && d.groups.building.some((o) => o.id === preset)) {
    if (!st.a.building.includes(preset)) st.a.building.push(preset);
    st.step = 0;
    markStarted();
  }
  if (params.has('b') || params.has('from')) {
    params.delete('b');
    params.delete('from');
    const qs = params.toString();
    history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
  }

  /* ------------------------------- painting ------------------------------- */

  function paintChips(): void {
    for (const c of chips) {
      const on = st.a[c.dataset.group as Group].includes(c.dataset.value ?? '');
      c.setAttribute('aria-pressed', String(on));
    }
  }

  const answered = (i: number): boolean => {
    switch (d.steps[i]) {
      case 'building':
        return st.a.building.length + st.a.users.length > 0;
      case 'stage':
        return st.a.stage.length > 0;
      case 'features':
        return st.a.features.length + st.a.platforms.length > 0;
      case 'timing':
        return st.a.timing.length > 0;
      default:
        return true;
    }
  };

  function paintNav(): void {
    const i = st.step;
    backBtn.hidden = i === 0;
    nextBtn.hidden = i === REVIEW;
    trayToggle.hidden = i === REVIEW;
    nextLabel.textContent = i === REVIEW - 1 ? t.review : answered(i) ? t.next : t.skip;
  }

  const attachedLabels = () => [files.sketch ? t.sketch : '', files.photo ? t.photo : ''].filter(Boolean);

  let shownRows: Record<string, boolean> = {};
  function paintTray(): void {
    const vals: Record<string, string> = {};
    for (const g of GROUPS) vals[g] = labels(d, st.a, g).join(', ');
    vals.notes = [clip(st.a.notes.trim(), 70), st.a.link.trim()].filter(Boolean).join(' · ');
    vals.attached = attachedLabels().join(', ');
    for (const [key, row] of trayRows) {
      const v = vals[key] ?? '';
      row.hidden = !v;
      row.querySelector('[data-tray-val]')!.textContent = v;
      if (v && !shownRows[key] && !reduce.matches) {
        row.classList.remove('is-new');
        void row.offsetWidth; // restart the tick
        row.classList.add('is-new');
      }
      shownRows[key] = Boolean(v);
    }
    const count =
      GROUPS.reduce((n, g) => n + st.a[g].length, 0) +
      (st.a.notes.trim() || st.a.link.trim() ? 1 : 0) +
      attachedLabels().length;
    trayEmpty.hidden = count > 0;
    trayCount.textContent = count ? fill(t.trayCount, { n: count }) : t.trayZero;
  }

  /* ------------------------------- steps ------------------------------- */

  let current = -1;
  let autoT = 0;
  let finished = false;
  /** The quick message panel is showing (the steps are hidden, not reset). */
  let quickOpen = false;
  /** This page pushed the #message history entry, so "Back to the questions" can simply go back. */
  let quickPushed = false;

  function reached(i: number): void {
    if (i === 0) return;
    let seen: number[] = [];
    try {
      seen = JSON.parse(ss.get(REACHED) ?? '[]') as number[];
    } catch {
      /* corrupt: start over */
    }
    if (seen.includes(i)) return;
    seen.push(i);
    ss.set(REACHED, JSON.stringify(seen));
    track('brief_step', { step: i + 1, name: d.steps[i] });
  }

  function show(i: number, opts: { push?: boolean; focus?: boolean } = {}): void {
    if (quickOpen) return;
    const { push = true, focus = true } = opts;
    i = Math.min(REVIEW, Math.max(0, i));
    window.clearTimeout(autoT);
    const changed = i !== current;
    current = st.step = i;
    steps.forEach((el, k) => (el.hidden = k !== i));
    segs.forEach((el, k) => {
      el.classList.toggle('is-done', k < i);
      el.classList.toggle('is-current', k === i);
    });
    progressLabel.textContent = fill(t.progress, { n: i + 1, total: d.steps.length });
    root.classList.toggle('is-review', i === REVIEW);
    toggleTray(false);
    paintNav();
    if (i === REVIEW) enterReview();
    save();
    if (!changed) return;
    if (push) history.pushState({ ...(history.state ?? {}), brief: i, quick: false }, '');
    if (focus) {
      scrollToStep();
      steps[i].querySelector<HTMLElement>('.step__title')?.focus({ preventScroll: true });
    }
    reached(i);
  }

  /**
   * Put the progress bar + new step right under the sticky header (instant jump). If a wheel/trackpad
   * stream was still running when the step changed (momentum from scrolling down to Next), that stream is
   * swallowed until it pauses (max 1.5s, released by any pointer or key input), so it cannot carry the view
   * off the new step. A fresh scroll after a pause is never blocked.
   */
  let lastWheel = -1e9;
  addEventListener('wheel', () => (lastWheel = performance.now()), { passive: true });
  let unhold: (() => void) | null = null;
  function scrollToStep(to: HTMLElement = top): void {
    unhold?.();
    const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const target = Math.max(0, Math.round(to.getBoundingClientRect().top + scrollY - pad));
    const jump = () => {
      if (Math.abs(scrollY - target) > 2) window.scrollTo({ top: target, behavior: 'instant' });
    };
    jump();
    requestAnimationFrame(jump); // after any layout change in the first frame
    const t0 = performance.now();
    if (t0 - lastWheel > 250) return; // nothing in flight: nothing to hold
    let last = t0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now - t0 > 1500 || now - last > 160) return unhold?.();
      last = now;
      e.preventDefault();
    };
    const onScroll = () => jump(); // e.g. a fling the compositor keeps running
    const stop = () => unhold?.();
    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pointerdown', stop, true);
    addEventListener('keydown', stop, true);
    const timer = window.setTimeout(stop, 1600);
    unhold = () => {
      removeEventListener('wheel', onWheel);
      removeEventListener('scroll', onScroll);
      removeEventListener('pointerdown', stop, true);
      removeEventListener('keydown', stop, true);
      window.clearTimeout(timer);
      unhold = null;
    };
  }

  const exclusive = (g: Group, id: string) => !SINGLE.has(g) && d.groups[g].some((o) => o.id === id && o.unsure);

  function pick(chip: HTMLButtonElement, pointer: boolean): void {
    const g = chip.dataset.group as Group;
    const v = chip.dataset.value ?? '';
    const cur = st.a[g];
    let next: string[];
    // Radio. On a whole-step question, tapping the chosen card again confirms it (and moves on); on an
    // optional row ("Who will use it?") it un-ticks it.
    if (SINGLE.has(g)) next = cur.includes(v) && !AUTO.has(g) ? [] : [v];
    else if (cur.includes(v)) next = cur.filter((x) => x !== v);
    else if (exclusive(g, v)) next = [v];
    else next = [...cur.filter((x) => !exclusive(g, x)), v];
    st.a[g] = next;
    markStarted();
    paintChips();
    paintTray();
    paintNav();
    save();
    window.clearTimeout(autoT);
    if (AUTO.has(g) && next.length && pointer) autoT = window.setTimeout(() => show(st.step + 1), AUTO_ADVANCE);
  }

  /* ------------------------------- tray sheet (below 1024) ------------------------------- */

  function toggleTray(open?: boolean): void {
    const want = (open ?? !tray.classList.contains('is-open')) && !desktop.matches;
    tray.classList.toggle('is-open', want);
    trayToggle.setAttribute('aria-expanded', String(want));
  }
  tray.tabIndex = -1;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tray.classList.contains('is-open')) {
      toggleTray(false);
      trayToggle.focus();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    const target = e.target as Node;
    if (tray.classList.contains('is-open') && !tray.contains(target) && !trayToggle.contains(target)) toggleTray(false);
  });
  desktop.addEventListener('change', () => toggleTray(false));
  // The dock is fixed below 1024: the sheet sits on top of it and the page keeps room for it.
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--dock-h', `${dock.offsetHeight}px`)).observe(dock);
  }

  /* ------------------------------- review ------------------------------- */

  function enterReview(): void {
    if (!st.edited || !st.summary.trim()) {
      st.summary = summarize(d, st.a, has());
      st.edited = false;
    }
    summaryEl.value = st.summary;
    regen.hidden = !st.edited;
    for (const [key, el] of pickEls) {
      let vals: string[];
      if ((GROUPS as readonly string[]).includes(key)) vals = labels(d, st.a, key as Group);
      else if (key === 'attached') vals = attachedLabels();
      else vals = [];
      el.replaceChildren();
      const row = el.closest<HTMLElement>('[data-pick-row]');
      if (key === 'attached' && row) row.hidden = !vals.length;
      if (key === 'notes') {
        const txt = [clip(st.a.notes.trim(), 160), st.a.link.trim()].filter(Boolean).join(' · ');
        el.textContent = txt || (el.dataset.empty ?? '');
        el.classList.toggle('is-empty', !txt);
        continue;
      }
      el.classList.toggle('is-empty', !vals.length);
      if (!vals.length) el.textContent = el.dataset.empty ?? '';
      for (const v of vals) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = v;
        el.append(tag);
      }
    }
    for (const el of review.contacts) el.value = st.c[el.dataset.contact as ContactKey];
    void turnstile.mount(review.ts);
    refreshLinks();
  }

  /**
   * Fallback links carry the brief (or the quick message): email app, WhatsApp, and the booking page with
   * notes prefilled.
   */
  function hrefs(mode: Mode = 'brief'): Record<'email' | 'whatsapp' | 'booking', string> {
    const name = st.c.name.trim();
    const email = st.c.email.trim();
    const brief = (
      mode === 'quick' ? st.q.message : st.step === REVIEW && st.summary.trim() ? st.summary : summarize(d, st.a, has())
    ).trim();
    const sign = name && email ? fill(d.fb.signoff, { name, email }) : name || email;
    const extra = files.sketch || files.photo ? d.fb.attachments : '';
    const body = [clip(brief, 1400), sign, extra].filter(Boolean).join('\n\n').replace(/\n/g, '\r\n');
    const subject = name ? fill(d.fb.subject, { name }) : d.fb.subjectNoName;
    const intro = mode === 'quick' ? d.quick.whatsappIntro : d.fb.whatsappIntro;
    const wa = [intro, clip(brief, 1300), sign].filter(Boolean).join('\n\n');
    const cal = new URLSearchParams();
    if (name) cal.set('name', name);
    if (EMAIL_RE.test(email)) cal.set('email', email);
    cal.set('notes', clip(brief, 900));
    return {
      email: `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      whatsapp: `${WHATSAPP.url}?text=${encodeURIComponent(wa)}`,
      booking: `${BOOKING_URL}?${cal.toString()}`,
    };
  }
  function refreshLinks(): void {
    const h = { brief: hrefs('brief'), quick: hrefs('quick') };
    for (const a of root.querySelectorAll<HTMLAnchorElement>('a[data-fallback]')) {
      const set = a.closest('[data-quick]') ? h.quick : h.brief;
      const k = a.dataset.fallback as keyof typeof set;
      if (set[k]) a.href = set[k];
    }
  }

  function problem(key: string): string {
    if (key === 'summary') return st.summary.trim() ? '' : t.errors.summary;
    if (key === 'message') return st.q.message.trim() ? '' : t.errors.message;
    if (key === 'name') return st.c.name.trim() ? '' : t.errors.name;
    const email = st.c.email.trim();
    return !email ? t.errors.email : EMAIL_RE.test(email) ? '' : t.errors.emailInvalid;
  }
  function mark(p: Panel, key: string, msg: string): void {
    const err = p.el.querySelector<HTMLElement>(`[data-error-for="${key}"]`);
    if (err) err.textContent = msg;
    const el = p.input(key);
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
  function validate(p: Panel): HTMLElement | null {
    let first: HTMLElement | null = null;
    for (const key of p.keys) {
      const msg = problem(key);
      mark(p, key, msg);
      if (msg && !first) first = p.input(key);
    }
    return first;
  }

  /* ------------------------------- quick message ("Just email me instead") ------------------------------- */

  function openQuick(opts: { push?: boolean } = {}): void {
    const { push = true } = opts;
    if (finished) return;
    window.clearTimeout(autoT);
    toggleTray(false);
    // Until the visitor types in it, the message follows the picks.
    if (!st.q.edited || !st.q.message.trim()) {
      const pre = quickPrefill(d, st.a);
      st.q.message = pre ? `${pre}\n\n` : '';
      st.q.edited = false;
    }
    messageEl.value = st.q.message;
    for (const el of quick.contacts) el.value = st.c[el.dataset.contact as ContactKey];
    const was = quickOpen;
    quickOpen = true;
    form.hidden = true;
    quickEl.hidden = false;
    root.classList.add('is-quick');
    save();
    void turnstile.mount(quick.ts);
    refreshLinks();
    if (push) {
      history.pushState({ ...(history.state ?? {}), brief: st.step, quick: true }, '', '#message');
      quickPushed = true;
    }
    if (was) return;
    scrollToStep(quickEl);
    quickTitle.focus({ preventScroll: true });
    track('brief_quick_open', { step: st.step + 1 });
  }

  /** Back to the step the panel was opened from, answers untouched. */
  function closeQuick(): void {
    if (!quickOpen) return;
    quickOpen = false;
    quickEl.hidden = true;
    form.hidden = false;
    root.classList.remove('is-quick');
    current = -1; // repaint, scroll to and focus the step again
    show(st.step, { push: false });
  }

  function leaveQuick(): void {
    if (quickPushed && (history.state as { quick?: unknown } | null)?.quick) return history.back(); // popstate closes it
    // Opened from a #message link (no step entry behind it): drop the hash in place.
    history.replaceState({ ...(history.state ?? {}), brief: st.step, quick: false }, '', location.pathname + location.search);
    closeQuick();
  }

  /* ------------------------------- send ------------------------------- */

  let sending = false;
  function busy(p: Panel, label: string | null): void {
    p.label.textContent = label ?? p.sendText;
    if (label) p.btn.setAttribute('aria-busy', 'true');
    else p.btn.removeAttribute('aria-busy');
    p.status.textContent = label ?? '';
  }

  function fail(p: Panel, error: Fail): void {
    p.reason.textContent = t.reasons[error] ?? t.reasons.network;
    refreshLinks();
    p.error.hidden = false;
    p.error.focus({ preventScroll: true });
    p.error.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    track('brief_error', { error, mode: p.mode });
  }

  function payload(): Record<string, string | string[]> {
    return {
      building: labels(d, st.a, 'building'),
      users: labels(d, st.a, 'users')[0] ?? '',
      stage: labels(d, st.a, 'stage')[0] ?? '',
      features: labels(d, st.a, 'features'),
      platforms: labels(d, st.a, 'platforms'),
      kind: [], // the v1 "It's a kind of…" row is gone; the key stays for the contract
      timing: labels(d, st.a, 'timing')[0] ?? '',
      notes: st.a.notes.trim().slice(0, 2000),
      link: st.a.link.trim().slice(0, 300),
      tech: techLines(d, st.a),
    };
  }

  async function submit(p: Panel): Promise<void> {
    if (sending) return;
    const bad = validate(p);
    if (bad) {
      p.status.textContent = t.errors.fix;
      bad.focus();
      return;
    }
    sending = true;
    p.error.hidden = true;
    busy(p, t.verifying);
    let token: string;
    try {
      token = await turnstile.getToken(45_000);
    } catch {
      sending = false;
      busy(p, null);
      fail(p, 'turnstile_load');
      return;
    }
    busy(p, t.sending);
    const isQuick = p.mode === 'quick';
    const body = new FormData();
    if (isQuick) body.append('mode', 'quick');
    // A quick message sends whatever was picked so far, or {} when nothing was.
    const answers = !isQuick || anyPicked(st.a) || st.a.notes.trim() || st.a.link.trim() ? payload() : {};
    body.append('answers', JSON.stringify(answers));
    body.append('summary', (isQuick ? st.q.message : st.summary).trim().slice(0, 4000));
    for (const k of CONTACT) body.append(k, st.c[k].trim());
    if (files.sketch) body.append('sketch', files.sketch.blob, 'sketch.png');
    if (files.photo) body.append('photo', files.photo.blob, 'photo.jpg');
    body.append('cf-turnstile-response', token);
    body.append('website', p.honeypot.value);
    const res = await send(body);
    sending = false;
    busy(p, null);
    turnstile.reset(p.ts); // tokens are single-use, success or not
    if (res.ok) succeed(p.mode);
    else fail(p, res.error);
  }

  function succeed(mode: Mode): void {
    finished = true;
    track('brief_submit', { method: mode === 'quick' ? 'quick' : 'form' });
    const h = hrefs(mode);
    doneBody.textContent = mode === 'quick' ? d.quick.body : doneBodyBrief;
    q('[data-done-sent]').textContent = (mode === 'quick' ? st.q.message : st.summary).trim();
    q<HTMLAnchorElement>('[data-done-book]').href = h.booking;
    form.hidden = true;
    quickEl.hidden = true;
    quickOpen = false;
    root.classList.remove('is-quick');
    done.hidden = false;
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
    ss.del(KEY);
    done.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
    q('#brief-done-title').focus({ preventScroll: true });
  }

  function restart(): void {
    finished = false;
    st = blank();
    delete files.sketch;
    delete files.photo;
    for (const k of ['sketch', 'photo'] as Kind[]) clearThumb(k);
    notes.value = link.value = messageEl.value = '';
    for (const p of [review, quick]) {
      for (const el of p.contacts) el.value = '';
      for (const k of p.keys) mark(p, k, '');
      p.error.hidden = true;
    }
    done.hidden = true;
    doneBody.textContent = doneBodyBrief;
    form.hidden = false;
    shownRows = {};
    paintChips();
    paintTray();
    current = -1;
    show(0);
  }

  /* ------------------------------- attachments ------------------------------- */

  function status(msg: string, error = false): void {
    extrasStatus.textContent = msg;
    extrasStatus.classList.toggle('is-error', error);
  }
  const thumb = (k: Kind) => q(`[data-thumb="${k}"]`);
  function setThumb(k: Kind): void {
    const li = thumb(k);
    li.querySelector('img')!.src = files[k]!.thumb;
    li.hidden = false;
  }
  function clearThumb(k: Kind): void {
    const li = thumb(k);
    li.hidden = true;
    li.querySelector('img')!.removeAttribute('src');
  }
  function afterFiles(): void {
    for (const [btn, k] of [[sketchBtn, 'sketch'], [photoBtn, 'photo']] as const) {
      const label = btn.querySelector<HTMLElement>('[data-label-add]');
      if (label) label.textContent = (files[k] ? label.dataset.labelEdit : label.dataset.labelAdd) ?? '';
    }
    paintTray();
  }
  function removeFile(k: Kind): void {
    delete files[k];
    clearThumb(k);
    afterFiles();
    (k === 'sketch' ? sketchBtn : photoBtn).focus();
  }

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    photoInput.value = '';
    if (!file) return;
    status(t.photoBusy);
    photoBtn.setAttribute('aria-busy', 'true');
    try {
      const { shrink } = await import('./photo');
      files.photo = await shrink(file);
      setThumb('photo');
      status('');
      markStarted();
      track('photo_attach');
    } catch {
      status(t.photoError, true);
    } finally {
      photoBtn.removeAttribute('aria-busy');
      afterFiles();
    }
  });

  let sketchMod: Promise<typeof import('./sketch')> | null = null;
  const loadSketch = () =>
    (sketchMod ??= import('./sketch').catch((e: unknown) => {
      sketchMod = null;
      throw e;
    }));
  // Warm the chunk as soon as someone heads for the button.
  for (const ev of ['pointerenter', 'focus', 'touchstart'] as const) {
    sketchBtn.addEventListener(ev, () => void loadSketch().catch(() => {}), { once: true, passive: true });
  }
  let pointerKind = 'keyboard';
  sketchBtn.addEventListener('pointerdown', (e) => (pointerKind = e.pointerType || 'mouse'));

  async function openSketch(): Promise<void> {
    track('sketch_open', { device: pointerKind });
    pointerKind = 'keyboard';
    sketchBtn.setAttribute('aria-busy', 'true');
    try {
      const m = await loadSketch();
      m.open(sketchDialog, (result) => {
        if (result) {
          files.sketch = result;
          setThumb('sketch');
          markStarted();
          afterFiles();
        } else if (files.sketch) removeFile('sketch');
      });
    } catch {
      status(t.reasons.network, true);
    } finally {
      sketchBtn.removeAttribute('aria-busy');
    }
  }

  /* ------------------------------- events ------------------------------- */

  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    const chip = el.closest<HTMLButtonElement>('[data-chip]');
    if (chip) return pick(chip, (e as MouseEvent).detail > 0);
    const fb = el.closest<HTMLAnchorElement>('a[data-fallback]');
    if (fb) return refreshLinks(); // the click's navigation uses the fresh href
    if (el.closest('[data-quick-open]')) {
      e.preventDefault(); // #message is only the URL; the panel is opened (and the history entry pushed) here
      return openQuick();
    }
    if (el.closest('[data-quick-back]')) return leaveQuick();
    const goto = el.closest<HTMLElement>('[data-goto]');
    if (goto) return show(Number(goto.dataset.goto));
    if (el.closest('[data-back]')) return show(st.step - 1);
    if (el.closest('[data-next]')) return show(st.step + 1);
    if (el.closest('[data-tray-toggle]')) {
      toggleTray();
      if (tray.classList.contains('is-open')) tray.focus({ preventScroll: true });
      return;
    }
    if (el.closest('[data-regenerate]')) {
      st.summary = summarize(d, st.a, has());
      st.edited = false;
      summaryEl.value = st.summary;
      regen.hidden = true;
      mark(review, 'summary', '');
      save();
      summaryEl.focus();
      return;
    }
    if (el.closest('[data-retry]')) {
      const p = el.closest('[data-quick]') ? quick : review;
      turnstile.reset(p.ts);
      return void submit(p);
    }
    if (el.closest('[data-sketch-open]')) return void openSketch();
    if (el.closest('[data-photo-pick]')) return photoInput.click();
    const rm = el.closest<HTMLElement>('[data-remove]');
    if (rm) return removeFile(rm.dataset.remove as Kind);
    if (el.closest('[data-restart]')) return restart();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (st.step < REVIEW) show(st.step + 1); // Enter in the link field = Next
    else void submit(review);
  });
  quickForm.addEventListener('submit', (e) => {
    e.preventDefault();
    void submit(quick);
  });

  notes.value = st.a.notes;
  link.value = st.a.link;
  for (const [el, k] of [[notes, 'notes'], [link, 'link']] as const) {
    el.addEventListener('input', () => {
      st.a[k] = el.value;
      markStarted();
      paintTray();
      save(true);
    });
  }
  summaryEl.addEventListener('input', () => {
    st.summary = summaryEl.value;
    st.edited = true;
    regen.hidden = false;
    if (summaryEl.hasAttribute('aria-invalid')) mark(review, 'summary', problem('summary'));
    save(true);
  });
  messageEl.addEventListener('input', () => {
    st.q.message = messageEl.value;
    st.q.edited = true;
    if (messageEl.hasAttribute('aria-invalid')) mark(quick, 'message', problem('message'));
    save(true);
  });
  // Name and email are shared by both forms (one draft); each form marks its own fields.
  for (const p of [review, quick]) {
    for (const el of p.contacts) {
      const k = el.dataset.contact as ContactKey;
      el.addEventListener('input', () => {
        st.c[k] = el.value;
        if (el.hasAttribute('aria-invalid')) mark(p, k, problem(k));
        save(true);
      });
      el.addEventListener('blur', () => {
        if ((k === 'email' || k === 'name') && el.value.trim()) mark(p, k, problem(k));
      });
    }
  }

  addEventListener('popstate', (e) => {
    if (finished) return;
    const s = (e.state ?? {}) as { brief?: unknown; quick?: unknown };
    if (s.quick) return openQuick({ push: false });
    if (quickOpen) {
      quickPushed = false;
      if (typeof s.brief === 'number') st.step = Math.min(REVIEW, Math.max(0, s.brief));
      return closeQuick();
    }
    if (typeof s.brief === 'number') show(s.brief, { push: false });
  });
  // Someone typed or followed a #message link while on the page.
  addEventListener('hashchange', () => {
    if (finished || quickOpen || location.hash !== '#message') return;
    history.replaceState({ ...(history.state ?? {}), brief: st.step, quick: true }, '');
    openQuick({ push: false });
  });
  addEventListener('pagehide', () => save());

  /* ------------------------------- boot ------------------------------- */

  // Steps are history entries; the browser must not restore an old scroll offset on Back/Forward.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  history.replaceState({ ...(history.state ?? {}), brief: st.step }, '');
  paintChips();
  shownRows = {};
  paintTray();
  // Rows already filled at load are not "new": no tick animation on restore.
  for (const row of trayRows.values()) row.classList.remove('is-new');
  show(st.step, { push: false, focus: false });
  if (location.hash === '#message') {
    history.replaceState({ ...(history.state ?? {}), brief: st.step, quick: true }, '');
    openQuick({ push: false });
  }
  root.classList.add('is-ready');
}
