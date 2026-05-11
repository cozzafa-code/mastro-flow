"use client";
// components/CentroPreparazioneFurgoni.tsx
// BLOCCO 6 - Lista carichi giornalieri + dettaglio FURGONE-GIORNO

import React, { useState } from "react";
import { useFurgoni, useCarico, toggleVerificato, toggleCaricato, type Carico, type CaricoArticolo } from "../hooks/useFurgoni";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const CAT_ICON: Record<string, string> = {
  telai: '🔧', ante: '🚪', vetri: '🪟', ferramenta: '⚙️',
  accessori: '📎', motori: '⚡', kit_posa: '📦',
};

const STATO_CARICO: Record<string, { col: string; bg: string; label: string; icon: string }> = {
  da_preparare:     { col: MUTED,     bg: '#F1F4F7', label: 'DA PREPARARE',  icon: '📋' },
  in_preparazione:  { col: AMBER,     bg: '#FEF3C7', label: 'IN PREPARAZIONE', icon: '⚙️' },
  caricato:         { col: TEAL,      bg: '#E1F5EE', label: 'CARICATO',      icon: '✓' },
  partito:          { col: BLUE,      bg: '#DBEAFE', label: 'PARTITO',       icon: '🚚' },
  completato:       { col: TEAL_DEEP, bg: '#D1FAE5', label: 'COMPLETATO',    icon: '✅' },
};

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

export default function CentroPreparazioneFurgoni({ aziendaId, onClose, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const { carichi, loading } = useFurgoni(resolved);
  const [caricoAperto, setCaricoAperto] = useState<string | null>(null);

  // Raggruppa carichi per giorno
  const carichiPerGiorno: Record<string, Carico[]> = {};
  carichi.forEach(c => {
    if (!carichiPerGiorno[c.data_carico]) carichiPerGiorno[c.data_carico] = [];
    carichiPerGiorno[c.data_carico].push(c);
  });

  const giorni = Object.keys(carichiPerGiorno).sort();

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>PREPARAZIONE</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>🚚 Furgoni & Carichi</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <KpiHero icon="🚚" label="CARICHI" val={carichi.length} color={TEAL} />
          <KpiHero icon="📦" label="ARTICOLI" val={carichi.reduce((s, c) => s + (c.articoli_count || 0), 0)} color={AMBER} />
          <KpiHero icon="✓" label="PRONTI" val={carichi.filter(c => c.stato === 'caricato' || c.stato === 'partito').length} color={GREEN} />
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         giorni.length === 0 ? <Empty label="Nessun carico pianificato" /> :
         giorni.map(g => (
           <div key={g}>
             <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, margin: '12px 4px 8px', fontWeight: 700 }}>
               {formatGiorno(g)} · {carichiPerGiorno[g].length} carich{carichiPerGiorno[g].length === 1 ? 'o' : 'i'}
             </div>
             {carichiPerGiorno[g].map(c => (
               <CardCarico key={c.id} c={c} onClick={() => setCaricoAperto(c.id)} />
             ))}
           </div>
         ))}
      </div>

      {caricoAperto && (
        <DettaglioCarico
          caricoId={caricoAperto}
          onClose={() => setCaricoAperto(null)}
          onApriCommessa={onApriCommessa}
        />
      )}
    </div>
  );
}

