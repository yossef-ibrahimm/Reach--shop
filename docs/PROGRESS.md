# PROGRESS

Current phase: **1 — Supabase — DONE (2026-10-01)**, awaiting approval to start Phase 2.

## Definition of done (every phase)
- [x] `npm run build` succeeds as a static export
- [x] No TypeScript / ESLint errors
- [x] RTL and LTR both verified
- [x] No secrets in the repo
- [x] RLS verified (anon cannot write; anon cannot read drafts) — from Phase 1
- [x] This file updated

## Phases
- [x] **0 Scaffold** — Next.js static export, TS strict, Tailwind (logical props), next-intl ar/en, fonts, site + admin layouts, lint/format, env, basePath, root redirect
- [x] **1 Supabase** — migrations (schema + RLS + storage), type generation, seed.sql from Appendix A (drafts), README steps (project + admin user)
- [ ] **2 Public site** — layout/header/footer/WhatsApp, Home, Products listing (filters + search + URL state), Product page, About, Contact, 404
- [ ] **3 Admin core** — login, guard, dashboard, products list, add/edit product, image + PDF pipeline, duplicate/delete/publish
- [ ] **4 Admin extras** — categories, brands, series, specs, settings, certificates, projects
- [ ] **5 Deploy** — Edge Function trigger-deploy, GitHub Actions, "Publish changes", weekly cron + external keep-alive, docs
- [ ] **6 SEO & polish** — sitemap/robots/hreflang/JSON-LD/OG, a11y pass, perf pass (Lighthouse ≥ 90 mobile), empty/error states, final README

## Log

### 2026-10-01 — Phase 0: Scaffold ✅
**Built**
- Next.js 16.3.8 static export (`output: 'export'`, `trailingSlash`, `images.unoptimized`, `basePath` from `NEXT_PUBLIC_BASE_PATH`), TS strict, Tailwind v4 with DESIGN.md tokens in `@theme`, Prettier + ESLint (`no-explicit-any` = error).
- next-intl 4.14.8 without middleware: `src/lib/i18n/{routing,request,navigation}.ts`, locale via `next/root-params`, `ar` default, `localePrefix: 'always'`, `generateStaticParams`.
- Three root layouts: `(site)/[locale]` (lang/dir per locale + `NextIntlClientProvider`), `(admin)` (Arabic RTL, noindex), `(redirect)` (static `/` → `/ar/` meta-refresh + JS fallback, basePath-aware).
- Bilingual 404 via `app/global-not-found.tsx` (`experimental.globalNotFound`) → `out/404.html`.
- Fonts via `next/font/google`: Cairo / Inter / JetBrains Mono (`src/lib/fonts.ts`), per-locale family selection in CSS.
- `.env.example`, README skeleton, `scripts/serve.mjs` (static server emulating GitHub Pages), `public/.nojekyll`, minimal AR/EN messages + placeholder pages.

**Verified** (commands + results)
- `npm run build` → OK, routes `/`, `/[locale]` (ar, en), `/admin`, `/_not-found`; all static (○/●), experiment `globalNotFound` enabled. `out/` contains `index.html`, `ar/`, `en/`, `admin/`, `404.html`, `.nojekyll`.
- `npm run lint` → 0 problems (probe file with `any` correctly fails, removed after).
- `npm run typecheck` (`next typegen && tsc --noEmit`, from a clean `.next/`) → 0 errors.
- `npm run format:check` → all files conform.
- Served `out/` with `scripts/serve.mjs`: `/` 200 `lang=ar dir=rtl` + `http-equiv refresh → /ar/`; `/ar/` 200 rtl + Arabic content; `/en/` 200 ltr + English content; `/admin/` 200 rtl + `noindex`; unknown path → HTTP 404 with bilingual `404.html`.
- Rebuilt with `NEXT_PUBLIC_BASE_PATH=/reach-site` and served from a `/reach-site/` prefix: refresh URL, asset URLs, nav links and 404 home link all prefixed; same 200/404 + lang/dir results.

