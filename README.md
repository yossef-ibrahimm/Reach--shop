# Reach — Fire Alarm & Sensors Product Showcase (AR/EN)

Bilingual (Arabic default / English) catalog site for fire-alarm equipment.
**Static export** (GitHub Pages) + **Supabase** backend (free tiers only).
Source of truth for scope and rules: [`PROJECT_SPEC.md`](./PROJECT_SPEC.md).

> Status: **Phase 0 — Scaffold**. See [`docs/PROGRESS.md`](./docs/PROGRESS.md).

## Requirements

- Node.js 20+ (verified on Node 24 / npm 11)
- npm

## Setup

```bash
npm install
copy .env.example .env.local   # Windows (or: cp .env.example .env.local)
# fill in the values — see "Environment variables" below
```

## Commands

| Command             | What it does                           |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev server                             |
| `npm run build`     | Static export into `out/`              |
| `npm run serve`     | Serve the static `out/` folder locally |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | `tsc --noEmit`                         |
| `npm run format`    | Prettier write                         |

## Environment variables

Committed template: [`.env.example`](./.env.example). Real values live in
`.env.local` (git-ignored) and in GitHub Secrets.

| Variable                        | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (anon-safe)                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — the only key the browser may see                  |
| `NEXT_PUBLIC_SITE_URL`          | Canonical public URL (sitemap / hreflang / OG)                        |
| `NEXT_PUBLIC_BASE_PATH`         | `""` (custom domain) or `"/repo-name"` for GitHub Pages project sites |

**Never** commit the `service_role` key or a GitHub token — not in `.env*`, not in
`NEXT_PUBLIC_*`, not anywhere in this (public) repo. Security lives in Supabase RLS.

## Structure

```
src/
├─ app/
│  ├─ (site)/[locale]/   public site — root layout with per-locale <html lang dir>
│  ├─ (admin)/           admin area — Arabic RTL root layout, noindex
│  ├─ (redirect)/        `/` → meta-refresh + JS redirect to /ar/
│  └─ global-not-found.tsx  bilingual 404 (multiple root layouts)
├─ components/
├─ features/
├─ lib/                  env, fonts, i18n (routing/request/navigation), helpers
└─ messages/{ar,en}.json
```

## Deploy

GitHub Pages via GitHub Actions — implemented in **Phase 5** (spec §9).

## Docs

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — full specification (wins on conflicts)
- [`docs/DESIGN.md`](./docs/DESIGN.md) — design system
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — decision log
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — phase checklist
