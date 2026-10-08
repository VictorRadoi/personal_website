/**
 * Content collections (site-spec §5). Every visible word comes from these files or from src/config.ts.
 * Owned by Foundation: request changes with a `REQUEST(F):` note (site-spec §10.3).
 *
 * Launch rule (decisions.md): no ⟦TBD⟧ string may be rendered. Missing facts are OMITTED from the
 * content and listed in src/content/omissions.yaml (read by tests/tbd-report.mjs).
 * Images use the image() helper with paths relative to the YAML file.
 */
import { defineCollection, type SchemaContext } from 'astro:content';
import { z } from 'astro/zod';
import { file, glob } from 'astro/loaders';
import { ICON_NAMES } from './lib/icons';

type ImageFn = SchemaContext['image'];

/* ---------------------------------- shared pieces ---------------------------------- */

export const TILTS = ['n22', 'n11', 'n08', 'p06', 'p14', 'p20', 'p22', 'none'] as const;
export const LINK_TARGETS = ['website', 'app_store', 'google_play', 'appgallery', 'organizer_ios', 'organizer_android'] as const;
export const PLATFORM_KINDS = ['ios', 'android', 'huawei', 'web', 'organizer'] as const;
export const PLATFORM_STATUSES = ['live', 'review', 'soon', 'relaunching', 'tbd'] as const;
export const ANNOTATION_PRESETS = ['hero-note', 'dp-home-task', 'dp-plan-weeks'] as const;

/** One screenshot. kind → frame: raw = PhoneFrame, marketing = Printout, tablet = TabletFrame. */
const shot = (image: ImageFn) =>
  z.object({
    /** Unique per page; also the `image_id` analytics param and the lightbox gallery key. */
    id: z.string(),
    /** Absent => the slot is omitted on the built site (launch rule); TbdImage exists for dev only. */
    src: image().optional(),
    alt: z.string(),
    kind: z.enum(['raw', 'marketing', 'tablet']),
    /** Optional fixed tilt (case panel phones); otherwise components use tiltFor(id). */
    tilt: z.enum(TILTS).optional(),
    tbd: z.string().optional(),
  });

/** Ballpoint note; positions live in Annotation.astro's CSS per preset. */
const annotation = z.object({ preset: z.enum(ANNOTATION_PRESETS), note: z.string() });

const link = z.object({ label: z.string(), url: z.url(), target: z.enum(LINK_TARGETS) });

const platform = z.object({
  kind: z.enum(PLATFORM_KINDS),
  label: z.string(),
  url: z.url().optional(),
  /** Absent => the chip shows no status (e.g. a client's own website). */
  status: z.enum(PLATFORM_STATUSES).optional(),
  /** outbound_click `target` param; required when url is set. */
  target: z.enum(LINK_TARGETS).optional(),
  note: z.string().optional(),
});

const csi = z.object({ challenge: z.string(), stack: z.array(z.string()), impact: z.string() });
const stat = z.object({ value: z.string(), label: z.string() });

/* ---------------------------------- projects ---------------------------------- */

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      order: z.number(),
      kind: z.enum(['venture', 'caseStudy']),
      title: z.string(),
      subtitle: z.string(),
      domain: z.array(z.string()),
      roleLine: z.string(),
      marginNote: z.string(),
      icon: image().optional(),
      /** Kept for the schema only: never rendered (owner rule: no publisher/company entities in JSON-LD). */
      publisher: z.string().optional(),
      platforms: z.array(platform),
      mainShot: shot(image),
      description: z.array(z.string()),
      csi: csi.optional(),
      features: z.array(
        z.object({
          name: z.string(),
          body: z.string(),
          shots: z.array(shot(image)).default([]),
          stat: stat.optional(),
          annotation: annotation.optional(),
        }),
      ),
      /** Slug of the next project (dream-pivot → teamboard → goparty → dream-pivot). */
      next: z.string(),
      seo: z.object({ title: z.string(), description: z.string(), og: z.string().optional() }),
      /** Home venture card (kind: venture). */
      card: z
        .object({
          role: z.string(),
          stamp: z.string(),
          stampTone: z.enum(['live', 'shipped', 'neutral']),
          problem: z.string(),
          solution: z.string(),
          origin: z.string().optional(),
          facts: z.string(),
          stats: z.array(stat),
          links: z.array(link),
          linkStory: z.string(),
          peek: shot(image).optional(),
          tilt: z.enum(['n08', 'p06']),
          offset: z.boolean().default(false),
        })
        .optional(),
      /** Home case-study folder (kind: caseStudy). */
      teaser: z
        .object({
          tab: z.string(),
          stamp: z.string(),
          stampTone: z.enum(['live', 'shipped', 'neutral']).default('shipped'),
          title: z.string(),
          summary: z.string(),
          /** Back to front: shots[0] sits behind, the last one in front (carries the view-transition name). */
          shots: z.array(shot(image)),
          notes: z.array(annotation),
          cta: z.string(),
        })
        .optional(),
    }),
});