**Decisions**: D-011, D-012, D-013 resolved; D-014…D-021 added (see `DECISIONS.md`).

**Open questions**: none blocking. D-006 (Appendix A ⚠ rows) and D-008 (category icons) remain open for later phases.

### 2026-10-01 — Phase 1: Supabase ✅
**Built**
- `supabase/` project (CLI 2.119.0 as devDependency): `config.toml` with ports remapped to 553xx (D-022), `seed.sql` path wired.
- Four migrations in order: `0001_functions` (`public.is_admin()` from spec §5 verbatim + `set_updated_at()`), `0002_schema` (all 11 tables from §5 with AR/EN column pairs, check constraints, indexes on category/brand/series/is_published/product_images + GIN on `specs`, `updated_at` trigger), `0003_rls` (RLS on 11 tables → 29 policies: public read of published/active rows, admin-only writes, drafts hidden), `0004_storage` (buckets `product-images` webp ≤5 MB, `catalogs` pdf ≤10 MB, `site-assets` ≤5 MB, public read / admin write policies on `storage.objects`).
- `supabase/seed.sql` — 17 categories, 8 brands, 7 spec definitions, 65 products (Appendix A) all `is_published = false`; availability per D-004; re-runnable (`on conflict do nothing`).
- `supabase/tests/rls_verify.sql` — DoD suite: seed counts, RLS/policy inventory, anon read/write matrix on all 11 tables + storage, `is_active`/`is_published` filtering, authenticated-no-admin denial, full admin round-trip, `updated_at` trigger, cleanup to pristine state.
- `src/lib/supabase/database.types.ts` generated (`gen types typescript --local --schema public`), added to `.prettierignore`.
- README: Supabase section (migration table, local dev, RLS test command, type regeneration, hosted setup incl. disable-signups + admin user + `app_metadata.role='admin'` SQL from current Supabase docs).

**Verified** (commands + results)
- Local stack: `npx supabase start` (postgres-only exclude variant; full stack not needed this phase) → `Started supabase local development setup` on ports 553xx.
- `npx supabase db reset` → all 4 migrations + seed applied, exit 0 (run twice — idempotence re-checked).
- `psql -v ON_ERROR_STOP=1 … < supabase/tests/rls_verify.sql` → **`ALL RLS CHECKS PASSED`**, 0 failures: anon blocked on INSERT (11 tables + storage), 0-row on UPDATE/DELETE (11 + storage), drafts invisible (0 of 65), published/unpublished transitions correct, non-admin authenticated denied, admin full CRUD + storage allowed, all fixtures restored (17/8/7/65 final counts).
- Types file: 311 lines, UTF-8 without BOM, contains all 11 tables + `is_admin`/`set_updated_at`.
- `npm run build` / `npm run lint` / `npm run typecheck` / `npm run format:check` → all pass (re-run at phase end).

**Environment notes (for future sessions)**
- C: drive was at 0 GB free → Docker's WSL disk went read-only mid-pull; freed space (npm cache 5.4 GB + temp) and restarted Docker. Watch disk before pulling the full stack (Studio etc. ≈ several GB) — Phase 2+ needs `kong`/`postgrest` at minimum for supabase-js.
- `config.toml` ports are 553xx (D-022). Local DB URL: `postgresql://postgres:postgres@127.0.0.1:55322/postgres`.
- psql on this machine ignores options placed **after** the connection string — always put `-v`/`-f` first; PowerShell lacks `<` redirect.

**Decisions**: D-022…D-027 added (see `DECISIONS.md`).

**Open questions**: D-006 (⚠ rows 46/65 need owner confirmation), D-005 (placeholder contact/certificate data — Phase 2 will need at least contact numbers; who seeds them: admin UI in Phase 4 or SQL placeholder in Phase 2?).
