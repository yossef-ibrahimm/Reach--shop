import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function respond(status: number, body: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return respond(405, { error: 'Method not allowed.' });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return respond(401, { error: 'A signed-in admin session is required.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
  const githubToken = Deno.env.get('GITHUB_TOKEN');
  const githubRepo = Deno.env.get('GITHUB_REPO');

  if (!supabaseUrl || !supabaseKey || !githubToken || !githubRepo) {
    console.error('trigger-deploy is missing required environment configuration.');
    return respond(500, { error: 'The deployment service is not configured.' });
  }

  const repoParts = githubRepo.split('/');
  if (repoParts.length !== 2 || !repoParts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part))) {
    console.error('GITHUB_REPO must use the owner/repository format.');
    return respond(500, { error: 'The deployment repository configuration is invalid.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return respond(401, { error: 'The admin session is invalid or expired. Sign in again.' });
  }

  if (data.user.app_metadata.role !== 'admin') {
    return respond(403, { error: 'Only an admin can trigger a deployment.' });
  }

  const response = await fetch(
    `https://api.github.com/repos/${repoParts[0]}/${repoParts[1]}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ event_type: 'content-updated' }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error(`GitHub repository_dispatch failed (${response.status}): ${details}`);
    return respond(502, {
      error: `GitHub did not accept the deployment request (HTTP ${response.status}).`,
    });
  }

  return respond(202, { status: 'triggered' });
});
