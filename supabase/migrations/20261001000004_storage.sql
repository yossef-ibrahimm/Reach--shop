-- 0004 · Storage buckets + object policies (PROJECT_SPEC §5 / §7)
-- Three public buckets; only admin may write objects (denied for anon at the RLS layer).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880,  array['image/webp']),
  ('catalogs',       'catalogs',       true, 10485760, array['application/pdf']),
  ('site-assets',    'site-assets',    true, 5242880,  array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Reads: public (public buckets are also served without auth via /object/public/ URLs).
create policy storage_objects_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images','catalogs','site-assets'));

-- Writes: admin only (authenticated + app_metadata.role='admin').
create policy storage_objects_admin_write on storage.objects
  for all to authenticated
  using (bucket_id in ('product-images','catalogs','site-assets') and public.is_admin())
  with check (bucket_id in ('product-images','catalogs','site-assets') and public.is_admin());