// =============== CARD CARICO (lista) ===============
function CardCarico({ c, onClick }: { c: Carico; onClick: () => void }) {
  const stMeta = STATO_CARICO[c.stato] || STATO_CARICO.da_preparare;
  const sqCol = c.squadra_colore || NAVY;
  const totArt = c.articoli_count || 0;
  const verArt = c.articoli_verificati || 0;
  const carArt = c.articoli_caricati || 0;
  const percVer = totArt > 0 ? Math.round((verArt / totArt) * 100) : 0;
  const percCar = totArt > 0 ? Math.round((carArt / totArt) * 100) : 0;
  const saturazione = Number(c.saturazione_peso_pct) || 0;
  const overload = saturazione > 100;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${sqCol}`, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: sqCol + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🚚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginBottom: 3 }}>
            <span style={{ background: sqCol, color: '#fff', padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 800 }}>
              {c.furgone_nome || '?'}
            </span>
            {c.squadra_nome && <span style={{ background: '#F1F4F7', color: TEXT, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Sq. {c.squadra_nome}</span>}
            {overload && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>⚠ OVERLOAD</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{c.furgone_targa}</div>
          {c.autista && <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Autista: {c.autista}</div>}
        </div>
        <span style={{ background: stMeta.bg, color: stMeta.col, padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{stMeta.icon}</span>{stMeta.label}
        </span>
      </div>

      {/* Stats inline */}
      <div style={{ background: '#F8FAFA', padding: '8px 10px', borderRadius: 7, display: 'flex', gap: 12, fontSize: 10, marginBottom: 8 }}>
        <div>📦 <strong>{totArt}</strong> articoli</div>
        <div>⚖️ <strong style={{ color: overload ? RED : TEXT }}>{c.peso_totale_kg || 0} kg</strong></div>
        <div style={{ marginLeft: 'auto' }}>🛣️ {c.percorso_montaggi?.length || 0} stop</div>
      </div>

      {/* Barra saturazione peso */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: MUTED, marginBottom: 3 }}>
          <span style={{ fontWeight: 700 }}>Saturazione peso</span>
          <span style={{ color: overload ? RED : saturazione > 80 ? AMBER : TEAL, fontWeight: 800 }}>{saturazione}%</span>
        </div>
        <div style={{ height: 7, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' as const }}>
          <div style={{ width: `${Math.min(100, saturazione)}%`, height: '100%', background: overload ? RED : saturazione > 80 ? AMBER : TEAL }} />
        </div>
      </div>

      {/* Avanzamento check */}
      {totArt > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: '#F1F4F7', padding: '6px 8px', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>VERIFICATI</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: percVer === 100 ? TEAL_DEEP : TEXT }}>{verArt}/{totArt} · {percVer}%</div>
          </div>
          <div style={{ background: '#F1F4F7', padding: '6px 8px', borderRadius: 6 }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>CARICATI</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: percCar === 100 ? TEAL_DEEP : TEXT }}>{carArt}/{totArt} · {percCar}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============== DETTAGLIO FURGONE-GIORNO ===============
function DettaglioCarico({ caricoId, onClose, onApriCommessa }: any) {
  const { carico, articoli, loading } = useCarico(caricoId);
  const [tab, setTab] = useState<'percorso' | 'carico' | 'squadra'>('carico');

  if (loading || !carico) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff', fontSize: 14 }}>Caricamento...</div>
      </div>
    );
  }

  const totArt = articoli.length;
  const verArt = articoli.filter(a => a.verificato).length;
  const carArt = articoli.filter(a => a.caricato).length;

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9900, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>🚚 {(carico as any).furgone_nome}</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{formatGiorno(carico.data_carico).toUpperCase()}</div>
          </div>
        </div>

        {/* Stats hero */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <KpiHero icon="📦" label="ARTICOLI" val={totArt} color={TEAL} />
          <KpiHero icon="✓" label="VERIFICATI" val={`${verArt}/${totArt}`} color={GREEN} small />
          <KpiHero icon="🚛" label="CARICATI" val={`${carArt}/${totArt}`} color={AMBER} small />
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2 }}>
        <TabBtn active={tab === 'percorso'} onClick={() => setTab('percorso')} label="🛣️ Percorso" badge={carico.percorso_montaggi?.length || 0} />
        <TabBtn active={tab === 'carico'} onClick={() => setTab('carico')} label="📦 Carico" badge={totArt} />
        <TabBtn active={tab === 'squadra'} onClick={() => setTab('squadra')} label="👥 Squadra" />
      </div>

      <div style={{ padding: 14 }}>
        {tab === 'percorso' && <ViewPercorso carico={carico} onApriCommessa={onApriCommessa} />}
        {tab === 'carico' && <ViewCarico articoli={articoli} carico={carico} />}
        {tab === 'squadra' && <ViewSquadra carico={carico} articoli={articoli} />}
      </div>
    </div>
  );
}

// =============== TAB PERCORSO ===============
function ViewPercorso({ carico, onApriCommessa }: any) {
  const stops = (carico.percorso_montaggi || []) as any[];
  if (stops.length === 0) return <Empty label="Nessun montaggio nel percorso" />;
  return (
    <>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>PERCORSO MONTAGGI DEL GIORNO</div>
      {stops.map((s: any, i: number) => (
        <div key={i} onClick={() => onApriCommessa?.(s.commessa)} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: TEAL_DEEP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
            {s.ordine || (i + 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ background: '#F1F4F7', color: TEXT, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{s.commessa}</span>
              {s.ora && <span style={{ background: BLUE, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>⏰ {s.ora}</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{s.cliente}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
              {s.indirizzo}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// =============== TAB CARICO - PULSANTI ENORMI ===============
function ViewCarico({ articoli, carico }: any) {
  if (articoli.length === 0) return <Empty label="Nessun articolo nel carico" />;
  
  // Raggruppa per commessa
  const byComm: Record<string, CaricoArticolo[]> = {};
  articoli.forEach((a: CaricoArticolo) => {
    const k = a.commessa_code || 'no-commessa';
    if (!byComm[k]) byComm[k] = [];
    byComm[k].push(a);
  });

  return (
    <>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>MATERIALE DA CARICARE</div>
      {Object.entries(byComm).map(([code, items]) => {
        const verCount = items.filter(a => a.verificato).length;
        const carCount = items.filter(a => a.caricato).length;
        const cliente = items[0]?.commessa_cliente || '';
        return (
          <div key={code} style={{ marginBottom: 14 }}>
            {/* Header commessa */}
            <div style={{ background: NAVY, color: '#fff', padding: '10px 12px', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 800 }}>{code}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{cliente}</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>✓ {verCount}/{items.length}</span>
              <span style={{ fontSize: 10, opacity: 0.85 }}>🚛 {carCount}/{items.length}</span>
            </div>
            {/* Articoli */}
            {items.map(a => <RigaCarico key={a.id} a={a} />)}
          </div>
        );
      })}
    </>
  );
}

// RIGA CARICO con PULSANTI ENORMI 60px touch target
function RigaCarico({ a }: { a: CaricoArticolo }) {
  const icon = CAT_ICON[a.categoria] || '📦';
  return (
    <div style={{ background: '#fff', padding: 12, borderBottom: '1px solid #F1F4F7' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{a.articolo_descrizione}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: TEXT }}>{a.quantita} pz</span>
            {a.peso_kg && <span style={{ fontSize: 10, color: MUTED }}>· {a.peso_kg} kg</span>}
            {a.scaffale_origine && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>📍 {a.scaffale_origine}</span>}
          </div>
          {a.qr_code && <div style={{ fontSize: 9, color: MUTED, marginTop: 3, fontFamily: 'monospace' as const }}>{a.qr_code}</div>}
        </div>
      </div>

      {/* PULSANTI ENORMI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 50px', gap: 6 }}>
        <BigBtn
          checked={a.verificato}
          onClick={() => toggleVerificato(a.id, !a.verificato)}
          label="VERIFICATO"
          icon="✓"
          colorOk={GREEN}
        />
        <BigBtn
          checked={a.caricato}
          onClick={() => toggleCaricato(a.id, !a.caricato)}
          label="CARICATO"
          icon="🚛"
          colorOk={TEAL_DEEP}
        />
        <BigBtn
          checked={!!a.foto_url}
          onClick={() => alert('Apri camera foto (TODO)')}
          icon="📸"
          colorOk={BLUE}
          square
        />
      </div>
      {a.verificato_at && (
        <div style={{ marginTop: 6, fontSize: 9, color: MUTED, textAlign: 'right' as const }}>
          Verificato {new Date(a.verificato_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
}

// PULSANTE ENORME 60px touch
function BigBtn({ checked, onClick, label, icon, colorOk, square }: any) {
  return (
    <button onClick={onClick} style={{
      minHeight: 60,
      background: checked ? colorOk : '#fff',
      color: checked ? '#fff' : colorOk,
      border: `2px solid ${colorOk}`,
      borderRadius: 10,
      fontSize: 10, fontWeight: 800,
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      padding: square ? 0 : '8px 4px',
      transition: 'all 0.15s',
    }}>
      <span style={{ fontSize: square ? 24 : 22 }}>{icon}</span>
      {label && <span style={{ letterSpacing: 0.5 }}>{label}</span>}
    </button>
  );
}

// =============== TAB SQUADRA ===============
function ViewSquadra({ carico, articoli }: any) {
  const totWeight = articoli.reduce((s: number, a: CaricoArticolo) => s + (Number(a.peso_kg) || 0) * Number(a.quantita), 0);
  const capacita = (carico as any).furgone_capacita_kg || 1500;
  const satPct = Math.round((totWeight / capacita) * 100);
  const overload = satPct > 100;
  const sqCol = carico.squadra_colore || NAVY;

  const warnings: string[] = [];
  if (overload) warnings.push(`Sovrappeso: ${totWeight}kg > ${capacita}kg`);
  if (satPct > 90) warnings.push(`Saturazione critica ${satPct}%`);
  const nonVerificati = articoli.filter((a: CaricoArticolo) => !a.verificato).length;
  if (nonVerificati > 0) warnings.push(`${nonVerificati} articoli non ancora verificati`);

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${sqCol}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: sqCol, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
            {(carico.squadra_nome || '?').slice(0, 3).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 700 }}>SQUADRA</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{carico.squadra_nome || 'Non assegnata'}</div>
            {carico.autista && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Autista: <strong>{carico.autista}</strong></div>}
          </div>
        </div>
      </div>

      {/* Capacità */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>CAPACITÀ FURGONE</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{ background: '#F8FAFA', padding: '10px 8px', borderRadius: 8, textAlign: 'center' as const }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700 }}>PESO ATTUALE</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: overload ? RED : TEXT, marginTop: 4 }}>{totWeight} kg</div>
            <div style={{ fontSize: 9, color: MUTED }}>su {capacita} kg max</div>
          </div>
          <div style={{ background: '#F8FAFA', padding: '10px 8px', borderRadius: 8, textAlign: 'center' as const }}>
            <div style={{ fontSize: 9, color: MUTED, fontWeight: 700 }}>SATURAZIONE</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: overload ? RED : satPct > 80 ? AMBER : TEAL, marginTop: 4 }}>{satPct}%</div>
            <div style={{ fontSize: 9, color: MUTED }}>{overload ? '⚠ Sovraccarico' : satPct > 80 ? 'Pieno' : 'OK'}</div>
          </div>
        </div>
        <div style={{ height: 12, background: '#F1F4F7', borderRadius: 6, overflow: 'hidden' as const }}>
          <div style={{ width: `${Math.min(100, satPct)}%`, height: '100%', background: overload ? RED : satPct > 80 ? AMBER : TEAL, borderRadius: 6 }} />
        </div>
      </div>

      {/* Warning */}
      {warnings.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, border: `2px solid ${AMBER}` }}>
          <div style={{ fontSize: 10, color: AMBER, letterSpacing: 1, marginBottom: 8, fontWeight: 800 }}>⚠ AVVERTIMENTI</div>
          {warnings.map((w, i) => (
            <div key={i} style={{ background: '#FEF3C7', borderLeft: `3px solid ${AMBER}`, padding: '7px 10px', borderRadius: 6, marginBottom: 5, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
              {w}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// =============== HELPERS ===============
function formatGiorno(d: string): string {
  const dt = new Date(d);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (dt.toDateString() === today.toDateString()) return 'OGGI';
  if (dt.toDateString() === tomorrow.toDateString()) return 'DOMANI';
  return dt.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' });
}

function KpiHero({ icon, label, val, color, small }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}55`, padding: '8px 6px', borderRadius: 10, textAlign: 'center' as const }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: small ? 14 : 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7, color: color, fontWeight: 700, letterSpacing: 0.6, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label, badge }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600,
      color: active ? '#fff' : MUTED, background: active ? NAVY : 'transparent',
      border: 'none', borderRadius: 7, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#F1F4F7', color: active ? '#fff' : TEXT, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{badge}</span>
      )}
    </button>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
