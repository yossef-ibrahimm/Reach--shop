export type SupabaseErrorKind =
  'network' | 'missingTable' | 'permission' | 'invalidData' | 'unknown';

export function supabaseErrorKind(error: unknown): SupabaseErrorKind {
  if (error instanceof TypeError) return 'network';
  if (
    error instanceof Error &&
    error.message.startsWith('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  ) {
    return 'missingTable';
  }
  if (!error || typeof error !== 'object') return 'unknown';

  const code = 'code' in error && typeof error.code === 'string' ? error.code : '';

  if (code === 'PGRST205' || code === '42P01') return 'missingTable';
  if (code === '42501' || code === 'PGRST301' || code === '401' || code === '403') {
    return 'permission';
  }
  if (code.startsWith('22') || code.startsWith('23')) return 'invalidData';
  return 'unknown';
}