/* ---------------------------------- services / earlier ---------------------------------- */

const services = defineCollection({
  loader: file('src/content/services.yaml'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    body: z.string(),
    typical: z.string(),
    proof: z.string(),
    proofHref: z.string(),
    /** 'light' = the smaller fourth service (websites & portfolios), styled lighter. */
    weight: z.enum(['full', 'light']).default('full'),
  }),
});

const earlier = defineCollection({
  loader: file('src/content/earlier.yaml'),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    meta: z.string(),
    body: z.string(),
    tags: z.array(z.string()),
    url: z.url().optional(),
    urlLabel: z.string().optional(),
  }),
});

/* ---------------------------------- omissions (not rendered) ---------------------------------- */

const omissions = defineCollection({
  loader: file('src/content/omissions.yaml'),
  schema: z.object({ where: z.string(), what: z.string() }),
});

/* ---------------------------------- site (one entry, id "en") ---------------------------------- */

const titleDesc = z.object({ title: z.string(), description: z.string() });
const ctaTriple = z.object({ email: z.string(), whatsapp: z.string(), book: z.string() });

const site = defineCollection({
  loader: file('src/content/site.yaml'),
  schema: z.object({
    seo: z.object({
      home: titleDesc,
      privacy: titleDesc,
      notFound: titleDesc,
      ogImage: z.object({ headline: z.string(), highlight: z.string(), byline: z.string() }),
    }),
    nav: z.object({
      skip: z.string(),
      wordmark: z.string(),
      label: z.string(),
      ventures: z.string(),
      services: z.string(),
      work: z.string(),
      contact: z.string(),
      cta: z.string(),
      menuOpen: z.string(),
      menuClose: z.string(),
      menuLabel: z.string(),
      backToWork: z.string(),
    }),
    cursor: z.object({
      open: z.string(),
      visit: z.string(),
      readStory: z.string(),
      openCase: z.string(),
      zoomHint: z.string(),
      touchStamp: z.string(),
    }),
    localTime: z.object({ base: z.string(), asleep: z.string(), fallback: z.string() }),
    copy: z.object({ button: z.string(), done: z.string(), failed: z.string() }),
    ui: z.object({
      tbdBadge: z.string(),
      notePrefix: z.string(),
      external: z.string(),
      a11y: z.object({
        emailCta: z.string(),
        whatsappCta: z.string(),
        bookingCta: z.string(),
        copyButton: z.string(),
        ventureLink: z.string(),
        casePanelLink: z.string(),
        screenshotOpen: z.string(),
        appIcon: z.string(),
        lightboxLabel: z.string(),
        lightboxClose: z.string(),
        lightboxPrev: z.string(),
        lightboxNext: z.string(),
        cursorToggle: z.string(),
        menuButton: z.string(),
        breadcrumb: z.string(),
        nextProject: z.string(),
      }),
    }),
    hero: z.object({
      margin: z.string(),
      eyebrow: z.string(),
      h1: z.object({ kicker: z.string(), main: z.string() }),
      highlight: z.string(),
      note: z.string(),
      lead: z.string(),
      focusLabel: z.string(),
      focus: z.string(),
      ctaEmail: z.string(),
      ctaWhatsApp: z.string(),
      ctaBook: z.string(),
      ctaWork: z.string(),
      reply: z.string(),
      todo: z.object({
        heading: z.string(),
        items: z.array(z.object({ text: z.string(), done: z.boolean(), href: z.string().optional() })),
        a11yCaption: z.string(),
        donePrefix: z.string(),
        openNote: z.string(),
      }),
    }),
    ventures: z.object({ margin: z.string(), eyebrow: z.string(), h2: z.string(), intro: z.string() }),
    services: z.object({ margin: z.string(), eyebrow: z.string(), h2: z.string(), intro: z.string() }),
    process: z.object({ label: z.string(), steps: z.array(z.string()).length(4) }),
    cta: z.object({
      h3: z.string(),
      body: z.string(),
      email: z.string(),
      whatsapp: z.string(),
      book: z.string(),
      bookNote: z.string(),
      reply: z.string(),
      whatsappPrefill: z.string(),
    }),
    work: z.object({
      margin: z.string(),
      eyebrow: z.string(),
      h2: z.string(),
      earlierLabel: z.string(),
      credentials: z.string(),
      csiLabels: z.object({ challenge: z.string(), stack: z.string(), impact: z.string() }),
    }),
    contact: z.object({
      margin: z.string(),
      h2: z.string(),
      body: z.string(),
      phone: z.string(),
      email: z.string(),
      whatsapp: z.string(),
      book: z.string(),
      linkedin: z.string(),
      github: z.string(),
      availability: z.string(),
      signoff: z.string(),
    }),
    egg: z.object({
      front: z.string(),
      button: z.string(),
      uhoh: z.string(),
      hint: z.string(),
      touchHint: z.string(),
      back: z.string(),
      foundStamp: z.string(),
      a11yButton: z.string(),
      console: z.string(),
    }),
    footer: z.object({
      copyright: z.string(),
      privacy: z.string(),
      cookies: z.string(),
      cursorFancy: z.string(),
      cursorPlain: z.string(),
      builtWith: z.string(),
      updated: z.string(),
    }),
    project: z.object({
      platformsLabel: z.string(),
      status: z.object({ live: z.string(), review: z.string(), soon: z.string(), relaunching: z.string() }),
      descriptionLabel: z.string(),
      featuresLabel: z.string(),
      next: z.string(),
      ctaLine: z.string(),
      ctaEmail: z.string(),
      ctaWhatsApp: z.string(),
      ctaBook: z.string(),
      swipeHint: z.string(),
      breadcrumbHome: z.string(),
      breadcrumbWork: z.string(),
    }),
    /** CTA labels per CtaGroup location not covered above (menu, not_found). */
    ctaLabels: z.object({ menu: ctaTriple, notFound: ctaTriple }),
    consent: z.object({
      label: z.string(),
      title: z.string(),
      body: z.string(),
      accept: z.string(),
      reject: z.string(),
      details: z.string(),
      note: z.string(),
      statusOn: z.string(),
      statusOff: z.string(),
    }),
    privacy: z.object({
      h1: z.string(),
      blocks: z.array(
        z.object({ id: z.string(), h: z.string(), p: z.array(z.string()), list: z.array(z.string()).optional() }),
      ),
      changeHeading: z.string(),
      changeBody: z.string(),
      noscript: z.string(),
      updated: z.string(),
    }),
    notFound: z.object({ h1: z.string(), body: z.string(), home: z.string(), email: z.string(), note: z.string() }),
  }),
});

