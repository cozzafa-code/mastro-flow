"use client";
// components/OrganizzaLavoriPanel.tsx
// Workspace POST-ORDINI per pianificare produzione + montaggio
// Colore card riflette stato materiali (nessuno/in_attesa/parziale/completo)

import React, { useState, useMemo } from "react";
import { useOrganizzaLavori } from "../hooks/useOrganizzaLavori";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

// Mappa stato materiali → colore card
function getMatColors(status: string) {
  if (status === 'completo') return { bg: '#E1F5EE', border: '#28A0A0', text: '#0F6E56', label: 'MATERIALI COMPLETI' };
  if (status === 'parziale') return { bg: '#FEF3C7', border: '#D97706', text: '#92400E', label: 'MATERIALI PARZIALI' };
  if (status === 'in_attesa') return { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B', label: 'MATERIALI IN ATTESA' };
  return { bg: '#F1F4F7', border: '#5C6B7A', text: '#5C6B7A', label: 'NESSUN ORDINE' };
}

const STATO_LAV: Record<string, { bg: string; fg: string; lbl: string }> = {
  da_fare:    { bg: '#F1F4F7', fg: '#5C6B7A', lbl: 'DA ASSEGNARE' },
  pianificata:{ bg: '#DBEAFE', fg: '#1E3A8A', lbl: 'PIANIFICATA' },
  in_corso:   { bg: '#FEF3C7', fg: '#92400E', lbl: 'IN CORSO' },
  completata: { bg: '#D1FAE5', fg: '#065F46', lbl: 'COMPLETATA' },
};

export default function OrganizzaLavoriPanel({ commessa, aziendaId, onClose }: any) {
  const [tab, setTab] = useState<'produzione' | 'montaggio'>('produzione');
  const { lavorazioni, montaggio, operatori, materialiStatus, loading, error, updateLavorazione, updateMontaggio } = useOrganizzaLavori(commessa?.id, aziendaId);
  const matCol = getMatColors(materialiStatus.status);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{commessa?.code} · ORGANIZZA LAVORI</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>{commessa?.cliente} {commessa?.cognome}</div>
          </div>
        </div>

        {/* Banner stato materiali */}
        <div style={{ background: matCol.bg, color: matCol.text, padding: '10px 12px', borderRadius: 10, border: `2px solid ${matCol.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: matCol.border, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{materialiStatus.perc}%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>{matCol.label}</div>
            <div style={{ fontSize: 10, marginTop: 2, opacity: 0.85 }}>
              {materialiStatus.status === 'completo' ? 'Tutti i materiali sono arrivati. Pronto per produzione.' :
               materialiStatus.status === 'parziale' ? 'Alcuni ordini ancora in transito.' :
               materialiStatus.status === 'in_attesa' ? 'Ordini inviati, attesa consegne.' :
               'Crea ordini fornitore per avviare i lavori.'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', margin: '-8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative', zIndex: 2 }}>
        <TabBtn active={tab === 'produzione'} onClick={() => setTab('produzione')}>Produzione</TabBtn>
        <TabBtn active={tab === 'montaggio'} onClick={() => setTab('montaggio')}>Montaggio</TabBtn>
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>Caricamento...</div> :
         error ? <div style={{ padding: 14, background: '#FEE2E2', color: '#991B1B', borderRadius: 10 }}>{error}</div> :
         tab === 'produzione' ? (
           <ProduzioneTab lavorazioni={lavorazioni} operatori={operatori} onUpdate={updateLavorazione} matStatus={materialiStatus.status} />
         ) : (
           <MontaggioTab montaggio={montaggio} operatori={operatori} onUpdate={updateMontaggio} matStatus={materialiStatus.status} />
         )}
      </div>
    </div>
  );
}

// =================== PRODUZIONE TAB ===================
function ProduzioneTab({ lavorazioni, operatori, onUpdate, matStatus }: any) {
  const pianificate = lavorazioni.filter((l: any) => l.operatore_id && l.data_pianificata).length;
  const totali = lavorazioni.length;

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 600 }}>FASI PIANIFICATE</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: TEXT, marginTop: 2 }}>{pianificate} / {totali}</div>
        </div>
        {matStatus !== 'completo' && (
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 10px', borderRadius: 7, fontSize: 10, fontWeight: 600 }}>
            ATTESA MATERIALI
          </div>
        )}
      </div>

      {lavorazioni.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 12 }}>Nessuna fase di produzione. Avvia produzione per crearle.</div>
      ) : lavorazioni.map((lav: any, i: number) => (
        <LavorazioneCard key={lav.id} lav={lav} index={i + 1} operatori={operatori} onUpdate={onUpdate} />
      ))}
    </>
  );
}

function LavorazioneCard({ lav, index, operatori, onUpdate }: any) {
  const [opId, setOpId] = useState(lav.operatore_id || '');
  const [data, setData] = useState(lav.data_pianificata || '');
  const stato = STATO_LAV[lav.stato] || STATO_LAV.da_fare;
  const pianificata = !!(opId && data);

  function handleOp(id: string) {
    setOpId(id);
    const op = operatori.find((o: any) => o.id === id);
    onUpdate(lav.id, { operatore_id: id, operatore_nome: op?.nome || null, stato: (id && data) ? 'pianificata' : 'da_fare' });
  }
  function handleData(d: string) {
    setData(d);
    onUpdate(lav.id, { data_pianificata: d, stato: (opId && d) ? 'pianificata' : 'da_fare' });
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, border: pianificata ? '1px solid #28A0A0' : '1px solid #E5EAF0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: pianificata ? '#DBEAFE' : '#F1F4F7', color: pianificata ? '#1E3A8A' : MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{index}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{lav.fase || 'Fase'}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>~{lav.ore_stimate || 1}h stimate</div>
        </div>
        <div style={{ background: stato.bg, color: stato.fg, fontSize: 8, padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.3 }}>{stato.lbl}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <select value={opId} onChange={e => handleOp(e.target.value)} style={{ padding: 8, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 11, background: '#fff', color: TEXT }}>
          <option value="">Operatore...</option>
          {operatori.map((o: any) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <input type="date" value={data} onChange={e => handleData(e.target.value)} style={{ padding: 8, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 11, background: '#fff', color: TEXT }} />
      </div>
    </div>
  );
}

// =================== MONTAGGIO TAB ===================
function MontaggioTab({ montaggio, operatori, onUpdate, matStatus }: any) {
  const [dataInst, setDataInst] = useState(montaggio?.data_installazione || '');
  const [oraIn, setOraIn] = useState(montaggio?.orario_inizio || '08:00');
  const [oraFn, setOraFn] = useState(montaggio?.orario_fine || '13:00');
  const [squadra, setSquadra] = useState<string[]>(montaggio?.squadra?.map((s: any) => s.id) || []);
  const [note, setNote] = useState(montaggio?.note || '');

  const oreLav = useMemo(() => {
    if (!oraIn || !oraFn) return 0;
    const [hi, mi] = oraIn.split(':').map(Number);
    const [hf, mf] = oraFn.split(':').map(Number);
    return Math.max(0, (hf - hi) + (mf - mi) / 60);
  }, [oraIn, oraFn]);

  function toggleOp(id: string) {
    const next = squadra.includes(id) ? squadra.filter(s => s !== id) : [...squadra, id];
    setSquadra(next);
    onUpdate({ squadra: next.map(sid => { const o = operatori.find((op: any) => op.id === sid); return { id: sid, nome: o?.nome }; }) });
  }

  function save() {
    onUpdate({ data_installazione: dataInst, orario_inizio: oraIn, orario_fine: oraFn, note });
  }

  return (
    <>
      {matStatus !== 'completo' && (
        <div style={{ background: '#FEF3C7', color: '#92400E', padding: 11, borderRadius: 10, marginBottom: 12, fontSize: 11, lineHeight: 1.4 }}>
          <strong>Attenzione:</strong> i materiali non sono ancora tutti arrivati. Puoi pianificare ma il montaggio verrà confermato quando saranno completi.
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 13, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>DATA INSTALLAZIONE</div>
        <input type="date" value={dataInst} onChange={e => { setDataInst(e.target.value); onUpdate({ data_installazione: e.target.value }); }} style={{ width: '100%', padding: 10, border: '1px solid #E5EAF0', borderRadius: 8, fontSize: 13, marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 6, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>INIZIO</div>
            <input type="time" value={oraIn} onChange={e => { setOraIn(e.target.value); onUpdate({ orario_inizio: e.target.value }); }} style={{ width: '100%', padding: 9, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>FINE</div>
            <input type="time" value={oraFn} onChange={e => { setOraFn(e.target.value); onUpdate({ orario_fine: e.target.value }); }} style={{ width: '100%', padding: 9, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: MUTED, marginBottom: 4 }}>DURATA</div>
            <div style={{ padding: 9, background: '#E1F5EE', color: TEAL_DEEP, borderRadius: 7, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{oreLav}h</div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 13, marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 600 }}>SQUADRA MONTAGGIO</div>
          <div style={{ fontSize: 10, color: TEAL, fontWeight: 600 }}>{squadra.length} selezionati</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {operatori.length === 0 ? <div style={{ fontSize: 11, color: MUTED, padding: 8 }}>Nessun operatore disponibile.</div> :
           operatori.map((op: any, i: number) => {
            const sel = squadra.includes(op.id);
            return (
              <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 9, background: sel ? '#E1F5EE' : '#F8FAFA', borderRadius: 7, border: sel ? `1.5px solid ${TEAL}` : '1px solid #E5EAF0', cursor: 'pointer' }}>
                <input type="checkbox" checked={sel} onChange={() => toggleOp(op.id)} style={{ accentColor: TEAL }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: TEXT }}>{op.nome}</div>
                  {i === 0 && sel && <div style={{ fontSize: 9, color: TEAL_DEEP, fontWeight: 600 }}>CAPOSQUADRA</div>}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 13, marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>NOTE PER LA SQUADRA</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={() => onUpdate({ note })} placeholder="Accesso, orari cliente, attrezzature..." style={{ width: '100%', minHeight: 70, padding: 10, border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 12, color: TEXT, fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      <button onClick={save} style={{ width: '100%', padding: 14, background: TEAL, color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.3 }}>
        CONFERMA E NOTIFICA SQUADRA
      </button>
    </>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 500, color: active ? '#fff' : MUTED, background: active ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
      {children}
    </button>
  );
}
