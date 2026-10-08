# rvandrei.com

Website of Victor-Andrei Rădoi, mobile & full-stack engineer: services, current ventures and selected
case studies. Astro 7 static site (plain HTML/CSS, a few small TypeScript modules, no UI framework),
hosted on Cloudflare Workers Static Assets.

## Requirements

- Node.js 22.12 or newer (CI uses Node 24), npm
- Google Chrome, only for `scripts/og.mjs` (share images)
- A Cloudflare account, only for deploying

## Develop

```bash
npm install
npm run dev          # http://localhost:4321, hot reload
```

Analytics never runs on `localhost` / `127.0.0.1`: `track()` only logs `[track] …` to the browser
console (`console.debug`), so you can test events locally without sending anything to Google.

## Build and check

```bash
npm run check                    # astro check: types + .astro diagnostics (expect 0 errors)
npm run build                    # static site → dist/ (6 pages)
npm run preview                  # serve dist/ on http://localhost:4321 (astro preview stop to end it)
node tests/tbd-report.mjs        # facts still missing (src/content/omissions.yaml); fails if a TBD is rendered
```

`npm run preview` does not apply `public/_headers` or `public/_redirects`. To test those (and the
real 404 status) serve `dist/` the way Cloudflare does: `npx wrangler dev` (http://localhost:8787).

## Deploy

```bash
npx wrangler login               # once
npx wrangler deploy --dry-run    # validates wrangler.jsonc + dist/ without uploading
scripts/deploy.sh --dry-run      # same, after a clean npm ci + build
scripts/deploy.sh                # build and deploy for real
```

Pushes to `main` deploy through GitHub Actions (`.github/workflows/deploy.yml`: check, build, deploy);
pull requests get a preview version. The workflow needs the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets. Go-live steps (domain cutover from the old site,
Google Analytics, Search Console) are in [docs/LAUNCH.md](docs/LAUNCH.md).

## Editing content

Every visible word lives in `src/content/` (YAML, validated at build time; a missing key fails the build):

| File | What |
| --- | --- |
| `site.yaml` | all page copy: hero, sections, contact, footer, consent slip, privacy page, 404, SEO titles |
| `services.yaml` | the four services on the home page |
| `earlier.yaml` | "Earlier, for other teams" cards |
| `projects/*.yaml` | one file per project: venture card / case-study teaser, project page, screenshots, store links |
| `omissions.yaml` | facts left out until the owner supplies them (never rendered) |

Contact details, booking link, GA4 ID and social links are in `src/config.ts`. Screenshots live in
`src/assets/work/<project>/` and go through Astro's image pipeline (AVIF + WebP, two widths).
After changing a project's screenshots or headline, re-render the share images:
`node scripts/og.mjs` (writes `public/og/*.png`; the `/og-template/` render page only exists in that build).

## Layout

- `src/layouts/Base.astro`: head (SEO, Open Graph, JSON-LD), consent-gated GA4 boot, page chrome
- `src/pages/`: `index`, `work/[slug]`, `privacy`, `404`, and `[ogPage]` (share-image template, OG builds only)
- `src/components/`: `layout/`, `paper/`, `ink/`, `media/`, `controls/`, `chrome/`, `home/`, `project/`
- `src/scripts/`: browser modules (analytics, consent, cursor, reveal, egg, lightbox, …)
- `src/styles/`: `tokens.css` (all colours, sizes, spacing), `base.css`, `fonts.css`
- `public/`: copied as-is: `_headers`, `_redirects`, fonts, icons, share images, `robots.txt`
- `wrangler.jsonc`: asset-only Worker serving `dist/`, `404.html` for unknown paths

## Rules that keep it working

- **CSP:** Astro hashes every script and style it emits. Never add `style=""` attributes,
  `<style define:vars>` or unhashed inline scripts (see `src/lib/csp.ts`); the console must stay free of
  CSP errors.
- **Privacy:** gtag.js loads only after the visitor says yes on the consent slip; nothing is sent to a
  Google domain before that. Keep it that way when adding tracking (`track()` in `src/scripts/analytics.ts`).
- **No photos of the owner** anywhere (pages, share images, structured data). No prices.
