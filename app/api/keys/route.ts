// app/api/keys/route.ts
// Route INTERNA (cookie-auth) per generare/revocare API keys.
// NB: non confondere con /api/v1/* che è la API pubblica.

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateKey } from '@/lib/api/auth-middleware';

const ALL_SCOPES = [
  'commesse:read', 'commesse:write',
  'fatture:read', 'fatture:write',
  'clienti:read', 'clienti:write',
  'vani:read', 'vani:write',
  'cnc:write',
  'leads:write',
  'webhook:receive',
];

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, scopes, expiresInDays } = body;

  if (!name || !Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const invalidScopes = scopes.filter((s: string) => !ALL_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json({ error: 'invalid_scopes', invalid: invalidScopes }, { status: 400 });
  }

  // Recupera azienda_id + ruolo dal profilo (no service_role: la RLS controlla)
  const { data: profile } = await supabase
    .from('profiles')
    .select('azienda_id, ruolo')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.azienda_id) {
    return NextResponse.json({ error: 'no_azienda' }, { status: 403 });
  }
  if (!['owner', 'admin', 'titolare'].includes(profile.ruolo ?? '')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { plaintext, hash, prefix } = generateKey();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
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

  // PRIMA E ULTIMA volta che il plaintext è visibile
  return NextResponse.json({ ...data, plaintext });
}

export async function DELETE(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
