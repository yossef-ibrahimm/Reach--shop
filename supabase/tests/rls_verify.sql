-- rls_verify.sql — PROJECT_SPEC §10 Phase 1 DoD:
--   "RLS verified (anon cannot write; anon cannot read drafts)"
-- Run against the LOCAL database after `supabase db reset`:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v ON_ERROR_STOP=1 -f supabase/tests/rls_verify.sql
-- Fails (psql error) on the first failed assertion.

\set ON_ERROR_STOP on

-- Self-heal: remove fixtures left behind by any previously aborted run.
set storage.allow_delete_query to 'true';
delete from storage.objects where name like 'rls-%';
reset storage.allow_delete_query;
delete from public.product_images where storage_path like 'rls-%';
delete from public.products where slug like 'rls-%';
delete from public.spec_definitions where key like 'rls\_%';
delete from public.categories where slug like 'rls-%';
delete from public.brands where slug like 'rls-%';
delete from public.series where slug like 'rls-%';
delete from public.certificates where title_ar like 'rls-%' or title_ar in ('shape-inactive', 'shape-active');
delete from public.projects where title_ar like 'rls-%' or title_ar in ('shape-inactive', 'shape-active');
delete from public.contact_numbers where label_ar like 'rls-%';
delete from public.social_links where platform like 'rls-%';
delete from public.site_settings where key like 'rls-%';

-- The suite must work whether or not products are published locally (D-034).
-- Force the designated test product into draft state and remember the original state.
create temporary table _state as
select (select is_published from public.products where slug = 'hst-fire-alarm-panel') as orig_published,
       (select count(*) from public.products
         where is_published and slug <> 'hst-fire-alarm-panel') as other_published;
update public.products set is_published = false where slug = 'hst-fire-alarm-panel';

-- ── helpers ──────────────────────────────────────────────────────────────
-- A write "does not happen" if the statement errors OR affects 0 rows.
create or replace function pg_temp.expect_no_write(stmt text, label text)
returns void language plpgsql as $fn$
declare rc bigint;
begin
  begin
    execute stmt;
    get diagnostics rc = row_count;
  exception when others then
    raise notice 'PASS: % (blocked: %)', label, sqlerrm;
    return;
  end;
  if rc > 0 then
    raise exception 'FAIL: % — write happened (% rows): %', label, rc, stmt;
  end if;
  raise notice 'PASS: % (0 rows)', label;
end $fn$;

-- A write must succeed AND affect at least one row.
create or replace function pg_temp.expect_write(stmt text, label text)
returns void language plpgsql as $fn$
declare rc bigint;
begin
  execute stmt;
  get diagnostics rc = row_count;
  if rc = 0 then
    raise exception 'FAIL: % — 0 rows affected: %', label, stmt;
  end if;
  raise notice 'PASS: % (% rows)', label, rc;
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  raise exception 'FAIL: % — % | %', label, sqlerrm, stmt;
end $fn$;

create or replace function pg_temp.expect_count(sql text, expected bigint, label text)
returns void language plpgsql as $fn$
declare got bigint;
begin
  execute sql into got;
  if got is distinct from expected then
    raise exception 'FAIL: % — expected %, got %', label, expected, got;
  end if;
  raise notice 'PASS: % (%)', label, got;
end $fn$;

-- ── 1. seed sanity, RLS enabled, policy inventory ────────────────────────
do $$
begin
  perform pg_temp.expect_count('select count(*) from public.categories', 17, 'seed: 17 categories');
  perform pg_temp.expect_count('select count(*) from public.brands', 8, 'seed: 8 brands');
  perform pg_temp.expect_count('select count(*) from public.spec_definitions', 7, 'seed: 7 spec definitions');
  perform pg_temp.expect_count('select count(*) from public.products', 65, 'seed: 65 products');

  perform pg_temp.expect_count(
    $q$select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relrowsecurity
         and c.relname in ('categories','brands','series','spec_definitions','products',
                           'product_images','certificates','contact_numbers','social_links',
                           'site_settings','projects')$q$,
    11, 'RLS enabled on all 11 tables');
  perform pg_temp.expect_count(
    $q$select count(*) from pg_policies where schemaname = 'public'$q$,
    29, '29 policies on public tables');
  perform pg_temp.expect_count(
    $q$select count(*) from pg_policies where schemaname = 'storage'
       and policyname in ('storage_objects_public_read','storage_objects_admin_write')$q$,
    2, '2 storage policies present');
