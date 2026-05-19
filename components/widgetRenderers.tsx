"use client";
import React, { useState } from "react";

// ═══════════════════════════════════════════════════════════
// DESIGN TOKENS v3 - Palette mockup v3 + interazioni iPhone-style
// ═══════════════════════════════════════════════════════════
const DARK = "#0D1F1F";
const INK = "#0F2525";
const SUB = "#5A7878";
const MUTED = "#8FA8A8";
const BORDER_SOFT = "rgba(200,228,228,0.3)";

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const TEAL_BRIGHT = "#5FD0D0";

const FASE: any = {
  sopralluogo:  { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)" },
  rilievo:      { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)" },
  preventivo:   { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", solid: "#1D9E75", dark: "#04342C", tint: "rgba(29,158,117,0.12)", bg: "rgba(29,158,117,0.08)" },
  conferma:     { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  ordini:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  ordine:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)" },
  produzione:   { grad: "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)", solid: "#378ADD", dark: "#042C53", tint: "rgba(55,138,221,0.12)", bg: "rgba(55,138,221,0.08)" },
  posa:         { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  montaggio:    { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  collaudo:     { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", bg: "rgba(212,83,126,0.1)" },
  consegna:     { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", bg: "rgba(99,153,34,0.1)" },
  fattura:      { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", bg: "rgba(99,153,34,0.1)" },
  chiusura:     { grad: "linear-gradient(155deg, #888780 0%, #5F5E5A 100%)", solid: "#5F5E5A", dark: "#2C2C2A", tint: "rgba(95,94,90,0.14)", bg: "rgba(95,94,90,0.1)" },
  ferma:        { grad: "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)", solid: "#E24B4A", dark: "#8B1A1A", tint: "rgba(226,75,74,0.14)", bg: "rgba(226,75,74,0.1)" },
};

const getFase = (f: string): any => {
  if (!f) return FASE.sopralluogo;
  const k = f.toLowerCase();
  if (k.includes("ferma")) return FASE.ferma;
  if (k.includes("rilievo") || k.includes("sopral")) return FASE.sopralluogo;
  if (k.includes("preventivo")) return FASE.preventivo;
  if (k.includes("conferma") || k.includes("ordin")) return FASE.ordini;
  if (k.includes("produzione")) return FASE.produzione;
  if (k.includes("posa") || k.includes("montag") || k.includes("collaudo")) return FASE.posa;
  if (k.includes("fattur") || k.includes("saldo") || k.includes("consegn")) return FASE.fattura;
  if (k.includes("chius") || k.includes("archivi")) return FASE.chiusura;
  return FASE.sopralluogo;
};

// ═══════════════════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════════════════
const today = () => new Date().toISOString().slice(0, 10);
const daysSince = (date: any): number => {
  if (!date || date === 0 || date === "0") return 0;
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;
  if (d.getTime() < 1577836800000) return 0;
  const diff = Date.now() - d.getTime();
  const gg = Math.floor(diff / 86400000);
  return gg < 0 ? 0 : gg;
};
const eur = (n: number): string => {
  if (!n || n <= 0) return "—";
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n)}`;
};
const eurFull = (n: number): string => {
  if (!n || n <= 0) return "€0";
  return "€" + Math.round(n).toLocaleString("it-IT");
};
const pick = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") return obj[k];
  }
  return null;
};
const valoreCM = (c: any): number => Number(pick(c, "totale_finale", "totale_preventivo", "euro", "totale", "valore_totale")) || 0;
const clienteCM = (c: any): string => {
  const _v = c?.cliente_nome || c?.cliente;
  const _name = _toStr(_v) || _v;
  if (typeof _name !== "string") return "—";
  const _v = c?.cliente_nome || c?.cliente;
  const _name = _toStr(_v) || _v;
  if (typeof _name !== "string") return "—";
  const nome = pick(c, "cliente", "cliente_nome");
  const cognome = pick(c, "cognome");
  if (nome && cognome) return `${nome} ${cognome}`;
  return nome || cognome || "—";
};
const initials = (s: string): string => {
  if (!s) return "—";
  const parts = s.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || s[0]?.toUpperCase() || "—";
};
const lastCMActivity = (c: any): any => pick(c, "ops_ultimo_avanzamento", "fase_start", "updated_at", "aggiornato", "created_at", "creato");
const fattPagata = (f: any): boolean => {
  if (f?.pagata === true) return true;
  if (f?.stato === "pagata" || f?.stato === "paid") return true;
  const residuo = Number(f?.residuo);
  if (!isNaN(residuo) && residuo === 0 && Number(f?.totale) > 0) return true;
  return false;
};
const fattImporto = (f: any): number => Number(pick(f, "totale", "importo")) || 0;
const fattScadenza = (f: any): string | null => pick(f, "data_scadenza", "scadenza");
const _toStr = (v: any): string => { if (v == null) return ""; if (typeof v === "string") return v; if (typeof v === "number") return String(v); if (typeof v === "object") return v.nome || v.ragione_sociale || v.denominazione || v.label || ""; return ""; };
const fattCliente = (f: any): string => _toStr(pick(f, "cliente", "ragione_sociale")) || "—";
const telLink = (t: string | null | undefined) => t ? `tel:${t}` : "#";
const waLink = (t: string | null | undefined, msg: string = "") => t ? `https://wa.me/${t.replace(/\D/g, "")}${msg ? "?text=" + encodeURIComponent(msg) : ""}` : "#";
const mapsLink = (addr: string | null | undefined) => addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` : "#";

// ═══════════════════════════════════════════════════════════
// COMPONENTI BASE
// ═══════════════════════════════════════════════════════════
const Empty = ({ msg, icon }: { msg: string; icon?: string }) => (
  <div style={{
    display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
    padding: "28px 16px", gap: 10,
  }}>
    {icon && <div style={{ fontSize: 36, opacity: 0.35 }}>{icon}</div>}
    <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center" as const, fontWeight: 600 }}>{msg}</p>
  </div>
);

const Avatar = ({ text, fase, size = 34, urgent }: any) => {
  const f = urgent ? FASE.ferma : getFase(fase || "");
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: f.grad,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 900, color: "#fff",
      boxShadow: "0 3px 8px rgba(13,31,31,0.18), inset 0 1px 1px rgba(255,255,255,0.25)",
      letterSpacing: "-0.2px",
      textShadow: "0 1px 2px rgba(0,0,0,0.15)",
    }}>{text}</div>
  );
};

const QuickActions = ({ tel: t, addr, onOpen, msg, color }: any) => (
  <div style={{
    display: "flex", gap: 6, marginTop: 10,
    paddingTop: 10, borderTop: "1px dashed " + BORDER_SOFT,
  }}>
    {t && (
      <a href={telLink(t)} onClick={e => e.stopPropagation()} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "7px", borderRadius: 8, textDecoration: "none",
        background: FASE.preventivo.tint, color: FASE.preventivo.dark,
        fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
        border: "1px solid " + FASE.preventivo.solid + "30",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        CHIAMA
      </a>
    )}
    {t && (
      <a href={waLink(t, msg)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "7px", borderRadius: 8, textDecoration: "none",
        background: "rgba(37,211,102,0.12)", color: "#075E54",
        fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
        border: "1px solid rgba(37,211,102,0.3)",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
        CHAT
      </a>
    )}
    {addr && (
      <a href={mapsLink(addr)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "7px", borderRadius: 8, textDecoration: "none",
        background: FASE.produzione.tint, color: FASE.produzione.dark,
        fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
        border: "1px solid " + FASE.produzione.solid + "30",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        NAVIGA
      </a>
    )}
    {onOpen && (
      <button onClick={e => { e.stopPropagation(); onOpen(); }} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "7px", borderRadius: 8, border: "none",
        background: color?.grad || TEAL, color: "#fff",
        fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", cursor: "pointer",
        boxShadow: `0 2px 6px ${color?.tint || "rgba(40,160,160,0.3)"}`,
      }}>
        APRI →
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════
// 1) AGENDA — iPhone Calendar style
// ═══════════════════════════════════════════════════════════
const AgendaWidget = ({ data, nav }: any) => {
  const events = data?.events || [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [view, setView] = useState<"oggi" | "7gg">("oggi");
  const td = today();

  const week = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const filtered = events.filter((e: any) => {
    const d = pick(e, "data", "date");
    const st = e?.start_time;
    const done = e?.completato || e?.annullato;
    if (done) return false;
    if (view === "oggi") return d === td || (st || "").startsWith(td);
    return week.some(w => d === w || (st || "").startsWith(w));
  });

  filtered.sort((a: any, b: any) => {
    const ta = (pick(a, "data", "date") || "") + " " + (pick(a, "ora", "time") || (a?.start_time || "").slice(11, 16) || "99:99");
    const tb = (pick(b, "data", "date") || "") + " " + (pick(b, "ora", "time") || (b?.start_time || "").slice(11, 16) || "99:99");
    return ta.localeCompare(tb);
  });

  if (filtered.length === 0) {
    return <Empty msg={view === "oggi" ? "Nessun evento oggi" : "Settimana libera"} icon="📅" />;
  }

  return (
    <div>
      <div style={{
        display: "flex", gap: 3, padding: 3, marginBottom: 10,
        background: "rgba(40,160,160,0.08)", borderRadius: 10,
      }}>
        {[["oggi", "Oggi"], ["7gg", "7 giorni"]].map(([v, l]) => (
          <div key={v} onClick={() => setView(v as any)} style={{
            flex: 1, textAlign: "center" as const,
            padding: "6px 10px", borderRadius: 8,
            fontSize: 10, fontWeight: 900, cursor: "pointer",
            background: view === v ? "#fff" : "transparent",
            color: view === v ? INK : SUB,
            boxShadow: view === v ? "0 2px 4px rgba(13,31,31,0.08)" : "none",
            letterSpacing: "0.2px",
          }}>{l}</div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {filtered.slice(0, view === "oggi" ? 5 : 10).map((e: any, i: number) => {
          const ora = pick(e, "ora", "time") || (e?.start_time || "").slice(11, 16) || "—";
          const dataE = pick(e, "data", "date") || (e?.start_time || "").slice(0, 10);
          const tipo = (pick(e, "tipo", "event_type", "type") || "").toLowerCase();
          const titolo = pick(e, "titolo", "title", "text");
          const persona = pick(e, "persona", "client_name", "cliente");
          const addr = pick(e, "indirizzo", "address", "addr");
          const telefono = pick(e, "telefono", "phone");
          const f = getFase(tipo);
          const isToday = dataE === td;
          const giorno = isToday ? "Oggi" : (() => {
            const d = new Date(dataE);
            return ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getDay()];
          })();
          const key = e.id || `e${i}`;
          const isOpen = expanded === key;

          return (
            <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{
              background: "#fff", borderRadius: 12,
              border: "1px solid " + BORDER_SOFT,
              overflow: "hidden" as const,
              cursor: "pointer",
              boxShadow: isOpen ? `0 6px 16px ${f.tint}, 0 0 0 2px ${f.solid}` : "0 2px 6px rgba(13,31,31,0.05)",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "stretch", gap: 10, padding: "10px 12px" }}>
                <div style={{
                  display: "flex", flexDirection: "column" as const,
                  alignItems: "center", justifyContent: "center",
                  width: 54, flexShrink: 0,
                  background: f.grad,
                  borderRadius: 10,
                  padding: "5px 0",
                  color: "#fff",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.3px", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{ora}</div>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.4px", opacity: 0.9, marginTop: 1 }}>
                    {view === "oggi" ? (tipo || "").slice(0, 7).toUpperCase() : giorno.toUpperCase()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {titolo || persona || "Evento"}
                  </div>
                  {(addr || persona) && (
                    <div style={{ fontSize: 10, color: SUB, fontWeight: 600, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {addr || persona}
                    </div>
                  )}
                </div>
                <span style={{
                  color: f.solid, fontSize: 16, fontWeight: 900, alignSelf: "center",
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>▾</span>
              </div>

              {isOpen && (
                <div style={{ padding: "0 12px 12px" }}>
                  {persona && titolo && (
                    <div style={{ fontSize: 11, color: SUB, fontWeight: 600, marginBottom: 6 }}>
                      Cliente: <strong style={{ color: INK }}>{persona}</strong>
                    </div>
                  )}
                  {addr && (
                    <div style={{
                      fontSize: 11, color: SUB, fontWeight: 600,
                      padding: "6px 10px", background: f.bg, borderRadius: 6,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={f.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {addr}
                    </div>
                  )}
                  <QuickActions
                    tel={telefono}
                    addr={addr}
                    onOpen={() => nav?.openEvent?.(e)}
                    msg={titolo ? `Ciao, ti confermo l'appuntamento di oggi ${ora} per "${titolo}"` : ""}
                    color={f}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length > 5 && view === "oggi" && (
        <button onClick={() => setView("7gg")} style={{
          width: "100%", marginTop: 8, padding: "8px",
          border: "1px dashed " + BORDER_SOFT, background: "transparent",
          borderRadius: 8, fontSize: 10, fontWeight: 800, color: TEAL_DARK,
          letterSpacing: "0.3px", cursor: "pointer",
        }}>Vedi settimana ({filtered.length - 5} in più)</button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 2) OGGI DEVI FARE — iPhone Reminders
// ═══════════════════════════════════════════════════════════
const OggiDeviFareWidget = ({ data, nav }: any) => {
  const cantieri = data?.cantieri || [];
  const fattureDB = data?.fattureDB || [];
  const td = today();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const actions: any[] = [];
  cantieri.filter((c: any) => c?.ferma === true && c?.ferma_dal).forEach((c: any, idx: number) => {
    const gg = daysSince(c.ferma_dal);
    if (gg > 0) actions.push({
      key: `ferma-${c.id || idx}`,
      titolo: `Sblocca ${c.code}`,
      sub: `${clienteCM(c)} · ferma da ${gg}gg`,
      motivo: c?.motivo_ferma || "in attesa",
      fase: "ferma", urgent: true,
      telefono: pick(c, "telefono", "phone"),
      addr: pick(c, "indirizzo", "address"),
      onOpen: () => nav?.openCM?.(c),
    });
  });
  cantieri.filter((c: any) => {
    const f = (c?.fase || "").toLowerCase();
    return f === "preventivo" && c?.updated_at && daysSince(c.updated_at) > 5;
  }).forEach((c: any, idx: number) => {
    actions.push({
      key: `prev-${c.id || idx}`,
      titolo: "Sollecita preventivo",
      sub: `${c.code} · ${clienteCM(c)}`,
      motivo: `${daysSince(c.updated_at)}gg senza firma`,
      fase: "preventivo",
      telefono: pick(c, "telefono", "phone"),
      addr: pick(c, "indirizzo", "address"),
      onOpen: () => nav?.openCM?.(c),
    });
  });
  fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td)).forEach((f: any, idx: number) => {
    actions.push({
      key: `fatt-${f.id || idx}`,
      titolo: `Incassa ${eur(fattImporto(f))}`,
      sub: `${fattCliente(f)} · scaduta`,
      motivo: `${daysSince(fattScadenza(f))}gg in ritardo`,
      fase: "ferma", urgent: true,
      telefono: pick(f, "telefono", "phone"),
      onOpen: () => nav?.openFatt?.(f),
    });
  });

  const visibili = actions.filter(a => !done.has(a.key));

  if (actions.length === 0) return <Empty msg="Tutto sotto controllo" icon="✓" />;
  if (visibili.length === 0) return <Empty msg="Completate tutte le azioni" icon="🎉" />;

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 10px", marginBottom: 8,
        background: "linear-gradient(145deg, rgba(40,160,160,0.08), rgba(40,160,160,0.03))",
        borderRadius: 10,
      }}>
        <div style={{ flex: 1, height: 5, background: "rgba(200,228,228,0.4)", borderRadius: 3, overflow: "hidden" as const }}>
          <div style={{
            height: "100%", width: `${(done.size / actions.length) * 100}%`,
            background: `linear-gradient(90deg, ${TEAL_BRIGHT}, ${TEAL})`,
            borderRadius: 3, transition: "width 0.3s",
          }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 900, color: TEAL_DARK, letterSpacing: "0.3px" }}>
          {done.size}/{actions.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
        {visibili.slice(0, 5).map(a => {
          const f = getFase(a.fase);
          const isOpen = expanded === a.key;

          return (
            <div key={a.key} style={{
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${f.solid}`,
              boxShadow: isOpen ? `0 6px 16px ${f.tint}` : "0 2px 6px rgba(13,31,31,0.04)",
              overflow: "hidden" as const,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px" }}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDone(prev => { const n = new Set(prev); n.add(a.key); return n; });
                  }}
                  style={{
                    width: 22, height: 22, borderRadius: 11,
                    border: `2px solid ${f.solid}80`,
                    background: "#fff",
                    cursor: "pointer", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                />

                <div onClick={() => setExpanded(isOpen ? null : a.key)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {a.titolo}
                  </div>
                  <div style={{ fontSize: 10, color: SUB, fontWeight: 600, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {a.sub}
                  </div>
                </div>

                <span onClick={() => setExpanded(isOpen ? null : a.key)} style={{
                  color: f.solid, fontSize: 14, fontWeight: 900,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                }}>▾</span>
              </div>

              {isOpen && (
                <div style={{ padding: "0 11px 11px" }}>
                  {a.motivo && (
                    <div style={{
                      fontSize: 11, color: f.dark, fontWeight: 700,
                      padding: "5px 9px", background: f.bg, borderRadius: 6,
                    }}>⚠ {a.motivo}</div>
                  )}
                  <QuickActions
                    tel={a.telefono}
                    addr={a.addr}
                    onOpen={a.onOpen}
                    msg={`Ciao, ti scrivo per ${a.titolo.toLowerCase()}.`}
                    color={f}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 3) LAVORI IN CORSO — espandibile con KPI
// ═══════════════════════════════════════════════════════════
const LavoriInCorsoWidget = ({ data, nav }: any) => {
  const cantieri = data?.cantieri || [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const a = cantieri.filter((c: any) => {
    const f = (c?.fase || "").toLowerCase();
    return c?.fase && !f.includes("chius") && !f.includes("consegn") && !f.includes("archivi");
  });
  if (a.length === 0) return <Empty msg="Nessun lavoro attivo" icon="🔨" />;
  a.sort((x: any, y: any) => daysSince(lastCMActivity(y)) - daysSince(lastCMActivity(x)));

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
      {a.slice(0, 5).map((c: any, i: number) => {
        const key = c.id || `c${i}`;
        const isOpen = expanded === key;
        const fase = c.fase || "—";
        const f = getFase(fase);
        const cliente = clienteCM(c);
        const valore = valoreCM(c);
        const gg = daysSince(lastCMActivity(c));
        const fermo = c?.ferma === true || gg >= 7;
        const vani = c?.vani?.length || 0;
        const fBase = fermo ? FASE.ferma : f;

        return (
          <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{
            background: "#fff", borderRadius: 10,
            border: "1px solid " + BORDER_SOFT,
            borderLeft: `3px solid ${fBase.solid}`,
            cursor: "pointer",
            overflow: "hidden" as const,
            boxShadow: isOpen ? `0 6px 16px ${fBase.tint}` : "0 2px 6px rgba(13,31,31,0.04)",
            transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px" }}>
              <Avatar text={initials(cliente)} fase={fase} size={32} urgent={fermo} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {c.code} · {typeof cliente === "string" ? cliente : (cliente?.nome || cliente?.ragione_sociale || cliente?.denominazione || "")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 5,
                    background: fBase.tint, color: fBase.dark,
                    letterSpacing: "0.3px", textTransform: "uppercase" as const,
                  }}>{fase}</span>
                  {valore > 0 && <span style={{ fontSize: 10, color: SUB, fontWeight: 700 }}>{eur(valore)}</span>}
                  {fermo && <span style={{ fontSize: 9, color: FASE.ferma.dark, fontWeight: 900 }}>{gg}gg</span>}
                </div>
              </div>
              <span style={{
                color: fBase.solid, fontSize: 14, fontWeight: 900,
                transform: isOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▾</span>
            </div>

            {isOpen && (
              <div style={{ padding: "0 11px 11px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <div style={{ background: fBase.bg, borderRadius: 7, padding: "6px 8px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: SUB, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>Vani</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: INK }}>{vani}</div>
                  </div>
                  <div style={{ background: fBase.bg, borderRadius: 7, padding: "6px 8px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: SUB, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>Valore</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: INK }}>{eur(valore)}</div>
                  </div>
                  <div style={{ background: fBase.bg, borderRadius: 7, padding: "6px 8px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: SUB, letterSpacing: "0.4px", textTransform: "uppercase" as const }}>Ultimo</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: fermo ? FASE.ferma.dark : INK }}>{gg}gg</div>
                  </div>
                </div>
                <QuickActions
                  tel={pick(c, "telefono", "phone")}
                  addr={pick(c, "indirizzo", "address")}
                  onOpen={() => nav?.openCM?.(c)}
                  msg={`Aggiornamento commessa ${c.code}: `}
                  color={fBase}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 4) FATTURE DA INCASSARE — con hero + lista espandibile
// ═══════════════════════════════════════════════════════════
const FattureIncassareWidget = ({ data, nav, onlyScadute }: any) => {
  const fattureDB = data?.fattureDB || [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const td = today();

  const da = onlyScadute
    ? fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td))
    : fattureDB.filter((f: any) => !fattPagata(f));
  if (da.length === 0) return <Empty msg={onlyScadute ? "Nessuna fattura scaduta" : "Tutto incassato"} icon="✓" />;
  const totale = da.reduce((s: number, f: any) => s + fattImporto(f), 0);
  const heroFase = onlyScadute ? FASE.ferma : FASE.fattura;

  return (
    <>
      <div style={{
        background: heroFase.grad,
        borderRadius: 12, padding: "12px 14px", marginBottom: 8,
        color: "#fff",
        boxShadow: `0 4px 14px ${heroFase.tint}`,
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>
          {onlyScadute ? "⚠ Scadute" : "Da incassare"}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>{eurFull(totale)}</div>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>{da.length} fattur{da.length === 1 ? "a" : "e"}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
        {da.slice(0, 4).map((f: any, i: number) => {
          const key = f.id || `f${i}`;
          const scad = fattScadenza(f);
          const scaduta = scad && new Date(scad) < new Date(td);
          const gg = scad ? daysSince(scad) : 0;
          const ff = scaduta ? FASE.ferma : FASE.fattura;
          const isOpen = expanded === key;
          const cliente = fattCliente(f);

          return (
            <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${ff.solid}`,
              cursor: "pointer",
              overflow: "hidden" as const,
              boxShadow: isOpen ? `0 6px 16px ${ff.tint}` : "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: ff.solid, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{typeof cliente === "string" ? cliente : (cliente?.nome || cliente?.ragione_sociale || cliente?.denominazione || "")}</div>
                  <div style={{ fontSize: 10, color: scaduta ? FASE.ferma.dark : SUB, fontWeight: 700 }}>
                    {scad ? (scaduta ? `${gg}gg in ritardo` : `scade ${scad}`) : "no scadenza"}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: ff.dark }}>{eur(fattImporto(f))}</div>
                <span style={{
                  color: ff.solid, fontSize: 14, fontWeight: 900,
                  transform: isOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>▾</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 11px 11px" }}>
                  <QuickActions
                    tel={pick(f, "telefono", "phone")}
                    addr={null}
                    onOpen={() => nav?.openFatt?.(f)}
                    msg={scaduta
                      ? `Buongiorno, le ricordo la fattura di ${eurFull(fattImporto(f))} scaduta da ${gg}gg. Quando può saldare?`
                      : `Buongiorno, le ricordo la fattura di ${eurFull(fattImporto(f))} in scadenza il ${scad}. Grazie`}
                    color={ff}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// 5) COMMESSE IN RITARDO — card rosse espandibili
// ═══════════════════════════════════════════════════════════
const CommesseRitardoWidget = ({ data, nav }: any) => {
  const cantieri = data?.cantieri || [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const r = cantieri.filter((c: any) => c?.ferma === true && c?.ferma_dal);
  if (r.length === 0) return <Empty msg="Tutto in orario" icon="✓" />;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
      {r.slice(0, 4).map((c: any, i: number) => {
        const key = c.id || `c${i}`;
        const gg = daysSince(c.ferma_dal);
        const isOpen = expanded === key;

        return (
          <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{
            background: FASE.ferma.grad,
            borderRadius: 12,
            cursor: "pointer",
            overflow: "hidden" as const,
            boxShadow: `0 4px 12px rgba(226,75,74,0.25)`,
            color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <Avatar text={initials(clienteCM(c))} urgent size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, textShadow: "0 1px 2px rgba(0,0,0,0.15)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {c.code} · {clienteCM(c)}
                </div>
                <div style={{ fontSize: 10, opacity: 0.9, fontWeight: 700, marginTop: 1 }}>
                  {c?.motivo_ferma || "ferma"} · {gg} gg
                </div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.95)", color: FASE.ferma.dark,
                letterSpacing: "0.4px", flexShrink: 0,
              }}>FERMA</span>
            </div>
            {isOpen && (
              <div style={{ padding: "10px 12px 12px", background: "rgba(0,0,0,0.12)" }}>
                <div style={{
                  padding: "8px 10px", marginBottom: 10,
                  background: "rgba(0,0,0,0.2)", borderRadius: 6,
                  fontSize: 11, fontWeight: 700,
                }}>
                  ⚠ {c?.motivo_ferma || "Motivo non specificato"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {pick(c, "telefono", "phone") && (
                    <a href={telLink(pick(c, "telefono", "phone"))} onClick={e => e.stopPropagation()} style={{
                      flex: 1, padding: "7px", borderRadius: 8, textDecoration: "none",
                      background: "rgba(255,255,255,0.95)", color: FASE.ferma.dark,
                      fontSize: 10, fontWeight: 900, textAlign: "center" as const, letterSpacing: "0.3px",
                    }}>☎ CHIAMA</a>
                  )}
                  {pick(c, "telefono", "phone") && (
                    <a href={waLink(pick(c, "telefono", "phone"), `Ciao, sulla commessa ${c.code} volevo sbloccare. Possiamo parlare?`)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                      flex: 1, padding: "7px", borderRadius: 8, textDecoration: "none",
                      background: "rgba(255,255,255,0.95)", color: "#075E54",
                      fontSize: 10, fontWeight: 900, textAlign: "center" as const, letterSpacing: "0.3px",
                    }}>💬 CHAT</a>
                  )}
                  <button onClick={e => { e.stopPropagation(); nav?.openCM?.(c); }} style={{
                    flex: 1, padding: "7px", borderRadius: 8, border: "none",
                    background: "rgba(0,0,0,0.3)", color: "#fff",
                    fontSize: 10, fontWeight: 900, cursor: "pointer", letterSpacing: "0.3px",
                  }}>APRI →</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 6) SQUADRA — stato live + montaggio oggi + click → Team
// ═══════════════════════════════════════════════════════════
const STATO_CFG: Record<string, { dot: string; label: string; tint: string; dark: string }> = {
  attivo:   { dot: "#1D9E75", label: "Attivo",   tint: "rgba(29,158,117,0.12)",  dark: "#04342C" },
  pausa:    { dot: "#EF9F27", label: "Pausa",    tint: "rgba(239,159,39,0.15)",  dark: "#854F0B" },
  problema: { dot: "#E24B4A", label: "Problema", tint: "rgba(226,75,74,0.14)",   dark: "#8B1A1A" },
  viaggio:  { dot: "#378ADD", label: "Viaggio",  tint: "rgba(55,138,221,0.12)",  dark: "#042C53" },
  libero:   { dot: "#8FA8A8", label: "Libero",   tint: "rgba(143,168,168,0.12)", dark: "#3A5555" },
};

const SquadraWidget = ({ data, nav }: any) => {
  const team = data?.team || [];
  const montaggi = data?.montaggiDB || data?.montaggi || [];
  const todayStr = new Date().toISOString().slice(0, 10);

  if (team.length === 0) return <Empty msg="Nessun membro in squadra" icon="👷" />;

  const montaggiOggi = montaggi.filter((m: any) => {
    const d = m.data || m.dataMontaggio || m.data_montaggio || "";
    return String(d).startsWith(todayStr);
  });

  const attivi   = team.filter((t: any) => (t.stato || t.status) === "attivo").length;
  const problemi = team.filter((t: any) => (t.stato || t.status) === "problema").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "rgba(29,158,117,0.1)", borderRadius: 10, padding: "6px 8px", textAlign: "center" as const }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#04342C", lineHeight: 1 }}>{attivi}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#1D9E75", marginTop: 2, letterSpacing: "0.3px" }}>ATTIVI</div>
        </div>
        <div style={{ flex: 1, background: "rgba(143,168,168,0.1)", borderRadius: 10, padding: "6px 8px", textAlign: "center" as const }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: DARK, lineHeight: 1 }}>{team.length}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: SUB, marginTop: 2, letterSpacing: "0.3px" }}>TOTALE</div>
        </div>
        <div style={{ flex: 1, background: montaggiOggi.length > 0 ? "rgba(55,138,221,0.1)" : "rgba(143,168,168,0.08)", borderRadius: 10, padding: "6px 8px", textAlign: "center" as const }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: montaggiOggi.length > 0 ? "#042C53" : DARK, lineHeight: 1 }}>{montaggiOggi.length}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: montaggiOggi.length > 0 ? "#378ADD" : SUB, marginTop: 2, letterSpacing: "0.3px" }}>OGGI</div>
        </div>
        {problemi > 0 && (
          <div style={{ flex: 1, background: "rgba(226,75,74,0.1)", borderRadius: 10, padding: "6px 8px", textAlign: "center" as const }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#8B1A1A", lineHeight: 1 }}>{problemi}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#E24B4A", marginTop: 2, letterSpacing: "0.3px" }}>PROB.</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {team.slice(0, 5).map((t: any, i: number) => {
          const key = t.id || `t${i}`;
          const nome = pick(t, "nome", "name") || "—";
          const ruolo = pick(t, "ruolo", "role") || "";
          const stato = (t.stato || t.status || "libero") as string;
          const cfg = STATO_CFG[stato] || STATO_CFG.libero;

          const montaggioOp = montaggiOggi.find((m: any) => {
            const squadra: string[] = m.squadra || m.operatori || [];
            return (
              m.operatoreId === key || m.operatore_id === key ||
              squadra.includes(key) || squadra.includes(nome)
            );
          });
          const cmLabel = montaggioOp
            ? (montaggioOp.cmCode || montaggioOp.codice || montaggioOp.cliente || "Montaggio")
            : (pick(t, "cantiere_attuale", "cantiere") || null);

          return (
            <div key={key} onClick={() => nav?.goto?.("team")} style={{
              background: "#fff", borderRadius: 11, padding: "9px 11px",
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${cfg.dot}`,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
            }}>
              <div style={{ position: "relative" as const, flexShrink: 0 }}>
                <Avatar text={initials(nome)} fase={stato === "attivo" ? "produzione" : stato === "problema" ? "ferma" : "preventivo"} size={30} />
                <div style={{
                  position: "absolute" as const, bottom: -1, right: -1,
                  width: 9, height: 9, borderRadius: "50%",
                  background: cfg.dot, border: "2px solid #fff",
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{nome}</div>
                <div style={{ fontSize: 9, color: SUB, fontWeight: 600, letterSpacing: "0.2px", textTransform: "uppercase" as const }}>{ruolo}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                <div style={{
                  fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 5,
                  background: cfg.tint, color: cfg.dark,
                  letterSpacing: "0.3px", textTransform: "uppercase" as const,
                }}>● {cfg.label}</div>
                {cmLabel && (
                  <div style={{ fontSize: 8, color: MUTED, fontWeight: 600, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                    {cmLabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {team.length > 5 && (
        <div onClick={() => nav?.goto?.("team")} style={{
          marginTop: 8, textAlign: "center" as const,
          fontSize: 11, fontWeight: 700, color: TEAL, cursor: "pointer", padding: "4px 0",
        }}>
          +{team.length - 5} altri → Apri Team
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 7) PIPELINE — tap barra per filtrare
// ═══════════════════════════════════════════════════════════
const PipelineWidget = ({ data, nav }: any) => {
  const cantieri = data?.cantieri || [];
  const [selected, setSelected] = useState<string | null>(null);

  const fasi = [
    { k: "sopralluogo", l: "Sopral." },
    { k: "preventivo", l: "Prev." },
    { k: "ordini", l: "Ordine" },
    { k: "produzione", l: "Prod." },
    { k: "posa", l: "Posa" },
    { k: "fattura", l: "Fatt." },
  ];
  const counts = fasi.map(f => {
    const comms = cantieri.filter((c: any) => {
      const cf = (c?.fase || "").toLowerCase();
      if (f.k === "sopralluogo") return cf.includes("sopral") || cf.includes("rilievo");
      if (f.k === "ordini") return cf.includes("ordin") || cf.includes("conferma");
      if (f.k === "posa") return cf.includes("posa") || cf.includes("montag") || cf.includes("collaudo");
      if (f.k === "fattura") return cf.includes("fattur") || cf.includes("saldo") || cf.includes("consegn");
      return cf.includes(f.k);
    });
    return { ...f, n: comms.length, euro: comms.reduce((s: number, c: any) => s + valoreCM(c), 0), fase: getFase(f.k) };
  });
  const maxN = Math.max(...counts.map(x => x.n), 1);
  const selFase = selected ? counts.find(c => c.k === selected) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 90, padding: "4px 2px 0" }}>
        {counts.map((c) => {
          const h = Math.max(8, (c.n / maxN) * 80);
          const isSel = selected === c.k;
          return (
            <div key={c.k} onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : c.k); }} style={{
              flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: c.fase.dark, marginBottom: 3 }}>{c.n}</div>
              <div style={{
                width: "100%", height: h,
                background: c.fase.grad,
                borderRadius: "6px 6px 2px 2px",
                boxShadow: isSel
                  ? `0 0 0 2px ${c.fase.solid}, 0 4px 10px ${c.fase.tint}, inset 0 1px 1px rgba(255,255,255,0.25)`
                  : `0 2px 6px ${c.fase.tint}, inset 0 1px 1px rgba(255,255,255,0.25)`,
                transform: isSel ? "translateY(-2px)" : "none",
                transition: "all 0.15s",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        {counts.map(c => (
          <div key={c.k} style={{
            flex: 1, textAlign: "center" as const,
            fontSize: 9, fontWeight: 800, color: selected === c.k ? c.fase.dark : SUB,
            letterSpacing: "0.2px",
          }}>{c.l}</div>
        ))}
      </div>

      {selFase && selFase.n > 0 && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: selFase.fase.bg,
          border: `1px solid ${selFase.fase.solid}30`,
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: selFase.fase.dark, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{selFase.l}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: INK }}>{selFase.n} commess{selFase.n === 1 ? "a" : "e"}</div>
            </div>
            <div style={{ textAlign: "right" as const }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: SUB, letterSpacing: "0.3px", textTransform: "uppercase" as const }}>Valore</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: selFase.fase.dark }}>{eurFull(selFase.euro)}</div>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); nav?.openCommesseFase?.(selFase.k); }} style={{
            width: "100%", padding: "7px",
            background: selFase.fase.grad, color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 10, fontWeight: 900, cursor: "pointer", letterSpacing: "0.3px",
            boxShadow: `0 2px 6px ${selFase.fase.tint}`,
          }}>VEDI LE {selFase.n} COMMESSE →</button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 8) MESSAGGI
// ═══════════════════════════════════════════════════════════
const MessaggiWidget = ({ data, nav }: any) => {
  const msgs = data?.msgs || [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const nuovi = msgs.filter((m: any) => !m?.letto && !m?.read);
  if (nuovi.length === 0) return <Empty msg="Nessun messaggio nuovo" icon="💬" />;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
      {nuovi.slice(0, 4).map((m: any, i: number) => {
        const key = m.id || `m${i}`;
        const mittente = pick(m, "da", "mittente", "sender") || "—";
        const testo = pick(m, "text", "anteprima", "contenuto") || "";
        const isOpen = expanded === key;

        return (
          <div key={key} onClick={() => setExpanded(isOpen ? null : key)} style={{
            background: "#fff", borderRadius: 10,
            border: "1px solid " + BORDER_SOFT,
            borderLeft: `3px solid ${TEAL}`,
            cursor: "pointer",
            overflow: "hidden" as const,
            boxShadow: isOpen ? "0 6px 16px rgba(40,160,160,0.15)" : "0 2px 6px rgba(13,31,31,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px" }}>
              <Avatar text={initials(mittente)} fase="preventivo" size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK }}>{mittente}</div>
                <div style={{ fontSize: 10, color: SUB, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, marginTop: 1 }}>
                  {testo}
                </div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: TEAL_BRIGHT,
                boxShadow: `0 0 0 3px rgba(40,160,160,0.2)`,
                flexShrink: 0,
              }} />
            </div>
            {isOpen && testo && (
              <div style={{ padding: "0 11px 11px" }}>
                <div style={{
                  padding: "8px 10px", background: "rgba(40,160,160,0.06)", borderRadius: 8,
                  fontSize: 11, fontWeight: 600, color: INK, lineHeight: 1.4,
                }}>{testo}</div>
                <QuickActions
                  tel={pick(m, "telefono", "phone")}
                  addr={null}
                  onOpen={() => nav?.openMsg?.(m)}
                  msg=""
                  color={FASE.preventivo}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// BIG NUMBER WIDGET
// ═══════════════════════════════════════════════════════════
const BigNumberWidget = ({ titolo, valore, sub, fase, pillola }: any) => {
  const f = fase || FASE.fattura;
  return (
    <div style={{
      background: f.grad,
      borderRadius: 14, padding: "14px 16px",
      color: "#fff",
      boxShadow: `0 6px 18px ${f.tint}`,
      position: "relative" as const,
      overflow: "hidden" as const,
    }}>
      <div style={{
        position: "absolute" as const, top: -30, right: -20, width: 100, height: 100, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)", pointerEvents: "none" as const,
      }} />
      <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.9, letterSpacing: "0.8px", textTransform: "uppercase" as const, position: "relative" as const }}>{titolo}</div>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.7px", marginTop: 3, textShadow: "0 2px 4px rgba(0,0,0,0.15)", position: "relative" as const }}>{valore}</div>
      {pillola && (
        <div style={{
          marginTop: 10, padding: "7px 10px",
          background: "rgba(255,255,255,0.22)",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.9 }}>{pillola.label}</span>
          <span style={{ fontSize: 12, fontWeight: 900 }}>{pillola.value}</span>
        </div>
      )}
      {sub && !pillola && (
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginTop: 2, position: "relative" as const }}>{sub}</div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════
function renderWidgetBody(id: string, data: any, nav: any): React.ReactNode {
  const cantieri = data?.cantieri || [];
  const fattureDB = data?.fattureDB || [];
  const td = today();

  switch (id) {
    case "oggi_devi_fare":
      return <OggiDeviFareWidget data={data} nav={nav} />;
    case "eventi_oggi":
      return <AgendaWidget data={data} nav={nav} />;
    case "lavori_in_corso":
      return <LavoriInCorsoWidget data={data} nav={nav} />;
    case "fatture_incassare":
      return <FattureIncassareWidget data={data} nav={nav} onlyScadute={false} />;
    case "fatture_scadute":
      return <FattureIncassareWidget data={data} nav={nav} onlyScadute={true} />;
    case "commesse_ritardo":
      return <CommesseRitardoWidget data={data} nav={nav} />;
    case "squadra":
      return <SquadraWidget data={data} nav={nav} />;
    case "pipeline_commesse":
      return <PipelineWidget data={data} nav={nav} />;
    case "messaggi_non_letti":
      return <MessaggiWidget data={data} nav={nav} />;

    case "fatturato_mese": {
      const mese = td.slice(0, 7);
      const tot = fattureDB
        .filter((f: any) => fattPagata(f) && (pick(f, "data_emissione", "data") || "").startsWith(mese))
        .reduce((s: number, f: any) => s + fattImporto(f), 0);
      const daInc = fattureDB
        .filter((f: any) => !fattPagata(f) && (pick(f, "data_emissione", "data") || "").startsWith(mese))
        .reduce((s: number, f: any) => s + fattImporto(f), 0);
      return <BigNumberWidget titolo="Fatturato mese" valore={eurFull(tot)} fase={FASE.fattura} pillola={{ label: "Da incassare", value: eurFull(daInc) }} />;
    }

    case "margine_medio": {
      const ff = fattureDB.filter((f: any) => fattPagata(f));
      const totFatt = ff.reduce((s: number, f: any) => s + fattImporto(f), 0);
      const spese = data?.spese || [];
      const totSpese = spese.reduce((s: number, sp: any) => s + Number(pick(sp, "importo", "totale") || 0), 0);
      const margine = totFatt - totSpese;
      const pct = totFatt > 0 ? Math.round((margine / totFatt) * 100) : 0;
      const f = pct >= 30 ? FASE.preventivo : pct >= 15 ? FASE.ordini : FASE.ferma;
      return <BigNumberWidget titolo="Margine medio" valore={`${pct}%`} fase={f} pillola={{ label: "Margine assoluto", value: eurFull(margine) }} />;
    }

    case "iva_versare": {
      const trim = Math.floor((new Date().getMonth()) / 3) + 1;
      const meseNum = parseInt(td.split("-")[1]);
      const trimStart = Math.floor((meseNum - 1) / 3) * 3 + 1;
      const trimPrefix = td.slice(0, 4) + "-" + String(trimStart).padStart(2, "0");
      const ivaFatture = fattureDB
        .filter((f: any) => (pick(f, "data_emissione", "data") || "") >= trimPrefix)
        .reduce((s: number, f: any) => s + (fattImporto(f) * 0.22 / 1.22), 0);
      return <BigNumberWidget titolo={`IVA Trim. ${trim}`} valore={eurFull(ivaFatture)} fase={FASE.conferma} sub="da versare" />;
    }

    case "spese_mese": {
      const spese = data?.spese || [];
      const mese = td.slice(0, 7);
      const del_mese = spese.filter((s: any) => {
        const d = pick(s, "data", "date");
        return d && d.startsWith(mese);
      });
      const tot = del_mese.reduce((s: number, sp: any) => s + Number(pick(sp, "importo", "totale") || 0), 0);
      return <BigNumberWidget titolo="Spese mese" valore={eurFull(tot)} fase={FASE.chiusura} sub={`${del_mese.length} spese registrate`} />;
    }

    case "pagamenti_arrivo": {
      const prossimi = fattureDB
        .filter((f: any) => !fattPagata(f) && fattScadenza(f))
        .sort((a: any, b: any) => (fattScadenza(a) || "").localeCompare(fattScadenza(b) || ""))
        .filter((f: any) => fattScadenza(f)! >= td);
      if (prossimi.length === 0) return <Empty msg="Nessun incasso in arrivo" icon="💰" />;
      const tot = prossimi.reduce((s: number, f: any) => s + fattImporto(f), 0);
      return <BigNumberWidget titolo="Pagamenti in arrivo" valore={eurFull(tot)} fase={FASE.preventivo} sub={`${prossimi.length} attesi`} />;
    }

    case "ordini_settimana": {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const ord = cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        const d = pick(c, "ordine_conferma_data", "data_ordine", "updated_at");
        return (f.includes("ordin") || f.includes("produzione")) && d && d >= weekAgo;
      });
      const tot = ord.reduce((s: number, c: any) => s + valoreCM(c), 0);
      return <BigNumberWidget titolo="Ordini settimana" valore={eurFull(tot)} fase={FASE.ordini} sub={`${ord.length} ordini confermati`} />;
    }

    case "produzione":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: cantieri.filter((c: any) => (c?.fase || "").toLowerCase().includes("produzione")) }} nav={nav} />;

    case "preventivi_scadenza":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: cantieri.filter((c: any) => (c?.fase || "").toLowerCase() === "preventivo") }} nav={nav} />;

    case "preventivi_da_inviare":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return (f === "rilievo" || f === "sopralluogo") && (c?.rilievo_completato || c?.rilievo_confermato);
      })}} nav={nav} />;

    case "rilievi_da_confermare":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return f === "rilievo" || f === "sopralluogo";
      })}} nav={nav} />;

    case "ordini_attesa":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: cantieri.filter((c: any) => {
        const f = (c?.fase || "").toLowerCase();
        return f === "conferma ordine" || f === "ordini" || f === "ordine";
      })}} nav={nav} />;

    case "prossime_consegne":
      return <LavoriInCorsoWidget data={{ ...data, cantieri: [...cantieri]
        .filter((c: any) => c?.data_consegna)
        .sort((a: any, b: any) => (a.data_consegna || "").localeCompare(b.data_consegna || ""))
        .filter((c: any) => c.data_consegna >= td)
      }} nav={nav} />;

    case "clienti_insolventi": {
      const scad = fattureDB.filter((f: any) => !fattPagata(f) && fattScadenza(f) && new Date(fattScadenza(f)!) < new Date(td));
      const byCliente = new Map<string, any>();
      scad.forEach((f: any) => {
        const k = fattCliente(f);
        const cur = byCliente.get(k) || { nome: k, tot: 0, count: 0 };
        cur.tot += fattImporto(f);
        cur.count += 1;
        byCliente.set(k, cur);
      });
      const arr = [...byCliente.values()].sort((a, b) => b.tot - a.tot);
      if (arr.length === 0) return <Empty msg="Nessun cliente insolvente" icon="✓" />;
      const tot = arr.reduce((s, x) => s + x.tot, 0);
      return <BigNumberWidget titolo="Insolventi" valore={eurFull(tot)} fase={FASE.ferma} sub={`${arr.length} client${arr.length === 1 ? "e" : "i"}`} />;
    }

    case "top_clienti": {
      const byCliente = new Map<string, any>();
      fattureDB.filter((f: any) => fattPagata(f)).forEach((f: any) => {
        const k = fattCliente(f);
        const cur = byCliente.get(k) || { nome: k, tot: 0, count: 0 };
        cur.tot += fattImporto(f);
        cur.count += 1;
        byCliente.set(k, cur);
      });
      const arr = [...byCliente.values()].sort((a, b) => b.tot - a.tot);
      if (arr.length === 0) return <Empty msg="Nessun cliente pagante" icon="🏆" />;
      const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
      return (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
          {arr.slice(0, 5).map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: "#fff", borderRadius: 10,
              border: "1px solid " + BORDER_SOFT,
              borderLeft: `3px solid ${i < 3 ? medals[i] : FASE.fattura.solid}`,
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: i < 3 ? medals[i] : FASE.chiusura.tint,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900, color: i < 3 ? "#fff" : SUB,
                flexShrink: 0,
                boxShadow: i < 3 ? `0 3px 8px ${medals[i]}60` : "none",
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.nome}</div>
                <div style={{ fontSize: 10, color: SUB, fontWeight: 700, marginTop: 1 }}>{c.count} fattur{c.count === 1 ? "a" : "e"}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: FASE.fattura.dark }}>{eur(c.tot)}</div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return <Empty msg={`Widget "${id}" in arrivo`} icon="⚡" />;
  }
}

const safeRender = renderWidgetBody;
export default renderWidgetBody;
export { renderWidgetBody, safeRender };
