// app/api/v1/fatture/route.ts
// MASTRO API v1 - Lista fatture emesse
// Header: Authorization: Bearer mk_live_xxx
// Scope richiesto: fatture:read

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const dateFrom = url.searchParams.get('from');
  const dateTo = url.searchParams.get('to');

  let q = supabaseAdmin
    .from('fin_fatture_emesse')
    .select('*', { count: 'exact' })
    .eq('azienda_id', ctx.aziendaId)
    .order('created_at', { ascending: false });

  if (dateFrom) q = q.gte('created_at', dateFrom);
  if (dateTo) q = q.lte('created_at', dateTo);

  const { data, error, count } = await q.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: 'db_error', message: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    { data, pagination: { limit, offset, total: count } },
    { headers: CORS_HEADERS }
  );
}, { scope: 'fatture:read' });
