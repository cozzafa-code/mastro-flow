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

    const { searchParams } = new URL(req.url);
    const commessaId = searchParams.get('commessa_id');
    if (!commessaId) return NextResponse.json({ error: 'commessa_id obbligatorio' }, { status: 400 });

    const { data: commessa } = await supabase
      .from('commesse')
      .select('*, clienti(nome, telefono, email), vani(*)')
      .eq('id', commessaId)
      .eq('azienda_id', auth.aziendaId)
      .single();

    if (!commessa) return NextResponse.json({ error: 'Commessa non trovata' }, { status: 404 });

    const { data: azienda } = await supabase
      .from('aziende')
      .select('nome, telefono, email, indirizzo, piva')
      .eq('id', auth.aziendaId)
      .single();

    // Genera HTML → PDF via browser print
    const html = generateMisurePDF(commessa, azienda);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-PDF-Ready': 'true',
      },
    });
  } catch (err: any) {
    console.error('[misure/pdf]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generateMisurePDF(commessa: any, azienda: any): string {
  const vani = commessa.vani ?? [];
  const cliente = commessa.clienti;
  const oggi = new Date().toLocaleDateString('it-IT');

  const vaniHtml = vani.map((v: any) => `
    <tr>
      <td>${v.nome ?? '—'}</td>
      <td>${v.piano ?? '—'}</td>
      <td>${v.larghezza_mm ? v.larghezza_mm + ' mm' : '—'}</td>
      <td>${v.altezza_mm ? v.altezza_mm + ' mm' : '—'}</td>
      <td>${v.tipo_apertura ?? '—'}</td>
      <td>${v.note ?? ''}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Misure — ${commessa.codice ?? commessa.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; font-size: 12px; color: #1A1A1C; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #D08008; padding-bottom: 16px; }
    .logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .logo span { color: #D08008; }
    .azienda-info { text-align: right; font-size: 11px; color: #6B7280; }
    .doc-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    .meta-block { background: #F2F1EC; padding: 12px 16px; border-radius: 8px; }
    .meta-label { font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 4px; }
    .meta-value { font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #1A1A1C; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; }
    tbody tr:nth-child(even) { background: #F2F1EC; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #E5E3DC; }
    .footer { margin-top: 40px; font-size: 10px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E3DC; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MASTRO <span>SUITE</span></div>
      <div style="font-size:11px;color:#6B7280;margin-top:4px">${azienda?.nome ?? ''}</div>
    </div>
    <div class="azienda-info">
      ${azienda?.indirizzo ?? ''}<br>
      ${azienda?.telefono ?? ''} · ${azienda?.email ?? ''}<br>
      P.IVA ${azienda?.piva ?? '—'}
    </div>
  </div>

  <div class="doc-title">Scheda Misure</div>
  <div style="color:#6B7280;font-size:11px;margin-bottom:20px">Commessa ${commessa.codice ?? commessa.id} · ${oggi}</div>

  <div class="meta">
    <div class="meta-block">
      <div class="meta-label">Cliente</div>
      <div class="meta-value">${cliente?.nome ?? '—'}</div>
      <div style="font-size:11px;color:#6B7280;margin-top:2px">${cliente?.telefono ?? ''} ${cliente?.email ?? ''}</div>
    </div>
    <div class="meta-block">
      <div class="meta-label">Indirizzo cantiere</div>
      <div class="meta-value">${commessa.indirizzo_cantiere ?? commessa.indirizzo ?? '—'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Vano</th>
        <th>Piano</th>
        <th>Larghezza</th>
        <th>Altezza</th>
        <th>Apertura</th>
        <th>Note</th>
      </tr>
    </thead>
    <tbody>
      ${vaniHtml || '<tr><td colspan="6" style="text-align:center;color:#9CA3AF;padding:20px">Nessun vano registrato</td></tr>'}
    </tbody>
  </table>

  <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
    <div>
      <div style="font-size:11px;color:#6B7280;margin-bottom:40px">Firma Tecnico Misuratore</div>
      <div style="border-top:1px solid #1A1A1C;padding-top:6px;font-size:11px">Nome e firma</div>
    </div>
    <div>
      <div style="font-size:11px;color:#6B7280;margin-bottom:40px">Firma Cliente (presa visione)</div>
      <div style="border-top:1px solid #1A1A1C;padding-top:6px;font-size:11px">Nome e firma</div>
    </div>
  </div>

  <div class="footer">
    Documento generato da MASTRO SUITE · ${oggi} · Dati riservati
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}
