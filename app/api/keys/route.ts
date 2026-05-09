// app/api/keys/route.ts
// Route INTERNA per generare/revocare API keys.
// Auth: cookie Supabase (stesso pattern del resto del progetto).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateKey } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ALL_SCOPES = [
  'commesse:read', 'commesse:write',
  'fatture:read', 'fatture:write',
  'clienti:read', 'clienti:write',
  'vani:read', 'vani:write',
  'cnc:write',
  'leads:write',
  'webhook:receive',
];

/**
 * Estrae user dalla request.
 * Tenta 3 modi (in ordine):
 *  1. Bearer token in header Authorization
 *  2. Cookie 'sb-session' (storage del progetto)
 *  3. Cookie 'sb-access-token' (legacy)
 */
async function getUserFromRequest(req: NextRequest) {
  // 1. Bearer token (per chiamate da modal con session.access_token)
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) return data.user;
  }

  // 2. Cookie sb-session (storage custom MASTRO da lib/supabase.ts)
  const sbSession = req.cookies.get('sb-session')?.value;
  if (sbSession) {
    try {
      const session = JSON.parse(decodeURIComponent(sbSession));
      const accessToken = session?.access_token;
      if (accessToken) {
        const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
        if (!error && data.user) return data.user;
      }
    } catch {
      // ignore parse error
    }
  }

  // 3. Cookie generici Supabase
  for (const cookieName of req.cookies.getAll().map((c) => c.name)) {
    if (cookieName.startsWith('sb-') && cookieName.includes('auth-token')) {
      const value = req.cookies.get(cookieName)?.value;
      if (!value) continue;
      try {
        // Formato: array JSON [access_token, refresh_token, ...]
        const decoded = decodeURIComponent(value);
        const parsed = JSON.parse(decoded);
        const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
        if (accessToken) {
          const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
          if (!error && data.user) return data.user;
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Sessione non trovata. Effettua nuovamente il login.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { name, scopes, expiresInDays } = body;

  if (!name || !Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const invalidScopes = scopes.filter((s: string) => !ALL_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json({ error: 'invalid_scopes', invalid: invalidScopes }, { status: 400 });
  }

  // Recupera azienda_id + ruolo
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('azienda_id, ruolo')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.azienda_id) {
    return NextResponse.json(
      { error: 'no_azienda', message: 'Profilo senza azienda associata' },
      { status: 403 }
    );
  }
  if (!['owner', 'admin', 'titolare'].includes(profile.ruolo ?? '')) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Solo owner/admin possono creare API keys' },
      { status: 403 }
    );
  }

  const { plaintext, hash, prefix } = generateKey();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      azienda_id: profile.azienda_id,
      created_by: user.id,
      name,
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      expires_at: expiresAt,
    })
    .select('id, name, key_prefix, scopes, expires_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, plaintext });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('azienda_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.azienda_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('azienda_id', profile.azienda_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
