"use client";
// components/finanze/CardPLCommessa.tsx
// Card P&L margine reale - da agganciare nei workspace commessa
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatEuro, formatEuroShort } from "../../hooks/useFinanze";
import { statoPLMeta, type CommessaPLRow } from "../../hooks/useCommessaPL";
import { PASTEL, MUTED, TEXT } from "../../lib/modaleColors";

interface Props {
  aziendaId: string;
  commessaCode: string;
  onApriDettaglio?: () => void;
}

export default function CardPLCommessa({ aziendaId, commessaCode, onApriDettaglio }: Props) {
  const [data, setData] = useState<CommessaPLRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!aziendaId || !commessaCode) { setLoading(false); return; }
      try {
        const { data: row } = await supabase
          .from('v_fin_commessa_pl')
          .select('*')
          .eq('azienda_id', aziendaId)
          .eq('commessa_code', commessaCode)
          .maybeSingle();
        if (cancel) return;
        if (row) {
          setData({
            ...row,
            ricavi_fatturati: Number(row.ricavi_fatturati || 0),
            ricavi_incassati: Number(row.ricavi_incassati || 0),
            ricavi_da_incassare: Number(row.ricavi_da_incassare || 0),
            costi_materiali: Number(row.costi_materiali || 0),
            costi_materiali_pagati: Number(row.costi_materiali_pagati || 0),
            costi_spese: Number(row.costi_spese || 0),
            costi_totali: Number(row.costi_totali || 0),
            utile_reale: Number(row.utile_reale || 0),
            utile_cassa: Number(row.utile_cassa || 0),
            margine_pct_reale: row.margine_pct_reale !== null ? Number(row.margine_pct_reale) : null,
            delta_margine_pct: row.delta_margine_pct !== null ? Number(row.delta_margine_pct) : null,
            margine_atteso_pct: row.margine_atteso_pct !== null ? Number(row.margine_atteso_pct) : null,
            n_fatture: Number(row.n_fatture || 0),
            n_spese: Number(row.n_spese || 0),
            n_fatt_fornitore: Number(row.n_fatt_fornitore || 0),
          } as CommessaPLRow);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [aziendaId, commessaCode]);

  if (loading) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 800 }}>MARGINE REALE</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Caricamento...</div>
      </div>
    );
  }

  if (!data || (data.ricavi_fatturati === 0 && data.costi_totali === 0)) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderLeft: `4px solid ${MUTED}` }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 800, marginBottom: 4 }}>MARGINE REALE</div>
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>
          Nessuna fattura o costo registrato per questa commessa. Il margine sarà calcolato automaticamente non appena verranno collegati ricavi/costi.
        </div>
      </div>
    );
  }

  const m = statoPLMeta(data.stato_pl);
  const col = (PASTEL as any)[m.tone] || PASTEL.navy;
  const inUtile = data.utile_reale >= 0;

  return (
    <div style={{ background: '#fff', borderRadius: 12, marginBottom: 8, borderLeft: `4px solid ${col.solid}`, overflow: 'hidden' as const }}>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 800 }}>MARGINE REALE COMMESSA</div>
          <div style={{ fontSize: 8, color: col.text, background: col.bg, padding: '2px 8px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5 }}>
            {m.emoji} {m.label.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid, letterSpacing: -1 }}>
            {inUtile ? '+' : ''}{formatEuro(data.utile_reale)}
          </div>
          {data.margine_pct_reale !== null && (
            <div style={{ fontSize: 14, fontWeight: 800, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid }}>
              {data.margine_pct_reale.toFixed(1)}%
            </div>
          )}
        </div>

        {data.delta_margine_pct !== null && data.margine_atteso_pct !== null && (
          <div style={{ fontSize: 10, color: data.delta_margine_pct >= 0 ? PASTEL.green.solid : PASTEL.red.solid, fontWeight: 700, marginBottom: 8 }}>
            {data.delta_margine_pct >= 0 ? '↑' : '↓'} {data.delta_margine_pct >= 0 ? '+' : ''}{data.delta_margine_pct.toFixed(1)}% vs preventivato ({data.margine_atteso_pct.toFixed(0)}%)
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div style={{ background: PASTEL.green.bg, borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 8, color: PASTEL.green.text, letterSpacing: 0.5, fontWeight: 800 }}>RICAVI</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: PASTEL.green.solid, marginTop: 2 }}>{formatEuroShort(data.ricavi_fatturati)}</div>
            <div style={{ fontSize: 8, color: MUTED, marginTop: 1, fontWeight: 600 }}>{data.n_fatture} fatture</div>
          </div>
          <div style={{ background: PASTEL.red.bg, borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 8, color: PASTEL.red.text, letterSpacing: 0.5, fontWeight: 800 }}>COSTI</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: PASTEL.red.solid, marginTop: 2 }}>{formatEuroShort(data.costi_totali)}</div>
            <div style={{ fontSize: 8, color: MUTED, marginTop: 1, fontWeight: 600 }}>{data.n_fatt_fornitore + data.n_spese} voci</div>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E5EAF0' }}>
            <RigaInfo label="Fatturato" value={formatEuro(data.ricavi_fatturati, 2)} />
            <RigaInfo label="Già incassato" value={formatEuro(data.ricavi_incassati, 2)} color={PASTEL.green.solid} />
            <RigaInfo label="Da incassare" value={formatEuro(data.ricavi_da_incassare, 2)} color={PASTEL.amber.solid} />
            <div style={{ height: 6 }} />
            <RigaInfo label={`Materiali (${data.n_fatt_fornitore})`} value={formatEuro(data.costi_materiali, 2)} />
            <RigaInfo label={`Spese titolare (${data.n_spese})`} value={formatEuro(data.costi_spese, 2)} />
            <div style={{ height: 6 }} />
            <RigaInfo label="Cassa netta" value={formatEuro(data.utile_cassa, 2)} bold color={data.utile_cassa >= 0 ? PASTEL.green.solid : PASTEL.red.solid} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={() => setExpanded(!expanded)} style={{
            flex: 1, padding: '8px 0', background: '#F1F4F7', color: TEXT,
            border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {expanded ? '▲ Riduci' : '▼ Dettaglio'}
          </button>
          {onApriDettaglio && (
            <button onClick={onApriDettaglio} style={{
              flex: 1, padding: '8px 0', background: col.solid, color: '#fff',
              border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Apri P&L →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RigaInfo({ label, value, color, bold }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
      <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: color || TEXT, fontWeight: bold ? 800 : 700 }}>{value}</span>
    </div>
  );
}