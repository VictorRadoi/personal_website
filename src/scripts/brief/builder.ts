/**
 * Brief builder (/start/, owner spec 2026-10-08). Markup: components/brief/*; copy: content/brief.yaml,
 * read from #brief-data. Contract: no-op without [data-brief], idempotent, never throws on storage.
 *
 * - Six steps (fieldsets). Chips are <button aria-pressed>; pick-one groups advance by themselves after
 *   a pointer tap (not after keyboard activation, WCAG 3.2.2); multi groups have exclusive "Not sure yet".
 * - Every step change pushes a history entry, so the phone's back gesture walks back through the steps;
 *   the new step's <h2> gets focus and the progress bar comes into view.
 * - Answers, the edited brief and the reply details live in sessionStorage (this tab only, cleared on
 *   success); attachments stay in memory.
 * - "Your brief" tray + dock count follow every pick. Review: generated summary (editable), picks with
 *   "Change", reply details, Turnstile (loaded only here), honeypot, Send → POST /api/brief (submit.ts).
 *   Failure keeps everything and offers mailto / wa.me / cal.com links carrying the summary.
 * - Napkin sketch (sketch.ts) and photo downscaling (photo.ts) are import()ed on first use.
 * - Analytics (track(), consent-gated, production hosts only): brief_start {source}, brief_step {step, name}
 *   (first time each step is reached), sketch_open {device}, photo_attach, brief_submit {method: form}
 *   (fallback links carry data-track brief_submit {method}), brief_error {error}. Never any answers or PII.
 */
import { track } from '../analytics';
import { BOOKING_URL, EMAIL, WHATSAPP } from '../../config';
import { GROUPS, SINGLE, emptyAnswers, fill, labels, summarize, type Answers, type Data, type Group } from './summary';
import { send, type SendError } from './submit';
import * as turnstile from './turnstile';

