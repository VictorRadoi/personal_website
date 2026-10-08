# Launch guide

Site: <https://rvandrei.com>, an Astro static site served by a Cloudflare Worker (static assets only).
Today the domain still serves the old Flutter web site (almost certainly a Cloudflare Pages project on
the same Cloudflare account; DNS for rvandrei.com is on Cloudflare). Do the steps in order.

## 0. Before every deploy

```bash
npm ci
npm run check                    # 0 errors
npm run build
node tests/tbd-report.mjs        # lists facts still missing; fails if a TBD would be visible
npx wrangler deploy --dry-run
```

Optional local check with the real Cloudflare behaviour (headers, redirects, 404 status):
`npx wrangler dev`, then open http://localhost:8787.

## A. Cloudflare account and first deploy (workers.dev, no domain yet)

1. **Account ID**: Cloudflare dashboard > Workers & Pages; it is in the right sidebar.
2. **API token** (for GitHub Actions): My Profile > API Tokens > Create Custom Token with
   `Account / Workers Scripts / Edit`; for the custom domain also `Zone / Workers Routes / Edit` and
   `Zone / DNS / Edit` (zone: rvandrei.com). Never paste it into chat or commit it.
3. **GitHub secrets**: repo > Settings > Secrets and variables > Actions: `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`.
4. **First deploy**: `npx wrangler login`, then `scripts/deploy.sh --dry-run`, then `scripts/deploy.sh`.
   Open the `https://victor-radoi-portfolio.<your-subdomain>.workers.dev` URL it prints and click through
   every page on a phone and a laptop. From then on, merging to `main` deploys through GitHub Actions and
   pull requests get a preview version.

Analytics stays off on the workers.dev URL until you say yes on the consent slip (and then it counts real
visits under the workers.dev hostname; that is fine, or filter the hostname out in GA4 later).

## B. Domain cutover: old site → new Worker

Cut over only after the workers.dev URL looks right. Expect a few minutes where the domain shows an
error while DNS and the certificate switch; pick a quiet hour.

1. **Find the old project**: Workers & Pages > the Pages project that lists `rvandrei.com` under
   Custom domains. Note its name (for rollback).
2. **Detach the domain from the old project**: that project > Custom domains > `rvandrei.com` > Remove.
   (A custom domain can belong to one project only.) There is currently no `www` record; add one in
   step 4 if you want `www` to work.
3. **Attach it to the Worker**: in `wrangler.jsonc` uncomment the `routes` block (apex and `www`,
   `custom_domain: true`) and deploy (`scripts/deploy.sh` or merge to `main`). Wrangler creates the DNS
   records and the certificate. If it reports an existing DNS record, delete the old `rvandrei.com`
   CNAME/AAAA record under DNS > Records and deploy again.
   No-code alternative: Workers & Pages > `victor-radoi-portfolio` > Settings > Domains & Routes >
   Add > Custom domain > `rvandrei.com` (and `www.rvandrei.com`).
4. **www → apex**: Rules > Redirect Rules > Create: when hostname equals `www.rvandrei.com`, redirect
   (301) to `https://rvandrei.com${path}` keeping the query string.
5. **Verify**:
   - `curl -sI https://rvandrei.com/` → `200`, with `strict-transport-security` and `x-frame-options` headers.
   - `curl -sI https://rvandrei.com/nope/` → `404` (the "Nothing here." page).
   - `curl -sI https://rvandrei.com/work/dream-pivot` → redirect to `/work/dream-pivot/`.
   - `curl -sI https://rvandrei.com/hire/` → `302` to `/#contact`.
   - Open the site in a browser where you visited the old site before: it must show the new site
     (see "old service worker" below), and the browser console must be free of errors.
6. **Old service worker**: the Flutter site installed a service worker (`/flutter_service_worker.js`)
   in every visitor's browser, and it serves cached copies of old files (icons, `favicon.ico`, the
   manifest). The new site ships a replacement `public/flutter_service_worker.js` that deletes those
   caches and unregisters itself the first time a returning visitor loads any page. Leave it in place
   for about six months after the cutover, then delete the file and its `_headers` rule.
7. **Old URLs**: the Flutter site had one page (`/`), so nothing else needs a redirect. `public/_redirects`
   sends the old CV PDF path to the home page and keeps the `/hire/` and `/contact/` short links.
8. **Rollback**: remove the custom domain from the Worker (comment `routes` again and deploy, or remove it
   under Domains & Routes), then re-add `rvandrei.com` under the old Pages project's Custom domains.
9. When everything has looked right for a week or two, delete the old Pages project.

URL policy: every page lives at a trailing-slash URL (`/work/teamboard/`); the slash-less form
redirects to it. Canonical tags and the sitemap use the same form.

## C. Google Analytics 4 (property already exists: G-D6Y74947LM)

How the site uses it: nothing is loaded from Google until the visitor clicks "Yes, count me" on the
consent slip (no cookieless pings before consent). A "yes" is remembered for 12 months; "No" or
"Cookie settings → No" stops counting at once and deletes the `_ga` cookies. Visitors who decline are
not counted, so numbers undercount. That is expected and keeps the site GDPR-safe.

1. **Retention and signals**: Admin > Data collection and modification > Data retention > Event data
   retention: **14 months** (the privacy page says 14 months; keep them in sync). Admin > Data collection:
   leave **Google signals off**.
