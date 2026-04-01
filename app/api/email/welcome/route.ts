import { NextRequest, NextResponse } from 'next/server';

// Chiamata da webhook Stripe checkout.session.completed
// o da onboarding/save dopo il setup azienda

export async function POST(req: NextRequest) {
  try {
    const { to, nome, azienda, piano } = await req.json();

    const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<style>body{font-family:Inter,Arial,sans-serif;background:#F2F1EC;margin:0;padding:32px}
.card{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E5E3DC}
.top{background:#1A1A1C;padding:28px;color:#fff}
.logo{font-size:22px;font-weight:800;letter-spacing:-0.5px}
.logo span{color:#D08008}
.body{padding:32px}.h2{font-size:22px;font-weight:700;margin:0 0 12px;color:#1A1A1C}
p{color:#374151;line-height:1.6;margin:0 0 16px;font-size:15px}
.btn{display:inline-block;background:#D08008;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px}
.box{background:#F2F1EC;border-radius:10px;padding:16px 20px;margin:20px 0}
.foot{padding:20px 32px;background:#F2F1EC;font-size:12px;color:#9CA3AF;text-align:center}
</style></head><body>
<div class="card">
<div class="top"><div class="logo">MASTRO <span>SUITE</span></div></div>
<div class="body">
<div class="h2">Benvenuto in MASTRO, ${nome}! 🎉</div>
<p>Il tuo account per <strong>${azienda}</strong> è pronto.</p>
<div class="box">
  <div style="font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;margin-bottom:4px">Il tuo piano</div>
  <div style="font-size:20px;font-weight:800;color:#D08008">${piano?.toUpperCase() ?? 'TRIAL'}</div>
  <div style="font-size:13px;color:#6B7280;margin-top:2px">30 giorni gratis · Nessuna carta addebitata ancora</div>
</div>
<p>Cosa fare adesso:</p>
<ol style="color:#374151;line-height:2;padding-left:20px;font-size:15px">
  <li>Crea la tua <strong>prima commessa</strong></li>
  <li>Aggiungi i tuoi <strong>clienti</strong></li>
  <li>Genera il primo <strong>preventivo PDF</strong></li>
</ol>
<a href="https://mastro-erp.vercel.app/app" class="btn">Vai a MASTRO →</a>
<p style="margin-top:24px;font-size:13px;color:#6B7280">
Hai domande? Rispondi a questa email — ti rispondo io personalmente.<br>
Fabio — fondatore MASTRO SUITE
</p>
</div>
<div class="foot">
MASTRO SUITE · <a href="https://mastro-erp.vercel.app/privacy" style="color:#9CA3AF">Privacy</a> ·
<a href="https://mastro-erp.vercel.app/tos" style="color:#9CA3AF">Termini</a>
</div>
</div></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fabio di MASTRO <fabio@mastrosuite.com>',
        to: [to],
        subject: `Benvenuto in MASTRO, ${nome}! Il tuo account è pronto.`,
        html,
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
