create table public.contractor_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  company text not null check (char_length(btrim(company)) between 2 and 160),
  phone text not null check (phone ~ '^[+]?[0-9() -]{8,20}$'),
  project text not null check (char_length(btrim(project)) between 2 and 160),
  building_type text not null check (
    building_type in ('commercial', 'administrative', 'industrial', 'healthcare', 'residential', 'education', 'other')
  ),
  area numeric(12, 2) not null check (area > 0),
  system text not null check (system in ('conventional', 'addressable', 'unsure')),
  tier text not null check (tier in ('premium', 'economy', 'open')),
  drawing_name text check (drawing_name is null or char_length(drawing_name) <= 255),
  created_at timestamptz not null default now()
);

create index contractor_requests_created_at_idx
  on public.contractor_requests (created_at desc);

alter table public.contractor_requests enable row level security;

create policy contractor_requests_public_submit on public.contractor_requests
  for insert to anon
  with check (true);

create policy contractor_requests_admin_manage on public.contractor_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
