"use client";
// components/home/CardPianificazione.tsx
// Tile home che mostra le commesse in fase di pianificazione produzione/montaggio
// con colore basato su stato materiali

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  aziendaId: string;
  onClick?: (commessaId: string) => void;
}

interface CmRow {
  id: string;
  code: string;
  cliente: string;
  cognome: string | null;
  fase: string;
  materiali_status: string;
  materiali_perc: number;
}

const MAT_COLORS: Record<string, { bg: string; border: string; text: string; lbl: string }> = {
  completo:   { bg: '#E1F5EE', border: '#28A0A0', text: '#0F6E56', lbl: 'PRONTA' },
  parziale:   { bg: '#FEF3C7', border: '#D97706', text: '#92400E', lbl: 'PARZIALE' },
  in_attesa:  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', lbl: 'IN ATTESA' },
  nessuno:    { bg: '#F1F4F7', border: '#5C6B7A', text: '#5C6B7A', lbl: 'NO ORDINI' },
};

export default function CardPianificazione({ aziendaId, onClick }: Props) {
  const [commesse, setCommesse] = useState<CmRow[]>([]);
  const [loading, setLoading] = useState(true);

  const initial = aziendaId || (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || '') : '');
  const [resolvedAziendaId, setResolvedAziendaId] = useState(initial);

  // Fallback estremo: se non c'e' aziendaId, lo prendo da user_data via session loggata
  useEffect(() => {
    if (resolvedAziendaId) return;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id;
        if (!uid) { setLoading(false); return; }
        const { data: ud } = await supabase.from('user_data').select('azienda_id').eq('user_id', uid).limit(1).maybeSingle();
        const az = (ud as any)?.azienda_id;
        if (az) {
          setResolvedAziendaId(az);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('mastro:aziendaId', az);
            localStorage.setItem('mastro:aziendaId', az);
          }
        } else {
          setLoading(false);
        }
      } catch { setLoading(false); }
    })();
  }, [resolvedAziendaId]);

  useEffect(() => {
    if (!resolvedAziendaId) return;
    async function load() {
      const { data } = await supabase
        .from("commesse")
        .select("id, code, cliente, cognome, fase, materiali_status, materiali_perc")
        .eq("azienda_id", resolvedAziendaId)
        .in("fase", ["ordine", "acconto_pagato", "produzione", "montaggio"])
        .order("created_at", { ascending: false })
        .limit(8);
      setCommesse((data as CmRow[]) || []);
      setLoading(false);
    }
    load();

    const ch = supabase.channel(`card-pianif-${resolvedAziendaId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "commesse" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [resolvedAziendaId]);

  const counts = {
    pronte: commesse.filter(c => c.materiali_status === 'completo').length,
    parziali: commesse.filter(c => c.materiali_status === 'parziale').length,
    attesa: commesse.filter(c => c.materiali_status === 'in_attesa').length,
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth={2}>
            <rect x={3} y={4} width={18} height={18} rx={2}/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1F33' }}>Pianificazione</div>
        </div>
        <div style={{ fontSize: 11, color: '#5C6B7A' }}>{commesse.length} attive</div>
      </div>

      {/* Mini stats colorate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        <div style={{ background: '#E1F5EE', padding: '7px 8px', borderRadius: 8, border: '1px solid #28A0A0' }}>
          <div style={{ fontSize: 9, color: '#0F6E56', fontWeight: 600 }}>PRONTE</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#0F6E56', marginTop: 1 }}>{counts.pronte}</div>
        </div>
        <div style={{ background: '#FEF3C7', padding: '7px 8px', borderRadius: 8, border: '1px solid #D97706' }}>
          <div style={{ fontSize: 9, color: '#92400E', fontWeight: 600 }}>PARZIALI</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#92400E', marginTop: 1 }}>{counts.parziali}</div>
        </div>
        <div style={{ background: '#FEE2E2', padding: '7px 8px', borderRadius: 8, border: '1px solid #DC2626' }}>
          <div style={{ fontSize: 9, color: '#991B1B', fontWeight: 600 }}>IN ATTESA</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#991B1B', marginTop: 1 }}>{counts.attesa}</div>
        </div>
      </div>

      {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#5C6B7A', fontSize: 11 }}>Caricamento...</div> :
       commesse.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#5C6B7A', fontSize: 11 }}>Nessuna commessa in pianificazione</div> :
       <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {commesse.slice(0, 5).map(c => {
          const col = MAT_COLORS[c.materiali_status] || MAT_COLORS.nessuno;
          return (
            <div key={c.id} onClick={() => onClick?.(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9, background: col.bg, borderRadius: 8, border: `1px solid ${col.border}40`, cursor: 'pointer' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: col.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{c.materiali_perc}%</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1F33', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.code} · {c.cliente} {c.cognome || ''}</div>
                <div style={{ fontSize: 10, color: col.text, fontWeight: 600, marginTop: 1, letterSpacing: 0.3 }}>{col.lbl}</div>
              </div>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={col.text} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          );
        })}
        {commesse.length > 5 && (
          <div style={{ textAlign: 'center', fontSize: 11, color: '#28A0A0', padding: 6, fontWeight: 600 }}>
            + {commesse.length - 5} altre
          </div>
        )}
       </div>}

      {/* Legenda */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, fontSize: 9, color: '#5C6B7A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#DC2626', borderRadius: '50%' }}></span>Attesa</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#D97706', borderRadius: '50%' }}></span>Parziale</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#28A0A0', borderRadius: '50%' }}></span>Pronta</div>
      </div>
    </div>
  );
}
