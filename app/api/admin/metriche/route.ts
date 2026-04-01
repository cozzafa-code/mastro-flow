import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREZZI: Record<string, number> = { base: 9, start: 29, pro: 59, titan: 89 };

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  // Solo titolare può vedere metriche
  const { data: profilo } = await supabase
    .from('profiles')
    .select('ruolo')
    .eq('id', auth.userId)
    .single();

  if (profilo?.ruolo !== 'titolare' && profilo?.ruolo !== 'admin') {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
  }

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('plan, status, created_at');

  const totale_aziende = subs?.length ?? 0;
  const trialing = subs?.filter(s => s.status === 'trialing').length ?? 0;
  const active = subs?.filter(s => s.status === 'active').length ?? 0;
  const mrr = subs?.filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (PREZZI[s.plan] ?? 0), 0) ?? 0;

  const sette_fa = new Date(Date.now() - 7 * 86400000).toISOString();
  const nuove_7gg = subs?.filter(s => s.created_at >= sette_fa).length ?? 0;

  const trenta_fa = new Date(Date.now() - 30 * 86400000).toISOString();
  const churn_30gg = subs?.filter(s => s.status === 'canceled' && s.created_at >= trenta_fa).length ?? 0;

  const trial_conversion_rate = totale_aziende > 0
    ? Math.round((active / totale_aziende) * 100)
    : 0;

  return NextResponse.json({
    totale_aziende,
    trialing,
    active,
    mrr,
    nuove_7gg,
    churn_30gg,
    trial_conversion_rate,
  });
}
