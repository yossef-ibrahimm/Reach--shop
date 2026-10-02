import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Build-time Supabase client (D-029): static export has no server runtime,
 * so this client only ever runs during `next build`. It authenticates as the
 * public anon key (RLS applies exactly as it does for visitors) and never
 * holds the service_role key.
 *
 * Missing env vars throw at import time → `npm run build` fails fast instead
 * of publishing a site with no data.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase project values.',
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
