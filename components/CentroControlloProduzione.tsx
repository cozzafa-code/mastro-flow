"use client";
// components/CentroControlloProduzione.tsx
// Mockup approvato - 2 viste: OVERVIEW + KANBAN

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

interface Commessa {
  id: string; code: string; cliente: string; cognome: string | null;
  fase: string; materiali_status: string; materiali_perc: number;
  produzione_iniziata_at: string | null; produzione_completata_at: string | null;
  totale_finale: number; total_vani?: number;
}

type ViewMode = 'overview' | 'kanban';

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

export default function CentroControlloProduzione({ aziendaId, onClose, onApriCommessa }: any) {
  const [view, setView] = useState<ViewMode>('overview');
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const resolved = resolveAziendaId(aziendaId);

  useEffect(() => {
    if (!resolved) { setLoading(false); return; }
    async function load() {
      const { data } = await supabase
        .from("commesse")
        .select("id, code, cliente, cognome, fase, materiali_status, materiali_perc, produzione_iniziata_at, produzione_completata_at, totale_finale, total_vani")
        .eq("azienda_id", resolved)
        .in("fase", ["ordine", "acconto_pagato", "produzione", "montaggio"])
        .order("created_at", { ascending: false });
      setCommesse((data as any) || []);
      setLoading(false);
    }
    load();
    const ch = supabase.channel(`ccp-${resolved}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commesse" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [resolved]);

  const stats = useMemo(() => {
    const inProd = commesse.filter(c => c.fase === 'produzione').length;
    const ritardo = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'produzione').length;
    const sovrac = commesse.filter(c => c.materiali_status === 'parziale').length;
    const stop = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'ordine').length;
    return { tempo: Math.max(0, inProd - ritardo), sovrac, ritardo, stop };
  }, [commesse]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
          <Kpi color="rgba(255,255,255,0.08)" fg="rgba(255,255,255,0.6)" label="STOP" val={stats.stop} />
        </div>
      </div>

      <div style={{ background: '#fff', margin: '-8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative', zIndex: 2 }}>
        <button onClick={() => setView('overview')} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, color: view === 'overview' ? '#fff' : MUTED, background: view === 'overview' ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Overview</button>
        <button onClick={() => setView('kanban')} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, color: view === 'kanban' ? '#fff' : MUTED, background: view === 'kanban' ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Kanban</button>
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'overview' ? <Overview commesse={commesse} onApri={onApriCommessa} /> :
         <Kanban commesse={commesse} onApri={onApriCommessa} />}
      </div>
    </div>
  );
}

function Overview({ commesse, onApri }: any) {
  const macchinari = [
    { name: 'CNC Taglio', perc: 65, color: TEAL },
    { name: 'Foratura', perc: 42, color: TEAL },
    { name: 'Assemblaggio', perc: 78, color: AMBER },
  ];
  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>CARICO MACCHINARI OGGI</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {macchinari.map(m => (
            <div key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span>{m.name}</span><span style={{ color: m.color, fontWeight: 600 }}>{m.perc}%</span>
              </div>
              <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${m.perc}%`, height: '100%', background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, margin: '8px 0', fontWeight: 600 }}>COMMESSE ({commesse.length})</div>
      {commesse.length === 0 ? <Empty label="Nessuna commessa attiva" /> :
       commesse.map((c: Commessa) => <CommessaCard key={c.id} cm={c} onClick={() => onApri?.(c.id)} />)}
    </>
  );
}

function Kanban({ commesse, onApri }: any) {
  const cols = [
    { key: 'da-avviare', title: 'DA AVVIARE', color: MUTED, items: commesse.filter((c: Commessa) => c.fase === 'ordine' && c.materiali_status === 'completo') },
    { key: 'in-prod', title: 'IN PRODUZIONE', color: TEAL, items: commesse.filter((c: Commessa) => c.fase === 'produzione' && c.materiali_status !== 'in_attesa') },
    { key: 'pronto', title: 'PRONTO MONTAGGIO', color: TEAL_DEEP, items: commesse.filter((c: Commessa) => c.fase === 'montaggio') },
    { key: 'bloccato', title: 'BLOCCATO', color: RED, items: commesse.filter((c: Commessa) => c.materiali_status === 'in_attesa') },
  ];
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 8, scrollSnapType: 'x mandatory' as any }}>
      {cols.map(col => (
        <div key={col.key} style={{ minWidth: 260, scrollSnapAlign: 'start' as any }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '0 4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: TEXT }}>{col.title}</div>
            <span style={{ marginLeft: 'auto', background: '#fff', color: col.color, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{col.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.items.length === 0 ?
              <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: 20, textAlign: 'center' as const, fontSize: 10, color: MUTED, border: '1px dashed #E5EAF0' }}>Vuoto</div> :
              col.items.map((c: Commessa) => (
                <div key={c.id} onClick={() => onApri?.(c.id)} style={{ background: '#fff', borderRadius: 10, padding: 10, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{c.code}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>{c.cliente} {c.cognome || ''}</div>
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>{c.total_vani || 0} vani · €{Number(c.totale_finale || 0).toFixed(0)}</div>
                  <MatBar status={c.materiali_status} perc={c.materiali_perc} />
                </div>
              ))}
          </div>
        </div>
      ))}
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
      <MatBar status={cm.materiali_status} perc={cm.materiali_perc} />
    </div>
  );
}

function MatBar({ status, perc }: { status: string; perc: number }) {
  const col = status === 'completo' ? TEAL : status === 'parziale' ? AMBER : status === 'in_attesa' ? RED : MUTED;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED, marginBottom: 3 }}>
        <span>Materiali</span><span style={{ fontWeight: 600 }}>{perc}%</span>
      </div>
      <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${perc}%`, height: '100%', background: col }} />
      </div>
    </>
  );
}

function Empty({ label }: any) { return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>{label}</div>; }
function Kpi({ color, border, fg, label, val }: any) {
  return <div style={{ background: color, border: border ? `1px solid ${border}` : 'none', padding: '7px 8px', borderRadius: 8 }}>
    <div style={{ fontSize: 8, color: fg, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{val}</div>
  </div>;
}
