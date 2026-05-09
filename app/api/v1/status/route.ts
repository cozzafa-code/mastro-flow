// app/api/v1/status/route.ts
// MASTRO API - Status pubblico (no auth, pubblico)
// Per uptime monitoring esterno (UptimeRobot, Better Stack, ecc.)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const START_TIME = Date.now();

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string }> = {};

  // Check 1: Database raggiungibile
  const dbStart = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from('aziende')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    checks.database = {
      ok: !error,
      latency_ms: Date.now() - dbStart,
      ...(error ? { error: error.message } : {}),
    };
  } catch (e: any) {
    checks.database = { ok: false, error: e?.message };
  }

  // Check 2: API keys table
  const apiStart = Date.now();
  try {
    const { error } = await supabaseAdmin
      .from('api_keys')
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    checks.api_keys = {
      ok: !error,
      latency_ms: Date.now() - apiStart,
    };
  } catch (e: any) {
    checks.api_keys = { ok: false, error: e?.message };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 'operational' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: 'v1',
      uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: CORS_HEADERS,
    }
  );
}
