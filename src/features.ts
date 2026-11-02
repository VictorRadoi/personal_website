/**
 * Feature switches. Read at build time by the site (Astro) and bundled into the Worker (worker/index.ts),
 * so one edit here switches a feature everywhere.
 *
 * briefBuilder: Set to false and merge a pull request to turn off the brief builder: the /start/ page,
 * every link/teaser to it, and the /api/brief endpoint.
 *   - /start/ is not generated (Cloudflare serves the normal 404 page) and drops out of the sitemap
 *   - the home contact teaser and the "Start a project" link under the services are not rendered
 *   - the hero to-do card's "your app →" goes to #contact again, as it did before the brief builder
 *   - the privacy page drops its "If you send a project brief" section
 *   - the Worker answers POST /api/brief with 404 {"ok":false,"error":"not_found"}
 */
export const FEATURES = { briefBuilder: false } as const;
