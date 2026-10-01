# DECISIONS & ASSUMPTIONS

Format: `ID — date — decision — reason — status (assumed / confirmed / open)`

## Defaults from PROJECT_SPEC §11
- D-001 — Default locale `ar`; admin UI Arabic RTL. (assumed)
- D-002 — "صيني" in names = country of origin, not a brand → brand "Generic (Chinese)" / `عام (صيني)`. (assumed)
- D-003 — English product names are machine-drafted from Arabic; owner must review. (assumed)
- D-004 — Initial availability derived from stock; real counts discarded. (assumed)
- D-005 — Logos, certificate image, company texts, phones, socials are placeholders until entered in admin. (assumed)
- D-006 — Appendix A items marked ⚠ (#46 abort switch, #65 HLT vs HST) seeded as drafts, need owner confirmation. (open)

## Raised while organizing the project files (agent: review, confirm or overrule)
- D-007 — Mockup shows brand "GST"; it is not in the spec. Use spec brands only. (assumed)
- D-008 — Mockup shows 6 categories; spec lists ~17. Category tiles are data-driven; agent chooses lucide icons for the rest and logs them. (open)
- D-009 — Mockup lacks brands strip, certificates, projects; spec requires them. Spec wins. (assumed)
- D-010 — Mockup is plain CSS; spec requires Tailwind. Map tokens from `docs/DESIGN.md` into the Tailwind theme. (assumed)
- D-011 — Contrast: `--slate-400` on light surfaces (~3:1) and white on `--whatsapp` (~2.9:1, verify) fail WCAG AA; agent picks compliant shades and logs them. → **Resolved 2026-10-01 (Phase 0)**: verified by WCAG relative-luminance math — white on `#1FAF5A` = 2.86:1 (fails). Compliant shades now in the theme: `green-600 #187A4C` (5.3:1 vs white), `blue-600 #2A63C0` (5.8:1 vs white, 5.1:1 on its 12% tint), `whatsapp #0F7B42` (5.3:1 with white text), `amber-700 #8A5D05` (5.1:1 on amber tint); `slate-400` allowed on navy only (6.2:1 on navy-950), light surfaces use `slate-600` (7.3:1). `fire-600/700` pass as-is (5.0:1 / 6.0:1). (confirmed)
- D-012 — Two root layouts (site + admin route groups) mean there is no top-level `app/layout.tsx`; the root `/` redirect page and the 404 page must live inside a route group / use the supported global-not-found pattern. Verify in Phase 0 against current Next.js docs. → **Resolved 2026-10-01**: see D-016. (confirmed)
- D-013 — Library versions: verify from official docs at Phase 0 and record here. → **Resolved 2026-10-01**: see D-014. (confirmed)

## Phase 0 — Scaffold (2026-10-01)
- D-014 — Versions verified against npm registry + official docs (2026-10-01): `next` 16.3.8 · `next-intl` 4.14.8 · `tailwindcss` 4.3.3 (+ `@tailwindcss/postcss`) · `@supabase/supabase-js` 2.117.2 · `zod` 4.6.5 · `react`/`react-dom` 19.2.8 · `typescript` 5.9.3 (create-next-app pins `^5`; TS 7 exists but Next's template doesn't use it yet — revisit when upgrading) · `eslint` 9.39.5 + `eslint-config-next` 16.3.8 · `prettier` 3.9.9 + `prettier-plugin-tailwindcss` 0.8.1 · `lucide-react` 1.49.0 · `react-icons` 5.7.0 · `@dnd-kit/core` 6.3.1 · `react-hook-form` 7.89.0 · `minisearch` 7.2.0 / `fuse.js` 7.5.0 (last group installed in the phase that uses it). (confirmed)
- D-015 — next-intl runs **without middleware** (static export): the locale is read in `src/lib/i18n/request.ts` via `next/root-params` (stable by default in Next 16.3), falling back to `ar`. Invalid site locales are rejected with `notFound()` in the `(site)/[locale]` root layout; `setRequestLocale` (legacy) is not used. All pages prerender as SSG (verified in build output — no dynamic routes). (confirmed)
- D-016 — App skeleton (resolves D-012): **three root layouts** — `(site)/[locale]` (per-locale `<html lang dir>`), `(admin)` (Arabic RTL, `robots: noindex`), `(redirect)` (the `/` entry point). Root redirect = static page with React-19-hoisted `<meta http-equiv="refresh" content="0;url={basePath}/ar/">` + client `location.replace()` fallback + visible link. 404 = `app/global-not-found.tsx` behind `experimental.globalNotFound` (required by Next.js when multiple root layouts exist); it emits `out/404.html` with status 404 semantics on GitHub Pages, is bilingual (locale unknown for unmatched URLs) and links to `{basePath}/ar/`. (confirmed — build + served-route tests)
- D-017 — `NEXT_PUBLIC_BASE_PATH` drives `basePath` **only**; `assetPrefix` is deliberately not set (Next.js docs: basePath is the right tool for sub-path hosting, assetPrefix is for CDNs and could double-prefix). Verified: refresh URL, assets, nav links and the 404 home link are all prefixed with `/reach-site` in a basePath build. (confirmed)
- D-018 — Admin UI strings are Arabic-only (PROJECT_SPEC §7: admin UI language = Arabic RTL). The "every string in AR and EN" rule applies to the public site; admin *content* forms get AR/EN tabs in Phase 3. (assumed — spec precedence, flag if you disagree)
- D-019 — `npm run serve` uses `scripts/serve.mjs`, a dependency-free static server for `out/` that emulates GitHub Pages (directory → `index.html`, unknown path → `404.html` with HTTP 404). Used for route/RTL/LTR verification. (confirmed)
- D-020 — Tailwind v4 (CSS-first): design tokens from `docs/DESIGN.md` live in `@theme` in `src/app/globals.css`; layout must use logical utilities only (`ms-*`, `pe-*`, `text-start`, `inset-s-*`). Default Tailwind shades not listed in DESIGN.md (e.g. `slate-500`) are off-limits — extend the theme instead. Custom `phone` utility = isolated LTR mono run for phone numbers/codes. (assumed)
- D-021 — Phase 0 installs only `next-intl` (+ Prettier toolchain). `@supabase/supabase-js`, `zod`, icons, dnd-kit, forms and search libs are installed in the phase that first uses them, to keep the scaffold minimal. (assumed)
