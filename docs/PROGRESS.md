# PROGRESS

Current phase: **5 — Deploy — in progress (2026-10-02)**. Owner approved deferring Phase 4 to deploy now; Phase 4 remains incomplete and is not represented as done.

## Definition of done (every phase)
- [x] `npm run build` succeeds as a static export
- [x] No TypeScript / ESLint errors
- [x] RTL and LTR both verified
- [x] No secrets in the repo
- [x] RLS verified end-to-end against a live local Supabase stack (admin login + REST + storage + SQL suite)
- [x] This file updated after final verification

## Phases
- [x] **0 Scaffold** — Next.js static export, TS strict, Tailwind (logical props), next-intl ar/en, fonts, site + admin layouts, lint/format, env, basePath, root redirect
- [x] **1 Supabase** — migrations (schema + RLS + storage), type generation, seed.sql from Appendix A (drafts), README steps (project + admin user)
- [x] **2 Public site** — layout/header/footer/WhatsApp, Home, Products listing (filters + search + URL state), Product page, About, Contact, 404
- [x] **3 Admin core** — login, guard, dashboard, products list, add/edit product, image + PDF pipeline, duplicate/delete/publish
- [ ] **4 Admin extras** — categories, brands, series, specs, settings, certificates, projects
- [ ] **5 Deploy (in progress)** — Edge Function trigger-deploy, GitHub Actions, "Publish changes", weekly cron + external keep-alive, docs. Hosted deployment still requires configured GitHub secrets, Pages settings, and Supabase deployment credentials.
- [ ] **6 SEO & polish** — sitemap/robots/hreflang/JSON-LD/OG, a11y pass, perf pass (Lighthouse ≥ 90 mobile), empty/error states, final README

## Log

### 2026-10-02 — Approved phase-order exception
- Owner explicitly approved deferring Phase 4 and moving directly to deployment. Phase 4 remains unchecked and must be completed later; this exception is logged rather than silently changing the spec's phase order.

### 2026-10-02 — Phase 5 deployment preparation (in progress)
- Added the `trigger-deploy` Edge Function with server-side Supabase Auth/JWT and `app_metadata.role=admin` verification, GitHub repository dispatch, CORS handling, and a best-effort per-isolate 60-second throttle. Function JWT verification is disabled at the gateway only because the handler validates the bearer token itself.
- Added an Arabic admin-header “Publish changes” control with triggering/success/error states and a link to Actions; updated the Pages workflow to Node 24 and repository-name-derived `basePath`.
- Documented hosted migrations, repository Actions secrets, GitHub Pages setup, the least-privilege GitHub token, Supabase function secrets, and external keep-alive.
- Verified local Edge Function startup on Supabase CLI runtime 1.77.1: CORS preflight returned 200 and unauthenticated POST returned 401. `npm run lint` and `npm run typecheck` pass.
- Hosted project linked and secured: migrations 0001–0004 applied/reconciled, seed loaded (17 categories, 8 brands, 7 spec definitions, 65 products, 2 placeholder contact numbers, 17 placeholder settings), all products left as drafts (0 public products), 29 RLS policies and 3 storage buckets verified. No rows were published without owner review.
- GitHub Pages source is set to GitHub Actions, and repository secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` are present. The production build supports the intentional zero-published-products state by exporting a not-found fallback for the dynamic product route; it does not expose drafts.
- Pending: deploy the Edge Function and set its private `GITHUB_TOKEN` / `GITHUB_REPO` secrets for the admin-triggered publishing button; commit and push the completed deployment configuration, then verify the Pages workflow and live URL. Admin account creation and disabling public signup remain dashboard setup steps.

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
- `supabase/` project (CLI 2.119.0 as devDependency): `config.toml` with ports remapped to 560xx (D-022), `seed.sql` path wired.
- Four migrations in order: `0001_functions` (`public.is_admin()` from spec §5 verbatim + `set_updated_at()`), `0002_schema` (all 11 tables from §5 with AR/EN column pairs, check constraints, indexes on category/brand/series/is_published/product_images + GIN on `specs`, `updated_at` trigger), `0003_rls` (RLS on 11 tables → 29 policies: public read of published/active rows, admin-only writes, drafts hidden), `0004_storage` (buckets `product-images` webp ≤5 MB, `catalogs` pdf ≤10 MB, `site-assets` ≤5 MB, public read / admin write policies on `storage.objects`).
- `supabase/seed.sql` — 17 categories, 8 brands, 7 spec definitions, 65 products (Appendix A) all `is_published = false`; availability per D-004; re-runnable (`on conflict do nothing`).
- `supabase/tests/rls_verify.sql` — DoD suite: seed counts, RLS/policy inventory, anon read/write matrix on all 11 tables + storage, `is_active`/`is_published` filtering, authenticated-no-admin denial, full admin round-trip, `updated_at` trigger, cleanup to pristine state.
- `src/lib/supabase/database.types.ts` generated (`gen types typescript --local --schema public`), added to `.prettierignore`.
- README: Supabase section (migration table, local dev, RLS test command, type regeneration, hosted setup incl. disable-signups + admin user + `app_metadata.role='admin'` SQL from current Supabase docs).

**Verified** (commands + results)
- Local stack: `npx supabase start` (postgres-only exclude variant; full stack not needed this phase) → `Started supabase local development setup` on ports 560xx.
- `npx supabase db reset` → all 4 migrations + seed applied, exit 0 (run twice — idempotence re-checked).
- `psql -v ON_ERROR_STOP=1 … < supabase/tests/rls_verify.sql` → **`ALL RLS CHECKS PASSED`**, 0 failures: anon blocked on INSERT (11 tables + storage), 0-row on UPDATE/DELETE (11 + storage), drafts invisible (0 of 65), published/unpublished transitions correct, non-admin authenticated denied, admin full CRUD + storage allowed, all fixtures restored (17/8/7/65 final counts).
- Types file: 311 lines, UTF-8 without BOM, contains all 11 tables + `is_admin`/`set_updated_at`.
- `npm run build` / `npm run lint` / `npm run typecheck` / `npm run format:check` → all pass (re-run at phase end).

**Environment notes (for future sessions)**
- C: drive was at 0 GB free → Docker's WSL disk went read-only mid-pull; freed space (npm cache 5.4 GB + temp) and restarted Docker. Watch disk before pulling the full stack (Studio etc. ≈ several GB) — Phase 2+ needs `kong`/`postgrest` at minimum for supabase-js.
- `config.toml` ports are 560xx (D-022). Local DB URL: `postgresql://postgres:postgres@127.0.0.1:56022/postgres`.
- psql on this machine ignores options placed **after** the connection string — always put `-v`/`-f` first; PowerShell lacks `<` redirect.

