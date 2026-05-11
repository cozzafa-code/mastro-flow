"use client";
// components/centro/TabPagamenti.tsx - Storico fatture + KPI + scadenze

import React from "react";
import { usePagamentiCliente, type FatturaCliente } from "../../hooks/useDossierExtra";
import { IcoEuro, IcoCheck, IcoAlertTriangle, IcoCalendar, IcoFile } from "../IconLib";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Props {
  clienteId: string;
  onApriCommessa?: (cmId: string) => void;
}

export default function TabPagamenti({ clienteId, onApriCommessa }: Props) {
  const { fatture, stats, loading } = usePagamentiCliente(clienteId);

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>;

  // Affidabilità interpretation
  const affCol = stats.affidabilita_calcolata >= 85 ? TEAL_DEEP : 
                  stats.affidabilita_calcolata >= 60 ? AMBER : RED;
  const affLabel = stats.affidabilita_calcolata >= 85 ? 'AFFIDABILE' :
                    stats.affidabilita_calcolata >= 60 ? 'LENTO' : 'PROBLEMATICO';

  const today = new Date();
  const fattureScadenza = fatture.filter(f => !f.pagata && f.data_scadenza).sort((a, b) => {
    const da = new Date(a.data_scadenza!).getTime();
    const db = new Date(b.data_scadenza!).getTime();
    return da - db;
  });
  const scadenzeImminenti = fattureScadenza.filter(f => {
    if (!f.data_scadenza) return false;
    const giorni = Math.floor((new Date(f.data_scadenza).getTime() - today.getTime()) / 86400000);
    return giorni >= -3 && giorni <= 14;
  });

  return (
    <div>
      {/* HERO AFFIDABILITÀ */}
      <div style={{ background: `linear-gradient(135deg, ${affCol}, ${affCol}cc)`, color: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.4)' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>INDICATORE AFFIDABILITÀ</div>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{stats.affidabilita_calcolata}%</div>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 700, marginTop: 2 }}>{affLabel}</div>
          </div>
          {stats.giorni_ritardo_medio > 0 && (
            <div style={{ textAlign: 'right' as const, background: 'rgba(255,255,255,0.18)', padding: '8px 10px', borderRadius: 8 }}>
              <div style={{ fontSize: 9, opacity: 0.9, fontWeight: 700 }}>RITARDO MEDIO</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>+{stats.giorni_ritardo_medio}g</div>
            </div>
          )}
        </div>
      </div>

      {/* 3 KPI */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <KpiBox Ico={IcoEuro} label="FATTURATO" val={`€${Math.round(stats.totale_fatturato).toLocaleString('it-IT')}`} col={NAVY} />
        <KpiBox Ico={IcoCheck} label="PAGATO" val={`€${Math.round(stats.totale_pagato).toLocaleString('it-IT')}`} col={TEAL_DEEP} />
        <KpiBox Ico={IcoAlertTriangle} label="APERTO" val={`€${Math.round(stats.saldo_aperto).toLocaleString('it-IT')}`} col={stats.saldo_aperto > 0 ? AMBER : MUTED} />
      </div>

      {/* SCADENZE IMMINENTI */}
      {scadenzeImminenti.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, ' + AMBER + '15, ' + AMBER + '05)', border: `2px solid ${AMBER}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#92400E', letterSpacing: 1, marginBottom: 8, fontWeight: 800 }}>SCADENZE IMMINENTI</div>
          {scadenzeImminenti.map(f => {
            const giorni = Math.floor((new Date(f.data_scadenza!).getTime() - today.getTime()) / 86400000);
            const inRitardo = giorni < 0;
            return (
              <div key={f.id} style={{ background: '#fff', padding: '8px 10px', borderRadius: 7, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: NAVY, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 800 }}>{f.numero}</span>
                {f.commessa_code && <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{f.commessa_code}</span>}
                <span style={{ flex: 1, fontSize: 11, color: TEXT, fontWeight: 700 }}>€{f.totale.toFixed(2)}</span>
                <span style={{ fontSize: 10, color: inRitardo ? RED : AMBER, fontWeight: 800 }}>
                  {inRitardo ? `+${Math.abs(giorni)}g RITARDO` : giorni === 0 ? 'OGGI' : `tra ${giorni}g`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* STORICO FATTURE */}
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
        STORICO FATTURE · {fatture.length} totali · {stats.num_pagate} pagate
      </div>
      {fatture.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>
          Nessuna fattura emessa
        </div>
      ) : fatture.map(f => <CardFattura key={f.id} f={f} onApriCommessa={onApriCommessa} />)}
    </div>
  );
}

function CardFattura({ f, onApriCommessa }: { f: FatturaCliente; onApriCommessa?: any }) {
  const oggi = new Date();
  const isScad = f.data_scadenza ? new Date(f.data_scadenza) < oggi : false;
  const stato = f.pagata ? 'PAGATA' : isScad && !f.pagata ? 'IN RITARDO' : 'DA PAGARE';
  const col = f.pagata ? TEAL_DEEP : isScad ? RED : AMBER;
  const bg = f.pagata ? '#D1FAE5' : isScad ? '#FEE2E2' : '#FEF3C7';

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, borderLeft: `4px solid ${col}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          <><FattIco pagata={f.pagata} scad={isScad} col={col} /></>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ background: NAVY, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 10, fontWeight: 800 }}>{f.numero}</span>
            {f.commessa_code && (
              <button onClick={(e) => { e.stopPropagation(); onApriCommessa?.(f.id); }} style={{ background: '#F1F4F7', color: TEXT, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                {f.commessa_code}
              </button>
            )}
            <span style={{ background: bg, color: col, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{stato}</span>
          </div>
          <div style={{ fontSize: 10, color: MUTED, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            <span>Emessa {new Date(f.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
            {f.data_scadenza && <span>· Scad. {new Date(f.data_scadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
            {f.pagata && f.pagata_at && (
              <span style={{ color: f.giorni_ritardo > 0 ? AMBER : TEAL_DEEP, fontWeight: 700 }}>
                · Pagata {new Date(f.pagata_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                {f.giorni_ritardo > 0 && ` (+${f.giorni_ritardo}g)`}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>€{f.totale.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function KpiBox({ icon, Ico, label, val, col }: any) {
  return (
    <div style={{ background: '#F8FAFA', padding: '8px 6px', borderRadius: 7, textAlign: 'center' as const }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 3, height: 14 }}>
        {Ico ? <Ico size={13} color={col} /> : icon ? <span style={{ fontSize: 13 }}>{icon}</span> : null}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: col, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 7, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 3 }}>{label}</div>
    </div>
  );
}


function FattIco({ pagata, scad, col }: any) {
  if (pagata) return <IcoCheck size={18} color={col} />;
  if (scad) return <IcoAlertTriangle size={18} color={col} />;
  return <IcoCalendar size={18} color={col} />;
}
