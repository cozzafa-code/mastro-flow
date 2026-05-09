// app/api/v1/commesse/route.ts
// GET /api/v1/commesse - lista commesse azienda
// Header: Authorization: Bearer mk_live_xxx
// Scope: commesse:read

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const GET = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
  const offset = Number(url.searchParams.get('offset') ?? 0);

  const { data, error, count } = await supabaseAdmin
    .from('commesse')
    .select('*', { count: 'exact' })
    .eq('azienda_id', ctx.aziendaId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: { limit, offset, total: count },
  });
}, { scope: 'commesse:read' });
