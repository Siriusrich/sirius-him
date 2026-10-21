# Sirius HIM — official website

Official site for **Sirius HIM** — independent melodic dancehall & R&B artist from
Runaway Bay, Jamaica.

A fast, static, five-page site with a visual admin dashboard. No database to manage, no
paid services, no credit card. Content lives in plain JSON files under `content/`; the
pages are generated from them, and the `/admin` dashboard edits those same files through
a form-based editor (Decap CMS, open source).

## Two ways to edit your site

### 1. The dashboard (recommended, no code)

Open `/admin` on your site, sign in with GitHub, and edit with forms:

| Editor section | Controls |
| --- | --- |
| **Site & social links** | Artist name, domain, location, tagline, genres, short bio, contact email, social profile URLs |
| **About page (biography)** | Intro line, portrait photo, story paragraphs, pull quote, quick facts |
| **Releases** | Add/remove releases: title, order, "feature on home", "coming soon" badge, type, date, cover artwork upload, description, streaming links |
| **Videos** | YouTube music videos and shorts (paste the video ID), titles, descriptions |

Click **Save** — the site rebuilds and goes live in about a minute. Empty URLs always show
a "coming soon" state on the site — never a broken link.

### 2. Edit the JSON files directly

All content lives in `content/` (see table below). `npm run dev` regenerates the pages as
you save. Files/folders starting with `_` are notes and are ignored.

```
content/site.json          artist name, tagline, bio, contact email, socials
content/about.json         About page: story paragraphs, quote, facts, portrait
content/releases/*.json    one file per release (ordered by the "order" field)
content/videos.json        YouTube videos and shorts
```

### Adding cover artwork

Upload it in the dashboard's cover-artwork field, or drop a square JPG/PNG (1400×1400
recommended) into `src/assets/img/` and reference it as `assets/img/your-file.jpg`.

## Running locally

```bash
npm install        # once
npm run dev        # preview at http://localhost:3000 (pages + /admin); content edits
                   # regenerate the pages automatically while it runs
npm run build      # production build → dist/
```

To try the dashboard without any login (great for practice — writes straight to disk):

```bash
npx decap-server   # terminal 1 — the local content proxy
npm run dev        # terminal 2
```

Then open http://localhost:3000/admin/ and click the login button (no password in local
mode). `local_backend: true` in `src/public/admin/config.yml` makes the editor talk to the
local proxy instead of GitHub; when the proxy is not running, the editor falls back to the
GitHub backend automatically — so this setting is safe to leave in production.

Optional: `node scripts/e2e-admin-test.mjs` runs the automated browser test of the whole
editor flow (requires `npm i -D playwright` + `npx playwright install chromium`).

## One-time setup (Phase 2 — needed before the dashboard can save on the live site)

The editor signs you in through GitHub, and the site is hosted on Netlify's free tier.
These steps need your (free) accounts — I can walk you through each:

1. **GitHub repo** — create a free GitHub account if needed; the project is pushed to a new
   repo (this is where your content and artwork are stored).
2. **Netlify site** — free account, connect the repo; build command `npm run build`,
   publish directory `dist`.
