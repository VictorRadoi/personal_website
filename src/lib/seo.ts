/**
 * JSON-LD builders for project pages (site-spec §6). OWNER: Agent D.
 * Base.astro accepts `jsonLd` (one node or an array) and appends it to the @graph next to the
 * Person and ProfessionalService nodes. No photo of Victor anywhere, never aggregateRating, no publisher
 * or other company entities.
 */
import { SITE_URL } from '../config';
import type { ProjectEntry, Site } from './content';

export type JsonLdNode = Record<string, unknown>;

/** schema.org applicationCategory from the project's domain tags. */
function categoryFor(domain: string[]): string {
  const d = domain.join(' ').toLowerCase();
  if (/edtech|education|learning/.test(d)) return 'EducationalApplication';
  if (/sport/.test(d)) return 'SportsApplication';
  if (/event|ticket/.test(d)) return 'LifestyleApplication';
  return 'BusinessApplication';
}

/** operatingSystem from live store links only (the web chip and in-review platforms are skipped). */
function systemsFor(project: ProjectEntry): string[] {
  const out = new Set<string>();
  for (const p of project.data.platforms) {
    if (p.status !== 'live' || !p.url) continue;
    if (p.url.includes('apps.apple.com')) out.add('iOS');
    else if (p.url.includes('play.google.com') || p.url.includes('appgallery.huawei.com')) out.add('Android');
  }
  return [...out];
}

/** First live store link: the app's canonical home outside this site. */
function storeUrl(project: ProjectEntry): string | undefined {
  return project.data.platforms.find(
    (p) => p.status === 'live' && p.url && /apps\.apple\.com|play\.google\.com/.test(p.url),
  )?.url;
}

export function projectJsonLd(project: ProjectEntry, site: Site): JsonLdNode[] {
  const p = project.data;
  const pageUrl = `${SITE_URL}/work/${project.id}/`;
  const systems = systemsFor(project);
  const url = storeUrl(project);
  const og = p.seo.og ? new URL(p.seo.og, SITE_URL).href : undefined;

  const app: JsonLdNode = {
    '@type': 'SoftwareApplication',
    '@id': `${pageUrl}#app`,
    name: p.title,
    description: p.seo.description,
    applicationCategory: categoryFor(p.domain),
    ...(systems.length ? { operatingSystem: systems.join(', ') } : {}),
    ...(url ? { url } : {}),
    ...(og ? { image: og } : {}),
    mainEntityOfPage: pageUrl,
    creator: { '@id': `${SITE_URL}/#person` },
    // No publisher / company entities (owner rule): the app is attributed to its creator only.
  };

  const crumbs: JsonLdNode = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.project.breadcrumbHome, item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: site.project.breadcrumbWork, item: `${SITE_URL}/#work` },
      { '@type': 'ListItem', position: 3, name: p.title, item: pageUrl },
    ],
  };

  return [app, crumbs];
}

/** WebPage node for simple pages (privacy). */
export function pageJsonLd(path: string, name: string, description: string, ogPath: string): JsonLdNode {
  return {
    '@type': 'WebPage',
    '@id': `${SITE_URL}${path}#page`,
    url: `${SITE_URL}${path}`,
    name,
    description,
    primaryImageOfPage: new URL(ogPath, SITE_URL).href,
    isPartOf: { '@id': `${SITE_URL}/#service` },
  };
}
