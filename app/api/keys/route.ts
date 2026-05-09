// app/api/keys/route.ts
// Route generazione/revoca API keys
// AUTH MODE: legacy - accetta azienda_id da body (l'app usa storage custom, non auth.users)
// Sicurezza: validazione formato UUID + verifica esistenza azienda

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function validateAzienda(aziendaId: string): Promise<boolean> {
  if (!UUID_REGEX.test(aziendaId)) return false;
  const { data } = await supabaseAdmin
    .from('aziende')
    .select('id')
    .eq('id', aziendaId)
    .maybeSingle();
  return !!data;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { azienda_id, name, scopes, expiresInDays } = body;

  // Validazione
  if (!azienda_id) {
    return NextResponse.json({ error: 'missing_azienda_id' }, { status: 400 });
  }
  if (!await validateAzienda(azienda_id)) {
    return NextResponse.json({ error: 'invalid_azienda' }, { status: 403 });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return NextResponse.json({ error: 'no_scopes' }, { status: 400 });
  }

  const invalidScopes = scopes.filter((s: string) => !ALL_SCOPES.includes(s));
  if (invalidScopes.length > 0) {
    return NextResponse.json({ error: 'invalid_scopes', invalid: invalidScopes }, { status: 400 });
  }

  // Genera
  const { plaintext, hash, prefix } = generateKey();
  const expiresAt = expiresInDays && expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      azienda_id,
      created_by: null, // legacy mode senza user
      name: name.trim(),
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      expires_at: expiresAt,
    })
    .select('id, name, key_prefix, scopes, expires_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, plaintext });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const aziendaId = url.searchParams.get('azienda_id');

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  if (!aziendaId) return NextResponse.json({ error: 'missing_azienda_id' }, { status: 400 });
  if (!UUID_REGEX.test(aziendaId)) return NextResponse.json({ error: 'invalid_azienda' }, { status: 403 });

  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('azienda_id', aziendaId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const aziendaId = new URL(req.url).searchParams.get('azienda_id');
  if (!aziendaId || !UUID_REGEX.test(aziendaId)) {
    return NextResponse.json({ error: 'invalid_azienda' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, scopes, created_at, expires_at, revoked_at, last_used_at')
    .eq('azienda_id', aziendaId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data || [] });
}
