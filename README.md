# Reach — Fire Alarm & Sensors Product Showcase (AR/EN)

Bilingual (Arabic default / English) catalog site for fire-alarm equipment.
**Static export** (GitHub Pages) + **Supabase** backend (free tiers only).
Source of truth for scope and rules: [`PROJECT_SPEC.md`](./PROJECT_SPEC.md).

> Status: **Phase 3 — Admin core — DONE**. See [`docs/PROGRESS.md`](./docs/PROGRESS.md).

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

`npm run build` reads site content from Supabase **at build time** (D-029), so
`.env.local` must point at a reachable instance (local stack or hosted) before building.

## Supabase

Database schema lives in [`supabase/migrations/`](./supabase/migrations) (applied in filename order):

| Migration             | Contents                                                                      |
| --------------------- | ----------------------------------------------------------------------------- |
| `…0001_functions.sql` | `public.is_admin()` (JWT `app_metadata.role = 'admin'`), `set_updated_at()`   |
| `…0002_schema.sql`    | 11 tables (lookup, products, content) + indexes + `updated_at` trigger        |
| `…0003_rls.sql`       | RLS enabled on all tables — 29 policies: public read / admin write            |
| `…0004_storage.sql`   | Buckets `product-images`, `catalogs`, `site-assets` + storage object policies |

Seed data: [`supabase/seed.sql`](./supabase/seed.sql) — categories, brands, spec
definitions and all 65 products from spec Appendix A, **as unpublished drafts**.

### Local development

Requires Docker. Note: this project's `config.toml` uses ports **560xx** instead of
Supabase's default 543xx because Windows reserves 54321–54420 on this machine (see D-022).

```bash
npx supabase start     # full local stack (first run pulls ~6 GB of images)
npx supabase db reset  # re-apply all migrations + seed from scratch
npx supabase stop
```

Lightweight variant (database only — enough for migrations, RLS tests and type
generation; skips Studio/auth/storage HTTP services):

```bash
npx supabase start --exclude=gotrue,realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

### Local admin user

Create the local admin account once per machine, then keep it for future sessions.
Open Supabase Studio at `http://127.0.0.1:56023`, go to **Authentication → Users → Add user**,
and create `admin@local.test` with a password you choose. Then promote it in local Postgres:

```powershell
$dbContainer = docker ps --filter "name=supabase_db_" --format "{{.Names}}" | Select-Object -First 1
docker exec $dbContainer psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "update auth.users set raw_app_meta_data = raw_app_meta_data || '{""role"":""admin""}'::jsonb where email = 'admin@local.test';"
```

Sign out and back in so the new JWT includes `app_metadata.role=admin`. Never put a
service-role key in the repo or browser; security remains in Supabase RLS.

### RLS verification (Phase 1 DoD)

After `db reset`, the suite asserts: anon cannot write **any** table, anon cannot read
drafts, admin (JWT with `app_metadata.role='admin'`) can do everything:

```bash
psql -v ON_ERROR_STOP=1 "postgresql://postgres:postgres@127.0.0.1:56022/postgres" < supabase/tests/rls_verify.sql
```

(PowerShell has no `<` input redirect — run it from cmd/Git Bash, or
`Get-Content supabase\tests\rls_verify.sql -Raw | psql …`. Note: this psql requires
options **before** the connection string.)

### Type generation

Generated types are committed at [`src/lib/supabase/database.types.ts`](./src/lib/supabase/database.types.ts)
(excluded from Prettier — regenerate, don't hand-edit):

```bash
npx supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts
```

### Hosted project setup

1. **Create the project** — [supabase.com](https://supabase.com) → New project (free tier).
2. **Apply migrations** — either paste the four files from `supabase/migrations/` into the
   SQL Editor in order, or link the CLI: `npx supabase link --project-ref <ref>` → `npx supabase db push`.
3. **Seed** — run the contents of `supabase/seed.sql` in the SQL Editor.
   (Products stay hidden until `is_published = true`.)
4. **Disable public signups** — Dashboard → _Authentication → Sign In / Providers_ →
   uncheck **“Allow new users to sign up”**. Only the admin user you create below can sign in.
5. **Create the admin user** — Dashboard → _Authentication → Users_ → **Add user**
   (email + password), then run in the SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   The admin claim travels in the JWT, so **sign out and back in** after setting it.
   RLS (not the UI) is what grants write access — see `public.is_admin()`.

6. **Environment variables** — Dashboard → _Project Settings → API_ → copy the Project URL
   and `anon` public key into `.env.local` (see table below).

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
├─ components/            layout · home · products · product · contact · ui (shared)
├─ lib/                   env, fonts, i18n (routing/request/navigation), helpers
│  ├─ products/           listing types, URL state, MiniSearch index
│  └─ supabase/           server (build-time client), queries, database.types.ts (generated)
└─ messages/{ar,en}.json
supabase/
├─ migrations/           0001 functions · 0002 schema · 0003 rls · 0004 storage
├─ seed.sql              Appendix A — 65 products as unpublished drafts
├─ tests/rls_verify.sql  RLS DoD suite (run with psql, see above)
└─ config.toml           local stack config (ports 560xx — see D-022)
```

## Deploy

GitHub Pages via GitHub Actions — implemented in **Phase 5** (spec §9).

## Docs

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — full specification (wins on conflicts)
- [`docs/DESIGN.md`](./docs/DESIGN.md) — design system
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — decision log
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — phase checklist
