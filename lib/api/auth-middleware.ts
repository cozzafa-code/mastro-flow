// lib/api/auth-middleware.ts
// Middleware autenticazione API esterne via Bearer key.

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type ApiContext = {
  apiKeyId: string;
  aziendaId: string;
  scopes: string[];
};

export type ApiError = {
  status: number;
  code: string;
  message: string;
};

export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

export function generateKey(): { plaintext: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(24).toString('base64url');
  const plaintext = `mk_live_${random}`;
  return { plaintext, hash: hashKey(plaintext), prefix: plaintext.slice(0, 12) };
}

function extractKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const [scheme, value] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !value) return null;
  return value.trim();
}

export async function authenticateApiRequest(
  req: NextRequest,
  requiredScope?: string
): Promise<{ ok: true; ctx: ApiContext } | { ok: false; error: ApiError }> {
  const plaintext = extractKey(req);
  if (!plaintext) {
    return { ok: false, error: { status: 401, code: 'missing_key', message: 'Authorization header mancante' } };
  }

  const hash = hashKey(plaintext);

  const { data: key, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, azienda_id, scopes, rate_limit_per_min, expires_at, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle();

  if (error || !key) {
    return { ok: false, error: { status: 401, code: 'invalid_key', message: 'API key non valida' } };
  }

  if (key.revoked_at) {
    return { ok: false, error: { status: 401, code: 'revoked_key', message: 'API key revocata' } };
  }

  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return { ok: false, error: { status: 401, code: 'expired_key', message: 'API key scaduta' } };
  }

  if (requiredScope && !key.scopes.includes(requiredScope)) {
    return { ok: false, error: { status: 403, code: 'insufficient_scope', message: `Scope richiesto: ${requiredScope}` } };
  }

  const windowStart = new Date(Math.floor(Date.now() / 60000) * 60000).toISOString();
  const { data: bucket } = await supabaseAdmin
    .from('api_rate_buckets')
    .select('count')
    .eq('api_key_id', key.id)
    .eq('window_start', windowStart)
    .maybeSingle();

  const currentCount = bucket?.count ?? 0;
  if (currentCount >= key.rate_limit_per_min) {
    return { ok: false, error: { status: 429, code: 'rate_limited', message: 'Rate limit superato' } };
  }

  await supabaseAdmin
    .from('api_rate_buckets')
    .upsert(
      { api_key_id: key.id, window_start: windowStart, count: currentCount + 1 },
      { onConflict: 'api_key_id,window_start' }
    );

  supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', key.id)
    .then(() => {});

  return {
    ok: true,
    ctx: { apiKeyId: key.id, aziendaId: key.azienda_id, scopes: key.scopes },
  };
}

export async function logApiRequest(params: {
  apiKeyId: string;
  aziendaId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userAgent?: string;
  errorCode?: string;
}) {
  await supabaseAdmin.from('api_logs').insert({
    api_key_id: params.apiKeyId,
    azienda_id: params.aziendaId,
    method: params.method,
    path: params.path,
    status_code: params.statusCode,
    duration_ms: params.durationMs,
    ip_address: params.ip,
    user_agent: params.userAgent,
    error_code: params.errorCode,
  });
}

export function withApiAuth(
  handler: (req: NextRequest, ctx: ApiContext) => Promise<NextResponse>,
  options: { scope?: string } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const auth = await authenticateApiRequest(req, options.scope);

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error.code, message: auth.error.message },
        { status: auth.error.status }
      );
    }

    let response: NextResponse;
    let errorCode: string | undefined;

    try {
      response = await handler(req, auth.ctx);
    } catch (e: any) {
      errorCode = 'handler_error';
      response = NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }

    logApiRequest({
      apiKeyId: auth.ctx.apiKeyId,
      aziendaId: auth.ctx.aziendaId,
      method: req.method,
      path: new URL(req.url).pathname,
      statusCode: response.status,
      durationMs: Date.now() - start,
      ip: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      errorCode,
    }).catch(() => {});

    return response;
  };
}
