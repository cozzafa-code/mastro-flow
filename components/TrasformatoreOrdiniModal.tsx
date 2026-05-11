"use client";
// components/TrasformatoreOrdiniModal.tsx
// Modal 4-step: SOURCE -> TIPO -> PREVIEW -> CONSEGNA+INVIO

import React, { useState, useMemo } from "react";
import { useCommesseAttive, useFornitoriOpt, calcolaDistinta, creaOrdiniDaDistinta, type CommessaSource, type TipoOrdine, type RigaDistinta } from "../hooks/useTrasformatore";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const TIPI: { val: TipoOrdine; icon: string; label: string; sub: string; col: string }[] = [
  { val: 'COMPLETO',   icon: '📦', label: 'COMPLETO',   sub: 'Tutto da più fornitori', col: NAVY },
  { val: 'TELAI',      icon: '🔧', label: 'TELAI+ANTE', sub: 'Profili PVC/Allu',       col: '#4F46E5' },
  { val: 'VETRI',      icon: '🪟', label: 'VETRI',      sub: 'Vetrocamera',            col: BLUE },
  { val: 'FERRAMENTA', icon: '⚙️',  label: 'FERRAMENTA', sub: 'Cerniere+maniglie',     col: AMBER },
  { val: 'KIT_POSA',   icon: '📦', label: 'KIT POSA',   sub: 'Kit certificato',        col: PURPLE },
  { val: 'MOTORI',     icon: '⚡', label: 'MOTORI',     sub: 'Automazione',            col: RED },
];

interface Props {
  aziendaId: string;
  commessaPredefinita?: { id: string; code: string } | null;
  onClose: () => void;
  onCreati?: (ordineIds: string[]) => void;
}

