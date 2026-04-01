import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vercel Cron: ogni giorno alle 09:00
// vercel.json → "crons": [{"path": "/api/cron/trial-scadenza", "schedule": "0 9 * * *"}]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const oggi = new Date();
  const tra7gg = new Date(oggi.getTime() + 7 * 86400000).toISOString();
  const tra1gg = new Date(oggi.getTime() + 1 * 86400000).toISOString();

  // Trial che scade tra 7 giorni
  const { data: scadono7 } = await supabase
    .from('subscriptions')
    .select('azienda_id, trial_ends_at, aziende(nome), profiles(email, nome)')
    .eq('status', 'trialing')
    .gte('trial_ends_at', oggi.toISOString())
    .lte('trial_ends_at', tra7gg);

  // Trial che scade domani — urgente
  const { data: scadono1 } = await supabase
    .from('subscriptions')
    .select('azienda_id, trial_ends_at, aziende(nome), profiles(email, nome)')
    .eq('status', 'trialing')
    .gte('trial_ends_at', oggi.toISOString())
    .lte('trial_ends_at', tra1gg);

  let emailInviate = 0;

  for (const sub of [...(scadono7 ?? []), ...(scadono1 ?? [])]) {
    const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles;
    const azienda = Array.isArray(sub.aziende) ? sub.aziende[0] : sub.aziende;
    if (!profile?.email) continue;

    const giorni = Math.ceil(
      (new Date(sub.trial_ends_at).getTime() - oggi.getTime()) / 86400000
    );

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({
        tipo: 'trial_scade',
        to: profile.email,
        dati: {
          nome: profile.nome,
          giorni,
          data_fine: new Date(sub.trial_ends_at).toLocaleDateString('it-IT'),
          link_upgrade: `${process.env.NEXT_PUBLIC_APP_URL}/app?tab=impostazioni&upgrade=1`,
          azienda: azienda?.nome ?? 'MASTRO SUITE',
        },
      }),
    });
    emailInviate++;
  }

  return NextResponse.json({
    ok: true,
    scadono_7gg: scadono7?.length ?? 0,
    scadono_1gg: scadono1?.length ?? 0,
    email_inviate: emailInviate,
    eseguito_alle: oggi.toISOString(),
  });
}
