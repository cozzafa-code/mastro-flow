"use client";
// @ts-nocheck
// MASTRO ERP - HomePanel MOBILE - fliwoX Widget Home v5 (drag+add+apri)
import React, { useState as RS } from "react";
import { DayButton } from "@/components/day/DayButton";
import { useMastro } from "./MastroContext";
import { AgendaIOSWidgetS, AgendaIOSWidgetM, AgendaIOSWidgetL } from "./widgets/AgendaIOS";
import OggiDeviFareMini from "./widgets/OggiDeviFareMini";
import TimelineOggiMini from "./widgets/TimelineOggiMini";
import MessaggiNonLettiMini from "./widgets/MessaggiNonLettiMini";
import FirmeInAttesaMini from "./widgets/FirmeInAttesaMini";
import DaIncassareMini from "./widgets/DaIncassareMini";
import LavoriRecentiMini from "./widgets/LavoriRecentiMini";

const ALL_WIDGETS: any[] = [
  // KPI & TODO
  { id: "oggi",        label: "Oggi devi fare",       bg: "#B5B0E8", fg: "#26215C", cat: "KPI" },
  { id: "timeline",    label: "Timeline di oggi",     bg: "#FFFFFF", fg: "#1A1A1A", cat: "KPI" },
  { id: "scaduti",     label: "Task scaduti",         bg: "#F7C1C1", fg: "#501313", cat: "KPI" },
  { id: "prossimi",    label: "Prossime scadenze",    bg: "#FAC775", fg: "#412402", cat: "KPI" },
  // COMMESSE
  { id: "corso",       label: "In corso",             bg: "#F5C4B3", fg: "#4A1B0C", cat: "Commesse" },
  { id: "nuove",       label: "Nuove questa sett.",   bg: "#CECBF6", fg: "#26215C", cat: "Commesse" },
  { id: "ferme",       label: "Commesse ferme",       bg: "#F7C1C1", fg: "#501313", cat: "Commesse" },
  { id: "pipeline",    label: "Pipeline per fase",    bg: "#B5D4F4", fg: "#042C53", cat: "Commesse" },
  { id: "recenti",     label: "Lavori recenti",       bg: "#FFFFFF", fg: "#1A1A1A", cat: "Commesse" },
  // SOLDI
  { id: "fatt",        label: "Fatturato mese",       bg: "#9FE1CB", fg: "#04342C", cat: "Soldi" },
  { id: "fattanno",    label: "Fatturato anno",       bg: "#C0DD97", fg: "#173404", cat: "Soldi" },
  { id: "incassi",     label: "Incassi da riscuot.",  bg: "#FAC775", fg: "#412402", cat: "Soldi" },
  { id: "preventivi",  label: "Preventivi aperti",    bg: "#CECBF6", fg: "#26215C", cat: "Soldi" },
  { id: "ordini",      label: "Ordini fornitori",     bg: "#B5D4F4", fg: "#042C53", cat: "Soldi" },
  { id: "margine",     label: "Margine medio %",      bg: "#9FE1CB", fg: "#04342C", cat: "Soldi" },
  // AGENDA
  { id: "agenda",      label: "Agenda oggi",          bg: "#F4C0D1", fg: "#4B1528", cat: "Agenda" },
  { id: "settimana",   label: "Settimana",            bg: "#F4C0D1", fg: "#4B1528", cat: "Agenda" },
  { id: "sopralluoghi",label: "Sopralluoghi prog.",   bg: "#EEEDFE", fg: "#26215C", cat: "Agenda" },
  { id: "montaggi",    label: "Montaggi programm.",   bg: "#E1F5EE", fg: "#04342C", cat: "Agenda" },
  { id: "agenda_ios_s",label: "Agenda iOS · S",       bg: "#FFFFFF", fg: "#1A1A1A", cat: "Agenda" },
  { id: "agenda_ios_m",label: "Agenda iOS · M",       bg: "#FFFFFF", fg: "#1A1A1A", cat: "Agenda" },
  { id: "agenda_ios_l",label: "Agenda iOS · L",       bg: "#FFFFFF", fg: "#1A1A1A", cat: "Agenda" },
  // TEAM & MAGAZZINO
  { id: "squadra",     label: "Squadra sul campo",    bg: "#CECBF6", fg: "#26215C", cat: "Team" },
  { id: "stock",       label: "Magazzino sotto-sc.",  bg: "#F7C1C1", fg: "#501313", cat: "Magazzino" },
  { id: "consegne",    label: "Consegne in arrivo",   bg: "#FAC775", fg: "#412402", cat: "Magazzino" },
  // COMUNICAZIONE
  { id: "msg",         label: "Messaggi non letti",   bg: "#F4C0D1", fg: "#4B1528", cat: "Talk" },
  { id: "firme",       label: "Firme in attesa",      bg: "#CECBF6", fg: "#26215C", cat: "Talk" },
  // AZIONI
  { id: "azioni",      label: "Azioni rapide",        bg: "#FAC775", fg: "#412402", cat: "Azioni" },
];
const DEFAULT_LAYOUT = ["oggi", "timeline", "corso", "fatt", "pipeline", "recenti", "agenda", "azioni"];


