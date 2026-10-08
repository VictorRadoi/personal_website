/**
 * Hand-stroke path library (design-system §9.2). OWNER: Agent A.
 * Paths are authored in a 0-100 box; `scalePath` maps them to the rendered px box at build time so the
 * SVG viewBox is in px (1 unit = 1px: even stroke widths, pathLength draw-on works).
 * Do not rename keys: ScribbleName is part of the props contract (site-spec §7.3).
 * Phase 2: Victor's own vectorized strokes replace these paths (same keys).
 */
export interface ScribblePath {
  /** Main stroke, authored in a 0-100 box. Rendered twice (.ink + .ink2) for the ballpoint look. */
  d: string;
  /** Arrowhead strokes (drawn last), or null. */
  head: string | null;
}

export const scribbles = {
  arrowSwoopRight: { d: 'M2,86 C22,98 52,78 66,48 S88,10 98,8', head: 'M98,8 L87,7 M98,8 L93,18' },
  arrowSwoopLeft: { d: 'M98,86 C78,98 48,78 34,48 S12,10 2,8', head: 'M2,8 L13,7 M2,8 L7,18' },
  arrowLoop: { d: 'M2,62 C18,92 44,96 50,62 C56,30 34,24 32,46 C30,72 70,92 98,40', head: 'M98,40 L87,43 M98,40 L95,51' },
  arrowShortDown: { d: 'M50,2 C44,30 58,62 50,96', head: 'M50,96 L43,86 M50,96 L57,87' },
  underlineDouble: { d: 'M0,42 C22,30 52,52 78,38 S96,34 100,40 M6,78 C34,66 62,84 94,70', head: null },
  dividerSquiggle: {
    d: 'M0,50 C4,10 8,90 12,50 S20,10 24,50 S32,90 36,50 S44,10 48,50 S56,90 60,50 S68,10 72,50 S80,90 84,50 S92,10 96,50',
    head: null,
  },
  circleLoose: { d: 'M8,52 C6,22 40,6 66,10 C92,14 98,40 92,62 C84,88 46,96 22,86 C4,78 2,58 14,40 C20,30 30,24 40,22', head: null },
  bracketRight: { d: 'M10,2 C60,4 55,40 62,48 L95,50 L62,52 C55,60 60,96 10,98', head: null },
  check: { d: 'M8,52 C16,60 24,70 34,86 C48,58 68,30 96,6', head: null },
  box: { d: 'M6,10 L94,6 M92,4 L96,92 M98,90 L8,94 M10,96 L4,8', head: null },
} as const satisfies Record<string, ScribblePath>;

export type ScribbleName = keyof typeof scribbles;

/** Scribble size classes (Scribble `size` prop). */
export type ScribbleSize = 'xs' | 's' | 'm' | 'l' | 'divider';


/** Rendered px boxes per size class (Scribble `size` prop). */
export const SCRIBBLE_BOX: Record<ScribbleSize, readonly [number, number]> = {
  xs: [24, 24],
  s: [48, 48],
  m: [96, 56],
  l: [160, 96],
  divider: [160, 12],
};

const fmt = (n: number) => String(Math.round(n * 10) / 10);

/** Scale absolute-coordinate path data (M L C S Q T, x/y pairs) from the 0-100 box to w x h px. */
export function scalePath(d: string, w: number, h: number): string {
  return d.replace(/([MLCSQT])([^MLCSQT]*)/g, (_m, cmd: string, args: string) => {
    const nums = args.match(/-?\d*\.?\d+/g) ?? [];
    const out: string[] = [];
    for (let i = 0; i < nums.length; i += 2) {
      out.push(`${fmt((Number(nums[i]) * w) / 100)},${fmt((Number(nums[i + 1]) * h) / 100)}`);
    }
    return `${cmd}${out.join(' ')}`;
  });
}

/**
 * Scale an arrowhead ("M tip L end M tip L end"): the strokes keep their direction but never get
 * shorter than `min` px, so heads stay legible in small boxes. Lengths stay unequal on purpose.
 */
export function scaleHead(head: string, w: number, h: number, min = 10): string {
  const segs = [...head.matchAll(/M\s*(-?[\d.]+),(-?[\d.]+)\s*L\s*(-?[\d.]+),(-?[\d.]+)/g)];
  return segs
    .map((m, i) => {
      const tx = (Number(m[1]) * w) / 100;
      const ty = (Number(m[2]) * h) / 100;
      let dx = (Number(m[3]) * w) / 100 - tx;
      let dy = (Number(m[4]) * h) / 100 - ty;
      const len = Math.hypot(dx, dy) || 1;
      const want = Math.max(len, min - i * 1.5);
      dx = (dx / len) * want;
      dy = (dy / len) * want;
      return `M${fmt(tx)},${fmt(ty)} L${fmt(tx + dx)},${fmt(ty + dy)}`;
    })
    .join(' ');
}
