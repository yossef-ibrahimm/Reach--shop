grant select, insert, update, delete on table public.contractor_requests
  to anon, authenticated;

notify pgrst, 'reload schema';
