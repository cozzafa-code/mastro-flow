// ============================================================
// MASTRO — Notifica problema timer → ops_alert
// ============================================================

import { supabase } from '@/lib/supabase';

export async function creaAlertProblema(p: {
  aziendaId: string;
  commessaId: string;
  operatoreId: string;
  oraId: string;
  fase: string;
  dettaglio: string;
}) {
  // Trova il responsabile: caposquadra > resp_produzione > titolare
  const { data: responsabili } = await supabase
    .from('operatori')
    .select('id, nome, cognome, ruolo')
    .eq('azienda_id', p.aziendaId)
    .in('ruolo', ['caposquadra', 'resp_produzione', 'titolare'])
    .eq('attivo', true);

  const ordine = ['caposquadra', 'resp_produzione', 'titolare'];
  const dest = (responsabili ?? [])
    .sort((a: any, b: any) => ordine.indexOf(a.ruolo) - ordine.indexOf(b.ruolo))[0];

  if (!dest) return;

  const { data: op } = await supabase
    .from('operatori').select('nome, cognome').eq('id', p.operatoreId).single();
  const operatoreNome = op
    ? `${op.nome ?? ''} ${op.cognome ?? ''}`.trim()
    : 'Operatore';

  const { data: cm } = await supabase
    .from('commesse').select('code, cliente, cognome').eq('id', p.commessaId).single();
  const commessaLabel = cm
    ? `${cm.code ?? '—'} · ${cm.cliente ?? ''} ${cm.cognome ?? ''}`.trim()
    : 'Commessa';

  await supabase.from('ops_alert').insert({
    azienda_id: p.aziendaId,
    commessa_id: p.commessaId,
    tipo: 'timer_problema',
    severita: 'alta',
    messaggio: `${operatoreNome} ha fermato il timer (${p.fase}) su ${commessaLabel}. Motivo: ${p.dettaglio}`,
    destinatario_id: dest.id,
    letto: false,
    risolto: false,
    dati: {
      ora_lavoro_id: p.oraId,
      operatore_id: p.operatoreId,
      fase: p.fase,
      dettaglio: p.dettaglio,
    },
  });
}
