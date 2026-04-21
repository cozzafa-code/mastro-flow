"use client";
// @ts-nocheck
import React, { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════
   NewEventModal — 3 step: Quando / Chi / Dove
   fliwoX design · header + footer sticky · no muro unico
   ═══════════════════════════════════════════════════════════════ */

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const TEAL_BRIGHT = "#5FD0D0";
const DARK = "#0D1F1F";
const SUB = "#5A7878";
const LIGHT = "#EEF8F8";
const BORDER = "#C8E4E4";
const AMBER = "#F5A030";
const RED = "#DC4444";

interface Props {
  newEvent: any;
  setNewEvent: (fn: any) => void;
  selDate: Date;
  cantieri: any[];
  contatti: any[];
  team: any[];
  TIPI_EVENTO: any[];
  addEvent: () => void;
  onClose: () => void;
}

export default function NewEventModal({
  newEvent, setNewEvent, selDate, cantieri, contatti, team, TIPI_EVENTO, addEvent, onClose
}: Props) {
  const [step, setStep] = useState(1);
  const isTask = newEvent.tipo === "task";

  // Auto-suggerisci titolo all'apertura se vuoto
  useEffect(() => {
    if (!newEvent.text || !newEvent.text.trim()) {
      const allTipi = [{ id: "task", l: "Task" }, ...TIPI_EVENTO];
      const match = allTipi.find((t: any) => t.id === newEvent.tipo);
      if (match) setNewEvent((prev: any) => ({ ...prev, text: match.l }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const input = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 11,
    border: `1.5px solid ${BORDER}`,
    background: "#F7FBFB",
    fontSize: 14,
    color: DARK,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as any,
  };

  const label = {
    fontSize: 11,
    fontWeight: 900,
    color: SUB,
    marginBottom: 7,
    display: "block",
    letterSpacing: "0.6px",
    textTransform: "uppercase" as any,
  };

  const stepsMeta = [
    { n: 1, label: "Quando" },
    { n: 2, label: "Chi" },
    { n: 3, label: "Dove" },
  ];

  // Validazione minima per avanzare
  const canNext = step === 1 ? !!newEvent.text && !!(newEvent.date || selDate) : true;

  const setField = (k: string, v: any) => setNewEvent((ev: any) => ({ ...ev, [k]: v }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(13,31,31,0.55)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 500,
        background: "#FFFFFF",
        borderRadius: "28px 28px 0 0",
        maxHeight: "92vh",
        display: "flex", flexDirection: "column" as any,
        boxShadow: "0 -6px 40px rgba(0,0,0,0.25)",
      }}>
        {/* ═══ HEADER STICKY ═══ */}
        <div style={{
          padding: "14px 20px 0",
          flexShrink: 0,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ width: 44, height: 5, borderRadius: 3, background: BORDER, margin: "0 auto 14px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: DARK, letterSpacing: "-0.3px" }}>
                {isTask ? "Nuovo task" : "Nuovo evento"}
              </div>
              <div style={{ fontSize: 12, color: SUB, marginTop: 2, fontWeight: 500 }}>
                Passo {step} di 3 · {stepsMeta[step - 1].label}
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 10,
              background: LIGHT, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Progress bar step */}
          <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
            {stepsMeta.map(s => (
              <div key={s.n} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: s.n <= step
                  ? `linear-gradient(145deg, ${TEAL_BRIGHT}, ${TEAL_DARK})`
                  : BORDER,
                boxShadow: s.n === step ? `0 0 8px ${TEAL}80` : "none",
                transition: "all 0.2s",
              }} />
            ))}
          </div>
        </div>

        {/* ═══ BODY SCROLLABLE ═══ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>

          {/* ─── STEP 1: QUANDO ─── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={label as any}>Titolo</label>
                <input
                  style={input}
                  placeholder="es. Sopralluogo, consegna materiale..."
                  value={newEvent.text || ""}
                  onChange={e => setField("text", e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={label as any}>Data</label>
                  <input
                    style={input}
                    type="date"
                    value={newEvent.date || selDate.toISOString().split("T")[0]}
                    onChange={e => setField("date", e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={label as any}>Ora</label>
                  <input
                    style={input}
                    type="time"
                    value={newEvent.time || ""}
                    onChange={e => setField("time", e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={label as any}>Tipo</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[{ id: "task", l: "Task", c: AMBER }, ...TIPI_EVENTO].map(t => {
                    const sel = newEvent.tipo === t.id;
                    return (
                      <div key={t.id} onClick={() => {
                        const tipiLabels = [{ id: "task", l: "Task" }, ...TIPI_EVENTO].map((x: any) => x.l);
                        const cur = (newEvent.text || "").trim();
                        const isAutoFilled = cur === "" || tipiLabels.includes(cur);
                        setNewEvent((prev: any) => ({
                          ...prev,
                          tipo: t.id,
                          text: isAutoFilled ? t.l : prev.text,
                        }));
                      }} style={{
                        padding: "9px 14px",
                        borderRadius: 11,
                        border: `1.5px solid ${sel ? (t.c || TEAL) : BORDER}`,
                        background: sel ? (t.c || TEAL) + "18" : "transparent",
                        fontSize: 12, fontWeight: 800,
                        color: sel ? (t.c || TEAL_DARK) : SUB,
                        cursor: "pointer",
                        whiteSpace: "nowrap" as any,
                      }}>{t.l}</div>
                    );
                  })}
                </div>
              </div>

              {/* Priorità task inline */}
              {isTask && (
                <div style={{ marginTop: 16 }}>
                  <label style={label as any}>Priorità</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { id: "alta", l: "Alta", c: RED },
                      { id: "media", l: "Media", c: AMBER },
                      { id: "bassa", l: "Bassa", c: "#8E8E93" }
                    ].map(p => {
                      const sel = (newEvent._taskPriority || "media") === p.id;
                      return (
                        <div key={p.id} onClick={() => setField("_taskPriority", p.id)} style={{
                          flex: 1, padding: "10px 4px", borderRadius: 11,
                          border: `1.5px solid ${sel ? p.c : BORDER}`,
                          background: sel ? p.c + "15" : "transparent",
                          textAlign: "center" as any,
                          fontSize: 12, fontWeight: 800,
                          color: sel ? p.c : SUB,
                          cursor: "pointer",
                        }}>{p.l}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── STEP 2: CHI ─── */}
          {step === 2 && (
            <>
              {!isTask && (
                <div style={{ marginBottom: 16 }}>
                  <label style={label as any}>Cliente</label>
                  <select
                    style={input}
                    value={newEvent.persona || ""}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "__new__") {
                        setNewEvent((ev: any) => ({ ...ev, persona: "", _newCliente: true }));
                      } else {
                        const ct = contatti.find(c => c.nome === val);
                        setNewEvent((ev: any) => ({
                          ...ev,
                          persona: val,
                          addr: ct?.indirizzo || ev.addr,
                          text: ev.text || ("Appuntamento " + val),
                          _newCliente: false,
                        }));
                      }
                    }}
                  >
                    <option value="">— Seleziona cliente —</option>
                    {contatti.filter(ct => ct.tipo === "cliente").map(ct => (
                      <option key={ct.id || ct.nome} value={ct.nome}>
                        {ct.nome}{ct.cognome ? " " + ct.cognome : ""}
                      </option>
                    ))}
                    <option value="__new__">+ Nuovo cliente...</option>
                  </select>

                  {newEvent._newCliente && (
                    <div style={{
                      background: LIGHT, borderRadius: 12,
                      padding: 14, marginTop: 10,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: TEAL_DARK, marginBottom: 10, letterSpacing: "0.4px", textTransform: "uppercase" as any }}>
                        Nuovo cliente
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input
                          style={{ ...input, flex: 1 }}
                          placeholder="Nome"
                          value={newEvent._nomeCliente || ""}
                          onChange={e => setField("_nomeCliente", e.target.value)}
                        />
                        <input
                          style={{ ...input, flex: 1 }}
                          placeholder="Cognome"
                          value={newEvent._cognomeCliente || ""}
                          onChange={e => setField("_cognomeCliente", e.target.value)}
                        />
                      </div>
                      <input
                        style={{ ...input, marginBottom: 8 }}
                        placeholder="Telefono"
                        value={newEvent._telCliente || ""}
                        onChange={e => setField("_telCliente", e.target.value)}
                      />
                      <input
                        style={input}
                        placeholder="Indirizzo"
                        value={newEvent._addrCliente || ""}
                        onChange={e => {
                          const v = e.target.value;
                          setNewEvent((ev: any) => ({ ...ev, _addrCliente: v, addr: v }));
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={label as any}>Collega a commessa</label>
                <select
                  style={input}
                  value={newEvent.cm || ""}
                  onChange={e => setField("cm", e.target.value)}
                >
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => (
                    <option key={c.id} value={c.code}>
                      {c.code} · {c.cliente}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label as any}>Assegna a persona</label>
                <select
                  style={input}
                  value={isTask ? newEvent.persona || "" : newEvent.persona || ""}
                  onChange={e => setField("persona", e.target.value)}
                >
                  <option value="">— Nessuno —</option>
                  {(isTask
                    ? [...contatti.filter(ct => ct.tipo === "cliente"), ...team]
                    : team
                  ).map(m => (
                    <option key={m.id} value={m.nome}>
                      {m.nome}{m.ruolo ? " — " + m.ruolo : ""}
                    </option>
                  ))}
                </select>
              </div>

              {isTask && (
                <div style={{ marginTop: 16 }}>
                  <label style={label as any}>Note</label>
                  <input
                    style={input}
                    placeholder="Dettagli, materiale da portare..."
                    value={newEvent._taskMeta || ""}
                    onChange={e => setField("_taskMeta", e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* ─── STEP 3: DOVE ─── */}
          {step === 3 && (
            <>
              {!isTask ? (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <label style={label as any}>Indirizzo</label>
                    <input
                      style={input}
                      placeholder="Via Roma 12, Cosenza..."
                      value={newEvent.addr || ""}
                      onChange={e => setField("addr", e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={label as any}>Reminder al cliente</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        { id: "", l: "Nessuno" },
                        { id: "24h", l: "24h prima" },
                        { id: "1h", l: "1h prima" },
                        { id: "giorno", l: "Il giorno" },
                      ].map(r => {
                        const sel = (newEvent.reminder || "") === r.id;
                        return (
                          <div key={r.id} onClick={() => setField("reminder", r.id)} style={{
                            flex: 1, padding: "10px 4px", borderRadius: 11,
                            textAlign: "center" as any,
                            fontSize: 11, fontWeight: 800,
                            cursor: "pointer",
                            border: `1.5px solid ${sel ? TEAL : BORDER}`,
                            background: sel ? LIGHT : "transparent",
                            color: sel ? TEAL_DARK : SUB,
                          }}>{r.l}</div>
                        );
                      })}
                    </div>
                    {newEvent.reminder && (
                      <div style={{
                        marginTop: 10, fontSize: 11, color: TEAL_DARK,
                        padding: "10px 12px", background: LIGHT,
                        borderRadius: 10, fontWeight: 600, lineHeight: 1.5,
                      }}>
                        MASTRO ti avviserà di inviare il reminder — lo farai con 1 click dal banner in agenda.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: "center" as any,
                  padding: "40px 20px", color: SUB, fontSize: 13,
                }}>
                  Tutto pronto! Premi <b>Crea task</b> per salvare.
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ FOOTER STICKY ═══ */}
        <div style={{
          flexShrink: 0,
          padding: "14px 20px calc(14px + env(safe-area-inset-bottom, 0px))",
          borderTop: `1px solid ${BORDER}`,
          background: "#FFFFFF",
          display: "flex", gap: 10,
        }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1, padding: 14, borderRadius: 13,
                border: `1.5px solid ${BORDER}`,
                background: "#FFFFFF",
                fontSize: 14, fontWeight: 800, color: SUB,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >Indietro</button>
          )}

          {step < 3 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              style={{
                flex: 2, padding: 14, borderRadius: 13,
                border: "none",
                background: canNext
                  ? `linear-gradient(145deg, ${TEAL_BRIGHT} 0%, ${TEAL} 50%, ${TEAL_DARK} 100%)`
                  : "#CCCCCC",
                color: "#fff", fontSize: 15, fontWeight: 900,
                cursor: canNext ? "pointer" : "default",
                fontFamily: "inherit", letterSpacing: "0.3px",
                boxShadow: canNext ? `0 6px 14px ${TEAL}40, inset 0 1px 2px rgba(255,255,255,0.3)` : "none",
                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            >Avanti</button>
          ) : (
            <button
              onClick={addEvent}
              style={{
                flex: 2, padding: 14, borderRadius: 13,
                border: "none",
                background: `linear-gradient(145deg, ${TEAL_BRIGHT} 0%, ${TEAL} 50%, ${TEAL_DARK} 100%)`,
                color: "#fff", fontSize: 15, fontWeight: 900,
                cursor: "pointer", fontFamily: "inherit",
                letterSpacing: "0.3px",
                boxShadow: `0 6px 14px ${TEAL}50, inset 0 1px 2px rgba(255,255,255,0.3)`,
                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            >{isTask ? "Crea task" : "Crea evento"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
