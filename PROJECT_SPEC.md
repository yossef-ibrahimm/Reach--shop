# PROJECT SPEC — Fire Alarm & Sensors Product Showcase (Bilingual AR/EN)

> This file is the single source of truth for the project. Read it fully before any task.
> If a request conflicts with this spec, flag the conflict instead of silently deviating.
> Record every non-trivial decision you make in `docs/DECISIONS.md`.

---

## 1. What we are building

A **bilingual (Arabic default + English) product showcase website** for a company that sells
fire-alarm systems, detectors and related accessories in Egypt.

- It is a **catalog, not a shop**: no prices, no cart, no checkout, no public user accounts.
- Visitors browse products, filter/search them, open a product page (images, description,
  specs, downloadable catalog PDF) and contact the company (phone / WhatsApp).
- The company owner manages everything through a **hidden admin area** (login → add/edit products,
  images, catalog files, etc.).
- **Hard constraint: everything must run on free tiers.**
  Hosting = **GitHub Pages** (static files only). Backend = **Supabase free plan**.

### Non-goals
Prices, cart/checkout, payments, public registration, reviews/comments, real stock counts in the
public DB, server-side rendering at request time, any paid service.

---

## 2. Architecture (read this carefully — it drives every decision)

GitHub Pages serves **static files only**. There is no server runtime. Therefore:

1. The public site is a **Next.js static export** (`output: 'export'`). Public pages are
   pre-rendered at **build time** from Supabase data (JAMstack).
2. A product added/edited in the admin does **not** appear on the public site until the site is
   **rebuilt and redeployed** (1–3 min). The admin has a **"Publish changes"** button that triggers
   the rebuild (see §10).
3. The **admin area is client-side only**: it talks to Supabase directly from the browser using
   the user's session. **Real security is Postgres Row Level Security (RLS)**, never UI hiding.
4. Because product IDs are unknown at build time for admin pages, admin edit pages use a
   **query parameter** (`/admin/products/edit/?id=<uuid>`), not a dynamic `[id]` segment.
5. Supabase free projects **pause after ~1 week of inactivity**. A **scheduled weekly GitHub Action
   rebuild** keeps the project awake and refreshes content.
   Caveat: GitHub also disables scheduled workflows on public repos after ~60 days without repository
   activity (verify the current rule). Add a secondary free keep-alive (e.g. an external cron that pings the
   Supabase REST endpoint) and document it in the README.
6. The repository is **public** (required for free GitHub Pages). Never commit secrets, the `service_role`
   key, `.env*` files, or real inventory counts. Only the anon key is ever exposed to the browser.

```
Browser (public)  ──►  GitHub Pages (static HTML/JS, data baked in at build time)
Browser (admin)   ──►  Supabase (Auth + Postgres + Storage), protected by RLS
Admin "Publish"   ──►  Supabase Edge Function ──► GitHub repository_dispatch ──► Actions build+deploy
```

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict), `output: 'export'` |
| Styling | Tailwind CSS using **logical properties** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`) so RTL/LTR flip automatically |
| i18n | `next-intl` with `[locale]` route segment, locales `ar` (default) and `en`, `localePrefix: 'always'`, no middleware (static export) |
| Backend | Supabase: Postgres, Auth (email+password), Storage, Edge Functions |
| Client search | MiniSearch or Fuse.js over a build-time JSON of products |
| Forms | react-hook-form + zod |
| Icons | `lucide-react` (UI) + `react-icons` (brand/social icons) |
| Drag & drop | `@dnd-kit` (image reordering) |
| Fonts | `next/font/google`: **Cairo** (Arabic) + **Inter** (English) |
| CI/CD | GitHub Actions → GitHub Pages |

Static-export requirements to respect:
- `images: { unoptimized: true }` (no Next image optimizer on static hosting).
- `trailingSlash: true`; `basePath` / `assetPrefix` read from `NEXT_PUBLIC_BASE_PATH`
  (needed when served from `user.github.io/repo-name`); add `.nojekyll`; provide a custom `404.html`.
- Any component using `useSearchParams()` must be wrapped in `<Suspense>`.
- Dynamic public routes must implement `generateStaticParams`.
- Root `/` must redirect to `/ar/` (static page with meta refresh + JS fallback, respecting basePath).

### Environment variables (`.env.example` must be committed; real values never)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=          # canonical public URL, used for sitemap/hreflang/OG
NEXT_PUBLIC_BASE_PATH=         # "" or "/repo-name"
```
**Never** put the Supabase `service_role` key or a GitHub token in client code, the repo, or `NEXT_PUBLIC_*`.

