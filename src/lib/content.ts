/**
 * Typed content getters. Pages and components call these, never getCollection directly (site-spec §5).
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Site = CollectionEntry<'site'>['data'];
export type ProjectEntry = CollectionEntry<'projects'>;
export type Project = ProjectEntry['data'];
export type Shot = Project['mainShot'];
export type Platform = Project['platforms'][number];
export type PlatformStatus = NonNullable<Platform['status']>;
export type Feature = Project['features'][number];
export type Csi = NonNullable<Project['csi']>;
export type Annotation = NonNullable<Feature['annotation']>;
export type VentureCard = NonNullable<Project['card']>;
export type CardLink = VentureCard['links'][number];
export type Teaser = NonNullable<Project['teaser']>;
export type ServiceEntry = CollectionEntry<'services'>;
export type Service = ServiceEntry['data'];
export type EarlierEntry = CollectionEntry<'earlier'>;
export type Earlier = EarlierEntry['data'];
export type Omission = CollectionEntry<'omissions'>['data'] & { id: string };
export type Brief = CollectionEntry<'brief'>['data'];
export type BriefOption = Brief['steps']['building']['options'][number];

/** A project entry that has a venture card / a case-study teaser (narrowed types). */
export type VentureEntry = ProjectEntry & { data: Project & { card: VentureCard } };
export type CaseStudyEntry = ProjectEntry & { data: Project & { teaser: Teaser } };

/** Minimal reference to another project (NextProject). */
export interface ProjectRef {
  slug: string;
  title: string;
}

export type CtaLocation = 'hero' | 'services' | 'contact' | 'project_footer' | 'menu' | 'not_found';
export interface CtaLabels {
  email: string;
  whatsapp: string;
  book: string;
}

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function getSite(): Promise<Site> {
  const entry = await getEntry('site', 'en');
  if (!entry) throw new Error('src/content/site.yaml: entry "en" is missing');
  return entry.data;
}

export async function getBrief(): Promise<Brief> {
  const entry = await getEntry('brief', 'en');
  if (!entry) throw new Error('src/content/brief.yaml: entry "en" is missing');
  return entry.data;
}

export async function getProjects(): Promise<ProjectEntry[]> {
  return (await getCollection('projects')).sort(byOrder);
}

export async function getVentures(): Promise<VentureEntry[]> {
  return (await getProjects()).filter((p): p is VentureEntry => Boolean(p.data.card));
}

export async function getCaseStudies(): Promise<CaseStudyEntry[]> {
  return (await getProjects()).filter((p): p is CaseStudyEntry => Boolean(p.data.teaser));
}

export async function getProject(slug: string): Promise<ProjectEntry> {
  const entry = await getEntry('projects', slug);
  if (!entry) throw new Error(`Unknown project "${slug}"`);
  return entry;
}

/** The project after this one (wraps around), as a slug + title pair. */
export async function getNextProject(project: ProjectEntry): Promise<ProjectRef> {
  const next = await getProject(project.data.next);
  return { slug: next.id, title: next.data.title };
}

export async function getServices(): Promise<ServiceEntry[]> {
  return (await getCollection('services')).sort(byOrder);
}

export async function getEarlier(): Promise<EarlierEntry[]> {
  return (await getCollection('earlier')).sort(byOrder);
}

export async function getOmissions(): Promise<Omission[]> {
  return (await getCollection('omissions')).map((e) => ({ id: e.id, ...e.data }));
}

/** Button labels for a CtaGroup location (copy.md keys: hero.cta*, cta.*, contact.*, project.cta*). */
export function ctaLabels(site: Site, location: CtaLocation): CtaLabels {
  switch (location) {
    case 'hero':
      return { email: site.hero.ctaEmail, whatsapp: site.hero.ctaWhatsApp, book: site.hero.ctaBook };
    case 'services':
      return { email: site.cta.email, whatsapp: site.cta.whatsapp, book: site.cta.book };
    case 'contact':
      return { email: site.contact.email, whatsapp: site.contact.whatsapp, book: site.contact.book };
    case 'project_footer':
      return { email: site.project.ctaEmail, whatsapp: site.project.ctaWhatsApp, book: site.project.ctaBook };
    case 'menu':
      return site.ctaLabels.menu;
    case 'not_found':
      return site.ctaLabels.notFound;
  }
}

/** Label for a platform status chip ('tbd' and absent status render nothing). */
export function platformStatusLabel(site: Site, status: Platform['status']): string | undefined {
  if (!status || status === 'tbd') return undefined;
  return site.project.status[status];
}

/** outbound_click `target` for a platform chip. */
export function platformTarget(p: Platform): string {
  if (p.target) return p.target;
  switch (p.kind) {
    case 'ios':
      return 'app_store';
    case 'android':
      return 'google_play';
    case 'huawei':
      return 'appgallery';
    case 'organizer':
      return 'organizer_ios';
    case 'web':
      return 'website';
  }
}