**Decisions**: D-022…D-027 added (see `DECISIONS.md`).

**Open questions**: D-006 (⚠ rows 46/65 need owner confirmation), D-005 (placeholder contact/certificate data — Phase 2 will need at least contact numbers; who seeds them: admin UI in Phase 4 or SQL placeholder in Phase 2?).

### 2026-10-01 — Phase 2: Public site —

**Built**
- Layout & chrome: `(site)/[locale]/layout.tsx` (skip link, header, footer, floating WhatsApp), `site-header` (topbar hours+phone, nav, language switch preserving query, mobile menu), `site-footer` (phones, socials, nav, legal), `floating-whatsapp`.
- Data layer: `src/lib/supabase/server.ts` (server-only build-time client) + `src/lib/supabase/queries.ts` (typed, `cache()`-wrapped queries per D-029).
- Pages: Home (hero with `*highlight*` parsing + decorative panel, categories, featured, brands, why-us, certificates/projects conditionals, CTA), Products listing, Product detail (breadcrumbs, gallery+lightbox, chips, labelled spec table, catalog AR/EN fallback, WhatsApp quote, related), About, Contact, per-locale `not-found`.
- Products explorer: debounced search (MiniSearch + `normalizeArabic()`, D-031), facet filters (category/brand/system/availability + spec groups for a single category), chips, sort (D-037), sticky sidebar / mobile drawer, 24-per-page load-more, empty state with WhatsApp CTA, URL state per D-030.
- Components: `product-card` (cover/glyph, availability badge, 3-value spec line per D-038), `category-tile`, `breadcrumbs`, `section-heading`, `lightbox`, `hero-panel`, `certificates-grid`, quote button, 17-slug icon map (D-032), `waLink`/`telLink` helpers, `splitHighlight`.
- Full AR/EN copy: `src/messages/{ar,en}.json` (meta, nav, common, availability, system, home, products, product, about, contact, footer, notFound).
- Seed additions (D-033): placeholder contact numbers, social links, site texts; all 65 products published locally (D-034); RLS suite made publish-state-agnostic.

**Verified** (commands + results)
- `npm run typecheck` — 0 errors. `npm run lint` — 0 problems (fixed 3× `react-hooks/set-state-in-effect` with render-adjustment/close-on-click patterns, 3× `react-hooks/static-components` with `categoryGlyph()`). `npm run format` — clean.
- `npm run build` — OK: 143 static pages (ar+en for all pages, 130 product pages = 65 slugs × 2 locales), `globalNotFound` intact.
- `npm run serve` (port 4173): `/ar/`, `/en/`, `/ar/products/`, `/ar/products/hst-mcp`, `/ar/about/`, `/ar/contact/`, `/en/products/` → 200; unknown path → HTTP 404; `/ar/products/?q=panel&sort=name_asc&category=control-panels` → 200.
- HTML checks: AR `lang=ar dir=rtl`, EN `dir=ltr`; hero marker fully parsed; `wa.me` links present; phones carry `dir="ltr"` (header, footer, contact); hero panel `aria-hidden`; spec table renders when specs exist (`hst-economy-4-zone-panel` → `{"zones":4}`) and is omitted when `{}` (`hst-mcp`); home renders featured cards + product links; certificates/projects sections hidden while tables are empty (0 rows — no invented data); products listing prerender = skeleton (D-030), explorer present in client chunks.
- DB after publish: 65 published / 8 featured / 17 categories / 17 settings / 2 phones / 3 socials / 7 spec defs / 8 brands / 0 certificates / 0 projects.
- `supabase/tests/rls_verify.sql` → `ALL RLS CHECKS PASSED` after the publish update, fixture counts restored (D-034).

