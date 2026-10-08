/**
 * ⟦TBD: …⟧ markers. Launch rule (decisions.md): none may render on the built site; content omits
 * missing facts instead (src/content/omissions.yaml). These helpers stay for ContentText and
 * tests/tbd-report.mjs.
 */
export const TBD_PATTERN = /⟦TBD[^⟧]*⟧/g;

export interface TextSegment {
  text: string;
  tbd: boolean;
}

export function isTbd(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.includes('⟦TBD');
}

/** Splits "a ⟦TBD: x⟧ b" into [{a}, {x, tbd}, {b}]; the TBD segment text drops the brackets and "TBD:". */
export function splitTbd(value: string): TextSegment[] {
  const out: TextSegment[] = [];
  let last = 0;
  for (const m of value.matchAll(TBD_PATTERN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: value.slice(last, i), tbd: false });
    const inner = m[0].slice(1, -1).replace(/^TBD:?\s*/, '').trim();
    out.push({ text: inner || 'TBD', tbd: true });
    last = i + m[0].length;
  }
  if (last < value.length) out.push({ text: value.slice(last), tbd: false });
  return out;
}