// === HELPER V3 MOCKUP ===
const FASE_V3: any = {
  sopralluogo: { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)", light: "#EEEDFE" },
  rilievo:     { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", bg: "rgba(127,119,221,0.08)", light: "#EEEDFE" },
  preventivo:  { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", solid: "#1D9E75", dark: "#04342C", tint: "rgba(29,158,117,0.12)", bg: "rgba(29,158,117,0.08)", light: "#E1F5EE" },
  conferma:    { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)",  light: "#FAEEDA" },
  ordini:      { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", bg: "rgba(239,159,39,0.1)",  light: "#FAEEDA" },
  produzione:  { grad: "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)", solid: "#378ADD", dark: "#042C53", tint: "rgba(55,138,221,0.12)",  bg: "rgba(55,138,221,0.08)", light: "#B5D4F4" },
  posa:        { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)",  bg: "rgba(212,83,126,0.1)",  light: "#F4C0D1" },
  montaggio:   { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)",  bg: "rgba(212,83,126,0.1)",  light: "#F4C0D1" },
  fattura:     { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)",   bg: "rgba(99,153,34,0.1)",   light: "#C0DD97" },
  ferma:       { grad: "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)", solid: "#E24B4A", dark: "#8B1A1A", tint: "rgba(226,75,74,0.14)",   bg: "rgba(226,75,74,0.1)",   light: "#F7C1C1" },
};
const getFaseV3 = (f: string): any => {
  if (!f) return FASE_V3.sopralluogo;
  const k = f.toLowerCase();
  if (k.includes("ferma")) return FASE_V3.ferma;
  if (k.includes("rilievo") || k.includes("sopral")) return FASE_V3.sopralluogo;
  if (k.includes("preventivo")) return FASE_V3.preventivo;
  if (k.includes("conferma") || k.includes("ordin")) return FASE_V3.ordini;
  if (k.includes("produzione")) return FASE_V3.produzione;
  if (k.includes("posa") || k.includes("montag") || k.includes("collaudo")) return FASE_V3.posa;
  if (k.includes("fattur") || k.includes("saldo") || k.includes("consegn")) return FASE_V3.fattura;
  return FASE_V3.sopralluogo;
};
const initialsV3 = (s: string): string => {
  if (!s) return "â€”";
  const parts = s.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || "").join("") || s[0]?.toUpperCase() || "â€”";
};
const telLnk = (t: any) => t ? `tel:${t}` : "#";
const waLnk = (t: any, msg: string = "") => t ? `https://wa.me/${String(t).replace(/\D/g, "")}${msg ? "?text=" + encodeURIComponent(msg) : ""}` : "#";
const mapsLnk = (addr: any) => addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(addr))}` : "#";

function QuickActionsV3({ tel, addr, onOpen, msg, color }: any) {
  const c = color || FASE_V3.preventivo;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(200,228,228,0.5)" }}>
      {tel && (
        <a href={telLnk(tel)} onClick={(e: any) => e.stopPropagation()} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "7px", borderRadius: 8, textDecoration: "none",
          background: FASE_V3.preventivo.tint, color: FASE_V3.preventivo.dark,
          fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
          border: `1px solid ${FASE_V3.preventivo.solid}30`,
        }}>CHIAMA</a>
      )}
      {tel && (
        <a href={waLnk(tel, msg)} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "7px", borderRadius: 8, textDecoration: "none",
          background: "rgba(37,211,102,0.12)", color: "#075E54",
          fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
          border: "1px solid rgba(37,211,102,0.3)",
        }}>CHAT</a>
      )}
      {addr && (
        <a href={mapsLnk(addr)} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()} style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "7px", borderRadius: 8, textDecoration: "none",
          background: FASE_V3.produzione.tint, color: FASE_V3.produzione.dark,
          fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
          border: `1px solid ${FASE_V3.produzione.solid}30`,
        }}>NAVIGA</a>
      )}
      {onOpen && (
        <button onClick={(e: any) => { e.stopPropagation(); onOpen(); }} style={{
          flex: 1, padding: "7px", borderRadius: 8, border: "none",
          background: c.grad, color: "#fff",
          fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", cursor: "pointer",
          boxShadow: `0 2px 6px ${c.tint}`,
        }}>APRI →</button>
      )}
    </div>
  );
}

function AgendaWidgetV3({ events, onNavigate, editMode }: any) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const td = new Date().toISOString().slice(0, 10);
  const todayEvents = (events || []).filter((e: any) => {
    const d = e?.data || e?.date || "";
    return d === td || (e?.start_time || "").startsWith(td);
  });
  todayEvents.sort((a: any, b: any) => ((a.ora || a.time || "99") + "").localeCompare((b.ora || b.time || "99") + ""));

  return (
    <div style={{ background: FASE_V3.posa.grad, borderRadius: 20, padding: 14, position: "relative" as any, boxShadow: `0 6px 18px ${FASE_V3.posa.tint}` }}>
      <div style={{ fontSize: 11, color: "#fff", fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.92 }}>Agenda oggi</div>
      <div style={{ fontSize: 18, color: "#fff", fontWeight: 900, marginTop: 2, marginBottom: 10, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
        {todayEvents.length} appuntament{todayEvents.length === 1 ? "o" : "i"}
      </div>
      {todayEvents.length === 0 && (
        <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "14px 12px", textAlign: "center" as any }}>
          <div style={{ fontSize: 12, color: "#5A7878", fontWeight: 600 }}>Nessun impegno oggi</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
        {todayEvents.slice(0, 5).map((ev: any, i: number) => {
          const key = ev.id || `ev${i}`;
          const isOpen = expanded === key;
          const ora = ev.ora || ev.time || (ev.start_time || "").slice(11, 16) || "â€”";
          const tipo = (ev.tipo || "evento").toLowerCase();
          const titolo = ev.titolo || ev.text || ev.title || "Evento";
          const persona = ev.persona || ev.cliente || ev.client_name || "";
          const addr = ev.indirizzo || ev.address || "";
          const telefono = ev.telefono || ev.phone || "";
          const f = getFaseV3(tipo);
          return (
            <div key={key} onClick={() => !editMode && setExpanded(isOpen ? null : key)} style={{
              background: "rgba(255,255,255,0.95)", borderRadius: 12,
              overflow: "hidden" as any, cursor: editMode ? "grab" : "pointer",
              boxShadow: isOpen ? `0 6px 16px rgba(0,0,0,0.2)` : "0 2px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                <div style={{
                  width: 44, height: 36, borderRadius: 8, flexShrink: 0,
                  background: f.grad, color: "#fff",
                  display: "flex", flexDirection: "column" as any, alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "-0.3px" }}>{ora}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#0F2525", overflow: "hidden" as any, textOverflow: "ellipsis" as any, whiteSpace: "nowrap" as any }}>{titolo}</div>
                  {(persona || addr) && <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1, overflow: "hidden" as any, textOverflow: "ellipsis" as any, whiteSpace: "nowrap" as any }}>{persona || addr}</div>}
                </div>
                <span style={{ color: f.solid, fontSize: 14, fontWeight: 900, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 10px 10px" }}>
                  {addr && (
                    <div style={{ fontSize: 11, color: f.dark, fontWeight: 700, padding: "5px 9px", background: f.bg, borderRadius: 6, marginBottom: 4 }}>
                      ðŸ“ {addr}
                    </div>
                  )}
                  <QuickActionsV3 tel={telefono} addr={addr} onOpen={() => onNavigate?.("agenda")} msg={`Ciao, ti confermo l'appuntamento di oggi ${ora} per "${titolo}"`} color={f} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {todayEvents.length > 0 && (
        <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: 800, textAlign: "center" as any, marginTop: 8, cursor: "pointer", letterSpacing: "0.4px" }}>
          APRI AGENDA COMPLETA →
        </div>
      )}
    </div>
  );
}

