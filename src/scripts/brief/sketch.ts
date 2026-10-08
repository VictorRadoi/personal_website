/**
 * Napkin sketch pad (/start/ step 5). import()ed by builder.ts the first time the sheet opens, so it never
 * loads for visitors who skip it. Vanilla <canvas> + perfect-freehand (strokes are filled outlines, so
 * lines, boxes and arrows all look like the same ballpoint).
 *
 * Model: a list of items in a fixed logical space (about twice the sheet's on-screen width, 640-1200 px,
 * so pen and label sizes read the same on a phone and a desktop; height follows the sheet's aspect). Undo = snapshots of the list; the eraser removes whole items. Pointer Events cover mouse,
 * touch and pen (pressure from pens; once a pen was seen, touches are ignored = palm rejection);
 * touch-action: none is on the canvas only. Labels use a real <input> overlay (IME / phone keyboards work),
 * then are drawn in the hand font. Phone frames, labels, undo and clear are all keyboard-operable.
 * Export: PNG on paper, 1200 px wide (≤ 1.5 MB), plus a small data: thumbnail (CSP img-src has no blob:).
 * Colours and the hand font come from CSS tokens; sizes are set through the CSSOM (CSP).
 */
import { getStroke } from 'perfect-freehand';

type P = number[];
interface Item {
  /** p = pen stroke, r = box, a = arrow, f = phone frame, t = text label */
  k: 'p' | 'r' | 'a' | 'f' | 't';
  p: P[];
  pen?: boolean;
  s?: string;
}
export interface SketchResult {
  blob: Blob;
  thumb: string;
}

const MAX_BYTES = 1_450_000;
const PEN = { size: 6.5, thinning: 0.6, smoothing: 0.55, streamline: 0.4 };
const LINE = { size: 4.6, thinning: 0.12, smoothing: 0.5, streamline: 0.25, simulatePressure: false, last: true };
const FONT_PX = 30;

let W = 1200;
let H = 800;
let items: Item[] = [];
let history: Item[][] = [];
let tool = 'pen';
let live: Item | null = null;
let active: number | null = null;
let penSeen = false;
let erased = false;
let scale = 1;
let raf = 0;
let labelAt: P | null = null;
let ink = 'blue';
let paper = 'white';
let font = 'cursive';
let onDone: (r: SketchResult | null) => void = () => {};

let dlg: HTMLDialogElement;
let cv: HTMLCanvasElement;
let cx: CanvasRenderingContext2D;
let stage: HTMLElement;
let input: HTMLInputElement;

/* ------------------------------- drawing ------------------------------- */

/** Points every ~24px along a polyline, so the smoothing has something to work with. */
function dense(pts: P[]): P[] {
  const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 24));
    for (let j = 1; j <= n; j++) out.push([x0 + ((x1 - x0) * j) / n, y0 + ((y1 - y0) * j) / n]);
  }
  return out;
}

/** A shape as one or more polylines (boxes, arrows with uneven heads, phone frames). */
function shape(it: Item): P[][] {
  const [[x1, y1], [x2, y2]] = it.p;
  if (it.k === 'a') {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.min(30, Math.hypot(x2 - x1, y2 - y1) * 0.4);
    const head = (d: number, l: number): P[] => [[x2, y2], [x2 - l * Math.cos(ang + d), y2 - l * Math.sin(ang + d)]];
    return [[[x1, y1], [x2, y2]], head(0.48, len), head(-0.42, len * 0.85)];
  }
  const l = Math.min(x1, x2);
  const r = Math.max(x1, x2);
  const t = Math.min(y1, y2);
  const b = Math.max(y1, y2);
  if (it.k === 'r') return [[[l, t], [r, t]], [[r, t], [r, b]], [[r, b], [l, b]], [[l, b], [l, t]]];
  const w = r - l;
  const rad = w * 0.15;
  const outline: P[] = [];
  const arc = (ox: number, oy: number, a0: number) => {
    for (let i = 0; i <= 4; i++) outline.push([ox + rad * Math.cos(a0 + (i * Math.PI) / 8), oy + rad * Math.sin(a0 + (i * Math.PI) / 8)]);
  };
  arc(r - rad, t + rad, -Math.PI / 2);
  arc(r - rad, b - rad, 0);
  arc(l + rad, b - rad, Math.PI / 2);
  arc(l + rad, t + rad, Math.PI);
  outline.push(outline[0]);
  const bar = (y: number, inset: number): P[] => [[l + w * inset, y], [r - w * inset, y]];
  return [outline, bar(t + rad * 0.55, 0.4), bar(b - rad * 0.5, 0.36)];
}

function blot(c: CanvasRenderingContext2D, pts: P[], o: object): void {
  const out = getStroke(pts, o);
  if (out.length < 2) return;
  c.beginPath();
  c.moveTo(out[0][0], out[0][1]);
  for (let i = 1; i < out.length; i++) c.lineTo(out[i][0], out[i][1]);
  c.closePath();
  c.fill();
}

