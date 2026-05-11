"use client";
// components/CentroControlloOrdini.tsx
// BLOCCO 2 - Header Hero + 5 KPI giganti + 3 Alert giganti + tab switcher

import React, { useState, useMemo } from "react";
import { useOrdini, type OrdineRow } from "../hooks/useOrdini";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

type ViewMode = 'kanban' | 'lista' | 'alert';

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

export default function CentroControlloOrdini({ aziendaId, onClose, onApriOrdine, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const [view, setView] = useState<ViewMode>('alert');
  const { ordini, stats, loading } = useOrdini(resolved);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER HERO con 5 KPI GIGANTI */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CENTRO CONTROLLO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Ordini & Catena Operativa</div>
          </div>
        </div>

        {/* 5 KPI HERO - giganti */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          <KpiHero icon="🔴" label="BLOCCANTI" val={stats.bloccanti} color={RED} />
          <KpiHero icon="🟠" label="IN RITARDO" val={stats.in_ritardo} color={AMBER} />
          <KpiHero icon="🟢" label="ARRIVI OGGI" val={stats.arrivi_oggi} color={TEAL} />
          <KpiHero icon="🔴" label="CM. FERME" val={stats.commesse_ferme} color={RED} />
          <KpiHero icon="💶" label="ATTIVI" val={`€${(stats.totale_euro_attivi / 1000).toFixed(1)}k`} color={GREEN} small />
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ background: '#fff', margin: '-12px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative' as const, zIndex: 2 }}>
        <TabBtn active={view === 'alert'} onClick={() => setView('alert')} label="🚨 Alert" badge={stats.bloccanti + stats.in_ritardo} />
        <TabBtn active={view === 'kanban'} onClick={() => setView('kanban')} label="Kanban" badge={ordini.length} />
        <TabBtn active={view === 'lista'} onClick={() => setView('lista')} label="Lista" badge={ordini.length} />
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'alert' ? <ViewAlert ordini={ordini} onApriOrdine={onApriOrdine} onApriCommessa={onApriCommessa} /> :
         view === 'kanban' ? <Placeholder label="Kanban — in costruzione (Blocco 3)" /> :
         <Placeholder label="Lista — in costruzione (Blocco 3)" />}
      </div>
    </div>
  );
}