type ContactKey = 'name' | 'email' | 'company' | 'whatsapp';
type Contact = Record<ContactKey, string>;
interface Draft {
  v: 1;
  step: number;
  a: Answers;
  summary: string;
  edited: boolean;
  c: Contact;
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
  const contactEls = qa<HTMLInputElement>('[data-contact]');
  const honeypot = q<HTMLInputElement>('[data-honeypot]');
  const tsSlot = q('[data-turnstile]');
  const errorPanel = q('[data-error-panel]');
  const errorReason = q('[data-error-reason]');
  const submitBtn = q<HTMLButtonElement>('[data-submit]');
  const submitLabel = q('[data-submit-label]');
  const sendStatus = q('[data-send-status]');
  const done = q('[data-done]');
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
        return st.a.building.length > 0;
      case 'stage':
        return st.a.stage.length > 0;
      case 'features':
        return st.a.features.length + st.a.kind.length > 0;
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
    if (push) history.pushState({ ...(history.state ?? {}), brief: i }, '');
    if (focus) {
      const r = top.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight * 0.35) top.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
      steps[i].querySelector<HTMLElement>('.step__title')?.focus({ preventScroll: true });
    }
    reached(i);
  }

  const exclusive = (g: Group, id: string) => !SINGLE.has(g) && d.groups[g].some((o) => o.id === id && o.unsure);

  function pick(chip: HTMLButtonElement, pointer: boolean): void {
    const g = chip.dataset.group as Group;
    const v = chip.dataset.value ?? '';
    const cur = st.a[g];
    let next: string[];
    if (SINGLE.has(g)) next = cur[0] === v ? [] : [v];
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
    if (SINGLE.has(g) && next.length && pointer) autoT = window.setTimeout(() => show(st.step + 1), AUTO_ADVANCE);
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
    for (const el of contactEls) el.value = st.c[el.dataset.contact as ContactKey];
    void turnstile.mount(tsSlot);
    refreshLinks();
  }

  /** Fallback links carry the brief: email app, WhatsApp, and the booking page with notes prefilled. */
  function hrefs(): Record<'email' | 'whatsapp' | 'booking', string> {
    const name = st.c.name.trim();
    const email = st.c.email.trim();
    const brief = (st.step === REVIEW && st.summary.trim() ? st.summary : summarize(d, st.a, has())).trim();
    const sign = name && email ? fill(d.fb.signoff, { name, email }) : name || email;
    const extra = files.sketch || files.photo ? d.fb.attachments : '';
    const body = [clip(brief, 1400), sign, extra].filter(Boolean).join('\n\n').replace(/\n/g, '\r\n');
    const subject = name ? fill(d.fb.subject, { name }) : d.fb.subjectNoName;
    const wa = [d.fb.whatsappIntro, clip(brief, 1300), sign].filter(Boolean).join('\n\n');
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
    const h = hrefs();
    for (const a of root.querySelectorAll<HTMLAnchorElement>('a[data-fallback]')) {
      const k = a.dataset.fallback as keyof typeof h;
      if (h[k]) a.href = h[k];
    }
  }

  function inputFor(key: string): HTMLElement {
    return key === 'summary' ? summaryEl : contactEls.find((e) => e.dataset.contact === key)!;
  }
  function problem(key: string): string {
    if (key === 'summary') return st.summary.trim() ? '' : t.errors.summary;
    if (key === 'name') return st.c.name.trim() ? '' : t.errors.name;
    const email = st.c.email.trim();
    return !email ? t.errors.email : EMAIL_RE.test(email) ? '' : t.errors.emailInvalid;
  }
  function mark(key: string, msg: string): void {
    const p = root.querySelector<HTMLElement>(`[data-error-for="${key}"]`);
    if (p) p.textContent = msg;
    const el = inputFor(key);
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
  function validate(): HTMLElement | null {
    let first: HTMLElement | null = null;
    for (const key of ['summary', 'name', 'email']) {
      const msg = problem(key);
      mark(key, msg);
      if (msg && !first) first = inputFor(key);
    }
    return first;
  }

  /* ------------------------------- send ------------------------------- */

  let sending = false;
  function busy(label: string | null): void {
    submitLabel.textContent = label ?? t.send;
    if (label) submitBtn.setAttribute('aria-busy', 'true');
    else submitBtn.removeAttribute('aria-busy');
    sendStatus.textContent = label ?? '';
  }

  function fail(error: Fail): void {
    errorReason.textContent = t.reasons[error] ?? t.reasons.network;
    refreshLinks();
    errorPanel.hidden = false;
    errorPanel.focus({ preventScroll: true });
    errorPanel.scrollIntoView({ block: 'nearest', behavior: reduce.matches ? 'auto' : 'smooth' });
    track('brief_error', { error });
  }

  function payload(): Record<string, string | string[]> {
    return {
      building: labels(d, st.a, 'building'),
      stage: labels(d, st.a, 'stage')[0] ?? '',
      features: labels(d, st.a, 'features'),
      kind: labels(d, st.a, 'kind'),
      timing: labels(d, st.a, 'timing')[0] ?? '',
      notes: st.a.notes.trim().slice(0, 2000),
      link: st.a.link.trim().slice(0, 300),
    };
  }

  async function submit(): Promise<void> {
    if (sending) return;
    const bad = validate();
    if (bad) {
      sendStatus.textContent = t.errors.fix;
      bad.focus();
      return;
    }
    sending = true;
    errorPanel.hidden = true;
    busy(t.verifying);
    let token: string;
    try {
      token = await turnstile.getToken(45_000);
    } catch {
      sending = false;
      busy(null);
      fail('turnstile_load');
      return;
    }
    busy(t.sending);
    const body = new FormData();
    body.append('answers', JSON.stringify(payload()));
    body.append('summary', st.summary.trim().slice(0, 4000));
    for (const k of CONTACT) body.append(k, st.c[k].trim());
    if (files.sketch) body.append('sketch', files.sketch.blob, 'sketch.png');
    if (files.photo) body.append('photo', files.photo.blob, 'photo.jpg');
    body.append('cf-turnstile-response', token);
    body.append('website', honeypot.value);
    const res = await send(body);
    sending = false;
    busy(null);
    turnstile.reset(tsSlot); // tokens are single-use, success or not
    if (res.ok) succeed();
    else fail(res.error);
  }

  function succeed(): void {
    finished = true;
    track('brief_submit', { method: 'form' });
    const h = hrefs();
    q('[data-done-sent]').textContent = st.summary.trim();
    q<HTMLAnchorElement>('[data-done-book]').href = h.booking;
    form.hidden = true;
    done.hidden = false;
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
    notes.value = link.value = '';
    for (const el of contactEls) el.value = '';
    for (const k of ['summary', 'name', 'email']) mark(k, '');
    errorPanel.hidden = true;
    done.hidden = true;
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
      mark('summary', '');
      save();
      summaryEl.focus();
      return;
    }
    if (el.closest('[data-retry]')) {
      turnstile.reset(tsSlot);
      return void submit();
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
    else void submit();
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
    if (summaryEl.hasAttribute('aria-invalid')) mark('summary', problem('summary'));
    save(true);
  });
  for (const el of contactEls) {
    const k = el.dataset.contact as ContactKey;
    el.addEventListener('input', () => {
      st.c[k] = el.value;
      if (el.hasAttribute('aria-invalid')) mark(k, problem(k));
      save(true);
    });
    el.addEventListener('blur', () => {
      if ((k === 'email' || k === 'name') && el.value.trim()) mark(k, problem(k));
    });
  }

  addEventListener('popstate', (e) => {
    const s = (e.state as { brief?: unknown } | null)?.brief;
    if (!finished && typeof s === 'number') show(s, { push: false });
  });
  addEventListener('pagehide', () => save());

  /* ------------------------------- boot ------------------------------- */

  history.replaceState({ ...(history.state ?? {}), brief: st.step }, '');
  paintChips();
  shownRows = {};
  paintTray();
  // Rows already filled at load are not "new": no tick animation on restore.
  for (const row of trayRows.values()) row.classList.remove('is-new');
  show(st.step, { push: false, focus: false });
  root.classList.add('is-ready');
}
