/** Dates and string templates. All rendering happens at build time. */
import { TIME_ZONE } from '../config';

/** Build time = "last updated" date in the footer. */
export const BUILD_DATE = new Date();

/** "7 Oct 2026" (copy.md footer.updated: d MMM yyyy). */
export function formatDate(date: Date = BUILD_DATE): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(date);
}

/** "2026-10-07" for <time datetime>. */
export function isoDate(date: Date = BUILD_DATE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date);
}

export function currentYear(date: Date = BUILD_DATE): number {
  return Number(new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: TIME_ZONE }).format(date));
}

/** Fills {key} placeholders: fill('Next: {name} →', { name: 'GoParty' }). Unknown keys stay as-is. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
}

/** Splits text around the first occurrence of phrase (for the hero highlighter). */
export function splitPhrase(
  text: string,
  phrase: string,
): { before: string; match: string; after: string } | null {
  const i = text.indexOf(phrase);
  if (i < 0 || !phrase) return null;
  return { before: text.slice(0, i), match: phrase, after: text.slice(i + phrase.length) };
}

/** kebab-case / id-safe slug. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Splits text into runs so hyphenated words ("full-stack") can be kept on one line:
 * keepHyphenated('Mobile & full-stack engineer.') → [{ text: 'Mobile & ' }, { text: 'full-stack', keep: true }, { text: ' engineer.' }].
 */
export function keepHyphenated(text: string): { text: string; keep?: boolean }[] {
  const out: { text: string; keep?: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+/gu)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[0], keep: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
