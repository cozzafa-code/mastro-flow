import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status, trial_ends_at, current_period_end')
      .eq('azienda_id', auth.aziendaId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ plan: 'base', status: 'no_subscription', trialing: false });
    }

    const now = new Date();
    const trialing = data.status === 'trialing' && data.trial_ends_at
      ? new Date(data.trial_ends_at) > now
      : false;

    const trialDaysLeft = trialing && data.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(data.trial_ends_at).getTime() - now.getTime()) / 86400000))
      : 0;

    return NextResponse.json({ ...data, trialing, trialDaysLeft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