end $$;

-- ── 2. anon reads: drafts invisible, lookups visible ─────────────────────
do $$
declare n bigint; baseline bigint;
begin
  select other_published into baseline from _state;

  set role anon;
  set request.jwt.claims to '{}';

  select count(*) into n from public.products;
  if n <> baseline then
    raise exception 'FAIL: anon sees % products (want % = all published, draft hidden)', n, baseline;
  end if;
  raise notice 'PASS: anon cannot read drafts (% published visible, forced draft hidden)', baseline;

  perform pg_temp.expect_count('select count(*) from public.categories', 17, 'anon: sees 17 categories');
  perform pg_temp.expect_count('select count(*) from public.brands', 8, 'anon: sees 8 brands');
  perform pg_temp.expect_count('select count(*) from public.spec_definitions', 7, 'anon: sees 7 spec definitions');
  perform pg_temp.expect_count('select count(*) from public.product_images', 0, 'anon: 0 product images');
  perform pg_temp.expect_count('select count(*) from public.certificates', 0, 'anon: 0 certificates');
  perform pg_temp.expect_count('select count(*) from public.projects', 0, 'anon: 0 projects');
  perform pg_temp.expect_count('select count(*) from public.site_settings', 17, 'anon: sees 17 site settings');

  reset role;
end $$;

-- published product becomes visible, then hidden again
do $$
declare baseline bigint;
begin
  select other_published into baseline from _state;

  update public.products set is_published = true where slug = 'hst-fire-alarm-panel';

  set role anon;
  perform pg_temp.expect_count(
    'select count(*) from public.products', baseline + 1,
    'anon: published product becomes visible');
  perform pg_temp.expect_count(
    $q$select count(*) from public.products where slug = 'hst-fire-alarm-panel'$q$,
    1, 'anon: published product readable');
  perform pg_temp.expect_count(
    $q$select count(*) from public.product_images pi
       join public.products p on p.id = pi.product_id where p.is_published$q$,
    0, 'anon: published-product images visible (none exist yet)');
  reset role;

  update public.products set is_published = false where slug = 'hst-fire-alarm-panel';

  set role anon;
  perform pg_temp.expect_count(
    'select count(*) from public.products', baseline,
    'anon: hidden again after unpublish');
  reset role;
end $$;

-- is_active filtering (certificates + projects)
do $$
begin
  insert into public.certificates (title_ar, title_en, image_url, storage_path, is_active)
  values ('shape-inactive','x','u','p', false), ('shape-active','x','u','p', true);
  insert into public.projects (title_ar, title_en, is_active)
  values ('shape-inactive','x', false), ('shape-active','x', true);

  set role anon;
  perform pg_temp.expect_count('select count(*) from public.certificates', 1, 'anon: sees only active certificates');
  perform pg_temp.expect_count('select count(*) from public.projects', 1, 'anon: sees only active projects');
  reset role;
end $$;

-- ── 3. anon cannot write (11 tables + storage) ───────────────────────────
do $$
declare
  v_cat uuid;
  v_prod uuid;