3. **Editor login** — register a (free) GitHub OAuth application:
   GitHub → Settings → Developer settings → OAuth apps → New OAuth app, and use this
   **Authorization callback URL** (verified against Netlify's current docs):

   ```text
   https://api.netlify.com/auth/done
   ```

   Then install GitHub as an authentication provider in Netlify
   (Site settings → Access control → Authentication providers → GitHub) and paste the
   Client ID and Client Secret there. One-time, ~10 minutes. This is what lets `/admin`
   sign you in with your own GitHub account.
4. In `src/public/admin/config.yml`, set `repo:` to `your-github-name/repo-name`.

Note: when the dashboard saves a content file for the first time it rewrites it from the
form schema — the `_note` helper comments in the JSON are dropped from that file from then
on. That's expected and harmless.

### Free-hosting limits to know (verified against Netlify's docs, Oct 2026)

- New Netlify Free accounts are **credit-based**: 300 credits/month, and a static
  production deploy costs about 15 credits → roughly **20 publishes per month** free.
  Editing a handful of times a week fits fine; heavier testing may not. (Legacy free
  accounts: 300 build minutes + 100 GB bandwidth/month.)
- 500 projects, one concurrent build; no credit card required.
- If you ever need unlimited publishes for free, Cloudflare Pages allows 500 builds/month,
  but Decap's GitHub login there requires your own OAuth proxy (extra setup) — not the
  recommended path for a beginner.
- The editor login needs the GitHub OAuth app above; without it `/admin` loads but sign-in
  cannot complete.

## What's tested (automated browser test, Oct 2026)

`node scripts/e2e-admin-test.mjs` drives a real Chromium and passes **12/12**:

1. `/admin` loads the Decap editor UI; one-click local login opens it (no password)
2. The biography form opens showing the current intro line from `content/about.json`
3. Typing an edit sticks in the form (Decap's controlled inputs verified)
4. **Save → `content/about.json` changes on disk** (proxy `persistEntry` → 200)
5. Reopening in a fresh session shows the saved edit (persistence proven)
6–8. A restore edit saves and the file ends **byte-identical** to its original
9. Releases form opens with title, cover-artwork and description widgets
10. Site form opens with the artist-name field (`Sirius HIM`)
11. Videos form opens with YouTube ID/title/description fields (list rows expand)
12. No console or page errors during the run

Also verified: content → page regeneration (local watcher and `npm run build`),
production build exit 0, all routes and `/admin` serve 200.

**Not yet testable here (requires your free accounts):** GitHub sign-in on the hosted
site, and a hosted save → Netlify rebuild → live publish. Both follow the Phase 2 steps
above; I can verify them with you once the accounts are connected.

## Project structure

```
content/                ← your content (dashboard edits these)
scripts/
  build-content.mjs     ← content → HTML (runs automatically)
  templates.mjs         ← page layout & components
src/
  admin/index.html      ← the /admin dashboard entry
  index.html …          ← generated pages (don't edit by hand)
  assets/css/main.css   ← design system (tokens in :root)
  assets/js/main.js     ← nav, scroll reveals, contact form
  assets/img/           ← artwork + uploads
  public/admin/config.yml ← dashboard schema (repo setting lives here)
  public/               ← favicon, share image (robots.txt + sitemap.xml generated)
dist/                   ← production build (deploy target)
```

## Design system

Near-black canvas `--bg: #0a0a0c`, warm ivory type `--ivory: #f1e9da`, Caribbean-sunset
accent `--sunset: #f4713a` → `--gold: #f2b33d`, self-hosted Instrument Serif display type.
All values in `:root` at the top of `main.css`.

## Before launch — checklist

- [ ] `siteUrl` set to the real domain (drives canonical URLs, Open Graph, sitemap)
- [ ] Real streaming links added; "coming soon" badges removed (`placeholder` = false)
- [ ] Artwork and portrait replaced (current portrait is an abstract placeholder)
- [ ] YouTube IDs added; social URLs and `contactEmail` filled in
- [ ] `src/public/og.svg` replaced with a 1200×628 PNG named `og.png`; set `ogImage` to `/og.png`
- [ ] Pull quote and bio personalised in the About editor
- [ ] Phase 2 setup above completed so the dashboard can save

## Built in

- Semantic HTML, one `h1` per page, landmarks, skip link, visible focus states, `aria-current` nav
- `prefers-reduced-motion` respected
- Per-page titles/descriptions, canonical + Open Graph tags, robots.txt, sitemap.xml,
  JSON-LD (`MusicGroup` / `WebSite`)
- Mobile-first CSS, ~1.3 kB gzipped JS, self-hosted subset fonts, lazy media