export default function TrasformatoreOrdiniModal({ aziendaId, commessaPredefinita, onClose, onCreati }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(commessaPredefinita ? 2 : 1);
  const [commessa, setCommessa] = useState<CommessaSource | null>(null);
  const [tipi, setTipi] = useState<TipoOrdine[]>([]);
  const [righe, setRighe] = useState<RigaDistinta[]>([]);
  const [dataConsegna, setDataConsegna] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [note, setNote] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [success, setSuccess] = useState<{ count: number } | null>(null);
  const [searchSrc, setSearchSrc] = useState('');

  const { commesse, loading } = useCommesseAttive(aziendaId);
  const fornitori = useFornitoriOpt(aziendaId);

  // Se commessa predefinita, la trovo
  React.useEffect(() => {
    if (commessaPredefinita && commesse.length > 0 && !commessa) {
      const c = commesse.find(x => x.id === commessaPredefinita.id);
      if (c) setCommessa(c);
    }
  }, [commessaPredefinita, commesse, commessa]);

  // Calcola distinta quando passo allo step 3
  React.useEffect(() => {
    if (step === 3 && commessa && tipi.length > 0) {
      setRighe(calcolaDistinta(commessa, tipi, fornitori));
    }
  }, [step, commessa, tipi, fornitori]);

  const commesseFilt = useMemo(() => {
    if (!searchSrc.trim()) return commesse;
    const q = searchSrc.trim().toLowerCase();
    return commesse.filter(c => 
      (c.code || '').toLowerCase().includes(q) ||
      (c.cliente || '').toLowerCase().includes(q) ||
      (c.cognome || '').toLowerCase().includes(q)
    );
  }, [commesse, searchSrc]);

  // Totale stimato
  const totaleStimato = righe.reduce((s, r) => s + r.qta_richiesta * r.prezzo_unitario, 0);
  const fornUnici = Array.from(new Set(righe.map(r => r.fornitore_nome || 'Da assegnare'))).length;

  async function handleSalva() {
    if (!commessa || righe.length === 0) return;
    setSalvando(true);
    const res = await creaOrdiniDaDistinta(aziendaId, commessa.id, commessa.code, righe, dataConsegna, note);
    setSalvando(false);
    if (res.success) {
      setSuccess({ count: res.ordineIds.length });
      onCreati?.(res.ordineIds);
      setTimeout(() => onClose(), 2500);
    } else {
      alert('Errore: ' + (res.error || 'creazione fallita'));
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '95vh', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(40,160,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>TRASFORMATORE ORDINI</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Da Commessa → Ordini Fornitore</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { n: 1, label: 'Commessa' },
              { n: 2, label: 'Tipo' },
              { n: 3, label: 'Preview' },
              { n: 4, label: 'Invio' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, textAlign: 'center' as const }}>
                <div style={{
                  height: 4, borderRadius: 2,
                  background: step >= s.n ? TEAL : 'rgba(255,255,255,0.2)',
                  marginBottom: 6,
                }} />
                <div style={{ fontSize: 9, color: step >= s.n ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 0.5 }}>{s.n}. {s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const, minHeight: 200 }}>
          {success ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 30, textAlign: 'center' as const }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: TEAL_DEEP, marginBottom: 6 }}>{success.count} ordin{success.count === 1 ? 'e creato' : 'i creati'}</div>
              <div style={{ fontSize: 12, color: MUTED }}>Visibili nel Centro Controllo Ordini</div>
            </div>
          ) : (
            <>
              {/* STEP 1: SOURCE */}
              {step === 1 && (
                <>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>SELEZIONA COMMESSA DI ORIGINE</div>
                  <div style={{ background: '#fff', padding: 8, borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
                      <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
                    </svg>
                    <input value={searchSrc} onChange={e => setSearchSrc(e.target.value)}
                      placeholder="Cerca codice o cliente..."
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
                  </div>
                  {loading ? <Empty label="Caricamento commesse..." /> :
                   commesseFilt.length === 0 ? <Empty label="Nessuna commessa attiva" /> :
                   commesseFilt.map(c => (
                    <div key={c.id} onClick={() => { setCommessa(c); setStep(2); }} style={{
                      background: '#fff', borderRadius: 10, padding: 12, marginBottom: 6,
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      borderLeft: `4px solid ${commessa?.id === c.id ? TEAL : '#E5EAF0'}`,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ background: NAVY, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{c.code}</span>
                          <span style={{ fontSize: 9, color: MUTED, fontWeight: 700, textTransform: 'uppercase' as const }}>{c.fase}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{c.cliente} {c.cognome}</div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
                          {c.num_vani} vani · {c.num_pezzi} pezzi · {c.sistema_principale || 'sistema'}
                        </div>
                      </div>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                   ))}
                </>
              )}

              {/* STEP 2: TIPO */}
              {step === 2 && commessa && (
                <>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: MUTED, fontWeight: 700 }}>COMMESSA SELEZIONATA</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ background: NAVY, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{commessa.code}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{commessa.cliente} {commessa.cognome}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, fontWeight: 700 }}>{commessa.num_pezzi} pz</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>CHE TIPO DI ORDINE? (multi-selezione)</div>
                  {TIPI.map(t => {
                    const sel = tipi.includes(t.val);
                    return (
                      <div key={t.val} onClick={() => {
                        if (t.val === 'COMPLETO') {
                          setTipi(sel ? [] : ['COMPLETO']);
                        } else {
                          setTipi(prev => {
                            const without = prev.filter(x => x !== 'COMPLETO');
                            return sel ? without.filter(x => x !== t.val) : [...without, t.val];
                          });
                        }
                      }} style={{
                        background: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        border: `2px solid ${sel ? t.col : 'transparent'}`,
                        boxShadow: sel ? `0 4px 12px ${t.col}33` : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: t.col + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{t.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: t.col }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{t.sub}</div>
                        </div>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: sel ? t.col : 'transparent',
                          border: `2px solid ${sel ? t.col : '#E5EAF0'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800,
                        }}>{sel ? '✓' : ''}</div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* STEP 3: PREVIEW */}
              {step === 3 && commessa && (
                <>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      <StatPrev label="ARTICOLI" val={righe.length} col={TEAL_DEEP} />
                      <StatPrev label="FORNITORI" val={fornUnici} col={AMBER} />
                      <StatPrev label="TOTALE" val={`€${Math.round(totaleStimato).toLocaleString('it-IT')}`} col={NAVY} small />
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>DISTINTA CALCOLATA · {righe.length} RIGHE</div>
                  {righe.length === 0 ? <Empty label="Nessuna riga da generare" /> :
                    righe.map((r, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: 8, padding: 10, marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                              <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{r.categoria}</span>
                              {r.fornitore_nome ? (
                                <span style={{ fontSize: 9, color: TEAL_DEEP, fontWeight: 700 }}>🏭 {r.fornitore_nome}</span>
                              ) : (
                                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>⚠ NO FORN.</span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{r.descrizione}</div>
                          </div>
                          <div style={{ textAlign: 'right' as const }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{r.qta_richiesta} {r.unita_misura}</div>
                            <div style={{ fontSize: 10, color: MUTED }}>€{r.prezzo_unitario.toFixed(2)} cad.</div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, marginTop: 2 }}>€{(r.qta_richiesta * r.prezzo_unitario).toFixed(0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* STEP 4: CONSEGNA + INVIO */}
              {step === 4 && (
                <>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>CONSEGNA DESIDERATA</div>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <input type="date" value={dataConsegna} onChange={e => setDataConsegna(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', fontSize: 16, border: '2px solid #E5EAF0', borderRadius: 8, fontWeight: 700, color: TEXT, fontFamily: 'inherit' }} />
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 6 }}>Default: +14 giorni · Default fornitori contattati per email</div>
                  </div>

                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>NOTE PER I FORNITORI (opzionale)</div>
                  <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <textarea value={note} onChange={e => setNote(e.target.value)}
                      placeholder="Es: consegna in mattinata · cliente esige certificazioni · imballo separato per vano..."
                      rows={3}
                      style={{ width: '100%', padding: 10, fontSize: 12, border: '1.5px solid #E5EAF0', borderRadius: 6, color: TEXT, fontFamily: 'inherit', resize: 'vertical' as const, outline: 'none' }} />
                  </div>

                  <div style={{ background: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 8 }}>RIEPILOGO INVIO</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: MUTED }}>Commessa</span>
                      <strong style={{ color: TEXT }}>{commessa?.code}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: MUTED }}>Ordini da creare</span>
                      <strong style={{ color: TEAL_DEEP }}>{fornUnici}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: MUTED }}>Articoli totali</span>
                      <strong style={{ color: TEXT }}>{righe.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5EAF0' }}>
                      <span style={{ color: TEXT, fontWeight: 700 }}>TOTALE STIMATO</span>
                      <strong style={{ color: NAVY, fontSize: 16 }}>€{Math.round(totaleStimato).toLocaleString('it-IT')}</strong>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer azioni */}
        {!success && (
          <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #E5EAF0', display: 'flex', gap: 8 }}>
            {step > 1 && step !== 1 && (
              <button onClick={() => setStep(step - 1 as any)} disabled={salvando} style={{
                flex: 1, padding: '14px 0', background: '#fff', color: MUTED,
                border: '1.5px solid #E5EAF0', borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}>← Indietro</button>
            )}
            {step < 4 && (
              <button onClick={() => setStep(step + 1 as any)}
                disabled={(step === 1 && !commessa) || (step === 2 && tipi.length === 0) || (step === 3 && righe.length === 0)}
                style={{
                  flex: 2, padding: '14px 0',
                  background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`, color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', opacity: ((step === 1 && !commessa) || (step === 2 && tipi.length === 0) || (step === 3 && righe.length === 0)) ? 0.4 : 1,
                }}>Avanti →</button>
            )}
            {step === 4 && (
              <button onClick={handleSalva} disabled={salvando} style={{
                flex: 2, padding: '14px 0',
                background: salvando ? MUTED : `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`,
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: salvando ? 'wait' : 'pointer',
              }}>
                {salvando ? 'Salvataggio...' : `✓ CREA ${fornUnici} ORDIN${fornUnici === 1 ? 'E' : 'I'}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPrev({ label, val, col, small }: any) {
  return (
    <div style={{ background: '#F8FAFA', padding: '8px 6px', borderRadius: 8, textAlign: 'center' as const }}>
      <div style={{ fontSize: small ? 13 : 18, fontWeight: 800, color: col, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