---

## 4. Repository layout

```
/
├─ PROJECT_SPEC.md          ← this file
├─ CLAUDE.md                ← short pointer + rules for the agent
├─ docs/
│  ├─ DECISIONS.md          ← decisions + assumptions log
│  └─ PROGRESS.md           ← phase checklist, updated after each phase
├─ supabase/
│  ├─ migrations/           ← SQL migrations (schema, RLS, storage)
│  ├─ seed.sql              ← generated from Appendix A
│  └─ functions/trigger-deploy/   ← Edge Function
├─ src/
│  ├─ app/
│  │  ├─ (site)/[locale]/…  ← public site (own root layout: html lang/dir per locale)
│  │  └─ (admin)/admin/…    ← admin (own root layout, Arabic RTL, noindex)
│  ├─ components/
│  ├─ features/             ← products, admin, search, contact …
│  ├─ lib/                  ← supabase clients, i18n helpers, arabic-normalize, whatsapp, utils
│  └─ messages/{ar,en}.json
├─ scripts/                 ← seed generator, etc.
└─ .github/workflows/deploy.yml
```
Conventions: TypeScript strict, no `any`, absolute imports (`@/…`), zod schemas shared between
form and API layer, generated Supabase types (`supabase gen types typescript`), conventional commits,
one commit (or PR) per phase, `README.md` with full setup/deploy instructions.

---

## 5. Data model (Supabase / Postgres)

All user-facing text exists in **two languages** (`*_ar`, `*_en`). Use plain columns, not a
translation table (only two languages).

```sql
-- Admin check: role is stored in the JWT app_metadata (set manually for the single admin user)
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null, name_en text not null,
  sort_order int not null default 0
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null, name_en text not null,
  logo_url text,
  sort_order int not null default 0
);

create table series (          -- optional grouping of related products (NOT variants)
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null, name_en text not null
);

create table spec_definitions (   -- drives specs form + filters, per category
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  key text not null,                         -- e.g. 'zones','loops','voltage','capacity_ah','weight_kg'
  label_ar text not null, label_en text not null,
  unit text,
  value_type text not null check (value_type in ('number','text','select')),
  options jsonb,                             -- for 'select'
  is_filterable boolean not null default false,
  sort_order int not null default 0,
  unique (category_id, key)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- URL slug, lowercase latin/digits/hyphens
  category_id uuid not null references categories(id),
  brand_id uuid references brands(id),
  series_id uuid references series(id),
  system_type text check (system_type in ('conventional','addressable')),
  name_ar text not null, name_en text not null,
  description_ar text, description_en text,
  specs jsonb not null default '{}'::jsonb,  -- {"zones":4,"voltage":24}
  availability text not null default 'in_stock'
    check (availability in ('in_stock','limited','on_request')),
  catalog_ar_url text, catalog_en_url text,  -- PDF per language, both optional
  search_keywords text,                      -- extra aliases e.g. "اتش اس تي hst"
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null, thumb_url text, storage_path text not null,
  alt_ar text, alt_en text,
  sort_order int not null default 0          -- first = cover
);

create table certificates (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  issuer_ar text, issuer_en text, issued_at date,
  image_url text not null, storage_path text not null,
  sort_order int not null default 0, is_active boolean not null default true
);

create table contact_numbers (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null, label_en text not null,   -- e.g. Sales / مبيعات
  number text not null,                             -- E.164, e.g. +201012345678
  is_whatsapp boolean not null default false,
  sort_order int not null default 0, is_active boolean not null default true
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                           -- facebook|instagram|tiktok|youtube|linkedin|x|…
  url text not null,
  sort_order int not null default 0, is_active boolean not null default true
);

create table site_settings (                        -- single values: address, email, hours, about text, hero text…
  key text primary key,
  value_ar text, value_en text
);

create table projects (                             -- optional: past work for trust section
  id uuid primary key default gen_random_uuid(),
  title_ar text not null, title_en text not null,
  description_ar text, description_en text,
  image_url text, storage_path text,
  sort_order int not null default 0, is_active boolean not null default true
);
```