function paint(c: CanvasRenderingContext2D, list: Item[]): void {
  c.fillStyle = ink;
  c.font = `${FONT_PX}px ${font}`;
  c.textBaseline = 'middle';
  for (const it of list) {
    if (it.k === 'p') blot(c, it.p, { ...PEN, simulatePressure: !it.pen, last: it !== live });
    else if (it.k === 't') c.fillText(it.s ?? '', it.p[0][0], it.p[0][1]);
    else for (const seg of shape(it)) blot(c, dense(seg), LINE);
  }
}

function render(): void {
  raf = 0;
  cx.setTransform(scale, 0, 0, scale, 0, 0);
  cx.clearRect(0, 0, W, H);
  paint(cx, items);
}
const schedule = () => {
  raf ||= requestAnimationFrame(render);
};

/** Fit the canvas into the sheet, keeping the logical aspect; sharp on high-DPI screens. */
function fit(first: boolean): void {
  const bw = stage.clientWidth;
  const bh = stage.clientHeight;
  if (!bw || !bh) return;
  if (first && !items.length) {
    W = Math.round(Math.min(1200, Math.max(640, bw * 2)));
    H = Math.round(Math.min(W * 1.8, Math.max(W * 0.5, (W * bh) / bw)));
  }
  const k = Math.min(bw / W, bh / H);
  cv.style.width = `${Math.floor(W * k)}px`;
  cv.style.height = `${Math.floor(H * k)}px`;
  scale = Math.min(2, Math.max(0.5, (W * k * devicePixelRatio) / W));
  cv.width = Math.round(W * scale);
  cv.height = Math.round(H * scale);
  render();
}

/* ------------------------------- editing ------------------------------- */

function snap(): void {
  history.push(items.slice());
  if (history.length > 80) history.shift();
}

function distSeg(x: number, y: number, a: P, b: P): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

function hit(it: Item, x: number, y: number): boolean {
  const R = 16;
  if (it.k === 't') {
    const [tx, ty] = it.p[0];
    return x > tx - R && x < tx + cx.measureText(it.s ?? '').width + R && Math.abs(y - ty) < FONT_PX / 2 + R;
  }
  for (const seg of it.k === 'p' ? [it.p] : shape(it)) {
    for (let i = 0; i < seg.length; i++) if (distSeg(x, y, seg[i], seg[i + 1] ?? seg[i]) < R) return true;
  }
  return false;
}

function erase(p: P): void {
  for (let i = items.length - 1; i >= 0; i--) {
    if (!hit(items[i], p[0], p[1])) continue;
    if (!erased) snap();
    erased = true;
    items.splice(i, 1);
    schedule();
    return;
  }
}

function frames(n: number): void {
  snap();
  const gap = 48;
  const w0 = (W * 0.84 - gap * (n - 1)) / n;
  const h = Math.min(H * 0.84, w0 / 0.47);
  const w = h * 0.47;
  let x = (W - (n * w + (n - 1) * gap)) / 2;
  const y = (H - h) / 2;
  for (let i = 0; i < n; i++, x += w + gap) items.push({ k: 'f', p: [[x, y], [x + w, y + h]] });
  render();
}

function openLabel(x: number, y: number): void {
  labelAt = [x, y];
  input.hidden = false;
  input.value = '';
  const k = cv.clientWidth / W;
  const sr = stage.getBoundingClientRect();
  const cr = cv.getBoundingClientRect();
  const left = cr.left - sr.left + cv.clientLeft + x * k;
  const topPx = cr.top - sr.top + cv.clientTop + y * k - 22;
  input.style.left = `${Math.max(4, Math.min(left, stage.clientWidth - input.offsetWidth - 4))}px`;
  input.style.top = `${Math.max(4, Math.min(topPx, stage.clientHeight - input.offsetHeight - 4))}px`;
  input.focus();
}

function commitLabel(): void {
  if (!labelAt) return;
  const at = labelAt;
  const s = input.value.trim();
  labelAt = null;
  input.hidden = true;
  if (!s) return;
  snap();
  items.push({ k: 't', p: [at], s });
  render();
}

/* ------------------------------- pointer ------------------------------- */

function pos(e: PointerEvent): P {
  const r = cv.getBoundingClientRect();
  return [
    ((e.clientX - r.left - cv.clientLeft) * W) / cv.clientWidth,
    ((e.clientY - r.top - cv.clientTop) * H) / cv.clientHeight,
    e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5,
  ];
}

