"use client";
// components/CentroControlloProduzione.tsx
// Vista Overview + Kanban
// CommessaCard operativa: tipo infisso, vani, ore, piano, ponteggio, difficolta,
// materiali pronti, produzione pronta, acconto pagato, priorita, warning, rischio ritardo

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AIAssistantDrawer from "./centro/AIAssistantDrawer";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

interface Commessa {
  id: string; code: string; cliente: string; cognome: string | null;
  fase: string; tipo_infisso: string | null; piano_edificio: string | null;
  difficolta_salita: string | null; mezzo_salita: string | null; urgenza: string | null;
  materiali_status: string; materiali_perc: number;
  produzione_iniziata_at: string | null; produzione_completata_at: string | null;
  fattura_acconto_pagata_at: string | null;
  totale_finale: number; n_vani?: number; ore_previste?: number; data_montaggio_prevista?: string | null; squadra_prevista?: string | null;
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
  const [filter, setFilter] = useState<'tutte'|'urgenti'|'ritardo'|'pronte'|'bloccate'>('tutte');
  const [search, setSearch] = useState('');
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const resolved = resolveAziendaId(aziendaId);

  useEffect(() => {
    if (!resolved) { setLoading(false); return; }
    async function load() {
      const { data: cm } = await supabase
        .from("commesse")
        .select("id, code, cliente, cognome, fase, tipo_infisso, piano_edificio, difficolta_salita, mezzo_salita, urgenza, materiali_status, materiali_perc, produzione_iniziata_at, produzione_completata_at, fattura_acconto_pagata_at, totale_finale")
        .eq("azienda_id", resolved)
        .in("fase", ["ordine", "acconto_pagato", "produzione", "montaggio"])
        .order("created_at", { ascending: false });

      const ids = (cm || []).map((c: any) => c.id);
      if (ids.length === 0) { setCommesse([]); setLoading(false); return; }

      const { data: vaniData } = await supabase.from("vani").select("commessa_id").in("commessa_id", ids);
      const vaniMap: Record<string, number> = {};
      (vaniData || []).forEach((v: any) => { vaniMap[v.commessa_id] = (vaniMap[v.commessa_id] || 0) + 1; });

      const { data: montData } = await supabase.from("montaggi").select("commessa_id, ore_preventivate, data_montaggio, squadra").in("commessa_id", ids).order("data_montaggio", { ascending: true });
      const oreMap: Record<string, number> = {};
      const dataMap: Record<string, string> = {};
      const squadraMap: Record<string, string> = {};
      (montData || []).forEach((m: any) => {
        oreMap[m.commessa_id] = (oreMap[m.commessa_id] || 0) + (Number(m.ore_preventivate) || 0);
        if (m.data_montaggio && !dataMap[m.commessa_id]) dataMap[m.commessa_id] = m.data_montaggio;
        if (Array.isArray(m.squadra) && m.squadra.length > 0 && !squadraMap[m.commessa_id]) {
          squadraMap[m.commessa_id] = m.squadra.map((s: any) => s.nome).filter(Boolean).join(', ');
        }
      });

      const enriched = (cm || []).map((c: any) => ({ ...c, n_vani: vaniMap[c.id] || 0, ore_previste: oreMap[c.id] || 0, data_montaggio_prevista: dataMap[c.id] || null, squadra_prevista: squadraMap[c.id] || null }));
      setCommesse(enriched as Commessa[]);
      setLoading(false);
    }
    load();
    const ch = supabase.channel(`ccp-${resolved}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commesse" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [resolved]);

  const filtered = useMemo(() => {
    let arr = commesse;
    if (filter === 'urgenti') arr = arr.filter(c => (c.urgenza || '').toLowerCase() === 'alta');
    else if (filter === 'ritardo') arr = arr.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'produzione');
    else if (filter === 'pronte') arr = arr.filter(c => c.materiali_status === 'completo');
    else if (filter === 'bloccate') arr = arr.filter(c => c.materiali_status === 'in_attesa');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(c => 
        (c.code || '').toLowerCase().includes(q) ||
        (c.cliente || '').toLowerCase().includes(q) ||
        (c.cognome || '').toLowerCase().includes(q) ||
        (c.tipo_infisso || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [commesse, filter, search]);

  const stats = useMemo(() => {
    const inProd = commesse.filter(c => c.fase === 'produzione').length;
    const ritardo = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'produzione').length;
    const sovrac = commesse.filter(c => c.materiali_status === 'parziale').length;
    const stop = commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'ordine').length;
    return { tempo: Math.max(0, inProd - ritardo), sovrac, ritardo, stop };
  }, [commesse]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
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

      <div style={{ background: '#fff', margin: '-8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative' as const, zIndex: 2 }}>
        <button onClick={() => setView('overview')} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, color: view === 'overview' ? '#fff' : MUTED, background: view === 'overview' ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Overview</button>
        <button onClick={() => setView('kanban')} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, color: view === 'kanban' ? '#fff' : MUTED, background: view === 'kanban' ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>Kanban</button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Cerca codice, cliente, tipo infisso..." />

      <FilterBar filter={filter} setFilter={setFilter} counts={{
        tutte: commesse.length,
        urgenti: commesse.filter(c => (c.urgenza || '').toLowerCase() === 'alta').length,
        ritardo: commesse.filter(c => c.materiali_status === 'in_attesa' && c.fase === 'produzione').length,
        pronte: commesse.filter(c => c.materiali_status === 'completo').length,
        bloccate: commesse.filter(c => c.materiali_status === 'in_attesa').length,
      }} />

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'overview' ? <Overview commesse={filtered} onApri={onApriCommessa} /> :
         <Kanban commesse={filtered} onApri={onApriCommessa} />}
      </div>

      {resolved && <AIAssistantDrawer aziendaId={resolved} onApriCommessa={onApriCommessa} />}
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
              <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' as const }}>
                <div style={{ width: `${m.perc}%`, height: '100%', background: m.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, margin: '8px 0', fontWeight: 600 }}>COMMESSE ({commesse.length})</div>
      {commesse.length === 0 ? <Empty label="Nessuna commessa attiva" /> :
       commesse.map((c: Commessa) => <CommessaCardOperativa key={c.id} cm={c} onClick={() => onApri?.(c.id)} />)}
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
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 8 }}>
      {cols.map(col => (
        <div key={col.key} style={{ minWidth: 280, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '0 4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: TEXT }}>{col.title}</div>
            <span style={{ marginLeft: 'auto', background: '#fff', color: col.color, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{col.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {col.items.length === 0 ?
              <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: 20, textAlign: 'center' as const, fontSize: 10, color: MUTED, border: '1px dashed #E5EAF0' }}>Vuoto</div> :
              col.items.map((c: Commessa) => <CommessaCardOperativa key={c.id} cm={c} compact onClick={() => onApri?.(c.id)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function CommessaCardOperativa({ cm, onClick, compact }: any) {
  const matCol = cm.materiali_status === 'completo' ? TEAL : cm.materiali_status === 'parziale' ? AMBER : cm.materiali_status === 'in_attesa' ? RED : MUTED;
  const rischio = computeRischio(cm);

  const matBadge = cm.materiali_status === 'completo' ? { bg: '#D1FAE5', fg: '#065F46', l: 'PRONTA' } :
                cm.materiali_status === 'parziale' ? { bg: '#FEF3C7', fg: '#92400E', l: `PARZ ${cm.materiali_perc}%` } :
                cm.materiali_status === 'in_attesa' ? { bg: '#FEE2E2', fg: '#991B1B', l: 'ATTESA' } :
                { bg: '#F1F4F7', fg: MUTED, l: 'NO ORD' };

  const urg = (cm.urgenza || 'media').toLowerCase();
  const urgenzaCol = urg === 'alta' ? RED : urg === 'bassa' ? MUTED : AMBER;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${matCol}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cm.code} · {cm.cliente} {cm.cognome || ''}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{cm.tipo_infisso || 'No tipo'} · {cm.n_vani || 0} vani · {cm.ore_previste || 0}h</div>
        </div>
        <span style={{ background: matBadge.bg, color: matBadge.fg, fontSize: 9, padding: '4px 8px', borderRadius: 5, fontWeight: 700, whiteSpace: 'nowrap' as const }}>{matBadge.l}</span>
      </div>

      {!compact && (
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 10 }}>
          {cm.piano_edificio && cm.piano_edificio !== '' && <Pill label={`Piano ${cm.piano_edificio}`} bg="#F1F4F7" fg={TEXT} />}
          {cm.mezzo_salita && cm.mezzo_salita !== '' && <Pill label={cm.mezzo_salita} bg="#EFF6FF" fg="#1E40AF" />}
          {cm.difficolta_salita && cm.difficolta_salita !== '' && <Pill label={cm.difficolta_salita} bg="#FFFBEB" fg="#92400E" />}
          <Pill label={`Pr. ${urg}`} bg={urgenzaCol + '22'} fg={urgenzaCol} />
        </div>
      )}

      {cm.data_montaggio_prevista && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#EFF6FF', borderRadius: 6, marginBottom: 10, fontSize: 10 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ color: '#1E40AF', fontWeight: 600 }}>Montaggio:</span>
          <span style={{ color: '#1E40AF', fontWeight: 700 }}>{new Date(cm.data_montaggio_prevista).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
          {cm.squadra_prevista && <span style={{ marginLeft: 'auto', background: '#1E40AF', color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{cm.squadra_prevista}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Check ok={!!cm.fattura_acconto_pagata_at} label="Acconto" />
        <Check ok={cm.materiali_status === 'completo'} partial={cm.materiali_status === 'parziale'} label="Materiali" />
        <Check ok={!!cm.produzione_completata_at} running={!!cm.produzione_iniziata_at && !cm.produzione_completata_at} label="Prod." />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>Avanz. materiali</span>
          <span style={{ color: matCol, fontWeight: 700 }}>{cm.materiali_perc}%</span>
        </div>
        <div style={{ height: 10, background: '#F1F4F7', borderRadius: 5, overflow: 'hidden' as const }}>
          <div style={{ width: `${cm.materiali_perc}%`, height: '100%', background: `linear-gradient(90deg, ${matCol}aa, ${matCol})`, borderRadius: 5 }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: rischio.bg, borderRadius: 6, fontSize: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: rischio.color }} />
          <span style={{ color: rischio.fg, fontWeight: 600 }}>RISCHIO RITARDO</span>
        </div>
        <span style={{ color: rischio.fg, fontWeight: 700 }}>{rischio.label}</span>
      </div>

      {rischio.warning && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF3C7', borderRadius: 6, fontSize: 10, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>
          <span style={{ fontWeight: 600 }}>{rischio.warning}</span>
        </div>
      )}
    </div>
  );
}

function computeRischio(cm: any) {
  if (cm.materiali_status === 'in_attesa' && cm.fase === 'produzione') {
    return { label: 'ALTO', color: RED, bg: '#FEE2E2', fg: '#991B1B', warning: 'Materiali mancanti in produzione' };
  }
  if (cm.materiali_status === 'parziale') {
    return { label: 'MEDIO', color: AMBER, bg: '#FEF3C7', fg: '#92400E', warning: cm.materiali_perc < 50 ? 'Meno del 50% materiali arrivati' : null };
  }
  if (cm.materiali_status === 'in_attesa') {
    return { label: 'MEDIO', color: AMBER, bg: '#FEF3C7', fg: '#92400E', warning: null };
  }
  return { label: 'BASSO', color: TEAL, bg: '#E1F5EE', fg: TEAL_DEEP, warning: null };
}

function Check({ ok, label, partial, running }: any) {
  const col = ok ? TEAL : partial ? AMBER : running ? '#3B82F6' : MUTED;
  const bg = ok ? '#E1F5EE' : partial ? '#FEF3C7' : running ? '#EFF6FF' : '#F1F4F7';
  return (
    <div style={{ flex: 1, background: bg, padding: '5px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={3}>
        {ok ? <polyline points="20 6 9 17 4 12"/> : partial ? <circle cx={12} cy={12} r={10}/> : running ? <circle cx={12} cy={12} r={4} fill={col}/> : <circle cx={12} cy={12} r={10}/>}
      </svg>
      <span style={{ fontSize: 9, color: col, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Pill({ label, bg, fg }: any) {
  return <span style={{ background: bg, color: fg, fontSize: 9, padding: '3px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{label}</span>;
}



function SearchBar({ value, onChange, placeholder }: any) {
  return (
    <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
        <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', outline: 'none',
          fontSize: 12, color: TEXT, background: 'transparent',
        }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>
      )}
    </div>
  );
}

function FilterBar({ filter, setFilter, counts }: any) {
  const filters: { k: 'tutte'|'urgenti'|'ritardo'|'pronte'|'bloccate'; l: string; bg: string; activeBg: string; activeFg: string }[] = [
    { k: 'tutte',    l: 'TUTTE',     bg: '#F1F4F7', activeBg: NAVY,  activeFg: '#fff' },
    { k: 'urgenti',  l: 'URGENTI',   bg: '#FFE4E4', activeBg: RED,   activeFg: '#fff' },
    { k: 'ritardo',  l: 'RITARDO',   bg: '#FEE2E2', activeBg: '#991B1B', activeFg: '#fff' },
    { k: 'pronte',   l: 'PRONTE',    bg: '#D1FAE5', activeBg: TEAL,  activeFg: '#fff' },
    { k: 'bloccate', l: 'BLOCCATE',  bg: '#FEF3C7', activeBg: AMBER, activeFg: '#fff' },
  ];
  return (
    <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const }}>
      {filters.map(f => {
        const isActive = filter === f.k;
        const n = counts[f.k] || 0;
        return (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            background: isActive ? f.activeBg : f.bg,
            color: isActive ? f.activeFg : TEXT,
            border: 'none', borderRadius: 8, padding: '8px 12px',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap' as const, flexShrink: 0,
          }}>
            {f.l}
            <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: isActive ? '#fff' : TEXT, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{n}</span>
          </button>
        );
      })}
    </div>
  );
}

function Empty({ label }: any) { return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>{label}</div>; }
function Kpi({ color, border, fg, label, val }: any) {
  return <div style={{ background: color, border: border ? `1px solid ${border}` : 'none', padding: '7px 8px', borderRadius: 8 }}>
    <div style={{ fontSize: 8, color: fg, fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 17, fontWeight: 600, color: '#fff' }}>{val}</div>
  </div>;
}
