// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL policy: every page is built as <route>/index.html (build.format 'directory') and canonical
// URLs end with a slash (trailingSlash 'always'). This matches Cloudflare Workers Static Assets'
// default html_handling "auto-trailing-slash": /about/ is served directly and /about redirects
// to /about/, so there is exactly one URL per page and canonical, sitemap and served URL agree.
// 404.html is emitted at the root (Astro special-cases it) for not_found_handling "404-page".
export default defineConfig({
  site: 'https://rvandrei.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Links opt in with data-astro-prefetch (TextLink prefetch prop); prefetched on hover.
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  markdown: { syntaxHighlight: 'prism' }, // Shiki's inline styles conflict with CSP
  integrations: [
    // og-template (src/pages/[ogPage].astro) is a render target for scripts/og.mjs, built only with OG_BUILD=1.
    sitemap({ filter: (page) => !page.includes('/og-template') }), // belt and braces: the route only exists under OG_BUILD=1
  ],
  security: {
    // Stable CSP: Astro hashes its own scripts/styles and emits a <meta http-equiv> policy.
    // The static (non-hashable) directives are in public/_headers. GA4 hosts are allowed here.
    // Cloudflare Turnstile (spam check on /start/ only; its script is injected there on the review step)
    // needs its script host and an iframe from the same host. The brief posts same-origin (connect-src 'self').
    // Consequence: no style="" attributes and no <style define:vars> anywhere (site-spec, top).
    csp: {
      algorithm: 'SHA-256',
      scriptDirective: {
        resources: [
          "'self'",
          'https://www.googletagmanager.com',
          'https://*.google-analytics.com',
          'https://challenges.cloudflare.com',
        ],
      },
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
        "frame-src https://challenges.cloudflare.com",
        "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
});