function down(e: PointerEvent): void {
  if (e.button > 0 || active !== null) return;
  if (e.pointerType === 'pen') penSeen = true;
  else if (e.pointerType === 'touch' && penSeen) return; // palm on the screen while drawing with a pen
  const p = pos(e);
  if (tool === 'text') {
    e.preventDefault();
    commitLabel();
    openLabel(p[0], p[1]);
    return;
  }
  active = e.pointerId;
  cv.setPointerCapture(e.pointerId);
  if (tool === 'eraser') {
    erased = false;
    erase(p);
    return;
  }
  snap();
  live = tool === 'pen' ? { k: 'p', p: [p], pen: e.pointerType === 'pen' } : { k: tool === 'rect' ? 'r' : 'a', p: [p, p] };
  items.push(live);
  schedule();
}

function move(e: PointerEvent): void {
  if (e.pointerId !== active) return;
  const list = e.getCoalescedEvents?.() ?? [];
  for (const ev of list.length ? list : [e]) {
    const p = pos(ev);
    if (tool === 'eraser') erase(p);
    else if (live?.k === 'p') live.p.push(p);
    else if (live) live.p[1] = p;
  }
  schedule();
}

function up(e: PointerEvent): void {
  if (e.pointerId !== active) return;
  active = null;
  if (live && live.k !== 'p') {
    const [[x1, y1], [x2, y2]] = live.p;
    if (Math.hypot(x2 - x1, y2 - y1) < 10) {
      items.pop();
      history.pop();
    }
  }
  live = null;
  schedule();
}

/* ------------------------------- sheet ------------------------------- */

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));

async function finish(): Promise<void> {
  commitLabel();
  if (!items.length) {
    dlg.close();
    onDone(null);
    return;
  }
  let k = 1;
  let out: HTMLCanvasElement;
  let blob: Blob | null;
  do {
    out = document.createElement('canvas');
    out.width = Math.round(W * k);
    out.height = Math.round(H * k);
    const c = out.getContext('2d')!;
    c.scale(k, k);
    c.fillStyle = paper;
    c.fillRect(0, 0, W, H);
    paint(c, items);
    blob = await toBlob(out);
    k *= 0.7;
  } while (blob && blob.size > MAX_BYTES && k > 0.3);
  const th = document.createElement('canvas');
  th.width = 264;
  th.height = Math.round((264 * H) / W);
  th.getContext('2d')!.drawImage(out, 0, 0, th.width, th.height);
  dlg.close();
  if (blob) onDone({ blob, thumb: th.toDataURL('image/png') });
}

function onClick(e: MouseEvent): void {
  const b = (e.target as Element).closest<HTMLButtonElement>('button');
  if (!b) return;
  const d = b.dataset;
  if (d.tool) {
    commitLabel();
    tool = d.tool;
    for (const t of dlg.querySelectorAll('[data-tool]')) t.setAttribute('aria-pressed', String(t === b));
    if (tool === 'text' && e.detail === 0) openLabel(W / 2 - 120, H / 2); // keyboard: label in the middle
  } else if (d.frame) frames(Number(d.frame));
  else if (d.sk === 'undo') {
    items = history.pop() ?? items;
    render();
  } else if (d.sk === 'clear' && items.length) {
    snap();
    items = [];
    render();
  } else if (d.sk === 'done') void finish();
  else if (d.sk === 'close') dlg.close();
}

function setup(dialog: HTMLDialogElement): void {
  dlg = dialog;
  cv = dlg.querySelector<HTMLCanvasElement>('[data-sk-canvas]')!;
  stage = dlg.querySelector<HTMLElement>('[data-sk-stage]')!;
  input = dlg.querySelector<HTMLInputElement>('[data-sk-input]')!;
  cx = cv.getContext('2d')!;
  const cs = getComputedStyle(dlg);
  ink = cs.getPropertyValue('--ballpoint').trim() || ink;
  paper = cs.getPropertyValue('--card').trim() || paper;
  font = cs.getPropertyValue('--font-hand').trim() || font;

  dlg.addEventListener('click', onClick);
  dlg.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && e.target !== input) {
      e.preventDefault();
      items = history.pop() ?? items;
      render();
    }
  });
  dlg.addEventListener('close', () => {
    labelAt = null;
    input.hidden = true;
  });
  cv.addEventListener('pointerdown', down);
  cv.addEventListener('pointermove', move);
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitLabel();
      dlg.querySelector<HTMLElement>('[data-tool="text"]')?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      labelAt = null;
      input.hidden = true;
    }
  });
  input.addEventListener('blur', commitLabel);
  new ResizeObserver(() => dlg.open && fit(false)).observe(stage);
}

/** Open the sheet; `done` gets the PNG + thumbnail on Done (null when the sketch was emptied). */
export function open(dialog: HTMLDialogElement, done: (r: SketchResult | null) => void): void {
  onDone = done;
  if (!dlg) setup(dialog);
  dlg.showModal();
  fit(true);
  // Make sure the hand font is ready before labels are drawn (it is preloaded on every page).
  void document.fonts?.load(`${FONT_PX}px ${font}`).then(render, () => {});
}