Also: an `updated_at` trigger on `products`; indexes on `products(category_id)`, `(brand_id)`,
`(series_id)`, `(is_published)`, `product_images(product_id)`; a GIN index on `products.specs`.

### Row Level Security (enable on EVERY table)
- **Public (anon) SELECT**: `products` where `is_published = true`; `product_images` of published
  products; `categories`, `brands`, `series`, `spec_definitions`; `certificates`/`contact_numbers`/
  `social_links`/`projects` where `is_active`; `site_settings`.
- **INSERT / UPDATE / DELETE** on all tables: `public.is_admin()` only.
- `products` SELECT also allowed when `public.is_admin()` (to see drafts in admin).
- Auth settings: **disable public sign-ups**. Create the single admin user manually and set
  `app_metadata.role = 'admin'`. Document the exact steps in the README.

### Storage buckets (public read, admin-only write)
`product-images`, `catalogs` (PDF only, max 10 MB, enforced by bucket config **and** client),
`site-assets` (certificates, brand logos, project images).
Policies: SELECT public; INSERT/UPDATE/DELETE `public.is_admin()`.

### Availability instead of stock counts
Real inventory counts are **never** stored or shown. Public status only:
`in_stock` / `limited` / `on_request`. Zero-stock items stay visible as `on_request`.

---

## 6. Public site

### 6.1 Global
- Bilingual with a language switcher that keeps the current page (`/ar/products/x` ↔ `/en/products/x`).
  `<html lang dir>` set per locale. `hreflang` alternates on every page.
- Header: logo, nav (Home, Products, About, Contact), language switcher, primary phone (`tel:`) +
  WhatsApp button. Footer: all active numbers, social icons, address, hours.
- **Floating WhatsApp button** on all pages.
- Phone numbers rendered with `dir="ltr"` / `unicode-bidi: isolate` so they never flip inside RTL text.
- Links: `tel:+20…`; WhatsApp `https://wa.me/20…` (no `+`, no leading zero) with a prefilled,
  localized message. External links use `target="_blank" rel="noopener noreferrer"`.

### 6.2 Home
Hero (tagline + "Browse products" + WhatsApp CTA) → categories grid → featured products →
brands strip (logos) → "Why choose us" (experience, warranty, technical support — **only real,
admin-editable facts; no invented statistics**) → **accredited certificate(s)** with lightbox →
past projects (if any) → contact CTA.

### 6.3 Products listing (`/[locale]/products/`)
- All published products baked into the page/JSON at build time; **filtering and search run client-side**.
- **Filters** (facets with result counts, multi-select where sensible): category, brand,
  system type (conventional/addressable), availability, plus **dynamic spec filters** built from
  `spec_definitions.is_filterable` for the selected category (zones, loops, voltage, capacity…).
- **Search**: one box, searches AR + EN name, description, brand, category, series, `search_keywords`,
  regardless of UI language. Implement `normalizeArabic()`: strip tashkeel/tatweel, `أإآ→ا`, `ة→ه`,
  `ى→ي`, lowercase Latin, normalize Arabic-Indic digits to Western. Tolerate typos (fuzzy).
- **Sort**: featured/default order, name A–Z.
- **URL state**: all filters/search/sort live in the query string (shareable links).
- Responsive: filters in a drawer on mobile. Empty state with "ask us on WhatsApp". Pagination or
  "load more" (24 per page).

### 6.4 Product page (`/[locale]/products/[slug]/`)
Breadcrumbs • image gallery with thumbnails + zoom/lightbox • name • brand & category chips •
availability badge • description • **specs table** (rendered from `specs` + `spec_definitions`,
localized labels/units) • **catalog download buttons** (AR/EN; fall back to the other language if one
is missing; hide if none) • **"Ask for price / quote" WhatsApp button** prefilled with product name
and page URL • related products (same series first, then same category) • JSON-LD `Product`
(**no `offers`/price**) • Open Graph + Twitter tags with the product cover image.

### 6.5 About
Company story, vision, certificates, brands, address + map link, contact block.
Content from `site_settings` + `certificates`.

