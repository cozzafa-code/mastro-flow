"use client";
// @ts-nocheck
import React, { useState, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   NewEventModal — Mockup Navy Approvato
   Single-screen sezionato (no wizard step):
   TIPO → COSA → QUANDO → CLIENTE → COMMESSA → DOVE → CHI → NOTIFICHE → ALLEGATI
   ═══════════════════════════════════════════════════════════════ */

const TH = {
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  navySoft: "#93B0CF",
  navyMuted: "#475A75",
  ink: "#0A1628",
  sub: "#475A75",
  subLight: "#94A3B8",
  border: "#CBD5E1",
  borderSoft: "#E2E8F0",
  bgPill: "#DBE6F1",
  bgPage: "#F1F5F9",
  white: "#FFFFFF",
  ambra: "#92400E",
  ambraBg: "#FEF3C7",
  red: "#991B1B",
  green: "#065F46",
};

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
  const [showSearchCliente, setShowSearchCliente] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRipetiMenu, setShowRipetiMenu] = useState(false);

  // Tipo principale: evento / task / task_cm
  const tipoMacro = newEvent.tipoMacro || "evento";
  const setTipoMacro = (v: string) => setNewEvent((p: any) => ({ ...p, tipoMacro: v }));

  // Data formattata
  const dataLabel = useMemo(() => {
    if (!selDate) return "—";
    return selDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })
      .replace(/^./, c => c.toUpperCase());
  }, [selDate]);

  // Tipo evento (sopralluogo, misure, ecc.)
  const tipoEvento = newEvent.tipo || "sopralluogo";
  const setTipoEvento = (v: string) => setNewEvent((p: any) => ({ ...p, tipo: v }));

  // Cliente selezionato
  const clienteSel = newEvent.cliente || null;

  // Commesse suggerite per cliente
  const commesseSuggerite = useMemo(() => {
    if (!clienteSel) return [];
    return (cantieri || []).filter(cm =>
      cm.cliente && (cm.cliente + " " + (cm.cognome || "")).toLowerCase().includes((clienteSel.nome || "").toLowerCase())
    ).slice(0, 3);
  }, [clienteSel, cantieri]);

  // Filtra contatti per ricerca
  const filteredContatti = useMemo(() => {
    if (!searchTerm.trim()) return (contatti || []).slice(0, 8);
    const q = searchTerm.toLowerCase();
    return (contatti || []).filter(c =>
      (c.nome || "").toLowerCase().includes(q) ||
      (c.cognome || "").toLowerCase().includes(q) ||
      (c.telefono || "").includes(q)
    ).slice(0, 8);
  }, [searchTerm, contatti]);

  // Squadra selezionata
  const squadraSel = newEvent.squadra || [];
  const toggleMembro = (id: string) => {
    setNewEvent((p: any) => {
      const cur = p.squadra || [];
      return { ...p, squadra: cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id] };
    });
  };

  // Notifiche
  const notifs = newEvent.notifiche || ["1h"];
  const toggleNotif = (v: string) => {
    setNewEvent((p: any) => {
      const cur = p.notifiche || [];
      return { ...p, notifiche: cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v] };
    });
  };

  // Tipi evento preset (mockup)
  const TIPI_PRESET = [
    { id: "sopralluogo", l: "Sopralluogo", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" },
    { id: "misure", l: "Misure", icon: "M21 6H3M21 12H3M21 18H3" },
    { id: "posa", l: "Posa", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
    { id: "riunione", l: "Riunione", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
  ];

  // Durate preset
  const DURATE = [
    { id: "30m", l: "30m" },
    { id: "1h", l: "1h" },
    { id: "1h30m", l: "1h30m" },
    { id: "2h", l: "2h" },
    { id: "mezza", l: "Mezza gg" },
  ];
  const durata = newEvent.durata || "1h";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.5)",
      zIndex: 1200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: TH.white,
        width: "100%", maxWidth: 500,
        maxHeight: "92vh",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ═══ HEADER NAVY ═══ */}
        <div style={{
          background: `linear-gradient(160deg, ${TH.navy} 0%, ${TH.navyDark} 100%)`,
          padding: "calc(env(safe-area-inset-top, 0px) + 14px) 18px 18px",
          color: TH.white,
          position: "relative",
        }}>
          <div style={{ width: 36, height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 2, margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: TH.navySoft, textTransform: "uppercase" }}>Calendario · Crea</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.1, marginTop: 3 }}>Nuovo Item</div>
              <div style={{ fontSize: 12, color: "#B5C8DD", marginTop: 4, fontWeight: 600, textTransform: "capitalize" }}>{dataLabel}</div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: TH.white,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* ═══ BODY SCROLLABILE ═══ */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 12px" }}>

          {/* TIPO MACRO */}
          <div style={{ fontSize: 9.5, fontWeight: 800, color: TH.sub, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>Tipo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[
              { id: "evento", l: "EVENTO", icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></> },
              { id: "task", l: "TASK", icon: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></> },
              { id: "task_cm", l: "TASK CM", icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></> },
            ].map(t => {
              const sel = tipoMacro === t.id;
              return (
                <button key={t.id} onClick={() => setTipoMacro(t.id)} style={{
                  border: `2px solid ${sel ? TH.navy : TH.border}`,
                  background: sel ? TH.bgPill : TH.white,
                  color: sel ? TH.navy : TH.sub,
                  borderRadius: 12, padding: "12px 6px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: "pointer", fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">{t.icon}</svg>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.3 }}>{t.l}</div>
                </button>
              );
            })}
          </div>

          {/* SEZIONE: COSA */}
          <Section icon={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>} title="Cosa" required>
            <div style={{ marginBottom: 8 }}>
              <Label>Tipo evento</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {TIPI_PRESET.map(t => {
                  const sel = tipoEvento === t.id;
                  return (
                    <button key={t.id} onClick={() => setTipoEvento(t.id)} style={{
                      background: sel ? TH.bgPill : TH.white,
                      border: `1.5px solid ${sel ? TH.navy : TH.border}`,
                      color: sel ? TH.navy : TH.sub,
                      borderRadius: 999, padding: "7px 12px",
                      fontSize: 11.5, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>{t.l}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label>Titolo</Label>
              <input style={inputStyle} placeholder="Es. Misure cliente Cozza"
                value={newEvent.titolo || ""}
                onChange={e => setNewEvent((p: any) => ({ ...p, titolo: e.target.value }))} />
            </div>
            <div>
              <Label>Note <span style={{ color: TH.subLight, fontWeight: 600, fontSize: 9, textTransform: "none" }}>(opzionale)</span></Label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
                placeholder="Note aggiuntive..."
                value={newEvent.note || ""}
                onChange={e => setNewEvent((p: any) => ({ ...p, note: e.target.value }))} />
            </div>
          </Section>

          {/* SEZIONE: QUANDO */}
          <Section icon={<rect x="3" y="4" width="18" height="18" rx="2"/>} title="Quando" required>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <Label>Data</Label>
                <input
                  type="date"
                  style={{ ...inputStyle, padding: "10px 12px", background: TH.white }}
                  value={(newEvent.data || (selDate ? selDate.toISOString().split('T')[0] : ''))}
                  onChange={e => setNewEvent((p: any) => ({ ...p, data: e.target.value }))}
                />
              </div>
              <div>
                <Label>Inizio</Label>
                <input type="time" style={inputStyle} value={newEvent.oraInizio || "08:30"}
                  onChange={e => setNewEvent((p: any) => ({ ...p, oraInizio: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label>Durata stimata</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {DURATE.map(d => {
                  const sel = durata === d.id;
                  return (
                    <button key={d.id} onClick={() => setNewEvent((p: any) => ({ ...p, durata: d.id }))} style={{
                      background: sel ? TH.navy : TH.white,
                      border: `1.5px solid ${sel ? TH.navy : TH.border}`,
                      color: sel ? TH.white : TH.sub,
                      borderRadius: 999, padding: "7px 14px",
                      fontSize: 11.5, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>{d.l}</button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setShowRipetiMenu(!showRipetiMenu)} style={{
              width: "100%",
              background: TH.bgPage, border: `1px solid ${TH.borderSoft}`,
              borderRadius: 9, padding: "9px 12px",
              display: "flex", alignItems: "center", gap: 8,
              cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: TH.bgPill, color: TH.navy,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: TH.ink, textAlign: "left" }}>Ripeti</div>
              <div style={{ fontSize: 11, color: TH.sub, fontWeight: 700 }}>{newEvent.ripeti || "Mai"} ›</div>
            </button>
          </Section>

          {/* SEZIONE: CLIENTE */}
          <Section icon={<><circle cx="12" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></>} title="Cliente" optional>
            {clienteSel ? (
              <div style={{
                background: TH.bgPill, border: `1.5px solid ${TH.navy}`,
                borderRadius: 12, padding: 10,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: TH.navy, color: TH.white,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                }}>
                  {((clienteSel.nome || "").charAt(0) + (clienteSel.cognome || "").charAt(0)).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink, textTransform: "uppercase" }}>
                    {clienteSel.nome} {clienteSel.cognome}
                  </div>
                  {clienteSel.telefono && (
                    <div style={{ fontSize: 11, color: TH.sub, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {clienteSel.telefono}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {clienteSel.telefono && (
                    <button onClick={() => window.open(`tel:${clienteSel.telefono}`)} style={iconBtnStyle} title="Chiama">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </button>
                  )}
                  <button onClick={() => setShowSearchCliente(true)} style={iconBtnStyle} title="Cambia">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowSearchCliente(true)} style={{
                width: "100%",
                background: TH.bgPill, border: `1.5px dashed ${TH.navy}`,
                borderRadius: 10, padding: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: 12, fontWeight: 800, color: TH.navy,
                cursor: "pointer", fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Cerca o aggiungi cliente
              </button>
            )}
          </Section>

          {/* SEZIONE: COMMESSA (se cliente e ci sono commesse) */}
          {clienteSel && commesseSuggerite.length > 0 && (
            <Section icon={<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>} title="Commessa" optional>
              {(newEvent.cmId ? commesseSuggerite.filter(c => c.id === newEvent.cmId) : commesseSuggerite).slice(0, 3).map(cm => {
                const sel = newEvent.cmId === cm.id;
                return (
                  <button key={cm.id} onClick={() => setNewEvent((p: any) => ({ ...p, cmId: sel ? null : cm.id, commessaCode: sel ? null : cm.code, indirizzo: sel ? p.indirizzo : cm.indirizzo }))}
                    style={{
                      width: "100%",
                      background: sel ? TH.bgPill : TH.white,
                      border: `1.5px solid ${sel ? TH.navy : TH.borderSoft}`,
                      borderRadius: 10, padding: "10px 12px",
                      marginBottom: 5,
                      display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>
                    <div style={{
                      background: TH.navy, color: TH.white,
                      padding: "3px 8px", borderRadius: 6,
                      fontSize: 11, fontWeight: 800,
                      fontFamily: "JetBrains Mono, monospace", letterSpacing: 0.3,
                      flexShrink: 0,
                    }}>{cm.code}</div>
                    <div style={{ flex: 1, fontSize: 11.5, color: TH.sub, fontWeight: 600 }}>
                      <div style={{ color: TH.ink, fontWeight: 700 }}>{cm.fase || "—"} · {(cm.rilievi?.[0]?.vani?.length || 0)} vani</div>
                      <div style={{ fontSize: 10, color: TH.subLight, marginTop: 2 }}>{cm.indirizzo}</div>
                    </div>
                    {sel && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                );
              })}
            </Section>
          )}

          {/* SEZIONE: DOVE */}
          <Section icon={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} title="Dove" optional>
            <div style={{ marginBottom: 8 }}>
              <Label>Indirizzo</Label>
              <input style={inputStyle} placeholder="Via, città"
                value={newEvent.indirizzo || ""}
                onChange={e => setNewEvent((p: any) => ({ ...p, indirizzo: e.target.value }))} />
            </div>
            {newEvent.indirizzo && (
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newEvent.indirizzo)}`, "_blank")} style={chipBtnStyle}>📍 Apri mappa</button>
                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(newEvent.indirizzo)}`, "_blank")} style={chipBtnStyle}>🧭 Naviga</button>
              </div>
            )}
          </Section>

          {/* SEZIONE: CHI */}
          {(team || []).length > 0 && (
            <Section icon={<><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></>} title="Chi" optional sub="(squadra)">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {(team || []).slice(0, 8).map((m: any) => {
                  const sel = squadraSel.includes(m.id);
                  const initials = (m.nome || "M").charAt(0).toUpperCase();
                  return (
                    <button key={m.id} onClick={() => toggleMembro(m.id)} style={{
                      background: sel ? TH.navy : TH.white,
                      border: `1.5px solid ${sel ? TH.navy : TH.border}`,
                      color: sel ? TH.white : TH.sub,
                      borderRadius: 999, padding: "7px 12px",
                      fontSize: 11.5, fontWeight: 800,
                      cursor: "pointer", fontFamily: "inherit",
                      letterSpacing: 0.3, textTransform: "uppercase",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>{m.nome}</button>
                  );
                })}
              </div>
            </Section>
          )}

          {/* SEZIONE: NOTIFICHE */}
          <Section icon={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>} title="Notifiche" optional>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[
                { id: "1h", l: "1 ora prima" },
                { id: "15m", l: "15 min prima" },
                { id: "inizio", l: "All'inizio" },
              ].map(n => {
                const sel = notifs.includes(n.id);
                return (
                  <button key={n.id} onClick={() => toggleNotif(n.id)} style={{
                    background: sel ? TH.bgPill : TH.white,
                    border: `1.5px solid ${sel ? TH.navy : TH.border}`,
                    color: sel ? TH.navy : TH.sub,
                    borderRadius: 999, padding: "7px 12px",
                    fontSize: 11.5, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", gap: 5,
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}>
                    {sel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    {n.l}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* SEZIONE: ALLEGATI */}
          <Section icon={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>} title="Allegati" optional>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                { l: "FOTO", icon: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></> },
                { l: "FILE", icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/> },
                { l: "VOCE", icon: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/></> },
              ].map(a => (
                <button key={a.l} style={{
                  background: TH.bgPage, border: `1px dashed ${TH.border}`,
                  borderRadius: 10, padding: "12px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  cursor: "pointer", fontFamily: "inherit",
                  color: TH.sub,
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">{a.icon}</svg>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5 }}>{a.l}</div>
                </button>
              ))}
            </div>
          </Section>

        </div>

        {/* ═══ FOOTER STICKY: ANNULLA + CREA ═══ */}
        <div style={{
          padding: "12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)",
          borderTop: `1px solid ${TH.borderSoft}`,
          display: "flex", gap: 8,
          background: TH.white,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 13, borderRadius: 10,
            background: TH.bgPage, color: TH.sub,
            border: `1px solid ${TH.border}`,
            fontSize: 13, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}>Annulla</button>
          <button onClick={addEvent} disabled={!newEvent.titolo?.trim()} style={{
            flex: 2, padding: 13, borderRadius: 10,
            background: newEvent.titolo?.trim() ? `linear-gradient(135deg, ${TH.navy} 0%, ${TH.navyDark} 100%)` : "#CBD5E1",
            color: TH.white, border: "none",
            fontSize: 13, fontWeight: 800,
            cursor: newEvent.titolo?.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: newEvent.titolo?.trim() ? "0 4px 12px rgba(15,27,45,0.3)" : "none",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}>
            Crea {tipoMacro === "task" ? "Task" : tipoMacro === "task_cm" ? "Task Commessa" : "Evento"}
          </button>
        </div>

        {/* ═══ MODAL SEARCH CLIENTE ═══ */}
        {showSearchCliente && (
          <div onClick={() => setShowSearchCliente(false)} style={{
            position: "absolute", inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            zIndex: 10,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: TH.white,
              width: "100%", maxHeight: "75%",
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px 8px", borderBottom: `1px solid ${TH.borderSoft}` }}>
                <div style={{ width: 36, height: 4, background: TH.border, borderRadius: 2, margin: "0 auto 10px" }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: TH.ink, marginBottom: 8 }}>Cerca cliente</div>
                <div style={{ position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.subLight} strokeWidth="2.5" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input autoFocus style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Nome, cognome o telefono..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
                <button onClick={() => {
                  // TODO: aprire modal "Nuovo Cliente"
                  setShowSearchCliente(false);
                }} style={{
                  width: "100%",
                  background: TH.bgPill, border: `1.5px dashed ${TH.navy}`,
                  borderRadius: 10, padding: "10px",
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 10,
                  cursor: "pointer", fontFamily: "inherit",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: TH.navy, color: TH.white,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TH.navy }}>Crea nuovo cliente</div>
                    <div style={{ fontSize: 10, color: TH.sub }}>Aggiungilo alla rubrica</div>
                  </div>
                </button>

                {filteredContatti.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: TH.sub }}>Nessun cliente trovato</div>
                ) : (
                  filteredContatti.map((c: any) => (
                    <button key={c.id} onClick={() => {
                      setNewEvent((p: any) => ({ ...p, cliente: c, indirizzo: p.indirizzo || c.indirizzo || "" }));
                      setShowSearchCliente(false);
                      setSearchTerm("");
                    }} style={{
                      width: "100%",
                      background: TH.white, border: `1px solid ${TH.borderSoft}`,
                      borderRadius: 10, padding: 10,
                      marginBottom: 5,
                      display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: TH.navy, color: TH.white,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                      }}>{((c.nome || "").charAt(0) + (c.cognome || "").charAt(0)).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: TH.ink, textTransform: "uppercase" }}>{c.nome} {c.cognome}</div>
                        {c.telefono && <div style={{ fontSize: 10.5, color: TH.sub, marginTop: 2 }}>{c.telefono}</div>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── COMPONENTI HELPER ───────────────────────────────────────
function Section({ icon, title, required, optional, sub, children }: any) {
  return (
    <div style={{
      background: "#F8FAFC",
      border: `1px solid ${TH.borderSoft}`,
      borderRadius: 12, padding: 12,
      marginBottom: 10,
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: TH.navy, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{icon}</svg>
        {title}
        {required && <span style={{ color: TH.red }}>*</span>}
        {optional && <span style={{ color: TH.subLight, fontWeight: 600, textTransform: "none", letterSpacing: 0, fontSize: 9 }}>{sub || "(opzionale)"}</span>}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: any) {
  return <div style={{ fontSize: 9.5, fontWeight: 800, color: TH.sub, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box" as any,
  background: TH.white, border: `1.5px solid ${TH.border}`,
  borderRadius: 9, padding: "10px 12px",
  fontSize: 13, fontFamily: "inherit",
  color: TH.ink, fontWeight: 600,
};

const iconBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 9,
  background: TH.white, border: `1px solid ${TH.border}`,
  color: TH.navy,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", fontFamily: "inherit", padding: 0,
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

const chipBtnStyle: React.CSSProperties = {
  flex: 1, background: TH.bgPill, border: `1px solid ${TH.navy}40`,
  borderRadius: 8, padding: "8px 12px",
  fontSize: 11, fontWeight: 700, color: TH.navy,
  cursor: "pointer", fontFamily: "inherit",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};