// =============== VIEW ALERT - 3 card giganti operative ===============
function ViewAlert({ ordini, onApriOrdine, onApriCommessa }: any) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Alert 1: MONTAGGIO BLOCCATO - ordini bloccanti non arrivati
  const bloccantiAttivi = ordini.filter((o: OrdineRow) => 
    o.bloccante && !['arrivato', 'verificato', 'completato'].includes(o.stato)
  );

  // Alert 2: FORNITORE IN RITARDO
  const ritardiPerFornitore: Record<string, OrdineRow[]> = {};
  ordini.forEach((o: OrdineRow) => {
    if (o.consegna_prevista && o.consegna_prevista < today &&
        !['arrivato', 'verificato', 'completato'].includes(o.stato)) {
      if (!ritardiPerFornitore[o.fornitore]) ritardiPerFornitore[o.fornitore] = [];
      ritardiPerFornitore[o.fornitore].push(o);
    }
  });

  // Alert 3: ORDINI ERRORE
  const ordiniErrore = ordini.filter((o: OrdineRow) => o.stato === 'errore');

  // Arrivi previsti oggi
  const arriviOggi = ordini.filter((o: OrdineRow) => o.consegna_prevista === today);

  const hasAnyAlert = bloccantiAttivi.length + Object.keys(ritardiPerFornitore).length + ordiniErrore.length > 0;

  if (!hasAnyAlert && arriviOggi.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEAL_DEEP, marginBottom: 4 }}>Tutto sotto controllo</div>
        <div style={{ fontSize: 12, color: MUTED }}>Nessun ordine bloccante, ritardo o errore</div>
      </div>
    );
  }

  return (
    <>
      {/* BLOCCANTI */}
      {bloccantiAttivi.map((o: OrdineRow) => (
        <CardAlertGiant
          key={o.id}
          icon="🔴"
          severity="block"
          title="MONTAGGIO BLOCCATO"
          subtitle={`Mancano ${o.categoria_materiale || 'materiali'} commessa ${o.commessa_code || ''}`}
          ordine={o}
          onClick={() => onApriOrdine?.(o.id)}
          onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined}
        />
      ))}

      {/* FORNITORE IN RITARDO */}
      {Object.entries(ritardiPerFornitore).map(([forn, ords]) => {
        const giorniRitardo = Math.max(...ords.map(o => 
          Math.floor((new Date(today).getTime() - new Date(o.consegna_prevista!).getTime()) / (1000*60*60*24))
        ));
        return (
          <CardAlertGiant
            key={forn}
            icon="🟠"
            severity="warn"
            title="FORNITORE IN RITARDO"
            subtitle={`${forn} ETA +${giorniRitardo} giorni · ${ords.length} ordine${ords.length>1?'i':''}`}
            ordine={ords[0]}
            onClick={() => onApriOrdine?.(ords[0].id)}
          />
        );
      })}

      {/* ERRORI */}
      {ordiniErrore.map((o: OrdineRow) => (
        <CardAlertGiant
          key={o.id}
          icon="🔴"
          severity="block"
          title="ORDINE IN ERRORE"
          subtitle={o.errore_descrizione || `${o.numero} richiede verifica`}
          ordine={o}
          onClick={() => onApriOrdine?.(o.id)}
          onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined}
        />
      ))}

      {/* ARRIVI OGGI - banner positivo */}
      {arriviOggi.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, ' + TEAL + '15, ' + TEAL + '08)', border: `2px solid ${TEAL}`, borderRadius: 12, padding: 14, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: TEAL_DEEP }}>ARRIVI PREVISTI OGGI</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginTop: 2 }}>{arriviOggi.length} consegne in giornata</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {arriviOggi.map((o: OrdineRow) => (
              <div key={o.id} onClick={() => onApriOrdine?.(o.id)} style={{ background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: 7, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ background: TEAL_DEEP, color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: 9 }}>{o.numero}</span>
                <span style={{ flex: 1, color: TEXT, fontWeight: 600 }}>{o.fornitore}</span>
                <span style={{ color: MUTED, fontWeight: 600 }}>€{Number(o.totale_euro || o.totale_stimato).toLocaleString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// =============== CARD ALERT GIGANTE ===============
function CardAlertGiant({ icon, severity, title, subtitle, ordine, onClick, onOpenCm }: any) {
  const col = severity === 'block' ? RED : severity === 'warn' ? AMBER : TEAL;
  const bg = severity === 'block' ? '#FEE2E2' : severity === 'warn' ? '#FEF3C7' : '#E1F5EE';
  const fg = severity === 'block' ? '#991B1B' : severity === 'warn' ? '#92400E' : TEAL_DEEP;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeft: `6px solid ${col}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.3, color: fg, fontWeight: 800, marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 14, color: TEXT, fontWeight: 700, lineHeight: 1.3 }}>{subtitle}</div>
        </div>
      </div>

      {/* Riga dati ordine */}
      <div style={{ background: '#F8FAFA', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ background: col, color: '#fff', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{ordine.numero}</span>
        <span style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{ordine.fornitore}</span>
        {ordine.commessa_code && (
          <span style={{ background: '#fff', color: TEXT, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, border: '1px solid #E5EAF0' }}>{ordine.commessa_code} · {ordine.commessa_cliente}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: TEXT, fontWeight: 700 }}>€{Number(ordine.totale_euro || ordine.totale_stimato).toLocaleString('it-IT')}</span>
      </div>

      {/* Bottoni azioni */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{ flex: 1, padding: '9px 0', background: col, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Apri ordine →
        </button>
        {onOpenCm && (
          <button onClick={(e) => { e.stopPropagation(); onOpenCm(); }} style={{ flex: 1, padding: '9px 0', background: '#fff', color: col, border: `2px solid ${col}`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Apri commessa
          </button>
        )}
      </div>
    </div>
  );
}

// =============== HELPERS ===============
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

function Placeholder({ label }: any) {
  return <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