function PipelineWidgetV3({ cantieri, onNavigate, editMode }: any) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const fasi = [
    { k: "sopralluogo", l: "Sopral." },
    { k: "preventivo",  l: "Prev." },
    { k: "ordini",      l: "Ordine" },
    { k: "produzione",  l: "Prod." },
    { k: "posa",        l: "Posa" },
    { k: "fattura",     l: "Fatt." },
  ];
  const counts = fasi.map(f => {
    const comms = (cantieri || []).filter((c: any) => {
      const cf = (c?.fase || c?.fase_corrente || c?.stato || "").toLowerCase();
      if (f.k === "sopralluogo") return cf.includes("sopral") || cf.includes("rilievo");
      if (f.k === "ordini") return cf.includes("ordin") || cf.includes("conferma");
      if (f.k === "posa") return cf.includes("posa") || cf.includes("montag") || cf.includes("collaudo");
      if (f.k === "fattura") return cf.includes("fattur") || cf.includes("saldo") || cf.includes("consegn");
      return cf.includes(f.k);
    });
    const euro = comms.reduce((s: number, c: any) => s + (Number(c?.totale || c?.importo || 0)), 0);
    return { ...f, n: comms.length, euro, fase: getFaseV3(f.k) };
  });
  const maxN = Math.max(...counts.map(c => c.n), 1);
  const sel = selected ? counts.find(c => c.k === selected) : null;
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 14, position: "relative" as any, border: "1px solid #F0EDE5", boxShadow: "0 4px 12px rgba(13,31,31,0.05)" }}>
      <div style={{ fontSize: 11, color: "#185FA5", fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any }}>Pipeline</div>
      <div style={{ fontSize: 14, color: "#0F2525", fontWeight: 800, marginTop: 2, marginBottom: 12 }}>Distribuzione per fase</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, padding: "4px 2px 0" }}>
        {counts.map(c => {
          const h = Math.max(8, (c.n / maxN) * 72);
          const isSel = selected === c.k;
          return (
            <div key={c.k} onClick={(e: any) => { e.stopPropagation(); if (!editMode) setSelected(isSel ? null : c.k); }} style={{
              flex: 1, display: "flex", flexDirection: "column" as any, alignItems: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: c.fase.dark, marginBottom: 3 }}>{c.n}</div>
              <div style={{
                width: "100%", height: h,
                background: c.fase.grad,
                borderRadius: "6px 6px 2px 2px",
                boxShadow: isSel ? `0 0 0 2px ${c.fase.solid}, 0 4px 10px ${c.fase.tint}` : `0 2px 6px ${c.fase.tint}`,
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
            flex: 1, textAlign: "center" as any,
            fontSize: 9, fontWeight: 800, color: selected === c.k ? c.fase.dark : "#5A7878",
            letterSpacing: "0.2px",
          }}>{c.l}</div>
        ))}
      </div>
      {sel && sel.n > 0 && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: sel.fase.bg,
          border: `1px solid ${sel.fase.solid}30`,
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: sel.fase.dark, letterSpacing: "0.8px", textTransform: "uppercase" as any }}>{sel.l}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#0F2525" }}>{sel.n} commess{sel.n === 1 ? "a" : "e"}</div>
            </div>
            <div style={{ textAlign: "right" as any }}>
              <div style={{ fontSize: 8, fontWeight: 800, color: "#5A7878", letterSpacing: "0.3px", textTransform: "uppercase" as any }}>Valore</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: sel.fase.dark }}>{sel.euro >= 1000 ? `€${(sel.euro/1000).toFixed(1)}k` : `€${Math.round(sel.euro)}`}</div>
            </div>
          </div>
          <button onClick={(e: any) => { e.stopPropagation(); onNavigate?.("commesse"); }} style={{
            width: "100%", padding: "7px",
            background: sel.fase.grad, color: "#fff",
            border: "none", borderRadius: 8,
            fontSize: 10, fontWeight: 900, cursor: "pointer", letterSpacing: "0.3px",
            boxShadow: `0 2px 6px ${sel.fase.tint}`,
          }}>VEDI LE {sel.n} COMMESSE →</button>
        </div>
      )}
    </div>
  );
}

