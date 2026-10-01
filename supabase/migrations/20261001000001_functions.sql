-- 0001 · Shared functions (PROJECT_SPEC §5)
-- Admin check: role is stored in the JWT app_metadata (set manually for the single admin user).
-- See README for the exact steps to create the admin user and set app_metadata.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

-- updated_at maintenance (trigger is attached to products in the schema migration).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