/* ---------------------------------- brief builder (one entry, id "en") ---------------------------------- */

/** A tappable answer. `phrase` reads inside a list sentence, `sentence` stands alone; `unsure` = exclusive "Not sure yet". */
const briefOption = z.object({
  id: z.string().regex(/^[a-z0-9]+$/),
  label: z.string().max(60),
  note: z.string().optional(),
  icon: z.enum(ICON_NAMES).optional(),
  phrase: z.string().optional(),
  sentence: z.string().optional(),
  unsure: z.boolean().default(false),
});
const briefStep = z.object({ title: z.string(), hint: z.string(), tray: z.string() });

const brief = defineCollection({
  loader: file('src/content/brief.yaml'),
  schema: z.object({
    seo: titleDesc,
    page: z.object({
      margin: z.string(),
      eyebrow: z.string(),
      h1: z.string(),
      lead: z.string(),
      escape: z.string(),
      nojsTitle: z.string(),
      nojsBody: z.string(),
    }),
    progress: z.string(),
    nav: z.object({ back: z.string(), next: z.string(), skip: z.string(), review: z.string() }),
    unsure: z.string(),
    steps: z.object({
      building: briefStep.extend({ options: z.array(briefOption) }),
      stage: briefStep.extend({ options: z.array(briefOption) }),
      features: briefStep.extend({
        kindTitle: z.string(),
        kindTray: z.string(),
        kinds: z.array(briefOption),
        featuresTitle: z.string(),
        groups: z.array(z.object({ id: z.string(), label: z.string(), options: z.array(briefOption) })),
      }),
      timing: briefStep.extend({ options: z.array(briefOption) }),
      notes: briefStep.extend({
        notesLabel: z.string(),
        notesPlaceholder: z.string(),
        linkLabel: z.string(),
        linkHint: z.string(),
        linkPlaceholder: z.string(),
        extrasTitle: z.string(),
        extrasNote: z.string(),
        sketchAdd: z.string(),
        sketchEdit: z.string(),
        photoAdd: z.string(),
        photoReplace: z.string(),
        remove: z.string(),
        removeSketch: z.string(),
        removePhoto: z.string(),
        sketchAlt: z.string(),
        photoAlt: z.string(),
        photoBusy: z.string(),
        photoError: z.string(),
        attachedSketch: z.string(),
        attachedPhoto: z.string(),
        trayAttached: z.string(),
      }),
    }),
    review: z.object({
      title: z.string(),
      hint: z.string(),
      summaryLabel: z.string(),
      summaryNote: z.string(),
      regenerate: z.string(),
      picksTitle: z.string(),
      change: z.string(),
      changeA11y: z.string(),
      nothing: z.string(),
      contactTitle: z.string(),
      name: z.string(),
      email: z.string(),
      company: z.string(),
      whatsapp: z.string(),
      optional: z.string(),
      honeypot: z.string(),
      consent: z.string(),
      privacyLink: z.string(),
      turnstileNote: z.string(),
      send: z.string(),
      sending: z.string(),
      verifying: z.string(),
      or: z.string(),
      whatsappIt: z.string(),
      bookCall: z.string(),
      errors: z.object({ name: z.string(), email: z.string(), emailInvalid: z.string(), summary: z.string(), fix: z.string() }),
    }),
    summary: z.object({
      build: z.string(),
      features: z.string(),
      featuresUnsure: z.string(),
      kind: z.string(),
      link: z.string(),
      sketch: z.string(),
      photo: z.string(),
      both: z.string(),
      and: z.string(),
      andLast: z.string(),
      empty: z.string(),
    }),
    success: z.object({ title: z.string(), body: z.string(), book: z.string(), home: z.string(), sentTitle: z.string(), again: z.string() }),
    error: z.object({
      title: z.string(),
      reasons: z.object({
        invalid: z.string(),
        turnstile: z.string(),
        rate_limited: z.string(),
        email_failed: z.string(),
        network: z.string(),
        turnstile_load: z.string(),
      }),
      next: z.string(),
      retry: z.string(),
      email: z.string(),
      whatsapp: z.string(),
      booking: z.string(),
    }),
    fallback: z.object({
      subject: z.string(),
      subjectNoName: z.string(),
      whatsappIntro: z.string(),
      signoff: z.string(),
      attachments: z.string(),
    }),
    tray: z.object({ title: z.string(), empty: z.string(), toggle: z.string(), count: z.string(), countZero: z.string() }),
    sketch: z.object({
      title: z.string(),
      hint: z.string(),
      canvasLabel: z.string(),
      toolsLabel: z.string(),
      pen: z.string(),
      eraser: z.string(),
      rect: z.string(),
      arrow: z.string(),
      text: z.string(),
      framesLabel: z.string(),
      frame1: z.string(),
      frame2: z.string(),
      frame3: z.string(),
      undo: z.string(),
      clear: z.string(),
      done: z.string(),
      close: z.string(),
      textLabel: z.string(),
      textPlaceholder: z.string(),
    }),
    teaser: z.object({ title: z.string(), body: z.string(), chipsLabel: z.string(), cta: z.string(), note: z.string() }),
    ctaLink: z.string(),
  }),
});

export const collections = { projects, services, earlier, site, omissions, brief };
