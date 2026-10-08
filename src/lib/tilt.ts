/**
 * Deterministic tilt from an object's id (design-system §10.3). Tilts are applied with the
 * .tilt-<value> classes from base.css (never a style attribute: CSP).
 */
export type TiltClass = 'n22' | 'n11' | 'n08' | 'p06' | 'p14' | 'p20' | 'p22' | 'none';

/** The five hash tilts: -2.2, -1.1, 0.6, 1.4, 2.0 degrees. */
export const HASH_TILTS: readonly TiltClass[] = ['n22', 'n11', 'p06', 'p14', 'p20'];

/** Fixed exceptions (design-system §10.3). */
export const FIXED_TILTS = {
  todoCard: 'p22',
  teamboardCard: 'n08',
  goPartyCard: 'p06',
} as const satisfies Record<string, TiltClass>;

/** 32-bit FNV-1a. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Stable pick from a list by seed. */
export function pick<T>(seed: string, list: readonly T[]): T {
  return list[fnv1a(seed) % list.length];
}

export function tiltFor(id: string): TiltClass {
  return pick(id, HASH_TILTS);
}

/** "tilt-n22" etc., or undefined for no tilt prop. */
export function tiltClass(tilt: TiltClass | undefined): string | undefined {
  return tilt ? `tilt-${tilt}` : undefined;
}

/** Resolve a Screenshot-style tilt prop ('auto' → hash of id). */
export function resolveTilt(tilt: TiltClass | 'auto' | undefined, id: string): TiltClass | undefined {
  return tilt === 'auto' ? tiltFor(id) : tilt;
}
