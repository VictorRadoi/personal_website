/**
 * Brief builder model + the plain-language summary (/start/). Pure functions, no DOM.
 * The words come from src/content/brief.yaml (rendered into #brief-data by BriefBuilder.astro).
 * Owner rule: the summary says what the visitor wants, never a size, weeks or a price.
 */

export type Group = 'building' | 'stage' | 'kind' | 'features' | 'timing';
export const GROUPS: readonly Group[] = ['building', 'stage', 'kind', 'features', 'timing'];
/** Pick-one groups (tapping another card replaces the answer). */
export const SINGLE: ReadonlySet<Group> = new Set<Group>(['stage', 'timing']);

export interface Opt {
  id: string;
  label: string;
  phrase?: string;
  sentence?: string;
  unsure?: boolean;
}

/** Option ids per group, plus the free text from step 5. */
export interface Answers extends Record<Group, string[]> {
  notes: string;
  link: string;
}

export interface Sum {
  build: string;
  features: string;
  featuresUnsure: string;
  kind: string;
  link: string;
  sketch: string;
  photo: string;
  both: string;
  and: string;
  andLast: string;
  empty: string;
}

export interface Fallback {
  subject: string;
  subjectNoName: string;
  whatsappIntro: string;
  signoff: string;
  attachments: string;
}

/** #brief-data (BriefBuilder.astro). */
export interface Data {
  steps: string[];
  groups: Record<Group, Opt[]>;
  t: Record<string, string> & { errors: Record<string, string>; reasons: Record<string, string> };
  sum: Sum;
  fb: Fallback;
}

export const emptyAnswers = (): Answers => ({
  building: [],
  stage: [],
  kind: [],
  features: [],
  timing: [],
  notes: '',
  link: '',
});

/** "Step {n} of {total}" → "Step 2 of 6". Unknown keys stay as they are. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** "a", "a and b", "a, b, and c" (the joiners come from the content file). */
export function list(items: string[], s: Pick<Sum, 'and' | 'andLast'>): string {
  if (items.length < 3) return items.join(s.and);
  return items.slice(0, -1).join(', ') + s.andLast + items[items.length - 1];
}

/** The picked options of a group, in the order they appear on the page. */
export function picked(d: Data, a: Answers, g: Group): Opt[] {
  return d.groups[g].filter((o) => a[g].includes(o.id));
}

/** Visible labels of a group's picks (what the tray, the review and the Worker see). */
export function labels(d: Data, a: Answers, g: Group): string[] {
  return picked(d, a, g).map((o) => o.label);
}

const phrases = (opts: Opt[]) => opts.flatMap((o) => (o.phrase ? [o.phrase] : []));
const sentences = (opts: Opt[]) => opts.flatMap((o) => (o.sentence ? [o.sentence] : []));

/** The generated brief: one paragraph of sentences, then the visitor's own notes, link and attachments. */
export function summarize(d: Data, a: Answers, files: { sketch: boolean; photo: boolean }): string {
  const s = d.sum;
  const out: string[] = [];

  const building = picked(d, a, 'building');
  const build = phrases(building);
  if (build.length) out.push(fill(s.build, { list: list(build, s) }));
  out.push(...sentences(building));

  const kind = phrases(picked(d, a, 'kind'));
  if (kind.length) out.push(fill(s.kind, { list: list(kind, s) }));

  out.push(...sentences(picked(d, a, 'stage')));

  const features = picked(d, a, 'features');
  if (features.some((o) => o.unsure)) out.push(s.featuresUnsure);
  else if (features.length) out.push(fill(s.features, { list: list(phrases(features), s) }));

  out.push(...sentences(picked(d, a, 'timing')));

  const paras: string[] = [];
  if (out.length) paras.push(out.join(' '));
  const notes = a.notes.trim();
  if (notes) paras.push(notes);
  const link = a.link.trim();
  if (link) paras.push(fill(s.link, { link }));
  if (files.sketch || files.photo) paras.push(files.sketch && files.photo ? s.both : files.sketch ? s.sketch : s.photo);
  return paras.length ? paras.join('\n\n') : s.empty;
}