### 6.6 Contact
All numbers (label + call + WhatsApp), email, address, hours, map link, social links.

### 6.7 SEO
`sitemap.xml` and `robots.txt` (generated at build, include both locales); canonical URLs;
`hreflang`; JSON-LD `LocalBusiness` (name, phones, address, `sameAs` = social links) on Home/Contact;
per-page localized `<title>`/meta description. Admin routes: `noindex` and excluded from sitemap.

### 6.8 Design direction
Professional and trustworthy, safety-industry feel: deep navy/charcoal base, a restrained fire-red
accent, generous whitespace, clear typographic hierarchy, consistent card system. **RTL-first**
(design Arabic first, English mirrors). Accessible: semantic HTML, keyboard navigation, visible
focus, alt text, WCAG AA contrast, `prefers-reduced-motion` respected. Lazy-load images with
reserved aspect ratios (no layout shift).

---

## 7. Admin area (hidden)

- UI language: **Arabic RTL** (own root layout). Product *content* forms have AR/EN tabs.
- `/admin/login/` is **not linked anywhere**, has `noindex`, and is excluded from sitemap/robots hints.
  (Hiding is not security — RLS is. Never rely on the hidden URL.)
- Auth: Supabase email+password. An `AdminGuard` checks session **and** `app_metadata.role === 'admin'`;
  otherwise redirect to login. Session persisted by supabase-js. Logout button.

### Routes
| Route | Purpose |
|---|---|
| `/admin/login/` | Sign in |
| `/admin/` | Dashboard: counts (products, drafts, missing translations/images), shortcuts, "Publish changes" |
| `/admin/products/` | **Products list** |
| `/admin/products/new/` | **Add product** |
| `/admin/products/edit/?id=<uuid>` | **Edit product** (same form as Add) |
| `/admin/categories/`, `/brands/`, `/series/`, `/specs/` | Lookup management (Phase 4) |
| `/admin/settings/` | Site settings, contact numbers, social links (Phase 4) |
| `/admin/certificates/`, `/admin/projects/` | Trust content (Phase 4) |

### Products list
Table with cover thumbnail, AR/EN name, category, brand, availability, published/featured badges,
last updated. Search + filters (category, brand, published, availability, missing
translation/image). Row actions: **Edit, Duplicate, Publish/Unpublish toggle, Delete (with confirm)**.
Bulk publish/unpublish. "Add product" button.

### Add / Edit product form (one shared component)
- **Basic**: name AR/EN, description AR/EN (textarea, simple formatting), slug (auto-generated from
  the English name, editable, uniqueness validated, lowercase latin/digits/hyphens), category (required),
  brand, system type, series, `search_keywords`.
- **Specs**: fields rendered **dynamically** from `spec_definitions` of the chosen category
  (number/text/select with unit); changing the category re-renders the fields.
- **Availability** (in_stock / limited / on_request), `is_featured`, `is_published`.
- **Images**: multi-upload, drag-to-reorder (first = cover), delete, alt text AR/EN. On upload,
  compress client-side to **WebP** (max 1600 px) and also create a **~480 px thumbnail**; store both.
- **Catalog PDFs**: separate optional uploads for AR and EN; validate MIME `application/pdf`
  and ≤ 10 MB; replace/remove; show current file name.
- Validation with zod (inline errors, Arabic messages), unsaved-changes warning, loading/disabled
  states, success/error toasts. Deleting a product also deletes its storage files.
- Edit page loads by `?id=`; handle not-found gracefully.

### "Publish changes"
Button in admin header/dashboard → calls Edge Function `trigger-deploy` → triggers the GitHub build.
Show state: triggering / triggered (link to Actions run if available) / error. Explain in UI that the
public site updates in 1–3 minutes.

---

## 8. Supabase Edge Function: `trigger-deploy`
Verifies the caller's JWT has `app_metadata.role = 'admin'`, then calls
`POST https://api.github.com/repos/{owner}/{repo}/dispatches` with
`{"event_type":"content-updated"}` using a fine-grained PAT stored as a **Supabase secret**
(`GITHUB_TOKEN`, `GITHUB_REPO`). Basic rate limit (e.g. ignore if triggered < 60 s ago). The token
never reaches the browser.

---