2. **Custom dimensions** (Admin > Data display > Custom definitions > Create custom dimension, scope
   Event, one per parameter): `method`, `location`, `slug`, `product`, `target`, `source`, `percent`,
   `section`, `image_id`, `egg`, `input`, `fancy`, `path`. Parameters appear in reports only after
   they are registered here.
3. **Key Events for email / WhatsApp / booking clicks**. Every contact button sends one event,
   `cta_click`, with `method` = `email`, `whatsapp` or `booking` (also `linkedin`, `github`, `todo`) and
   `location` = where on the site. To count each contact channel as its own key event:
   1. Admin > Data display > Events > **Create event** > Create. Name `contact_email`; matching conditions:
      `event_name` equals `cta_click` AND `method` equals `email`; keep "Copy parameters from the source
      event" ticked. Save.
   2. Repeat for `contact_whatsapp` (`method` equals `whatsapp`) and `contact_booking` (`method` equals
      `booking`).
   3. Admin > Data display > **Key events** > New key event: add `contact_email`, `contact_whatsapp`,
      `contact_booking`, and `email_copy` (someone copied the address). New events only start counting
      from the moment they are created.
   4. Test: open the live site, accept analytics, click each button, then check Reports > Realtime
      (or Admin > DebugView with the Google Analytics Debugger extension).
4. Other events you will see: `page_view`, `case_study_open` (with `source`), `project_scroll_depth`,
   `section_view`, `nav_click`, `outbound_click` (store links), `screenshot_zoom`, `easter_egg_enter` /
   `easter_egg_found`, `cursor_pref_change`, `not_found` (with the missing `path`: worth checking
   monthly for broken links).
5. EU vs US: Reports > User attributes > Demographic details, primary dimension Country.

## D. Google Search Console

1. <https://search.google.com/search-console> > Add property > **Domain** `rvandrei.com`.
2. Add the TXT record it shows in Cloudflare DNS (type TXT, name `@`), then Verify.
3. After the cutover: Sitemaps > submit `https://rvandrei.com/sitemap-index.xml`.
4. URL Inspection > the home page and the three `/work/…/` pages > Test live URL > Request indexing.
5. Over the next weeks: Pages report (indexing problems), Performance (queries and countries).
   The old site had one URL, so no "Change of address" is needed.

## E. Booking link

Done: `https://cal.com/rvandrei/30min` (30-minute call) in `src/config.ts` → `BOOKING_URL`. If the
event slug ever changes, update it there, rebuild and deploy. Keep the Cal.com event's availability
covering EU and US hours.

## F. Adding languages later

The plan is English now; Romanian, Italian, Spanish, German and French later (`ro`, `it`, `es`, `de`,
`fr`). The site is ready for it: every visible string is in `src/content/` (no hardcoded copy in
components), `site.yaml` already stores its copy under an `en` entry, and `<html lang="en">` is set in
one place (`Base.astro`). When a language is ready:

1. **URLs**: English stays at `/`; each language lives under its own prefix (`/ro/`, `/ro/work/teamboard/`,
   …). Configure Astro i18n in `astro.config.mjs`:
   `i18n: { defaultLocale: 'en', locales: ['en', 'ro', …], routing: { prefixDefaultLocale: false } }`,
   and add `src/pages/[lang]/…` routes (or per-locale folders) that reuse the same components.
2. **Content**: add a `ro` entry to `site.yaml` (same keys as `en`), and per-locale copies of
   `services.yaml`, `earlier.yaml` and `projects/*.yaml` (e.g. `projects/ro/teamboard.yaml`).
   `getSite()` in `src/lib/content.ts` takes the locale instead of the fixed `'en'`.
3. **Head tags**: per page `<html lang="ro">`, `og:locale` (`ro_RO`), and `hreflang` alternates for every
   language plus `x-default` (English), all as absolute trailing-slash URLs.
4. **Sitemap**: enable the `i18n` option of `@astrojs/sitemap` so each URL lists its alternates.
5. **Language switcher**: a small link list in the header/menu and footer, linking to the same page in
   the other language (never auto-redirect by browser language).
6. **Structured data**: update `availableLanguage` in the ProfessionalService node (currently English only)
   to the languages you actually offer work in.
7. **Review**: have a native speaker review each language before launch, including the consent slip and
   the privacy page (legal wording), button labels and the hand-written notes. Re-render share images
   per language if their headline is translated (`scripts/og.mjs`).
8. Submit the new sitemap in Search Console and add a GA4 comparison by `page_path` prefix.

## G. Owner checklist (still open)

| Item | Where | Status |
| --- | --- | --- |
| Contacts, GA4 ID, booking link | `src/config.ts` | Done |
| Share images (1200×630) per page | `public/og/*.png` | Done (`node scripts/og.mjs` to redo) |
| Real GoParty screenshots (organizer app too) | `src/assets/work/goparty/` + `projects/goparty.yaml` | Interim store images in use |
| Missing facts | `node tests/tbd-report.mjs` | See list |
| GA4 retention 14 months, custom dimensions, key events | GA4 admin (section C) | TODO |
| Domain cutover | section B | TODO |
| Search Console | section D | TODO after cutover |
