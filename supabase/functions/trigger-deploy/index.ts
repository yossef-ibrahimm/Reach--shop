const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
const lastDispatchByUser = new Map<string, number>();

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  const githubRepo = Deno.env.get('GITHUB_REPO');

  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !anonKey) {
    return json({ error: 'Unauthorized' }, 401);
  }
  if (!githubToken || !githubRepo || !/^[\w.-]+\/[\w.-]+$/.test(githubRepo)) {
    return json({ error: 'Deployment is not configured' }, 503);
  }

  let user: { id?: string; app_metadata?: { role?: string } };
  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: authorization },
    });
    if (!authResponse.ok) return json({ error: 'Unauthorized' }, 401);
    user = await authResponse.json();
  } catch {
    return json({ error: 'Authentication service unavailable' }, 503);
  }

  if (!user.id || user.app_metadata?.role !== 'admin') {
    return json({ error: 'Forbidden' }, 403);
  }

  const now = Date.now();
  const previousDispatch = lastDispatchByUser.get(user.id) ?? 0;
  if (now - previousDispatch < 60_000) {
    return json({ error: 'Please wait before publishing again' }, 429);
  }

  try {
    const dispatchResponse = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'content-updated' }),
    });

    if (dispatchResponse.status !== 204) {
      console.error('GitHub dispatch failed with status', dispatchResponse.status);
      return json({ error: 'GitHub could not start the deployment' }, 502);
    }
  } catch {
    return json({ error: 'GitHub is currently unavailable' }, 502);
  }

  lastDispatchByUser.set(user.id, now);
  return json({ ok: true }, 202);
});

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
