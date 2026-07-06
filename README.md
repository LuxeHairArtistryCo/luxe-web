# Luxe Hair Artistry Co — Website (v2)

Next.js 16 (App Router) front end for the salon's website, content-managed via [Sanity](https://www.sanity.io). This is the `web` half of the project — the Sanity Studio lives in the sibling `cms/` folder as its own separate app/repo.

## Getting started

You'll need a `.env.local` file in this folder (not committed — ask whoever set up the project for the values, or check Vercel's environment variables):

```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
NEXT_PUBLIC_SANITY_API_VERSION=
NEXT_PUBLIC_SITE_URL=
REVALIDATE_SECRET=
```

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
| `npm run build` | Runs lint, then typecheck, then `next build` — same thing Vercel runs |
| `npm start` | Runs a production build locally (run `build` first) |

## Committing changes

A Git pre-commit hook (via [Husky](https://typicode.github.io/husky/)) runs `npm run lint && npm run typecheck` automatically on every `git commit`. If either fails, the commit is blocked and the errors print in your terminal — fix them and commit again. Warnings (like the pre-launch TODO in `app/api/revalidate/route.ts`) don't block anything.

If Husky ever isn't firing, run `npm install` again (it wires itself up via the `prepare` script) and check `git config core.hooksPath` returns `.husky/_`.

To skip the hook in a genuine emergency: `git commit --no-verify`.

**Note:** ESLint and `tsc` catch different things — ESLint is fast, syntax/style-level linting; `tsc --noEmit` is the actual TypeScript compiler checking real types. Both run before every commit, but if you're debugging why something wasn't caught, check which of the two should have caught it.

## Content updates & the revalidate webhook

Sanity content (artists, site settings, etc.) is cached indefinitely by Next.js — it does **not** re-fetch on a timer. Two ways it becomes fresh:

1. **A new deploy** (any push to `main`/`preview` triggers a Vercel rebuild, which always has current content).
2. **Sanity's webhook** hits `/api/revalidate` whenever content is published, which tells Next.js to drop the cached content immediately. This is configured in Sanity at [sanity.io/manage](https://www.sanity.io/manage) → this project → API → Webhooks.

The webhook sends a `x-revalidate-secret` header (not a URL query param — kept out of logs/history on purpose) that must match `REVALIDATE_SECRET`. If content updates aren't showing up on the live site, check the webhook's "Attempts" log in Sanity's dashboard first — it shows the actual HTTP response your site sent back.

> **Pre-launch TODO:** the webhook currently points at the preview domain for testing. Before switching `luxehairartistry.ca` over to production, update the webhook URL in Sanity and confirm `REVALIDATE_SECRET` is set under the **Production** environment in Vercel (not just Preview). See the comment at the top of `app/api/revalidate/route.ts`.

## Deployment

- Hosted on Vercel, auto-deploys on push.
- `preview` branch → `preview.luxehairartistry.ca` (has `X-Robots-Tag: noindex` via `vercel.json` so it doesn't get indexed).
- Production domain (`luxehairartistry.ca`) is not yet cut over to this v2 site — see the pre-launch TODO above.
- Sanity Studio deploys separately, from `cms/`: `npm run deploy` there (not part of this repo's build).

## Conventions

A few deliberate patterns in this codebase that look unusual out of context — don't "clean these up" without understanding why first:

- **Inline `style={{ ... }}` with CSS variables, instead of Tailwind color classes.** Tailwind v4 in this project is configured via CSS variables in `globals.css` rather than a `tailwind.config.ts`, and inline styles proved more reliable here than relying on generated utility classes for the color palette. Layout/spacing still uses normal Tailwind classes — it's specifically colors that go through `style`.
- **`WebkitLineClamp` + the `--bio-clamp` CSS variable** (`components/artistCard.tsx`, defined in `globals.css`) — truncates artist bios to a responsive number of lines that increases at wider mobile breakpoints, so it doesn't look awkwardly short on a slightly bigger phone.
- **`style={{ display: 'contents' }}`** (`components/footer.tsx`) instead of a Tailwind `contents` class — the class version was unreliable on mobile Chrome specifically; the inline style version isn't.

## Known issues (not fixable in this codebase)

- **Sanity Studio doesn't load on iOS Safari or Chrome** (both use WebKit on iOS). Believed to be a CORS-related WebKit issue on Sanity's side, not something in this app. Reported to the Sanity community; no fix as of yet. Workaround: use Studio from a desktop browser.
- **HEIC image uploads aren't supported by Sanity's asset pipeline.** If a client uploads directly from an iPhone and it fails, have them go to Settings → Camera → Formats → **Most Compatible** on the iPhone before uploading (this makes the phone save JPEGs instead of HEIC).