## 9. CI/CD (`.github/workflows/deploy.yml`)
Triggers: `push` to `main`, `workflow_dispatch`, `repository_dispatch` (`content-updated`),
and **`schedule` weekly** (keeps Supabase awake + refreshes content).
Steps: checkout → setup Node → install → build (`next build`, env from GitHub Secrets:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_BASE_PATH`) → `actions/configure-pages` → `actions/upload-pages-artifact` →
`actions/deploy-pages`. Use `concurrency` so overlapping builds don't conflict.
The build must **fail loudly** if Supabase is unreachable (don't deploy an empty catalog).

---

## 10. Implementation phases (do them in order; update `docs/PROGRESS.md` after each)

0. **Scaffold**: Next.js static export, TS strict, Tailwind (logical props), next-intl (`ar`/`en`),
   fonts, base layouts (site + admin route groups), lint/format, env handling, basePath, root redirect.
1. **Supabase**: migrations (schema + RLS + storage buckets/policies), type generation,
   `seed.sql` from Appendix A (categories, brands, spec definitions, products as **unpublished drafts**
   with machine-drafted English names flagged for review), README steps to create project + admin user.
2. **Public site**: layout/header/footer/WhatsApp, Home, Products listing (filters + search + URL state),
   Product page, About, Contact, 404.
3. **Admin core**: login, guard, dashboard, products list, **add product**, **edit product**,
   image + PDF upload pipeline, duplicate/delete/publish toggle.
4. **Admin extras**: categories, brands, series, spec definitions, settings (contacts, socials),
   certificates, projects.
5. **Deploy**: Edge Function `trigger-deploy`, GitHub Actions workflow, "Publish changes" button,
   weekly cron, deployment docs.
6. **SEO & polish**: sitemap/robots/hreflang/JSON-LD/OG, accessibility pass, performance pass
   (Lighthouse ≥ 90 on mobile for Home and Product page), empty/error states, final README.

### Definition of done (every phase)
`npm run build` succeeds as a static export • no TypeScript/ESLint errors • RTL and LTR both verified
• no secrets in the repo • RLS verified (anon cannot write; anon cannot read drafts) •
`docs/PROGRESS.md` updated.

---

## 11. Defaults the agent should assume (log in DECISIONS.md, don't block on them)
- Default locale `ar`; admin UI Arabic.
- "صيني" in names = **country of origin, not a brand** → brand "Generic (Chinese)" / `عام (صيني)`.
- English product names are machine-drafted from the Arabic and must be reviewed by the owner.
- Initial availability derived from stock (see Appendix A); real counts are discarded.
- Brand/logo images, certificate image, company texts, phone numbers and social links are **placeholders**
  until the owner enters them in the admin.
- Items marked ⚠ in Appendix A need owner confirmation; seed them as drafts with a note in DECISIONS.md.

---

## Appendix A — Seed catalog (from stock sheet dated 30/9/2026, 65 items)

Availability rule used for seeding: stock 0 → `on_request`; 1–5 → `limited`; > 5 → `in_stock`.
(Counts are intentionally not included. Fix the obvious typo "القتصادية" → "الاقتصادية".)

**Brand detection by token:** `hst`→HST • `اسنوير`→Snower • `ابولو`→Apollo • `ats`→ATS • `hlt`→HLT •
`كونفوي`→Conway • `تاندا`→Tanda • `صيني`→Generic (Chinese) • no token (cables, batteries) → no brand.

**Suggested categories** (Arabic / English): لوحات التحكم / Control Panels • حساسات الدخان / Smoke Detectors •
حساسات الحرارة / Heat Detectors • حساسات متعددة / Multi-Sensor Detectors • حساسات اللهب / Flame Detectors •
حساسات الغاز / Gas Detectors • كواسر (نقاط نداء يدوية) / Manual Call Points • سرينات / Sirens •
أجراس / Bells • قواعد / Detector Bases • لمبات بيان / Remote Indicators • بيم / Beam Detectors •
موديولات (مونتور/كنترول/انترفيس) / Modules • بطاريات / Batteries • كابلات / Cables • طفايات / Extinguishers •
مفاتيح إيقاف (ابورت) / Abort Switches ⚠.

**Suggested spec definitions:** control panels → `zones`, `loops` (filterable) • bells/sirens → `voltage` •
batteries → `capacity_ah` • extinguishers → `weight_kg` • cables → `material`.

| # | Name (Arabic, as in the stock sheet) | Availability |
|---|---|---|
| 1 | لوحة اطفاء hst | in_stock |
| 2 | لوحة 2 زون hst | in_stock |
| 3 | لوحة 4 زون الاقتصادية hst | in_stock |
| 4 | لوحة 8 زون الاقتصادية hst | on_request |
| 5 | لوحة 12 زون الاقتصادية hst | on_request |
| 6 | لوحة 16 زون الاقتصادية hst | limited |
| 7 | لوحة 4 زون السيلفر hst | limited |
| 8 | لوحة 8 زون السيلفر hst | limited |
| 9 | لوحة 16 زون السيلفر hst | limited |
| 10 | كاسر hst | in_stock |
| 11 | سرينة hst | in_stock |
| 12 | جرس hst | in_stock |
| 13 | حساس دخان تقليدي hst | in_stock |
| 14 | حساس حرارة تقليدي hst | in_stock |
| 15 | حساس متعدد تقليدي hst | in_stock |
| 16 | لمبة بيان hst | in_stock |
| 17 | حساس لهب hst | in_stock |
| 18 | حساس غاز تقليدي hst | in_stock |
| 19 | بيم hst | limited |
| 20 | لوحة 1loop الاقتصادية hst | limited |
| 21 | لوحة 2loop الاقتصادية hst | on_request |
| 22 | لوحة 2loop الحمرة hst | limited |
| 23 | لوحة 4loop الحمرة hst | on_request |
| 24 | كاسر معنون hst | in_stock |
| 25 | حساس دخان معنون hst | in_stock |
| 26 | حساس حرارة معنون hst | in_stock |
| 27 | حساس متعدد معنون hst | in_stock |
| 28 | مونتور hst | in_stock |
| 29 | كنترول hst | limited |
| 30 | انترفيس hst | limited |
| 31 | لوحة اطفاء كونفوي | limited |
| 32 | قاعدة hst | in_stock |
| 33 | لوحة 4 زون اسنوير | in_stock |
| 34 | لوحة 8 زون اسنوير | limited |
| 35 | حساس دخان اسنوير | in_stock |
| 36 | حساس حرارة اسنوير | in_stock |
| 37 | كاسر اسنوير | in_stock |
| 38 | سرينة اسنوير | in_stock |
| 39 | جرس اسنوير | in_stock |
| 40 | كاسر صيني | in_stock |
| 41 | سرينة صيني | in_stock |
| 42 | جرس صيني 24 فولت | in_stock |
| 43 | جرس صيني 220 فولت | in_stock |
| 44 | لوحة 4 زون صيني | in_stock |
| 45 | بيم صيني | in_stock |
| 46 | ابورت صيني ⚠ (likely an abort/stop switch — confirm) | in_stock |
| 47 | طفاية فاير سيرش 6 كيلو صيني | on_request |
| 48 | طفاية فاير سيرش 2 كيلو صيني | on_request |
| 49 | كابلات الومنيوم | on_request |
| 50 | كابلات نحاس | on_request |
| 51 | بطارية 2.3 امبير | on_request |
| 52 | بطارية 7 امبير | in_stock |
| 53 | بيم تاندا | on_request |
| 54 | حساس حرارة تقليدي ats | in_stock |
| 55 | قاعدة ats | in_stock |
| 56 | لوحة اطفاء ابولو | in_stock |
| 57 | لوحة 2 زون ابولو | in_stock |
| 58 | لوحة 8 زون ابولو | limited |
| 59 | لوحة 1لوب ابولو | limited |
| 60 | لوحة 2 لوب ابولو | limited |
| 61 | كاسر ابولو تقليدي | in_stock |
| 62 | حساس دخان ابولو تقليدي | in_stock |
| 63 | حساس حرارة ابولو تقليدي | limited |
| 64 | قاعدة ابولو | in_stock |
| 65 | حساس دخان تقليدي hlt ⚠ (brand "HLT" or typo of "hst"? — confirm) | in_stock |

Notes: items with "معنون" = addressable system type; items with "تقليدي" = conventional; rows 28–30
(مونتور / كنترول / انترفيس) are addressable-system modules (Monitor / Control / Interface).