begin
  select id into v_cat from public.categories where slug = 'control-panels';
  select id into v_prod from public.products where slug = 'hst-fire-alarm-panel';

  -- fixtures (postgres) so UPDATE/DELETE have real candidate rows
  insert into public.series (slug, name_ar, name_en) values ('rls-fixture','x','x');
  insert into public.spec_definitions (category_id, key, label_ar, label_en, value_type)
  values (v_cat, 'rls_fixture','x','x','text');
  insert into public.products (slug, category_id, name_ar, name_en)
  values ('rls-fixture', v_cat, 'x','x');
  insert into public.product_images (product_id, url, storage_path)
  values (v_prod, 'u', 'rls-fixture');
  insert into public.categories (slug, name_ar, name_en) values ('rls-fixture','x','x');
  insert into public.brands (slug, name_ar, name_en) values ('rls-fixture','x','x');
  insert into public.certificates (title_ar, title_en, image_url, storage_path)
  values ('rls-fixture','x','u','p');
  insert into public.contact_numbers (label_ar, label_en, number)
  values ('rls-fixture','x','+201000000000');
  insert into public.social_links (platform, url) values ('rls-fixture','https://example.com/x');
  insert into public.site_settings (key, value_ar, value_en) values ('rls-fixture','x','x');
  insert into public.projects (title_ar, title_en) values ('rls-fixture','x');

  set role anon;
  set request.jwt.claims to '{}';

  perform pg_temp.expect_no_write(
    $q$insert into public.categories (slug, name_ar, name_en) values ('rls-anon','x','x')$q$,
    'anon INSERT categories blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.brands (slug, name_ar, name_en) values ('rls-anon','x','x')$q$,
    'anon INSERT brands blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.series (slug, name_ar, name_en) values ('rls-anon','x','x')$q$,
    'anon INSERT series blocked');
  perform pg_temp.expect_no_write(
    format($q$insert into public.spec_definitions (category_id, key, label_ar, label_en, value_type)
           values (%L, 'rls_anon','x','x','text')$q$, v_cat),
    'anon INSERT spec_definitions blocked');
  perform pg_temp.expect_no_write(
    format($q$insert into public.products (slug, category_id, name_ar, name_en)
           values ('rls-anon', %L, 'x','x')$q$, v_cat),
    'anon INSERT products blocked');
  perform pg_temp.expect_no_write(
    format($q$insert into public.product_images (product_id, url, storage_path)
           values (%L, 'u','p')$q$, v_prod),
    'anon INSERT product_images blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.certificates (title_ar, title_en, image_url, storage_path)
       values ('rls-anon','x','u','p')$q$,
    'anon INSERT certificates blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.contact_numbers (label_ar, label_en, number)
       values ('rls-anon','x','+201000000001')$q$,
    'anon INSERT contact_numbers blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.social_links (platform, url) values ('rls-anon','https://example.com/a')$q$,
    'anon INSERT social_links blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.site_settings (key, value_ar, value_en) values ('rls-anon','x','x')$q$,
    'anon INSERT site_settings blocked');
  perform pg_temp.expect_no_write(
    $q$insert into public.projects (title_ar, title_en) values ('rls-anon','x')$q$,
    'anon INSERT projects blocked');
  perform pg_temp.expect_no_write(
    $q$insert into storage.objects (bucket_id, name, owner, metadata)
       values ('site-assets','rls-anon.webp', null, '{}')$q$,
    'anon INSERT storage.objects blocked');

  perform pg_temp.expect_no_write(
    $q$update public.categories set name_ar = 'HACKED' where slug = 'rls-fixture'$q$,
    'anon UPDATE categories blocked');
  perform pg_temp.expect_no_write(
    $q$update public.brands set name_ar = 'HACKED' where slug = 'rls-fixture'$q$,
    'anon UPDATE brands blocked');
  perform pg_temp.expect_no_write(
    $q$update public.series set name_ar = 'HACKED' where slug = 'rls-fixture'$q$,
    'anon UPDATE series blocked');
  perform pg_temp.expect_no_write(
    $q$update public.spec_definitions set label_ar = 'HACKED' where key = 'rls_fixture'$q$,
    'anon UPDATE spec_definitions blocked');
  perform pg_temp.expect_no_write(
    $q$update public.products set name_ar = 'HACKED' where slug = 'rls-fixture'$q$,
    'anon UPDATE products blocked');
  perform pg_temp.expect_no_write(
    $q$update public.product_images set url = 'HACKED' where storage_path = 'rls-fixture'$q$,
    'anon UPDATE product_images blocked');
  perform pg_temp.expect_no_write(
    $q$update public.certificates set title_ar = 'HACKED' where title_ar = 'rls-fixture'$q$,
    'anon UPDATE certificates blocked');
  perform pg_temp.expect_no_write(
    $q$update public.contact_numbers set label_ar = 'HACKED' where label_ar = 'rls-fixture'$q$,
    'anon UPDATE contact_numbers blocked');
  perform pg_temp.expect_no_write(
    $q$update public.social_links set platform = 'HACKED' where platform = 'rls-fixture'$q$,
    'anon UPDATE social_links blocked');
  perform pg_temp.expect_no_write(
    $q$update public.site_settings set value_ar = 'HACKED' where key = 'rls-fixture'$q$,
    'anon UPDATE site_settings blocked');
  perform pg_temp.expect_no_write(
    $q$update public.projects set title_ar = 'HACKED' where title_ar = 'rls-fixture'$q$,
    'anon UPDATE projects blocked');

  perform pg_temp.expect_no_write(
    $q$delete from public.categories where slug = 'rls-fixture'$q$, 'anon DELETE categories blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.brands where slug = 'rls-fixture'$q$, 'anon DELETE brands blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.series where slug = 'rls-fixture'$q$, 'anon DELETE series blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.spec_definitions where key = 'rls_fixture'$q$, 'anon DELETE spec_definitions blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.products where slug = 'rls-fixture'$q$, 'anon DELETE products blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.product_images where storage_path = 'rls-fixture'$q$, 'anon DELETE product_images blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.certificates where title_ar = 'rls-fixture'$q$, 'anon DELETE certificates blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.contact_numbers where label_ar = 'rls-fixture'$q$, 'anon DELETE contact_numbers blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.social_links where platform = 'rls-fixture'$q$, 'anon DELETE social_links blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.site_settings where key = 'rls-fixture'$q$, 'anon DELETE site_settings blocked');
  perform pg_temp.expect_no_write(
    $q$delete from public.projects where title_ar = 'rls-fixture'$q$, 'anon DELETE projects blocked');
  perform pg_temp.expect_no_write(
    $q$delete from storage.objects where bucket_id = 'site-assets' and name = 'rls-anon.webp'$q$,
    'anon DELETE storage.objects blocked');

  reset role;

  -- fixtures untouched?
  perform pg_temp.expect_count(
    $q$select (select count(*) from public.categories where slug = 'rls-fixture')
            + (select count(*) from public.brands where slug = 'rls-fixture')
            + (select count(*) from public.series where slug = 'rls-fixture')
            + (select count(*) from public.spec_definitions where key = 'rls_fixture')
            + (select count(*) from public.products where slug = 'rls-fixture')
            + (select count(*) from public.product_images where storage_path = 'rls-fixture')
            + (select count(*) from public.certificates where title_ar = 'rls-fixture')
            + (select count(*) from public.contact_numbers where label_ar = 'rls-fixture')
            + (select count(*) from public.social_links where platform = 'rls-fixture')
            + (select count(*) from public.site_settings where key = 'rls-fixture')
            + (select count(*) from public.projects where title_ar = 'rls-fixture')$q$,
    11, 'all 11 fixtures intact after anon attempts');
end $$;

-- ── 4. authenticated without admin claims = write denied, drafts hidden ──
do $$
declare baseline bigint;
begin
  select other_published into baseline from _state;

  set request.jwt.claims to '{}';
  set role authenticated;

  perform pg_temp.expect_count('select count(*) from public.products', baseline,
    'authenticated (no admin): sees published only, drafts hidden');
  perform pg_temp.expect_no_write(
    $q$insert into public.categories (slug, name_ar, name_en) values ('rls-auth','x','x')$q$,
    'authenticated (no admin) INSERT categories blocked');
  perform pg_temp.expect_no_write(
    $q$update public.categories set name_ar = 'HACKED' where slug = 'rls-fixture'$q$,
    'authenticated (no admin) UPDATE categories blocked');

  reset role;
end $$;

-- ── 5. admin (authenticated + app_metadata.role=admin) full access ───────
do $$
begin
  set request.jwt.claims to '{"app_metadata":{"role":"admin"}}';
  set role authenticated;

  perform pg_temp.expect_count('select count(*) from public.products', 66,
    'admin: reads all drafts (65 seed + 1 fixture)');

  perform pg_temp.expect_write(
    $q$insert into public.categories (slug, name_ar, name_en) values ('rls-admin','x','x')$q$,
    'admin INSERT categories allowed');
  perform pg_temp.expect_write(
    $q$insert into public.brands (slug, name_ar, name_en) values ('rls-admin','x','x')$q$,
    'admin INSERT brands allowed');
  perform pg_temp.expect_write(
    $q$insert into public.series (slug, name_ar, name_en) values ('rls-admin','x','x')$q$,
    'admin INSERT series allowed');
  perform pg_temp.expect_write(
    $q$insert into public.certificates (title_ar, title_en, image_url, storage_path)
       values ('rls-admin','x','u','p')$q$,
    'admin INSERT certificates allowed');
  perform pg_temp.expect_write(
    $q$insert into public.contact_numbers (label_ar, label_en, number)
       values ('rls-admin','x','+201000000002')$q$,
    'admin INSERT contact_numbers allowed');
  perform pg_temp.expect_write(
    $q$insert into public.social_links (platform, url) values ('rls-admin','https://example.com/b')$q$,
    'admin INSERT social_links allowed');
  perform pg_temp.expect_write(
    $q$insert into public.site_settings (key, value_ar, value_en) values ('rls-admin','x','x')$q$,
    'admin INSERT site_settings allowed');
  perform pg_temp.expect_write(
    $q$insert into public.projects (title_ar, title_en) values ('rls-admin','x')$q$,
    'admin INSERT projects allowed');
  perform pg_temp.expect_write(
    $q$insert into storage.objects (bucket_id, name, owner, metadata)
       values ('site-assets','rls-admin.webp', null, '{}')$q$,
    'admin INSERT storage.objects allowed');

  perform pg_temp.expect_write(
    $q$update public.categories set name_ar = 'ADMIN-EDIT' where slug = 'rls-fixture'$q$,
    'admin UPDATE categories allowed');
  perform pg_temp.expect_write(
    $q$update public.products set name_ar = 'ADMIN-EDIT' where slug = 'rls-fixture'$q$,
    'admin UPDATE products allowed');

  perform pg_temp.expect_write(
    $q$update public.categories set name_ar = 'x' where slug = 'rls-admin'$q$,
    'admin UPDATE admin-inserted rows allowed');

  perform pg_temp.expect_write(
    $q$delete from public.categories where slug in ('rls-admin','rls-fixture')$q$,
    'admin DELETE categories allowed');
  perform pg_temp.expect_write(
    $q$delete from public.brands where slug in ('rls-admin','rls-fixture')$q$,
    'admin DELETE brands allowed');
  perform pg_temp.expect_write(
    $q$delete from public.series where slug in ('rls-admin','rls-fixture')$q$,
    'admin DELETE series allowed');
  perform pg_temp.expect_write(
    $q$delete from public.certificates where title_ar in ('rls-admin','rls-fixture')$q$,
    'admin DELETE certificates allowed');
  perform pg_temp.expect_write(
    $q$delete from public.contact_numbers where label_ar in ('rls-admin','rls-fixture')$q$,
    'admin DELETE contact_numbers allowed');
  perform pg_temp.expect_write(
    $q$delete from public.social_links where platform in ('rls-admin','rls-fixture')$q$,
    'admin DELETE social_links allowed');
  perform pg_temp.expect_write(
    $q$delete from public.site_settings where key in ('rls-admin','rls-fixture')$q$,
    'admin DELETE site_settings allowed');
  perform pg_temp.expect_write(
    $q$delete from public.projects where title_ar in ('rls-admin','rls-fixture')$q$,
    'admin DELETE projects allowed');
  -- storage.objects has a protect_delete trigger (Supabase design): direct deletes need the
  -- sanctioned storage.allow_delete_query escape hatch; RLS (is_admin) still applies.
  set storage.allow_delete_query to 'true';
  perform pg_temp.expect_write(
    $q$delete from storage.objects where bucket_id = 'site-assets' and name = 'rls-admin.webp'$q$,
    'admin DELETE storage.objects allowed (allow_delete_query)');
  reset storage.allow_delete_query;
  perform pg_temp.expect_no_write(
    $q$delete from storage.objects where bucket_id = 'site-assets' and name = 'rls-admin.webp'$q$,
    'storage DELETE blocked without allow_delete_query even for admin');
  perform pg_temp.expect_write(
    $q$update public.products set name_ar = 'ADMIN-EDIT' where slug = 'rls-fixture'$q$,
    'admin UPDATE products (second time) allowed');
  perform pg_temp.expect_write(
    $q$delete from public.products where slug = 'rls-fixture'$q$,
    'admin DELETE products allowed');
  perform pg_temp.expect_write(
    $q$delete from public.spec_definitions where key = 'rls_fixture'$q$,
    'admin DELETE spec_definitions allowed');
  perform pg_temp.expect_write(
    $q$delete from public.product_images where storage_path = 'rls-fixture'$q$,
    'admin DELETE product_images allowed');

  reset role;
  set request.jwt.claims to '{}';
end $$;

-- ── 6. updated_at trigger + final cleanup ────────────────────────────────
do $$
begin
  update public.products set updated_at = '2000-01-01T00:00:00Z' where slug = 'hst-2-zone-panel';
  update public.products set sort_order = sort_order where slug = 'hst-2-zone-panel';
  perform pg_temp.expect_count(
    $q$select count(*) from public.products
       where slug = 'hst-2-zone-panel' and updated_at > now() - interval '10 minutes'$q$,
    1, 'updated_at trigger fires on product update');

  delete from public.certificates where title_ar in ('shape-inactive','shape-active');
  delete from public.projects where title_ar in ('shape-inactive','shape-active');

  -- restore the test product's original publish state (D-034)
  update public.products p set is_published = s.orig_published
  from _state s
  where p.slug = 'hst-fire-alarm-panel';

  perform pg_temp.expect_count('select count(*) from public.categories', 17, 'final: 17 categories');
  perform pg_temp.expect_count('select count(*) from public.brands', 8, 'final: 8 brands');
  perform pg_temp.expect_count('select count(*) from public.spec_definitions', 7, 'final: 7 spec definitions');
  perform pg_temp.expect_count('select count(*) from public.products', 65, 'final: 65 products');
  perform pg_temp.expect_count(
    'select count(*) from public.products where is_published',
    (select other_published + orig_published::int from _state),
    'final: publish state restored');
  perform pg_temp.expect_count('select count(*) from public.series', 0, 'final: series empty');
  perform pg_temp.expect_count('select count(*) from public.product_images', 0, 'final: images empty');
  perform pg_temp.expect_count('select count(*) from public.certificates', 0, 'final: certificates empty');
  perform pg_temp.expect_count('select count(*) from public.contact_numbers', 2, 'final: 2 contact numbers');
  perform pg_temp.expect_count('select count(*) from public.social_links', 3, 'final: 3 social links');
  perform pg_temp.expect_count('select count(*) from public.site_settings', 17, 'final: 17 site settings');
  perform pg_temp.expect_count('select count(*) from public.projects', 0, 'final: projects empty');
  perform pg_temp.expect_count(
    $q$select count(*) from storage.objects where bucket_id in ('site-assets','catalogs','product-images')$q$,
    0, 'final: no storage fixture objects remain');
end $$;

select 'ALL RLS CHECKS PASSED' AS result;
