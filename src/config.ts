/** Single source of truth for site-wide constants (contact, booking, analytics). Words live in src/content. */
export const SITE_URL = 'https://rvandrei.com';
export const SITE_NAME = 'Victor-Andrei Rădoi';
/** = copy.md seo.home.title / seo.home.description (also in src/content/site.yaml → seo.home). */
export const SITE_TITLE = 'Victor-Andrei Rădoi · Mobile & full-stack engineer';
export const SITE_DESCRIPTION =
  'I build iOS and Android apps, plus the backends and websites behind them. Co-founder of Teamboard, founding engineer at GoParty. Independent, working with EU and US teams.';
export const JOB_TITLE = 'Mobile & full-stack engineer';

export const EMAIL = 'andreiradoi14@gmail.com';
export const EMAIL_SUBJECT = 'Project enquiry';
export const WHATSAPP = {
  display: '+40 764 347 095',
  number: '40764347095',
  url: 'https://wa.me/40764347095',
} as const;
/** E.164, for tel: links and JSON-LD. */
export const TELEPHONE = '+40764347095';

/** Cal.com booking link (30-minute call). Always opens in a new tab. */
export const BOOKING_URL = 'https://cal.com/rvandrei/30min';
/** GA4 Measurement ID, e.g. G-ABC123XYZ. While it is a placeholder, no Google request is made. */
export const GA_MEASUREMENT_ID = 'G-D6Y74947LM';

export const GITHUB_URL = 'https://github.com/VictorRadoi';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/victorandreiradoi/';

/** Per-page OG images live in public/og/<page>.png (1200×630, rendered by scripts/og.mjs). */
export const DEFAULT_OG_IMAGE = '/og/home.png';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Time zone for the live local-time line and the footer date (UK time; the site never names a country). */
export const TIME_ZONE = 'Europe/London';
