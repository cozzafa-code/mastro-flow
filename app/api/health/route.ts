import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const start = Date.now();
  let dbOk = false;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from('aziende').select('id').limit(1);
    dbOk = !error;
  } catch (_) {}

  const ms = Date.now() - start;

  return NextResponse.json({
    ok: dbOk,
    db: dbOk ? 'up' : 'down',
    latency_ms: ms,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    timestamp: new Date().toISOString(),
  }, { status: dbOk ? 200 : 503 });
}