**Decisions**: D-028…D-039 added; D-008 resolved (see `DECISIONS.md`).

**Open questions**: D-006 (⚠ rows 46/65 need owner confirmation) and D-005 (contact/certificate/social data are obvious placeholders — owner replaces them via the admin UI in Phase 4; certificates/projects sections stay hidden until real rows exist).

### 2026-10-02 — Phase 2 re-verification + local port move ✅
- Windows `netsh` exclusion ranges shifted again: 553xx became forbidden, so the local stack moved to **560xx** (`supabase/config.toml`, `.env.local`, README, this file, D-022). Docker Desktop was restarted from scratch; `npx supabase start` green on the new ports, legacy anon key still accepted by REST.
- `npm run typecheck` / `npm run lint` / `npm run format` (one file re-formatted) → 0 errors; `npm run build` → 143 static pages, all routes SSG/static.
- `npm run serve` route matrix re-run: `/ar/`+`/en/` (lang/dir correct), products listing/detail (both locales), about, contact, admin (noindex), query-string listing URL → 200; unknown path → HTTP 404; `wa.me` + `dir="ltr"` phones present; hero marker parsed; spec table present on `hst-economy-4-zone-panel`, absent on `hst-mcp`; certificates/projects sections hidden (0 rows).
- `psql -f supabase/tests/rls_verify.sql` → **ALL RLS CHECKS PASSED**, fixtures restored (17/8/7/65, 2 phones, 3 socials, 17 settings, 0 images/certificates/projects).
- Secret scan: no `service_role`/tokens in tracked files; `.env.local` git-ignored.

### 2026-10-02 — Phase 3: Admin core ✅
**Built**
- `src/app/(admin)/admin/login/page.tsx` + `src/features/admin/auth/login-form.tsx`: admin login flow with email/password validation, role check via `app_metadata.role`, sign-out on non-admin session, redirect to `/admin/` for valid admins.
- `src/app/(admin)/admin/(protected)/layout.tsx` + `src/features/admin/auth/admin-guard.tsx` + `src/features/admin/auth/admin-header.tsx`: protected admin shell, skip-link, role enforcement, header, logout and basePath-aware site link.
- `src/app/(admin)/admin/(protected)/page.tsx`: dashboard with live count queries for products/drafts/missing translations/images; client-side data loading and shortcuts.
- `src/features/admin/products/*`: shared add/edit form, product listing, image/PDF staging, duplicate/delete/publish flows, lookup loading, slug validation, category-change spec rebuild, partial-save error handling, and admin-only RLS enforcement.
- `src/lib/supabase/browser.ts`: lazy Supabase client plus admin-claim helper to keep the browser safe and anon-only by default.
- `src/messages/ar.json`: admin namespace with Arabic-only strings, plus shared `availability` / `system` labels used by the admin UI.

**Verified**
- `npm run format:check` → all matched files use Prettier formatting.
- `npm run lint` → 0 problems.
- `npm run typecheck` → 0 errors.
- Local Supabase Auth health → HTTP 200; the required database, REST, Auth, Kong and Storage containers were healthy.
- Admin password login → HTTP 200; decoded JWT claim `app_metadata.role=admin`; admin product read → HTTP 200.
- Admin product insert / patch / delete → all passed. Anon insert → HTTP 401; anon patch/delete → HTTP 200 with `[]` for both and the product row unchanged; authenticated non-admin insert → HTTP 403.
- Storage admin upload → HTTP 200; object removal → successful. Anonymous upload was denied by RLS (`statusCode=403`, `new row violates row-level security policy`).
- `Get-Content supabase\tests\rls_verify.sql -Raw | docker exec -i supabase_db_Reach_website psql -U postgres -d postgres -v ON_ERROR_STOP=1` → **`ALL RLS CHECKS PASSED`**; fixtures restored.
- `npm run build` → **147 static pages**. A temporary one-worker build setting was used to fit current machine memory and then reverted; the committed Next.js config is unchanged.
- Browser verification on the local static export: valid admin login redirected to `/admin/`; clearing the session and opening `/admin/products/` redirected to `/admin/login/`; dashboard fetched 65 products / 65 published / 0 missing translations / 65 missing images; products list and new-product form rendered with category/brand lookups. Routes `/ar/`, `/en/`, `/ar/products/`, `/admin/login/`, `/admin/products/` returned HTTP 200 with expected RTL/LTR and titles.
- `out/` secret scan → no `service_role` literal; any embedded Supabase JWT is anon-role only.

**Decisions**: D-040…D-051 added (see `DECISIONS.md`).

**Open questions**: D-006 (Appendix A rows 46/65 need owner confirmation) and D-005 (placeholder contact/certificate/social content remains for owner replacement in Phase 4). No Phase 3 verification blockers remain.