function LavoriRecentiWidgetV3({ recenti, onApriCommessa, onNavigate, editMode }: any) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  return (
    <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 14, position: "relative" as any, border: "1px solid #F0EDE5", boxShadow: "0 4px 12px rgba(13,31,31,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "#0F2525", fontWeight: 900 }}>Lavori recenti</div>
        <div style={{ fontSize: 10, color: "#1A7A7A", fontWeight: 800, cursor: "pointer", letterSpacing: "0.3px" }} onClick={() => !editMode && onNavigate?.("commesse")}>VEDI TUTTI ›</div>
      </div>
      {(!recenti || recenti.length === 0) && (
        <div style={{ fontSize: 11, color: "#5A7878", textAlign: "center" as any, padding: "16px 0", fontWeight: 600 }}>Nessuna commessa attiva</div>
      )}
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
        {(recenti || []).map((c: any, idx: number) => {
          const key = c?.id || `r${idx}`;
          const isOpen = expanded === key;
          const fase = c?.fase_corrente || c?.fase || c?.stato || "Sopralluogo";
          const f = getFaseV3(fase);
          const imp = Number(c?.totale || c?.importo || 0);
          const impLabel = imp >= 1000 ? `€${(imp / 1000).toFixed(1)}k` : `€${Math.round(imp)}`;
          const _cl = c?.cliente_nome || c?.cliente;
          const cliente = typeof _cl === "string" ? _cl : (_cl?.nome || _cl?.ragione_sociale || _cl?.denominazione || "Cliente");
          const cod = c?.codice || c?.code || `S-00${64 + idx}`;
          return (
            <div key={key} onClick={() => !editMode && setExpanded(isOpen ? null : key)} style={{
              background: "#fff", borderRadius: 10,
              border: "1px solid rgba(200,228,228,0.4)",
              cursor: "pointer", overflow: "hidden" as any,
              boxShadow: isOpen ? `0 6px 16px ${f.tint}` : "0 2px 6px rgba(13,31,31,0.04)",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: f.grad, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, letterSpacing: "-0.2px",
                  textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  boxShadow: `0 2px 6px ${f.tint}`,
                }}>{initialsV3(cliente)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#0F2525", fontWeight: 900 }}>{cod} · {cliente}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, padding: "1px 6px", borderRadius: 4, background: f.tint, color: f.dark, textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>{fase}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: f.dark, fontWeight: 900 }}>{impLabel}</div>
                <span style={{ color: f.solid, fontSize: 13, fontWeight: 900, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 10px 10px" }}>
                  <QuickActionsV3
                    tel={c?.telefono || c?.phone}
                    addr={c?.indirizzo || c?.address}
                    onOpen={() => onApriCommessa?.(c?.id)}
                    msg={`Aggiornamento commessa ${cod}: `}
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
}

function SquadraWidgetV3({ team, onNavigate, editMode }: any) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const list = (team && team.length > 0 ? team : [
    { id: "t1", nome: "Marco", cognome: "R.", cantiere: "S-0064" },
    { id: "t2", nome: "Luigi", cognome: "P.", cantiere: "S-0065" },
    { id: "t3", nome: "Anna", cognome: "T.", cantiere: "S-0066" },
  ]);
  return (
    <div style={{ background: FASE_V3.sopralluogo.grad, borderRadius: 20, padding: 14, position: "relative" as any, boxShadow: `0 6px 18px ${FASE_V3.sopralluogo.tint}` }}>
      <div style={{ fontSize: 11, color: "#fff", fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.92 }}>Squadra</div>
      <div style={{ fontSize: 14, color: "#fff", fontWeight: 900, marginTop: 2, marginBottom: 10, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>Sul campo ora</div>
      <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
        {list.slice(0, 5).map((t: any, i: number) => {
          const key = t.id || `t${i}`;
          const isOpen = expanded === key;
          const nome = `${t.nome || ""} ${t.cognome || ""}`.trim() || "â€”";
          const cantiere = t.cantiere_attuale || t.cantiere || "";
          const attivo = !!cantiere;
          return (
            <div key={key} onClick={() => !editMode && setExpanded(isOpen ? null : key)} style={{
              background: "rgba(255,255,255,0.95)", borderRadius: 10,
              cursor: editMode ? "grab" : "pointer",
              overflow: "hidden" as any,
              boxShadow: isOpen ? "0 6px 16px rgba(0,0,0,0.18)" : "0 2px 6px rgba(0,0,0,0.08)",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                <div style={{ position: "relative" as any, flexShrink: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: attivo ? FASE_V3.produzione.grad : FASE_V3.chiusura?.grad || FASE_V3.preventivo.grad, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900,
                    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  }}>{initialsV3(nome)}</div>
                  {attivo && (
                    <div style={{
                      position: "absolute" as any, bottom: -2, right: -2,
                      width: 10, height: 10, borderRadius: "50%",
                      background: "#1D9E75", border: "2px solid #fff",
                      boxShadow: "0 0 0 2px rgba(29,158,117,0.3)",
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#0F2525" }}>{nome}</div>
                  <div style={{ fontSize: 10, color: attivo ? "#1D9E75" : "#5A7878", fontWeight: 700, marginTop: 1 }}>
                    â— {attivo ? cantiere : "libero"}
                  </div>
                </div>
                <span style={{ color: FASE_V3.sopralluogo.dark, fontSize: 13, fontWeight: 900, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
              </div>
              {isOpen && (
                <div style={{ padding: "0 10px 10px" }}>
                  <QuickActionsV3
                    tel={t.telefono || t.phone}
                    addr={cantiere}
                    onOpen={() => onNavigate?.("agenda")}
                    msg={`Ciao ${t.nome || ""}, come va con ${cantiere}?`}
                    color={attivo ? FASE_V3.produzione : FASE_V3.preventivo}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === FINE HELPER V3 ===

export default function HomePanelMobile(props: any) {
  const mastro: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const user = props?.user || mastro?.user || {};
  const commesse: any[] = props?.commesse || mastro?.commesse || mastro?.cantieri || [];
  const onNavigate = props?.onNavigate || mastro?.onNavigate || (() => {});
  const onApriCommessa = props?.onApriCommessa || mastro?.onApriCommessa || ((id: string) => onNavigate?.("commesse"));

  // Layout persistito in localStorage
  const [layout, setLayout] = React.useState<string[]>(DEFAULT_LAYOUT);
  const [editMode, setEditMode] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("mastro_home_layout_v1");
      if (saved) setLayout(JSON.parse(saved));
    } catch {}
  }, []);
  const saveLayout = (next: string[]) => {
    setLayout(next);
    try { localStorage.setItem("mastro_home_layout_v1", JSON.stringify(next)); } catch {}
  };

  // Drag handlers
  const dragIdRef = React.useRef<string | null>(null);
  const onDragStart = (id: string) => (e: any) => {
    if (!editMode) return;
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (id: string) => (e: any) => {
    if (!editMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (targetId: string) => (e: any) => {
    if (!editMode) return;
    e.preventDefault();
    const src = dragIdRef.current;
    if (!src || src === targetId) return;
    const next = [...layout];
    const si = next.indexOf(src);
    const ti = next.indexOf(targetId);
    if (si < 0 || ti < 0) return;
    next.splice(si, 1);
    next.splice(ti, 0, src);
    saveLayout(next);
    dragIdRef.current = null;
  };
  const removeWidget = (id: string) => saveLayout(layout.filter(x => x !== id));
  const addWidget = (id: string) => {
    if (!layout.includes(id)) saveLayout([...layout, id]);
    setShowAdd(false);
  };

  const now = React.useMemo(() => new Date(), []);
  const greeting = React.useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "BUONGIORNO";
    if (h < 18) return "BUON POMERIGGIO";
    return "BUONASERA";
  }, [now]);
  const dataLunga = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const nome = (user?.nome || user?.email?.split("@")[0] || "FABIO").toString().toUpperCase();
  const iniziali = nome.slice(0, 2);

  const commesseAttive = (commesse || []).filter((c: any) => c?.stato !== "archiviata" && c?.stato !== "fatturata");
  const recenti = (commesseAttive || []).slice(0, 3);
  const taskOggi = recenti.length;
  const totMese = (commesseAttive || []).reduce((s: number, c: any) => s + Number(c?.totale || c?.importo || 0), 0);
  const totMeseK = totMese >= 1000 ? `€${(totMese / 1000).toFixed(1)}k` : `€${Math.round(totMese)}`;

  const faseColors: any = {
    Sopralluogo: { bg: "#EEEDFE", fg: "#3C3489" },
    Preventivo:  { bg: "#E1F5EE", fg: "#0F6E56" },
    Conferma:    { bg: "#FAEEDA", fg: "#854F0B" },
    Produzione:  { bg: "#B5D4F4", fg: "#185FA5" },
    Montaggio:   { bg: "#F4C0D1", fg: "#993556" },
    Fattura:     { bg: "#C0DD97", fg: "#3B6D11" },
  };
  const faseCol = (f: string) => faseColors[f] || { bg: "#F0EDE5", fg: "#666" };

  // === Widget renderers ===
  const W: any = {};

  W.oggi = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#B5B0E8", borderRadius: 20, padding: "14px 16px", position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="oggi" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#3C3489", fontWeight: 500, letterSpacing: 0.3 }}>OGGI DEVI FARE</div>
          <div style={{ fontSize: 16, color: "#26215C", fontWeight: 600, marginTop: 3 }}>{taskOggi} task urgenti</div>
          <div style={{ fontSize: 10, color: "#3C3489", marginTop: 2 }}>Sopralluogo · Firma · Fattura</div>
        </div>
        <div style={{ background: "#FFFFFF", borderRadius: 50, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26215C" strokeWidth={2.5}><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
        </div>
      </div>
    </div>
  );

  W.corso = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#F5C4B3", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="corso" fg="#712B13" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#712B13", fontWeight: 500, letterSpacing: 0.3 }}>IN CORSO</div>
      <div style={{ fontSize: 28, color: "#4A1B0C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{commesseAttive.length}</div>
      <div style={{ fontSize: 10, color: "#712B13", marginTop: 4 }}>commesse attive</div>
    </div>
  );

  W.fatt = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#9FE1CB", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="fatt" fg="#085041" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#085041", fontWeight: 500, letterSpacing: 0.3 }}>FATTURATO</div>
      <div style={{ fontSize: 28, color: "#04342C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{totMeseK}</div>
      <div style={{ fontSize: 10, color: "#085041", marginTop: 4 }}>questo mese</div>
    </div>
  );

  W.pipeline = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="pipeline" fg="#0C447C" onRemove={removeWidget} />}
      <PipelineWidgetV3 cantieri={mastro?.cantieri || []} onNavigate={onNavigate} editMode={editMode} />
    </div>
  );

  W.recenti = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="recenti" fg="#888" onRemove={removeWidget} />}
      <LavoriRecentiWidgetV3 recenti={recenti} onApriCommessa={onApriCommessa} onNavigate={onNavigate} editMode={editMode} />
    </div>
  );

  W.agenda = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="agenda" fg="#72243E" onRemove={removeWidget} />}
      <AgendaWidgetV3 events={mastro?.events || []} onNavigate={onNavigate} editMode={editMode} />
    </div>
  );

  // === Agenda iOS · S/M/L (mini-app stile iOS, scroll interno su L) ===
  const navIOS = {
    goto: (tab: string) => onNavigate?.(tab),
    openEvent: () => onNavigate?.("agenda"),
  };

  W.agenda_ios_s = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="agenda_ios_s" fg="#888" onRemove={removeWidget} />}
      <AgendaIOSWidgetS data={{ events: mastro?.events || [] }} nav={navIOS} />
    </div>
  );

  W.agenda_ios_m = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="agenda_ios_m" fg="#888" onRemove={removeWidget} />}
      <AgendaIOSWidgetM data={{ events: mastro?.events || [] }} nav={navIOS} />
    </div>
  );

  W.agenda_ios_l = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="agenda_ios_l" fg="#888" onRemove={removeWidget} />}
      <AgendaIOSWidgetL data={{ events: mastro?.events || [] }} nav={navIOS} />
    </div>
  );

  // ===== TIER 1 MINI-APP override =====
  const _onApriCm = (cmId: string) => {
    const cm = (mastro?.cantieri || mastro?.commesse || []).find((c: any) => c.id === cmId);
    if (cm && mastro?.setSelectedCM) mastro.setSelectedCM(cm);
    onNavigate?.("commesse");
  };

  W.oggi = () => (
    <OggiDeviFareMini
      tasks={mastro?.tasks || []}
      commesse={mastro?.cantieri || mastro?.commesse || []}
      onNavigate={onNavigate}
      onCompleteTask={mastro?.toggleTask}
      onApriCommessa={_onApriCm}
      onNuovoTask={() => mastro?.setTab?.("agenda")}
      editMode={editMode}
      onRemove={() => removeWidget("oggi")}
    />
  );

  W.timeline = () => (
    <TimelineOggiMini
      events={mastro?.events || []}
      onNavigate={onNavigate}
      onApriCommessa={_onApriCm}
      onNuovoEvento={() => mastro?.setTab?.("agenda")}
      editMode={editMode}
      onRemove={() => removeWidget("timeline")}
    />
  );

  W.msg = () => (
    <MessaggiNonLettiMini
      msgs={mastro?.msgs || []}
      onNavigate={onNavigate}
      onApriMsg={(mid: string) => {
        const m = (mastro?.msgs || []).find((x: any) => x.id === mid);
        if (m && mastro?.setSelectedMsg) mastro.setSelectedMsg(m);
        onNavigate?.("messaggi");
      }}
      onApriCommessa={_onApriCm}
      onMarkRead={(mid: string) => {
        if (mastro?.setMsgs) {
          mastro.setMsgs((prev: any[]) => prev.map((m: any) => m.id === mid ? { ...m, letto: true } : m));
        }
      }}
      editMode={editMode}
      onRemove={() => removeWidget("msg")}
    />
  );

  W.firme = () => (
    <FirmeInAttesaMini
      commesse={mastro?.cantieri || mastro?.commesse || []}
      onNavigate={onNavigate}
      onApriCommessa={_onApriCm}
      onApriDoc={(url: string) => { if (url) window.open(url, "_blank", "noopener"); }}
      editMode={editMode}
      onRemove={() => removeWidget("firme")}
    />
  );

  W.incassi = () => (
    <DaIncassareMini
      fattureDB={mastro?.fattureDB || []}
      onlyScadute={false}
      onNavigate={onNavigate}
      onApriCommessa={_onApriCm}
      onApriFattura={(fid: string) => {
        const f = (mastro?.fattureDB || []).find((x: any) => x.id === fid);
        if (f && mastro?.setFatturaEdit) mastro.setFatturaEdit(f);
        onNavigate?.("contabilita");
      }}
      editMode={editMode}
      onRemove={() => removeWidget("incassi")}
    />
  );

  W.recenti = () => (
    <LavoriRecentiMini
      commesse={mastro?.cantieri || mastro?.commesse || []}
      onNavigate={onNavigate}
      onApriCommessa={_onApriCm}
      onNuovaCommessa={() => mastro?.setTab?.("commesse")}
      editMode={editMode}
      onRemove={() => removeWidget("recenti")}
    />
  );

  
  // === NUOVI WIDGET ===
    W.timeline = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const todayEvents: any[] = [];
    ((mastro?.events || []) as any[]).forEach((e: any) => {
      const d = e.data || e.date || "";
      if (d === todayStr) todayEvents.push({ ora: e.ora || e.time || "", titolo: e.titolo || e.text || "Evento", tipo: (e.tipo || "evento").toLowerCase(), codice: e.commessaCode || e.cm || "" });
    });
    todayEvents.sort((a,b) => (a.ora || "99").localeCompare(b.ora || "99"));
    const FASE_MINI: any = {
      sopralluogo: { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489" },
      rilievo:     { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489" },
      preventivo:  { bg: "#E1F5EE", fg: "#04342C", pill: "#0F6E56" },
      firma:       { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B" },
      conferma:    { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B" },
      produzione:  { bg: "#B5D4F4", fg: "#042C53", pill: "#185FA5" },
      consegna:    { bg: "#EAF3DE", fg: "#173404", pill: "#3B6D11" },
      posa:        { bg: "#F4C0D1", fg: "#4B1528", pill: "#993556" },
      montaggio:   { bg: "#F4C0D1", fg: "#4B1528", pill: "#993556" },
      evento:      { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489" },
    };
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 14, position: "relative", border: "1px solid #F0EDE5" }}>
        {editMode && <RemoveBtn id="timeline" fg="#888" onRemove={removeWidget} />}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: "#D4EDEC", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={2.5}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: "#1A1A1A", fontWeight: 700 }}>Timeline di oggi</div>
          <div style={{ background: "#0D1F1F", color: "#FFF", fontSize: 9, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{todayEvents.length}</div>
        </div>
        {todayEvents.length === 0 && (
          <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
            <div style={{ fontSize: 11, color: "#888" }}>Nessun impegno oggi</div>
            <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ fontSize: 11, color: "#28A0A0", fontWeight: 600, marginTop: 4, cursor: "pointer" }}>Apri agenda ›</div>
          </div>
        )}
        {todayEvents.slice(0, 3).map((it: any, idx: number) => {
          const f = FASE_MINI[it.tipo] || FASE_MINI.evento;
          return (
            <div key={idx} onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: f.bg, borderRadius: 10, padding: "8px 10px", marginBottom: idx < Math.min(todayEvents.length, 3) - 1 ? 4 : 0, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ fontSize: 10, color: f.pill, fontWeight: 700, minWidth: 36 }}>{(it.ora || "").slice(0, 5)}</div>
              <div style={{ flex: 1, fontSize: 11, color: f.fg, fontWeight: 600 }}>{it.titolo}</div>
              {it.codice && <div style={{ fontSize: 9, color: f.pill, fontWeight: 600 }}>{it.codice}</div>}
            </div>
          );
        })}
        {todayEvents.length > 3 && (
          <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ fontSize: 10, color: "#28A0A0", fontWeight: 600, textAlign: "center", padding: "6px 0 0", cursor: "pointer" }}>Vedi altri {todayEvents.length - 3} ›</div>
        )}
      </div>
    );
  };

  W.scaduti = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#F7C1C1", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="scaduti" fg="#501313" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#501313", fontWeight: 500, letterSpacing: 0.3 }}>TASK SCADUTI</div>
      <div style={{ fontSize: 28, color: "#501313", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>0</div>
      <div style={{ fontSize: 10, color: "#501313", marginTop: 4 }}>da gestire subito</div>
    </div>
  );
  W.prossimi = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#FAC775", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="prossimi" fg="#412402" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#412402", fontWeight: 500, letterSpacing: 0.3 }}>PROSSIME SCADENZE</div>
      <div style={{ fontSize: 28, color: "#412402", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{commesseAttive.length}</div>
      <div style={{ fontSize: 10, color: "#412402", marginTop: 4 }}>entro 7 giorni</div>
    </div>
  );
  W.nuove = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#CECBF6", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="nuove" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#26215C", fontWeight: 500, letterSpacing: 0.3 }}>NUOVE SETTIMANA</div>
      <div style={{ fontSize: 28, color: "#26215C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>3</div>
      <div style={{ fontSize: 10, color: "#26215C", marginTop: 4 }}>commesse aggiunte</div>
    </div>
  );
  W.ferme = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#F7C1C1", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="ferme" fg="#501313" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#501313", fontWeight: 500, letterSpacing: 0.3 }}>COMMESSE FERME</div>
      <div style={{ fontSize: 28, color: "#501313", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>0</div>
      <div style={{ fontSize: 10, color: "#501313", marginTop: 4 }}>da sbloccare</div>
    </div>
  );
  W.fattanno = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#C0DD97", borderRadius: 20, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="fattanno" fg="#173404" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#173404", fontWeight: 500, letterSpacing: 0.3 }}>FATTURATO ANNO</div>
      <div style={{ fontSize: 24, color: "#173404", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>€{(totMese*10/1000).toFixed(0)}k</div>
      <div style={{ fontSize: 10, color: "#173404", marginTop: 4 }}>obiettivo 80%</div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.5)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
        <div style={{ width: "80%", height: "100%", background: "#3B6D11" }} />
      </div>
    </div>
  );
  W.incassi = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#FAC775", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="incassi" fg="#412402" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#412402", fontWeight: 500, letterSpacing: 0.3 }}>DA RISCUOTERE</div>
      <div style={{ fontSize: 24, color: "#412402", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>€{(totMese*0.3/1000).toFixed(1)}k</div>
      <div style={{ fontSize: 10, color: "#412402", marginTop: 4 }}>fatture aperte</div>
    </div>
  );
  W.preventivi = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#CECBF6", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="preventivi" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#26215C", fontWeight: 500, letterSpacing: 0.3 }}>PREVENTIVI APERTI</div>
      <div style={{ fontSize: 28, color: "#26215C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{Math.max(commesseAttive.length - 2, 0)}</div>
      <div style={{ fontSize: 10, color: "#26215C", marginTop: 4 }}>in attesa risposta</div>
    </div>
  );
  W.ordini = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#B5D4F4", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="ordini" fg="#042C53" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#042C53", fontWeight: 500, letterSpacing: 0.3 }}>ORDINI FORNITORI</div>
      <div style={{ fontSize: 28, color: "#042C53", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>0</div>
      <div style={{ fontSize: 10, color: "#042C53", marginTop: 4 }}>in corso</div>
    </div>
  );
  W.margine = () => (
    <div onClick={() => !editMode && onNavigate?.("contabilita")} style={{ background: "#9FE1CB", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="margine" fg="#04342C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#04342C", fontWeight: 500, letterSpacing: 0.3 }}>MARGINE MEDIO</div>
      <div style={{ fontSize: 28, color: "#04342C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>32%</div>
      <div style={{ fontSize: 10, color: "#04342C", marginTop: 4 }}>ultime 10 commesse</div>
    </div>
  );
  W.settimana = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#F4C0D1", borderRadius: 20, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="settimana" fg="#72243E" onRemove={removeWidget} />}
      <div style={{ fontSize: 11, color: "#993556", fontWeight: 500, letterSpacing: 0.3 }}>SETTIMANA</div>
      <div style={{ fontSize: 14, color: "#4B1528", fontWeight: 600, marginTop: 2, marginBottom: 10 }}>Appuntamenti 7 gg</div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 36 }}>
        {[2,3,1,4,2,0,1].map((n,i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ background: n > 0 ? "#993556" : "#E0B8C5", height: `${Math.max(n*25, 5)}%`, borderRadius: 3, marginBottom: 3, minHeight: 3 }} />
            <div style={{ fontSize: 9, color: "#4B1528", fontWeight: 500 }}>{["L","M","M","G","V","S","D"][i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
  W.sopralluoghi = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#EEEDFE", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="sopralluoghi" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#26215C", fontWeight: 500, letterSpacing: 0.3 }}>SOPRALLUOGHI</div>
      <div style={{ fontSize: 28, color: "#26215C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>2</div>
      <div style={{ fontSize: 10, color: "#26215C", marginTop: 4 }}>programmati</div>
    </div>
  );
  W.montaggi = () => (
    <div onClick={() => !editMode && onNavigate?.("agenda")} style={{ background: "#E1F5EE", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="montaggi" fg="#04342C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#04342C", fontWeight: 500, letterSpacing: 0.3 }}>MONTAGGI</div>
      <div style={{ fontSize: 28, color: "#04342C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>1</div>
      <div style={{ fontSize: 10, color: "#04342C", marginTop: 4 }}>questa settimana</div>
    </div>
  );
  W.squadra = () => (
    <div style={{ position: "relative" as any }}>
      {editMode && <RemoveBtn id="squadra" fg="#26215C" onRemove={removeWidget} />}
      <SquadraWidgetV3 team={mastro?.team || []} onNavigate={onNavigate} editMode={editMode} />
    </div>
  );
  W.stock = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#F7C1C1", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="stock" fg="#501313" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#501313", fontWeight: 500, letterSpacing: 0.3 }}>SOTTO SCORTA</div>
      <div style={{ fontSize: 28, color: "#501313", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>4</div>
      <div style={{ fontSize: 10, color: "#501313", marginTop: 4 }}>articoli da riordinare</div>
    </div>
  );
  W.consegne = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#FAC775", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="consegne" fg="#412402" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#412402", fontWeight: 500, letterSpacing: 0.3 }}>CONSEGNE</div>
      <div style={{ fontSize: 28, color: "#412402", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>2</div>
      <div style={{ fontSize: 10, color: "#412402", marginTop: 4 }}>in arrivo questa sett.</div>
    </div>
  );
  W.msg = () => (
    <div onClick={() => !editMode && onNavigate?.("messaggi")} style={{ background: "#F4C0D1", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="msg" fg="#4B1528" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#4B1528", fontWeight: 500, letterSpacing: 0.3 }}>MESSAGGI</div>
      <div style={{ fontSize: 28, color: "#4B1528", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>0</div>
      <div style={{ fontSize: 10, color: "#4B1528", marginTop: 4 }}>non letti</div>
    </div>
  );
  W.firme = () => (
    <div onClick={() => !editMode && onNavigate?.("commesse")} style={{ background: "#CECBF6", borderRadius: 18, padding: 14, position: "relative", cursor: editMode ? "grab" : "pointer" }}>
      {editMode && <RemoveBtn id="firme" fg="#26215C" onRemove={removeWidget} />}
      <div style={{ fontSize: 10, color: "#26215C", fontWeight: 500, letterSpacing: 0.3 }}>FIRME</div>
      <div style={{ fontSize: 28, color: "#26215C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>1</div>
      <div style={{ fontSize: 10, color: "#26215C", marginTop: 4 }}>in attesa cliente</div>
    </div>
  );

  W.azioni = () => (
    <div style={{ background: "#FAC775", borderRadius: 20, padding: 14, position: "relative" }}>
      {editMode && <RemoveBtn id="azioni" fg="#633806" onRemove={removeWidget} />}
      <div style={{ fontSize: 11, color: "#854F0B", fontWeight: 500, letterSpacing: 0.3, marginBottom: 10 }}>AZIONI RAPIDE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <button onClick={() => onNavigate?.("nuova-commessa")} style={QBTN}><PlusIco /> Nuova commessa</button>
        <button onClick={() => onNavigate?.("commesse")} style={QBTN}><DocIco /> Preventivo</button>
        <button onClick={() => onNavigate?.("contabilita")} style={QBTN}><MailIco /> Fattura</button>
        <button onClick={() => onNavigate?.("clienti")} style={QBTN}><UserIco /> Cliente</button>
      </div>
    </div>
  );

  // wrapper con drag
  const renderWidget = (id: string) => {
    const render = W[id];
    if (!render) return null;
    // Doppia-colonna per metriche piccole
    if (id === "corso" || id === "fatt") {
      return (
        <div key={id} draggable={editMode} onDragStart={onDragStart(id)} onDragOver={onDragOver(id)} onDrop={onDrop(id)} style={{ opacity: editMode ? 0.95 : 1 }}>
          {render()}
        </div>
      );
    }
    return (
      <div key={id} draggable={editMode} onDragStart={onDragStart(id)} onDragOver={onDragOver(id)} onDrop={onDrop(id)} style={{ marginBottom: 10, opacity: editMode ? 0.95 : 1 }}>
        {render()}
      </div>
    );
  };

  // Raggruppa corso+fatt in una griglia
  const renderOrder = () => {
    const blocks: any[] = [];
    let i = 0;
    while (i < layout.length) {
      const id = layout[i];
      if (id === "corso" && layout[i + 1] === "fatt") {
        blocks.push(
          <div key="pair-corso-fatt" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {renderWidget("corso")}
            {renderWidget("fatt")}
          </div>
        );
        i += 2;
      } else {
        blocks.push(renderWidget(id));
        i += 1;
      }
    }
    return blocks;
  };

  const availableToAdd = ALL_WIDGETS.filter(w => !layout.includes(w.id));

  return (
    <div style={{ background: "#F4F1EA", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: 100 }}>
      <div style={{ padding: "12px 10px 0" }}>
      <div style={{ background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)", padding: "18px 18px 20px", borderRadius: 22, boxShadow: "0 4px 16px rgba(40,160,160,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={3}><path d="M18 6L6 18M6 6l12 12" /></svg>
            </div>
            <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 500 }}>fliwoX</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <DayButton />
            <div onClick={() => onNavigate?.("altro")} style={{ width: 30, height: 30, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#28A0A0", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{iniziali}</div>
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
        <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
      </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
          <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>I miei widget</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowAdd(true)} style={{ background: "#FFFFFF", border: "1px solid #E0DCD0", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              Aggiungi
            </button>
            <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? "#1E8080" : "#28A0A0", border: "none", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#FFF", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
              {editMode ? "Fine" : "Modifica"}
            </button>
          </div>
        </div>

        {editMode && (
          <div style={{ background: "#FFF7E0", border: "1px dashed #FAC775", borderRadius: 12, padding: "8px 10px", marginBottom: 10, fontSize: 11, color: "#854F0B" }}>
            Trascina i widget per riordinare · Tocca la X per rimuovere
          </div>
        )}

        {renderOrder()}
      </div>

      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", width: "100%", borderRadius: "20px 20px 0 0", padding: 16, maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 12 }}>Aggiungi widget</div>
            {availableToAdd.length === 0 && <div style={{ fontSize: 12, color: "#888", padding: 16, textAlign: "center" }}>Tutti i widget sono già aggiunti.</div>}
            {Object.entries(availableToAdd.reduce((acc: any, w: any) => { (acc[w.cat] = acc[w.cat] || []).push(w); return acc; }, {})).map(([cat, items]: any) => (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, letterSpacing: 0.4, marginBottom: 6, paddingLeft: 4 }}>{cat.toUpperCase()}</div>
                {items.map((w: any) => (
                  <div key={w.id} onClick={() => addWidget(w.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, marginBottom: 6, background: w.bg, cursor: "pointer" }}>
                    <div style={{ flex: 1, fontSize: 13, color: w.fg, fontWeight: 600 }}>{w.label}</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={w.fg} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => setShowAdd(false)} style={{ width: "100%", background: "#F0EDE5", border: "none", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginTop: 8, cursor: "pointer" }}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}

const QBTN: any = { background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" };

const RemoveBtn = ({ id, fg, onRemove }: any) => (
  <div onClick={(e) => { e.stopPropagation(); onRemove(id); }} style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 50, background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth={3}><path d="M18 6L6 18M6 6l12 12" /></svg>
  </div>
);

const PlusIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>;
const DocIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
const MailIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>;
const UserIco = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>;
