"use client";
// components/centro/TabRete.tsx - Rete relazionale + referral + decisori

import React, { useState } from "react";
import { useReteCliente, type Decisore } from "../../hooks/useDossierExtra";
import ModalDecisore from "../ModalDecisore";
import { rimuoviDecisore } from "../../hooks/useClienteCRUD";
import { IcoTrash, IcoUsers, IcoCrown, IcoStar, IcoUser } from "../IconLib";

function IcoPlus({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>;}

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

const PESO_META: Record<string, { col: string; bg: string; label: string }> = {
  alto:  { col: RED,    bg: '#FEE2E2', label: 'DECIDE' },
  medio: { col: AMBER,  bg: '#FEF3C7', label: 'INFLUENZA' },
  basso: { col: MUTED,  bg: '#F1F4F7', label: 'ASCOLTA' },
};

interface Props {
  clienteId: string;
  onApriCliente?: (id: string) => void;
}

export default function TabRete({ clienteId, onApriCliente }: Props) {
  const { decisori, settore_lavorativo, professione, circolo_sociale, portato_da, referenziati, loading, reload } = useReteCliente(clienteId);
  const [showAddDecisore, setShowAddDecisore] = useState(false);

  async function deleteDecisore(idx: number) {
    if (!confirm('Eliminare questo decisore?')) return;
    await rimuoviDecisore(clienteId, idx);
    reload();
  }

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>;

  const valoreReferenziati = referenziati.reduce((s, r) => s + Number(r.valore_storico_eur || 0), 0);

  return (
    <div>
      {/* PROFILO LAVORATIVO */}
      {(professione || settore_lavorativo || circolo_sociale) && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${PURPLE}` }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 800 }}>PROFILO LAVORATIVO</div>
          {professione && (
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{professione}</div>
          )}
          {settore_lavorativo && (
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{settore_lavorativo}</div>
          )}
          {circolo_sociale && (
            <div style={{ fontSize: 11, color: MUTED }}>{circolo_sociale}</div>
          )}
        </div>
      )}

      {/* PORTATO DA */}
      {portato_da && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${TEAL_DEEP}` }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 6, fontWeight: 800 }}>PORTATO DA</div>
          <button onClick={() => onApriCliente?.(portato_da.id)} style={{ width: '100%', background: TEAL + '15', border: `1.5px solid ${TEAL}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
              {(portato_da.nome[0] || '') + (portato_da.cognome[0] || '')}
            </div>
            <div style={{ flex: 1, textAlign: 'left' as const }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{portato_da.nome} {portato_da.cognome}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>↑ Apri dossier →</div>
            </div>
          </button>
        </div>
      )}

      {/* DECISORI / NETWORK FAMILIARE */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${AMBER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, fontWeight: 800, flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoUsers size={11} color={MUTED} />NETWORK DECISORI · {decisori.length}
          </div>
          <button onClick={() => setShowAddDecisore(true)} style={{ padding: '6px 11px', background: AMBER, color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <IcoPlus size={11} color="#fff" />AGGIUNGI
          </button>
        </div>
        {decisori.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 14, color: MUTED, fontSize: 11 }}>Nessun decisore. Aggiungi moglie / figli / consulenti che influenzano le scelte.</div>
        ) : decisori.map((d: Decisore, i: number) => {
          const pm = PESO_META[d.peso_decisionale] || PESO_META.basso;
          const Ico = d.peso_decisionale === 'alto' ? IcoCrown : d.peso_decisionale === 'medio' ? IcoStar : IcoUser;
          return (
            <div key={i} style={{ background: '#F8FAFA', padding: 10, borderRadius: 8, marginBottom: i < decisori.length - 1 ? 6 : 0, borderLeft: `3px solid ${pm.col}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: pm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ico size={16} color={pm.col} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{d.nome}</div>
                  <div style={{ fontSize: 10, color: MUTED, fontStyle: 'italic' as const, marginTop: 1 }}>{d.ruolo}</div>
                </div>
                <span style={{ background: pm.bg, color: pm.col, padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{pm.label}</span>
                <button onClick={() => deleteDecisore(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  <IcoTrash size={14} color={MUTED} />
                </button>
              </div>
              {d.note && (
                <div style={{ fontSize: 11, color: TEXT, lineHeight: 1.4, paddingLeft: 42 }}>{d.note}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* CLIENTI REFERENZIATI */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${GREEN}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, fontWeight: 800, flex: 1 }}>HA REFERENZIATO · {referenziati.length}</div>
          {valoreReferenziati > 0 && (
            <span style={{ background: '#D1FAE5', color: TEAL_DEEP, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
              €{Math.round(valoreReferenziati / 1000)}k generati
            </span>
          )}
        </div>
        {referenziati.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: 20, color: MUTED, fontSize: 12 }}>
            Nessun cliente referenziato ancora.<br/>
            <span style={{ fontSize: 10, marginTop: 4, display: 'inline-block' }}>Chiedere referenze se cliente è soddisfatto</span>
          </div>
        ) : (
          referenziati.map(r => (
            <button key={r.id} onClick={() => onApriCliente?.(r.id)} style={{ width: '100%', background: '#F8FAFA', border: 'none', borderLeft: `3px solid ${GREEN}`, borderRadius: 6, padding: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `linear-gradient(135deg, ${GREEN}, #047857)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                {(r.nome[0] || '') + (r.cognome[0] || '')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{r.nome} {r.cognome}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                  <span style={{ background: r.stato_cliente === 'attivo' ? '#D1FAE5' : r.stato_cliente === 'prospect' ? '#F3E8FF' : '#F1F4F7', color: r.stato_cliente === 'attivo' ? TEAL_DEEP : r.stato_cliente === 'prospect' ? PURPLE : MUTED, padding: '1px 6px', borderRadius: 3, fontSize: 8, fontWeight: 800 }}>{r.stato_cliente.toUpperCase()}</span>
                </div>
              </div>
              {r.valore_storico_eur > 0 && (
                <div style={{ textAlign: 'right' as const }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: TEAL_DEEP }}>€{Math.round(r.valore_storico_eur / 1000)}k</div>
                </div>
              )}
              <span style={{ color: MUTED, fontSize: 14 }}>→</span>
            </button>
          ))
        )}
      </div>

      {showAddDecisore && (
        <ModalDecisore clienteId={clienteId} onClose={() => setShowAddDecisore(false)} onSaved={reload} />
      )}
    </div>
  );
}
