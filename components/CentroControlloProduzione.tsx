"use client";
// components/CentroControlloProduzione.tsx  
// Centro controllo produzione: KPI live + carico macchinari + lista in lavorazione

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

interface Commessa {
  id: string; code: string; cliente: string; cognome: string; fase: string;
  materiali_status: string; materiali_perc: number;
  produzione_iniziata_at: string | null; produzione_completata_at: string | null;
  totale_finale: number;
}

export default function CentroControlloProduzione({ aziendaId, onClose, onApriCommessa }: any) {
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'tutte' | 'oggi' | 'critiche'>('tutte');

  useEffect(() => {
    if (!aziendaId) return;
    async function load() {
      const { data } = await supabase
        .from("commesse")
        .select("id, code, cliente, cognome, fase, materiali_status, materiali_perc, produzione_iniziata_at, produzione_completata_at, totale_finale")
        .eq("azienda_id", aziendaId)
        .in("fase", ["ordine", "acconto_pagato", "produzione", "montaggio"])
        .order("created_at", { ascending: false });
      setCommesse((data as Commessa[]) || []);
      setLoading(false);
    }
    load();
    const ch = supabase.channel(`ccp-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commesse" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "lavorazioni_commessa" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId]);

  const stats = useMemo(() => {
    const inProd = commesse.filter(c => c.fase === 'produzione').length;
    const inRitardo = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'produzione').length;
    const sovrac = commesse.filter(c => c.materiali_status === 'parziale').length;
    const bloccati = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'ordine').length;
    return { tempo: inProd - inRitardo, sovrac, ritardo: inRitardo, bloccati };
  }, [commesse]);

  const filtered = useMemo(() => {
    if (filter === 'critiche') return commesse.filter(c => c.materiali_status === 'in_attesa');
    if (filter === 'oggi') return commesse.filter(c => c.fase === 'produzione');
    return commesse;
  }, [commesse, filter]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>CENTRO CONTROLLO</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>Produzione</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
          <Kpi color="rgba(40,160,160,0.22)" border={TEAL} fg="#A7E5E5" label="TEMPO" val={stats.tempo} />
          <Kpi color="rgba(217,119,6,0.22)" border={AMBER} fg="#FBBF24" label="SOVR." val={stats.sovrac} />
          <Kpi color="rgba(220,38,38,0.22)" border={RED} fg="#FCA5A5" label="RIT." val={stats.ritardo} />
          <Kpi color="rgba(255,255,255,0.08)" fg="rgba(255,255,255,0.6)" label="STOP" val={stats.bloccati} />
        </div>
      </div>

      <div style={{ background: '#fff', margin: '-8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative', zIndex: 2 }}>
        <FilterTab active={filter === 'tutte'} onClick={() => setFilter('tutte')}>Tutte {commesse.length}</FilterTab>
        <FilterTab active={filter === 'oggi'} onClick={() => setFilter('oggi')}>In produz. {commesse.filter(c => c.fase === 'produzione').length}</FilterTab>
        <FilterTab active={filter === 'critiche'} onClick={() => setFilter('critiche')}>Critiche {stats.ritardo}</FilterTab>
      </div>

      <div style={{ padding: 14 }}>
        <CaricoMacchinari />
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, margin: '8px 0', fontWeight: 600 }}>COMMESSE</div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Caricamento...</div> :
         filtered.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 12 }}>Nessuna commessa nei filtri</div> :
         filtered.map(c => <CommessaCard key={c.id} cm={c} onClick={() => onApriCommessa?.(c.id)} />)}
      </div>
    </div>
  );
}

function CommessaCard({ cm, onClick }: any) {
  const matCol = cm.materiali_status === 'completo' ? TEAL : cm.materiali_status === 'parziale' ? AMBER : cm.materiali_status === 'in_attesa' ? RED : MUTED;
  const badge = cm.materiali_status === 'completo' ? { bg: '#D1FAE5', fg: '#065F46', l: 'PRONTA' } :
                cm.materiali_status === 'parziale' ? { bg: '#FEF3C7', fg: '#92400E', l: `PARZ ${cm.materiali_perc}%` } :
                cm.materiali_status === 'in_attesa' ? { bg: '#FEE2E2', fg: '#991B1B', l: 'ATTESA MAT' } :
                { bg: '#F1F4F7', fg: MUTED, l: 'NO ORD' };
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `4px solid ${matCol}`, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{cm.code} · {cm.cliente} {cm.cognome || ''}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Fase: {cm.fase} · €{Number(cm.totale_finale || 0).toFixed(0)}</div>
        </div>
        <span style={{ background: badge.bg, color: badge.fg, fontSize: 9, padding: '3px 7px', borderRadius: 5, fontWeight: 600 }}>{badge.l}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED, marginBottom: 4 }}>
        <span>Materiali</span><span style={{ fontWeight: 600 }}>{cm.materiali_perc}%</span>
      </div>
      <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${cm.materiali_perc}%`, height: '100%', background: matCol }}></div>
      </div>
    </div>
  );
}

function CaricoMacchinari() {
  // Placeholder statico per ora (dati reali quando ci sarà macchinari table)
  const macchinari = [
    { name: 'CNC Taglio', perc: 65, color: TEAL },
    { name: 'Foratura', perc: 42, color: TEAL },
    { name: 'Assemblaggio', perc: 78, color: AMBER },
  ];
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>CARICO MACCHINARI OGGI</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {macchinari.map(m => (
          <div key={m.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}><span>{m.name}</span><span style={{ color: m.color, fontWeight: 600 }}>{m.perc}%</span></div>
            <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${m.perc}%`, height: '100%', background: m.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({ color, border, fg, label, val }: any) {
  return (
    <div style={{ background: color, border: border ? `1px solid ${border}` : 'none', padding: '7px 8px', borderRadius: 8 }}>
      <div style={{ fontSize: 8, color: fg, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{val}</div>
    </div>
  );
}

function FilterTab({ active, onClick, children }: any) {
  return <button onClick={onClick} style={{ flex: 1, padding: '8px 0', fontSize: 11, fontWeight: 500, color: active ? '#fff' : MUTED, background: active ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>{children}</button>;
}
