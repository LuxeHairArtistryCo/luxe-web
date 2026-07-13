# Luxe Hair Artistry Co — Website (v2)

Next.js 16 (App Router) front end for the salon's website, content-managed via [Sanity](https://www.sanity.io). This is the `web` half of the project — the Sanity Studio lives in the sibling `cms/` folder as its own separate app/repo.

## Getting started

You'll need a `.env.local` file in this folder (not committed — ask whoever set up the project for the values, or check Vercel's environment variables):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
NEXT_PUBLIC_SITE_URL=
SANITY_WEBHOOK_SECRET=
SQUARE_WEBHOOK_SIGNATURE_KEY=
```

Artists running their own independent Square account (their own terminal — see "Square services & the Square webhook" below) each need one more var, named after their Sanity slug — e.g. an artist with slug `jane-doe` needs `SQUARE_WEBHOOK_SIGNATURE_KEY_JANE_DOE=`. There's no fixed list of these; add one per independent-account artist as they're onboarded.

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Content changes made in Sanity Studio won't show up locally until you hard-refresh (see "Content updates" below) — you don't need the revalidate webhook for local dev.

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run lint` | ESLint only |
| `npm run typecheck` | TypeScript type-check only (`tsc --noEmit`) |
| `npm run build` | Runs typecheck, then lint, then `next build` — same thing Vercel runs |
| `npm start` | Runs a production build locally (run `build` first) |
| `npm run release` | Bumps version, writes `CHANGELOG.md`, tags the release — see [`CONVENTIONS.md`](./CONVENTIONS.md) |

## Committing changes

