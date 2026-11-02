/**
 * Brief builder model + the plain-language summary (/start/). Pure functions, no DOM.
 * The words come from src/content/brief.yaml (rendered into #brief-data by BriefBuilder.astro).
 * Owner rules: the summary says what the visitor wants in business words, never a size, weeks or a price.
 * The technical names (option `tech`) never reach the screen: techLines() builds the "Tech translation"
 * lines that are sent as answers.tech and printed only in the owner's email.
 */

export type Group = 'building' | 'users' | 'stage' | 'features' | 'platforms' | 'timing';
export const GROUPS: readonly Group[] = ['building', 'users', 'stage', 'features', 'platforms', 'timing'];
/** Pick-one groups (tapping another card replaces the answer). */
export const SINGLE: ReadonlySet<Group> = new Set<Group>(['users', 'stage', 'timing']);
/** Pick-one groups that are the whole step: a pointer tap moves on by itself. The others can be un-ticked. */
export const AUTO: ReadonlySet<Group> = new Set<Group>(['stage', 'timing']);

export interface Opt {
  id: string;
  label: string;
  phrase?: string;
  phraseIn?: 'people' | 'me' | 'it';
  sentence?: string;
  tech?: string;
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
  featuresMe: string;
  featuresIt: string;
  featuresUnsure: string;
  platforms: string;
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
  tech: { line: string; combo: string };
  quick: { prefill: string; whatsappIntro: string; body: string };
  fb: Fallback;
}

export const emptyAnswers = (): Answers => ({
  building: [],
  users: [],
  stage: [],
  features: [],
  platforms: [],
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

export const anyPicked = (a: Answers): boolean => GROUPS.some((g) => a[g].length > 0);

/** Phrases for a list sentence: options that have their own sentence say it there instead. */
const phrases = (opts: Opt[]) => opts.flatMap((o) => (o.phrase && !o.sentence ? [o.phrase] : []));
const sentences = (opts: Opt[]) => opts.flatMap((o) => (o.sentence ? [o.sentence] : []));

/** The generated brief: one paragraph of sentences, then the visitor's own notes, link and attachments. */
export function summarize(d: Data, a: Answers, files: { sketch: boolean; photo: boolean }): string {
  const s = d.sum;
  const out: string[] = [];
  const say = (template: string, items: string[]) => {
    if (items.length) out.push(fill(template, { list: list(items, s) }));
  };

  const building = picked(d, a, 'building');
  say(s.build, phrases(building));
  out.push(...sentences(building));
  out.push(...sentences(picked(d, a, 'users')));
  out.push(...sentences(picked(d, a, 'stage')));

  const features = picked(d, a, 'features');
  if (features.some((o) => o.unsure)) out.push(s.featuresUnsure);
  else {
    const by = (where: 'people' | 'me' | 'it') => phrases(features.filter((o) => (o.phraseIn ?? 'people') === where));
    say(s.features, by('people'));
    say(s.featuresMe, by('me'));
    say(s.featuresIt, by('it'));
    out.push(...sentences(features));
  }

  const platforms = picked(d, a, 'platforms');
  say(s.platforms, phrases(platforms));
  out.push(...sentences(platforms));

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

/**
 * "Tech translation" for the owner's email (answers.tech): first what is being built on which platforms
 * ("An app for my customers + iPhone + In the browser → iOS app + web app"), then every pick that has a
 * technical name ("Get reminders and alerts on their phone → push notifications").
 */
export function techLines(d: Data, a: Answers): string[] {
  const out: string[] = [];
  const build = picked(d, a, 'building').filter((o) => !o.unsure);
  const where = picked(d, a, 'platforms').filter((o) => !o.unsure && o.tech);
  if (build.length && where.length) {
    out.push(
      fill(d.tech.combo, {
        build: build.map((o) => o.label).join(' + '),
        platforms: where.map((o) => o.label).join(' + '),
        tech: where.map((o) => o.tech).join(' + '),
      }),
    );
  }
  for (const g of GROUPS) {
    for (const o of picked(d, a, g)) if (o.tech) out.push(fill(d.tech.line, { label: o.label, tech: o.tech }));
  }
  return out;
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The quick message's starting text: "So far I picked: an app for my customers, pay or subscribe." ('' if nothing). */
export function quickPrefill(d: Data, a: Answers): string {
  const items = GROUPS.flatMap((g) =>
    picked(d, a, g)
      .filter((o) => !(o.unsure && !o.sentence))
      .map((o) => o.phrase ?? lowerFirst(o.label)),
  );
  return items.length ? fill(d.quick.prefill, { list: items.join(', ') }) : '';
}
