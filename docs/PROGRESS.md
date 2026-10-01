# PROGRESS

Current phase: **0 — Scaffold — DONE (2026-10-01)**, awaiting approval to start Phase 1.

## Definition of done (every phase)
- [x] `npm run build` succeeds as a static export
- [x] No TypeScript / ESLint errors
- [x] RTL and LTR both verified
- [x] No secrets in the repo
- [ ] RLS verified (anon cannot write; anon cannot read drafts) — from Phase 1
- [x] This file updated

## Phases
- [x] **0 Scaffold** — Next.js static export, TS strict, Tailwind (logical props), next-intl ar/en, fonts, site + admin layouts, lint/format, env, basePath, root redirect
- [ ] **1 Supabase** — migrations (schema + RLS + storage), type generation, seed.sql from Appendix A (drafts), README steps (project + admin user)
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
