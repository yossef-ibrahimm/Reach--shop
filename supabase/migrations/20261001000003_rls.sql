-- 0003 · Row Level Security (PROJECT_SPEC §5)
-- Principle: reads are public (published/active rows only), writes require is_admin().
-- RLS is enforced by the database — the UI hides nothing.

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.series enable row level security;
alter table public.spec_definitions enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.certificates enable row level security;
alter table public.contact_numbers enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects enable row level security;

-- Lookup tables: public read, admin write -------------------------------

create policy categories_public_read on public.categories
  for select to anon, authenticated using (true);
create policy categories_admin_write on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy brands_public_read on public.brands
  for select to anon, authenticated using (true);
create policy brands_admin_write on public.brands
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy series_public_read on public.series
  for select to anon, authenticated using (true);
create policy series_admin_write on public.series
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy spec_definitions_public_read on public.spec_definitions
  for select to anon, authenticated using (true);
create policy spec_definitions_admin_write on public.spec_definitions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Products: only published rows are visible to the public ----------------

create policy products_public_read on public.products
  for select to anon, authenticated using (is_published);
create policy products_admin_read on public.products
  for select to authenticated using (public.is_admin());
create policy products_admin_write on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy product_images_public_read on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.is_published)
  );
create policy product_images_admin_read on public.product_images
  for select to authenticated using (public.is_admin());
create policy product_images_admin_write on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin-managed content: public sees active rows, admin manages -----------

create policy certificates_public_read on public.certificates
  for select to anon, authenticated using (is_active);
create policy certificates_admin_read on public.certificates
  for select to authenticated using (public.is_admin());
create policy certificates_admin_write on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy contact_numbers_public_read on public.contact_numbers
  for select to anon, authenticated using (is_active);
create policy contact_numbers_admin_read on public.contact_numbers
  for select to authenticated using (public.is_admin());
create policy contact_numbers_admin_write on public.contact_numbers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy social_links_public_read on public.social_links
  for select to anon, authenticated using (is_active);
create policy social_links_admin_read on public.social_links
  for select to authenticated using (public.is_admin());
create policy social_links_admin_write on public.social_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- site_settings: single key/value rows (no is_active); public read.
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_admin_read on public.site_settings
  for select to authenticated using (public.is_admin());
create policy site_settings_admin_write on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy projects_public_read on public.projects
  for select to anon, authenticated using (is_active);
create policy projects_admin_read on public.projects
  for select to authenticated using (public.is_admin());
create policy projects_admin_write on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