Two Git hooks run via [Husky](https://typicode.github.io/husky/):

- `pre-commit` — runs `npm run typecheck && npm run lint`. Blocks the commit if either fails. ESLint warnings (e.g. the `no-warning-comments` rule flagging a stray `TODO`/`FIXME`) do not block.
- `commit-msg` — validates the commit message against the format defined in [`CONVENTIONS.md`](./CONVENTIONS.md).

If a hook isn't firing, run `npm install` again (it re-registers via the `prepare` script) and confirm `git config core.hooksPath` returns `.husky/_`.

To bypass hooks: `git commit --no-verify`.

Branching rules and the commit/versioning/release process are documented in [`CONVENTIONS.md`](./CONVENTIONS.md).

## Content updates & the revalidate webhook

Sanity content (artists, site settings, etc.) is cached indefinitely by Next.js — it does **not** re-fetch on a timer. Two ways it becomes fresh:

1. **A new deploy** (any push to `main`/`preview` triggers a Vercel rebuild, which always has current content).
2. **Sanity's webhook** hits `/api/revalidate-sanity` whenever content is published, which tells Next.js to drop the cached content immediately.

This is configured as **two separate webhook subscriptions** in Sanity at [sanity.io/manage](https://www.sanity.io/manage) → this project → API → Webhooks — one with the production domain as its URL, one with the preview domain — so both environments pick up content changes right away, not just whichever one happens to get redeployed next. Each subscription should have:

- **URL:** `https://<domain>/api/revalidate-sanity` (production or preview domain respectively)
- **HTTP method:** GET
- **HTTP headers:** `x-revalidate-secret` set to that environment's secret

The webhook sends that secret as a header (not a URL query param — kept out of logs/history on purpose), which must match `SANITY_WEBHOOK_SECRET`. Same trick as the Square webhooks below: one env var name, but a **different value under Vercel's Production vs Preview environments**, matching whichever domain's webhook is calling in. If content updates aren't showing up on the live site, check that webhook's "Attempts" log in Sanity's dashboard first — it shows the actual HTTP response your site sent back (a 401 usually means the secret in Sanity doesn't match what's set in Vercel for that environment).

## Square services & the Square webhook

An artist's services come from Square's Catalog API when `serviceType` is `square` (see `getSquareServices()` in `app/[category]/[slug]/page.tsx`). Square's catalog data is cached for up to an hour (`revalidate: 3600`) as a fallback, but also tagged both `square` and `square-<slug>` (that artist's Sanity slug) so it can be dropped immediately without waiting out the hour.

Artists are on one of two kinds of Square setup, and each kind is wired to a different webhook route:

- **Shared salon account** — most artists. They all read from the same Square catalog (one `squareAccessToken`), and `squareTeamMemberId` filters it down to that artist's own services. One shared webhook (`/api/revalidate-square`) covers all of them.
- **Independent account** — an artist with their own terminal running their own separate Square business, with their own `squareAccessToken` from their own Square Developer Console. They need their own dedicated webhook (`/api/revalidate-square/<their-slug>`), because a Square webhook subscription's signing key belongs to whichever Square account created it and can't be shared across accounts.

Whichever kind an artist is, Square fires a `catalog.version.updated` webhook whenever their catalog data changes (new service, price change, team member assignment, etc.).

### Setting up the shared account's webhook (once, already done)

Configured as **two separate webhook subscriptions** in the [Square Developer Console](https://developer.squareup.com/apps) (your app → Webhooks) — one with the production domain as its notification URL, one with the preview domain — so both environments stay in sync, not just whichever one you remember to update. Each subscription needs:

- **Notification URL:** `https://<domain>/api/revalidate-square` (production or preview domain respectively)
- **Event:** `catalog.version.updated`
- **API version:** matching what `getSquareServices()` sends (`2024-01-17`)

Square generates its own signature key per subscription, used to verify requests came from Square (not a spoofed POST). Rather than hardcoding two keys, this reuses the same trick as `SANITY_WEBHOOK_SECRET`: `SQUARE_WEBHOOK_SIGNATURE_KEY` is a single env var name, but set to a **different value under Vercel's Production vs Preview environments** — each holding the signature key Square generated for that domain's subscription.

### Setting up a new independent-account artist's webhook

Repeat this for every artist who has their own separate Square account (skip it entirely for artists on the shared account — they're already covered above). You'll need that artist's Sanity slug (Studio → the artist document → Slug field) and access to log into **their** Square account, not the salon's main one.

1. In **that artist's own** [Square Developer Console](https://developer.squareup.com/apps) (logged in as/with access to their Square account), create an app if one doesn't exist yet, then add two webhook subscriptions under it (production + preview), same as the shared account above but with a per-artist notification URL:
   - **Notification URL (production):** `https://luxehairartistry.ca/api/revalidate-square/<slug>`
   - **Notification URL (preview):** `https://preview.luxehairartistry.ca/api/revalidate-square/<slug>` — then follow the "Preview-only gotcha" steps below to append the protection-bypass query param.
   - **Event:** `catalog.version.updated`
   - **API version:** `2024-01-17`
2. Each of the two subscriptions generates its own signing key. In Vercel → Project Settings → Environment Variables, add **one new var name**, `SQUARE_WEBHOOK_SIGNATURE_KEY_<SLUG>` (slug uppercased, hyphens → underscores — e.g. slug `jane-doe` → `SQUARE_WEBHOOK_SIGNATURE_KEY_JANE_DOE`), and set it to the **production** subscription's key under the Production environment and the **preview** subscription's key under the Preview environment (same per-environment-scoping trick as every other secret in this project).
3. Redeploy (or wait for the next deploy) so the new env var is picked up.
4. Confirm it's working: publish a small catalog change in that artist's Square account and check the subscription's "Notification attempts" log in the Square Developer Console — a `200` with `{"revalidated":true}` means it worked; a `401` means the signing key in Vercel doesn't match, or the slug in the URL doesn't match the artist's actual Sanity slug.

If catalog changes aren't showing up for either kind of account, check that subscription's notification attempts log in the Square Developer Console first (mirrors the "Attempts" log advice for Sanity above) — a 401 there usually means the signing key doesn't match what's set in Vercel for that environment.

> **Preview-only gotcha:** non-production deployments on Vercel sit behind Vercel Authentication by default, which returns its own login page (a 401) before the request ever reaches this route — Square's webhook logs just show a bare 401 with no body in that case, easy to mistake for our own signature check failing. `Deployment Protection Exceptions` (the clean fix — make `preview.luxehairartistry.ca` fully public) requires Vercel's paid Advanced Deployment Protection add-on, so instead this project uses **Protection Bypass for Automation** (free, built for exactly this: third-party webhooks like Square/Stripe/Slack that can't send custom headers):
>
> 1. Vercel → Project Settings → Deployment Protection → Protection Bypass for Automation → generate a secret (this is shared across all subscriptions, not per-artist — only generate it once).
> 2. In the Square Developer Console, edit the **preview** subscription's notification URL to include it as a query param: `https://preview.luxehairartistry.ca/api/revalidate-square?x-vercel-protection-bypass=<secret>` for the shared account, or `https://preview.luxehairartistry.ca/api/revalidate-square/<slug>?x-vercel-protection-bypass=<secret>` for an independent-account artist.
> 3. Nothing needed for the production subscription — production deployments aren't protected by default, so its plain URL (no query param) is fine as-is.
>
> The route reads the notification URL straight from the incoming request (`request.url`) rather than rebuilding it from `NEXT_PUBLIC_SITE_URL`, specifically so the signature check still matches once that query param is appended.

## Deployment

- Hosted on Vercel, auto-deploys on push.
- `preview` branch → `preview.luxehairartistry.ca` (has `X-Robots-Tag: noindex` via `vercel.json` so it doesn't get indexed).
- Production domain (`luxehairartistry.ca`) is not yet cut over to this v2 site. Both the Sanity and Square webhooks are already configured for it, though, so cutover is just a DNS/Vercel domain change — no webhook setup needed at that point.
- Sanity Studio deploys separately, from `cms/`: `npm run deploy` there (not part of this repo's build).

## Conventions

A few deliberate patterns in this codebase that look unusual out of context — don't "clean these up" without understanding why first:

- **Inline `style={{ ... }}` with CSS variables, instead of Tailwind color classes.** Tailwind v4 in this project is configured via CSS variables in `globals.css` rather than a `tailwind.config.ts`, and inline styles proved more reliable here than relying on generated utility classes for the color palette. Layout/spacing still uses normal Tailwind classes — it's specifically colors that go through `style`.
- **`WebkitLineClamp` + the `--bio-clamp` CSS variable** (`components/artistCard.tsx`, defined in `globals.css`) — truncates artist bios to a responsive number of lines that increases at wider mobile breakpoints, so it doesn't look awkwardly short on a slightly bigger phone.
- **`style={{ display: 'contents' }}`** (`components/footer.tsx`) instead of a Tailwind `contents` class — the class version was unreliable on mobile Chrome specifically; the inline style version isn't.

## Known issues (not fixable in this codebase)

- **Sanity Studio doesn't load on iOS Safari or Chrome** (both use WebKit on iOS). Believed to be a CORS-related WebKit issue on Sanity's side, not something in this app. Reported to the Sanity community; no fix as of yet. Workaround: use Studio from a desktop browser.
- **HEIC image uploads aren't supported by Sanity's asset pipeline.** If a client uploads directly from an iPhone and it fails, have them go to Settings → Camera → Formats → **Most Compatible** on the iPhone before uploading (this makes the phone save JPEGs instead of HEIC).
