-- 0002 · Schema (PROJECT_SPEC §5)
-- All user-facing text exists in two columns (*_ar / *_en) — only two languages,
-- so plain columns instead of a translation table.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text not null,
  sort_order int not null default 0
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text not null,
  logo_url text,
  sort_order int not null default 0
);

create table public.series (          -- optional grouping of related products (NOT variants)
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text not null
);

create table public.spec_definitions (   -- drives specs form + filters, per category
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  key text not null,                         -- e.g. 'zones','loops','voltage','capacity_ah','weight_kg'
  label_ar text not null,
  label_en text not null,
  unit text,
  value_type text not null check (value_type in ('number','text','select')),
  options jsonb,                             -- for 'select': [{"value","label_ar","label_en"}, …]
  is_filterable boolean not null default false,
  sort_order int not null default 0,
  unique (category_id, key)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                 -- URL slug, lowercase latin/digits/hyphens
  category_id uuid not null references public.categories(id),
  brand_id uuid references public.brands(id),
  series_id uuid references public.series(id),
  system_type text check (system_type in ('conventional','addressable')),
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  specs jsonb not null default '{}'::jsonb,  -- {"zones":4,"voltage":24}
  availability text not null default 'in_stock'
    check (availability in ('in_stock','limited','on_request')),
  catalog_ar_url text,
  catalog_en_url text,                       -- PDF per language, both optional
  search_keywords text,                      -- extra aliases e.g. "اتش اس تي hst"
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  thumb_url text,
  storage_path text not null,
  alt_ar text,
  alt_en text,
  sort_order int not null default 0          -- first = cover
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  issuer_ar text,
  issuer_en text,
  issued_at date,
  image_url text not null,
  storage_path text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.contact_numbers (
  id uuid primary key default gen_random_uuid(),
  label_ar text not null,                    -- e.g. Sales / مبيعات
  label_en text not null,
  number text not null,                      -- E.164, e.g. +201012345678
  is_whatsapp boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                    -- facebook|instagram|tiktok|youtube|linkedin|x|…
  url text not null,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.site_settings (          -- single values: address, email, hours, about text…
  key text primary key,
  value_ar text,
  value_en text
);

create table public.projects (               -- past work for trust section
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  image_url text,
  storage_path text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- updated_at trigger
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- Indexes (PROJECT_SPEC §5)
create index products_category_id_idx on public.products (category_id);
create index products_brand_id_idx on public.products (brand_id);
create index products_series_id_idx on public.products (series_id);
create index products_is_published_idx on public.products (is_published);
create index product_images_product_id_idx on public.product_images (product_id);
create index products_specs_idx on public.products using gin (specs);
