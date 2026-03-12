// =======================================================
// MASTRO ERP v2 — PARTE 1/5
// Righe 1-1280: Costanti, Dati Demo (incluse visite/vaniList/euro/scadenza),
//               MOTIVI_BLOCCO, AFASE, useDragOrder hook, Home, Helpers, Stili
// Continuazione in PARTE2
// =======================================================
// components/MastroERP.tsx
// MASTRO ERP — adattato per Next.js + Supabase
"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { getAziendaId, loadAllData, saveCantiere, saveEvent, deleteEvent as deleteEventDB, saveContatto, saveTeamMember, saveTask, saveAzienda, saveVano, deleteVano, saveMateriali, savePipeline } from "@/lib/supabase-sync";

/* =======================================================
   MASTRO MISURE — v15 COMPLETE REBUILD
   Tutte le feature recuperate + design Apple chiaro
   ======================================================= */

const FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600&display=swap";
const FF = "'Plus Jakarta Sans',sans-serif";
const FM = "'JetBrains Mono',monospace";

/* == TEMI == */
const THEMES = {
  chiaro: {
    name: "Chiaro", emoji: "☀️",
    bg: "#f5f5f7", bg2: "#ffffff", card: "#ffffff", card2: "#f8f8fa",
    bdr: "#e5e5ea", bdrL: "#d1d1d6", text: "#1d1d1f", sub: "#86868b", sub2: "#aeaeb2",
    acc: "#0066cc", accD: "#0055aa", accLt: "rgba(0,102,204,0.08)", accBg: "linear-gradient(135deg,#0066cc,#0055aa)",
    grn: "#34c759", grnLt: "rgba(52,199,89,0.08)",
    red: "#ff3b30", redLt: "rgba(255,59,48,0.08)",
    orange: "#ff9500", orangeLt: "rgba(255,149,0,0.08)",
    blue: "#007aff", blueLt: "rgba(0,122,255,0.08)",
    purple: "#af52de", purpleLt: "rgba(175,82,222,0.08)",
    cyan: "#32ade6", cyanLt: "rgba(50,173,230,0.08)",
    cardSh: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    cardShH: "0 4px 12px rgba(0,0,0,0.08)",
    r: 12, r2: 16
  },
  scuro: {
    name: "Scuro", emoji: "🌙",
    bg: "#000000", bg2: "#1c1c1e", card: "#1c1c1e", card2: "#2c2c2e",
    bdr: "#38383a", bdrL: "#48484a", text: "#f2f2f7", sub: "#8e8e93", sub2: "#636366",
    acc: "#0a84ff", accD: "#0070e0", accLt: "rgba(10,132,255,0.12)", accBg: "linear-gradient(135deg,#0a84ff,#0070e0)",
    grn: "#30d158", grnLt: "rgba(48,209,88,0.12)",
    red: "#ff453a", redLt: "rgba(255,69,58,0.12)",
    orange: "#ff9f0a", orangeLt: "rgba(255,159,10,0.12)",
    blue: "#0a84ff", blueLt: "rgba(10,132,255,0.12)",
    purple: "#bf5af2", purpleLt: "rgba(191,90,242,0.12)",
    cyan: "#64d2ff", cyanLt: "rgba(100,210,255,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.3)",
    cardShH: "0 4px 12px rgba(0,0,0,0.4)",
    r: 12, r2: 16
  },
  oceano: {
    name: "Oceano", emoji: "🌊",
    bg: "#0f1923", bg2: "#162231", card: "#1a2a3a", card2: "#1f3040",
    bdr: "#2a3f55", bdrL: "#345070", text: "#e8ecf0", sub: "#7a90a5", sub2: "#4a6070",
    acc: "#4fc3f7", accD: "#29b6f6", accLt: "rgba(79,195,247,0.12)", accBg: "linear-gradient(135deg,#4fc3f7,#29b6f6)",
    grn: "#66bb6a", grnLt: "rgba(102,187,106,0.12)",
    red: "#ef5350", redLt: "rgba(239,83,80,0.12)",
    orange: "#ffa726", orangeLt: "rgba(255,167,38,0.12)",
    blue: "#42a5f5", blueLt: "rgba(66,165,245,0.12)",
    purple: "#ab47bc", purpleLt: "rgba(171,71,188,0.12)",
    cyan: "#26c6da", cyanLt: "rgba(38,198,218,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.25)",
    cardShH: "0 4px 12px rgba(0,0,0,0.35)",
    r: 12, r2: 16
  }
};

/* == PIPELINE 7+1 FASI == */
const PIPELINE_DEFAULT = [
  { id: "sopralluogo", nome: "Sopralluogo", ico: "🔍", color: "#007aff", attiva: true },
  { id: "preventivo", nome: "Preventivo", ico: "📋", color: "#ff9500", attiva: true },
  { id: "conferma", nome: "Conferma", ico: "✍️", color: "#af52de", attiva: true },
  { id: "misure", nome: "Misure", ico: "📐", color: "#5856d6", attiva: true },
  { id: "ordini", nome: "Ordini", ico: "📦", color: "#ff2d55", attiva: true },
  { id: "produzione", nome: "Produzione", ico: "🏭", color: "#ff9500", attiva: true },
  { id: "posa", nome: "Posa", ico: "🔧", color: "#34c759", attiva: true },
  { id: "chiusura", nome: "Chiusura", ico: "✅", color: "#30b0c7", attiva: true },
];

/* == MOTIVI BLOCCO SOPRALLUOGO == */
const MOTIVI_BLOCCO = [
  "Cliente assente",
  "Vano inaccessibile",
  "Materiale da rimuovere",
  "Lavori in corso",
  "Arredo da spostare",
  "Altro"
];

/* == AZIONE SUGGERITA PER FASE == */
const AFASE = {
  sopralluogo: { i: "📐", t: "Pianifica sopralluogo",  c: "#007aff" },
  preventivo:  { i: "📝", t: "Invia preventivo",        c: "#ff9500" },
  conferma:    { i: "✍️", t: "Fai firmare contratto",   c: "#af52de" },
  misure:      { i: "📏", t: "Esegui rilievo misure",   c: "#5856d6" },
  ordini:      { i: "🛒", t: "Conferma ordine",          c: "#ff2d55" },
  produzione:  { i: "🏭", t: "Monitora produzione",      c: "#ff9500" },
  posa:        { i: "🔧", t: "Schedula posa",            c: "#34c759" },
  chiusura:    { i: "✅", t: "Richiedi saldo finale",    c: "#30b0c7" },
};

/* == DATI DEMO == */
const CANTIERI_INIT = [];

const TASKS_INIT = [];


// === AI INBOX — email in arrivo con classificazione AI ===
const AI_INBOX_INIT = [];

const MSGS_INIT = [];

const TEAM_INIT = [
  { id: 1, nome: "", ruolo: "Titolare", compiti: "Gestione commesse, preventivi, rapporti clienti", colore: "#007aff" },
];

const CONTATTI_INIT = [];

const COLORI_INIT = [
  { id: 1, nome: "Bianco", code: "RAL 9010", hex: "#f5f5f0", tipo: "RAL" },
  { id: 2, nome: "Grigio antracite", code: "RAL 7016", hex: "#383e42", tipo: "RAL" },
  { id: 3, nome: "Nero", code: "RAL 9005", hex: "#0e0e10", tipo: "RAL" },
  { id: 4, nome: "Marrone", code: "RAL 8014", hex: "#4a3728", tipo: "RAL" },
  { id: 5, nome: "Noce", code: "Noce", hex: "#6b4226", tipo: "Legno" },
  { id: 6, nome: "Rovere", code: "Rovere", hex: "#a0784a", tipo: "Legno" },
];

const SISTEMI_INIT = [
  { id: 1, marca: "Aluplast", sistema: "Ideal 4000", euroMq: 180, prezzoMq: 180, sovRAL: 12, sovLegno: 22, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Noce"], sottosistemi: ["Classicline", "Roundline"] },
  { id: 2, marca: "Schüco", sistema: "CT70", euroMq: 280, prezzoMq: 280, sovRAL: 15, sovLegno: 25, colori: ["RAL 9010", "RAL 7016", "RAL 9005"], sottosistemi: ["Classic", "Rondo"] },
  { id: 3, marca: "Rehau", sistema: "S80", euroMq: 220, prezzoMq: 220, sovRAL: 12, sovLegno: 20, colori: ["RAL 9010", "RAL 7016", "Noce"], sottosistemi: ["Geneo", "Synego"] },
  { id: 4, marca: "Finstral", sistema: "FIN-Project", euroMq: 350, prezzoMq: 350, sovRAL: 18, sovLegno: 30, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Rovere"], sottosistemi: ["Nova-line", "Step-line"] },
];

const VETRI_INIT = [
  { id: 1, nome: "Doppio basso emissivo", code: "4/16/4 BE", ug: 1.1, prezzoMq: 45 },
  { id: 2, nome: "Triplo basso emissivo", code: "4/12/4/12/4 BE", ug: 0.6, prezzoMq: 75 },
  { id: 3, nome: "Doppio sicurezza", code: "33.1/16/4 BE", ug: 1.1, prezzoMq: 65 },
  { id: 4, nome: "Triplo sicurezza", code: "33.1/12/4/12/4 BE", ug: 0.6, prezzoMq: 90 },
  { id: 5, nome: "Satinato", code: "4/16/4 SAT", ug: 1.1, prezzoMq: 55 },
  { id: 6, nome: "Fonoisolante", code: "44.2/20/6 BE", ug: 1.0, prezzoMq: 110 },
];

const TIPOLOGIE_RAPIDE = [
  // Finestre
  { code: "F1A",    label: "Finestra 1 anta",           icon: "🪟", cat: "Finestre" },
  { code: "F2A",    label: "Finestra 2 ante",            icon: "🪟", cat: "Finestre" },
  { code: "F3A",    label: "Finestra 3 ante",            icon: "🪟", cat: "Finestre" },
  { code: "F4A",    label: "Finestra 4 ante",            icon: "🪟", cat: "Finestre" },
  { code: "F2AFISDX", label: "Finestra 2A + Fisso DX",  icon: "🪟", cat: "Finestre" },
  { code: "F2AFISSX", label: "Finestra 2A + Fisso SX",  icon: "🪟", cat: "Finestre" },
  { code: "FISDX",  label: "Fisso DX",                  icon: "▮",  cat: "Finestre" },
  { code: "FISSX",  label: "Fisso SX",                  icon: "▮",  cat: "Finestre" },
  { code: "VAS",    label: "Vasistas",                  icon: "⬇",  cat: "Finestre" },
  { code: "RIBALTA",label: "Ribalta",                   icon: "⬆",  cat: "Finestre" },
  // Balconi / Portafinestre
  { code: "PF1A",   label: "Balcone 1 anta",            icon: "🚪", cat: "Balconi" },
  { code: "PF2A",   label: "Balcone 2 ante",            icon: "🚪", cat: "Balconi" },
  { code: "PF3A",   label: "Balcone 3 ante",            icon: "🚪", cat: "Balconi" },
  { code: "PF4A",   label: "Balcone 4 ante",            icon: "🚪", cat: "Balconi" },
  { code: "PF2AFISDX", label: "Balcone 2A + Fisso DX", icon: "🚪", cat: "Balconi" },
  { code: "PF2AFISSX", label: "Balcone 2A + Fisso SX", icon: "🚪", cat: "Balconi" },
  // Scorrevoli / Alzanti
  { code: "SC2A",   label: "Scorrevole 2 ante",         icon: "↔️", cat: "Scorrevoli" },
  { code: "SC4A",   label: "Scorrevole 4 ante",         icon: "↔️", cat: "Scorrevoli" },
  { code: "SCRDX",  label: "Scorrevole DX",             icon: "▶",  cat: "Scorrevoli" },
  { code: "SCRSX",  label: "Scorrevole SX",             icon: "◀",  cat: "Scorrevoli" },
  { code: "ALZDX",  label: "Alzante DX",                icon: "⬆",  cat: "Scorrevoli" },
  { code: "ALZSX",  label: "Alzante SX",                icon: "⬆",  cat: "Scorrevoli" },
  // Persiane
  { code: "PERS1A", label: "Persiana 1 anta",           icon: "🌂", cat: "Persiane" },
  { code: "PERS2A", label: "Persiana 2 ante",           icon: "🌂", cat: "Persiane" },
  { code: "TAPP",   label: "Tapparella",                icon: "⬇",  cat: "Persiane" },
  { code: "ZANZ",   label: "Zanzariera",                icon: "🕸",  cat: "Persiane" },
  // Altro
  { code: "SOPR",   label: "Sopraluce",                 icon: "△",  cat: "Altro" },
  { code: "MONO",   label: "Monoblocco",                icon: "⬜",  cat: "Altro" },
  { code: "BLI",    label: "Porta blindata",            icon: "🛡",  cat: "Altro" },
];

const COPRIFILI_INIT = [
  { id: 1, nome: "Coprifilo piatto 40mm", cod: "CP40", prezzoMl: 4.5 },
  { id: 2, nome: "Coprifilo piatto 50mm", cod: "CP50", prezzoMl: 5.5 },
  { id: 3, nome: "Coprifilo piatto 70mm", cod: "CP70", prezzoMl: 7.0 },
  { id: 4, nome: "Coprifilo angolare 40mm", cod: "CA40", prezzoMl: 5.0 },
  { id: 5, nome: "Coprifilo a Z 50mm", cod: "CZ50", prezzoMl: 6.0 },
];

const LAMIERE_INIT = [
  { id: 1, nome: "Lamiera davanzale 200mm", cod: "LD200", prezzoMl: 8.0 },
  { id: 2, nome: "Lamiera davanzale 250mm", cod: "LD250", prezzoMl: 9.5 },
  { id: 3, nome: "Lamiera davanzale 300mm", cod: "LD300", prezzoMl: 11.0 },
  { id: 4, nome: "Scossalina 150mm", cod: "SC150", prezzoMl: 7.0 },
  { id: 5, nome: "Scossalina 200mm", cod: "SC200", prezzoMl: 8.5 },
];

/* == ICONS SVG == */
const Ico = ({ d, s = 20, c = "#888", sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICO = {
  home: <><path d="M2 12L12 3l10 9"/><path d="M5 9.5V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><rect x="7" y="14" width="2" height="2" rx="0.5" fill="currentColor"/><rect x="11" y="14" width="2" height="2" rx="0.5" fill="currentColor"/><rect x="15" y="14" width="2" height="2" rx="0.5" fill="currentColor"/></>,
  chat: <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M7 8h10M7 12h6"/></>,
  settings: <><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></>,
  back: <><polyline points="15 18 9 12 15 6"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  pen: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 10h8M5 6h14M11 14h2M10 18h4"/></>,
  ai: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
};

/* == MISURE PUNTI == */
const PUNTI_MISURE = [
  { key: "lAlto", label: "L alto", x: 95, y: 8, color: "acc" },
  { key: "lCentro", label: "L centro", x: 95, y: 125, color: "acc" },
  { key: "lBasso", label: "L basso", x: 95, y: 242, color: "acc" },
  { key: "hSx", label: "H sx", x: 8, y: 125, color: "blue", rot: true },
  { key: "hCentro", label: "H centro", x: 95, y: 170, color: "blue" },
  { key: "hDx", label: "H dx", x: 182, y: 125, color: "blue", rot: true },
  { key: "d1", label: "D1 ↗", x: 50, y: 55, color: "purple" },
  { key: "d2", label: "D2 ↘", x: 140, y: 55, color: "purple" },
];

/* ====================================== */
/* ==          MAIN COMPONENT          == */
/* ====================================== */

/* == HOOK DRAG ORDER == */
function useDragOrder(init) {
  const [order, setOrder] = React.useState(init);
  const [dragging, setDragging] = React.useState(null);
  const [over, setOver] = React.useState(null);
  function start(id) { setDragging(id); }
  function onOver(id) { if (dragging && dragging !== id) setOver(id); }
  function drop(id) {
    if (!dragging || dragging === id) { setDragging(null); setOver(null); return; }
    setOrder(o => { const a = [...o], f = a.indexOf(dragging), t = a.indexOf(id); a.splice(f,1); a.splice(t,0,dragging); return a; });
    setDragging(null); setOver(null);
  }
  function end() { setDragging(null); setOver(null); }
  return { order, setOrder, dragging, over, start, onOver, drop, end };
}

export default function MastroMisure({ user, azienda: aziendaInit }: { user?: any, azienda?: any }) {
  const [theme, setTheme] = useState("chiaro");
  const T = THEMES[theme];
  
  const [tab, setTab] = useState("home");
  const WIDGET_IDS = ["banner", "urgenti", "calendario", "email", "commesse"];
  const drag = useDragOrder(WIDGET_IDS);
  const [homeEditMode, setHomeEditMode] = useState(false);

  // #06 — Meteo reale via geolocation + Open-Meteo (no API key)
  const [weather, setWeather] = useState<{temp:number|null,icon:string,city:string}|null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Reverse geocoding città
        const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const geoData = await geo.json();
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "—";
        // Meteo Open-Meteo
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const wxData = await wx.json();
        const temp = Math.round(wxData.current_weather?.temperature ?? 0);
        const code = wxData.current_weather?.weathercode ?? 0;
        const icon = code === 0 ? "☀️" : code <= 3 ? "⛅" : code <= 48 ? "🌫" : code <= 67 ? "🌧" : code <= 77 ? "❄️" : code <= 82 ? "🌦" : "⛈";
        setWeather({ temp, icon, city });
      } catch { /* silenzioso */ }
    }, () => { /* permesso negato — rimane null */ });
  }, []);
  // Wizard nuova visita
  const [cmSubTab, setCmSubTab] = useState("sopralluoghi"); // "sopralluoghi" | "misure" | "info"
  const [nvView, setNvView] = useState(false);
  const [nvStep, setNvStep] = useState(1);
  const [nvData, setNvData] = useState({ data: "", ora: "", rilevatore: "" });
  const [nvTipo, setNvTipo] = useState("rilievo"); // "rilievo" | "definitiva" | "modifica"
  const [nvMotivoModifica, setNvMotivoModifica] = useState("");
  const [nvVani, setNvVani] = useState([]);
  const [nvBlocchi, setNvBlocchi] = useState({});
  const [nvNote, setNvNote] = useState("");
  // Calendario griglia espandibile
  const [expandedDay, setExpandedDay] = useState(null); // ISO string del giorno espanso
  const [cantieri, setCantieri] = useState(CANTIERI_INIT);
  const [tasks, setTasks] = useState(TASKS_INIT);
  const [msgs, setMsgs] = useState(MSGS_INIT);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [team, setTeam] = useState(TEAM_INIT);
  const [coloriDB, setColoriDB] = useState(COLORI_INIT);
  const [sistemiDB, setSistemiDB] = useState(SISTEMI_INIT);
  const [vetriDB, setVetriDB] = useState(VETRI_INIT);
  const [coprifiliDB, setCoprifiliDB] = useState(COPRIFILI_INIT);
  const [lamiereDB, setLamiereDB] = useState(LAMIERE_INIT);
  const [telaiPersianaDB, setTelaiPersianaDB] = useState([
    { id: "tp1", code: "L" }, { id: "tp2", code: "Z 22" }, { id: "tp3", code: "Z 27" }, { id: "tp4", code: "Z 40" }, { id: "tp5", code: "Z 50" }
  ]);
  const [posPersianaDB, setPosPersianaDB] = useState([
    { id: "pp1", code: "In battuta" }, { id: "pp2", code: "Con zoccoletto" }, { id: "pp3", code: "A filo muro" }, { id: "pp4", code: "Su controtelaio" }
  ]);
  const [tipoMisuraDB, setTipoMisuraDB] = useState([
    { id: "tm1", code: "Punta corta" }, { id: "tm2", code: "Punta lunga" }, { id: "tm3", code: "Muro finito" }, { id: "tm4", code: "Muro grezzo" }
  ]);
  const [pipelineDB, setPipelineDB] = useState(PIPELINE_DEFAULT);
  const [faseOpen, setFaseOpen] = useState(true);
  const [sogliaDays, setSogliaDays] = useState(5);
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [firmaDrawing, setFirmaDrawing] = useState(false);
  const [firmaDataUrl, setFirmaDataUrl] = useState(null);
  const [showPreventivoModal, setShowPreventivoModal] = useState(false);
  const [favTipologie, setFavTipologie] = useState(["F1A", "F2A", "PF2A", "SC2A", "FISDX", "VAS"]);
  
  // Navigation
  const [selectedCM, setSelectedCM] = useState(null);
  const [selectedRilievo, setSelectedRilievo] = useState(null); // rilievo aperto
  const [showNuovoRilievo, setShowNuovoRilievo] = useState(false);
  const [nuovoRilTipo, setNuovoRilTipo] = useState("rilievo");
  const [nuovoRilData, setNuovoRilData] = useState({ data: "", ora: "", rilevatore: "", note: "", motivoModifica: "" });
  const [selectedVano, setSelectedVano] = useState(null);
  const [filterFase, setFilterFase] = useState("tutte");
  const [searchQ, setSearchQ] = useState("");
  const [showModal, setShowModal] = useState(null); // 'task' | 'commessa' | 'vano' | null
  const [settingsTab, setSettingsTab] = useState("generali");
  const [showRiepilogo, setShowRiepilogo] = useState(false);
  const [riepilogoSending, setRiepilogoSending] = useState(false);

  // === ONBOARDING TUTORIAL ===
  const [tutoStep, setTutoStep] = useState(0);
  React.useEffect(() => {
    try { if (!localStorage.getItem("mastro:onboarded")) setTutoStep(1); } catch(e){}
  }, []);
  const closeTuto = () => { setTutoStep(0); try { localStorage.setItem("mastro:onboarded", "1"); } catch(e){} };
  const nextTuto = () => { if (tutoStep >= 7) closeTuto(); else setTutoStep(tutoStep + 1); };

  const [aziendaInfo, setAziendaInfo] = useState({
    ragione: aziendaInit?.ragione || "Walter Cozza Serramenti SRL",
    piva: aziendaInit?.piva || "",
    indirizzo: aziendaInit?.indirizzo || "",
    telefono: aziendaInit?.telefono || "",
    email: aziendaInit?.email || "",
    website: "",
    iban: "",
    cciaa: "",
    logo: null,
  });
  const logoInputRef = useRef(null);
  const [aiChat, setAiChat] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState([{ role: "ai", text: "Ciao Fabio! Sono MASTRO AI. Chiedimi qualsiasi cosa sulle tue commesse, task o misure." }]);
  
  // Send commessa modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendOpts, setSendOpts] = useState({ misure: true, foto: true, disegno: true, note: true, accessori: true });
  const [sendConfirm, setSendConfirm] = useState(null);
  
  // Vano wizard step
  const [vanoStep, setVanoStep] = useState(0);
  const spCanvasRef = useRef(null);
  const [spDrawing, setSpDrawing] = useState(false); // "sent" | null
  
  // Agenda
  const [agendaView, setAgendaView] = useState("mese"); // "giorno" | "settimana" | "mese"
  const [cmFaseIdx, setCmFaseIdx] = useState(0); // filtro fase widget commesse dashboard
  const [cmView, setCmView] = useState<"card"|"list">("card"); // vista commesse: card grande | lista compatta
  const [fasePanelOpen, setFasePanelOpen] = useState<Record<string,boolean>>({}); // accordion checklist per fase
  const [catIdx, setCatIdx] = useState(0); // categoria widget allerte dashboard
  const [selDate, setSelDate] = useState(new Date());
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMailModal, setShowMailModal] = useState<{ev: any, cm: any} | null>(null);
  const [mailBody, setMailBody] = useState("");
  const [newEvent, setNewEvent] = useState({ text: "", time: "", tipo: "appuntamento", cm: "", persona: "", date: "", reminder: "", addr: "" });
  const [events, setEvents] = useState(() => {
    const t = new Date(); const td = t.toISOString().split("T")[0];
    const tm = new Date(t); tm.setDate(tm.getDate() + 1); const tmStr = tm.toISOString().split("T")[0];
    const t2 = new Date(t); t2.setDate(t2.getDate() + 2); const t2Str = t2.toISOString().split("T")[0];
    return [];
  });
  
    // Advance fase notification
  const [faseNotif, setFaseNotif] = useState(null);
  
  // AI Photo
  const [showAIPhoto, setShowAIPhoto] = useState(false);
  const [aiPhotoStep, setAiPhotoStep] = useState(0); // 0=ready, 1=analyzing, 2=done
  const [settingsModal, setSettingsModal] = useState(null); // {type, item?}
  const [settingsForm, setSettingsForm] = useState({});
  const [showAllegatiModal, setShowAllegatiModal] = useState(null); // "nota" | "vocale" | "video" | null
  const [allegatiText, setAllegatiText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recInterval = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [playProgress, setPlayProgress] = useState(0);
  const playInterval = useRef(null);
  
  // Drawing state
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fotoInputRef = useRef(null);
  const firmaRef = useRef(null);
  const fotoVanoRef = useRef(null);
  const calTouchStartRef = React.useRef(0);
  const calTouchEndRef = React.useRef(0);
  const [pendingFotoCat, setPendingFotoCat] = useState(null);
  const videoVanoRef = useRef(null);
  const ripFotoRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#1d1d1f");
  const [penSize, setPenSize] = useState(2);
  const [drawPaths, setDrawPaths] = useState([]);

  // New task form
  const [newTask, setNewTask] = useState({ text: "", meta: "", time: "", priority: "media", cm: "", date: "", persona: "" });
  const [taskAllegati, setTaskAllegati] = useState([]); // allegati for new task
  const [msgFilter, setMsgFilter] = useState("tutti"); // tutti/email/whatsapp/sms/telegram
  const [msgSearch, setMsgSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMsg, setComposeMsg] = useState({ to: "", text: "", canale: "whatsapp", cm: "" });
  const [fabOpen, setFabOpen] = useState(false);
  const [contatti, setContatti] = useState(CONTATTI_INIT);
  const [msgSubTab, setMsgSubTab] = useState("chat"); // "chat" | "rubrica" | "ai"
  const [aiInbox, setAiInbox] = useState(AI_INBOX_INIT);
  const [selectedAiMsg, setSelectedAiMsg] = useState(null);
  const [rubricaSearch, setRubricaSearch] = useState("");
  const [rubricaFilter, setRubricaFilter] = useState("tutti"); // tutti/preferiti/team/clienti/fornitori
  const [globalSearch, setGlobalSearch] = useState("");
  // New commessa form
  const [newCM, setNewCM] = useState({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "", note: "" });
  const [ripSearch, setRipSearch] = useState("");
  const [ripCMSel, setRipCMSel] = useState(null);
  const [ripProblema, setRipProblema] = useState("");
  const [ripFotos, setRipFotos] = useState([]);
  const [ripUrgenza, setRipUrgenza] = useState("media");
  // New vano form
  const [vanoInfoOpen, setVanoInfoOpen] = useState(null); // which accordion section is open
  const [tipCat, setTipCat] = useState("Finestre");
  const [newVano, setNewVano] = useState({ nome: "", tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", pezzi: 1 });
  const [customPiani, setCustomPiani] = useState(["S1", "PT", "P1", "P2", "P3"]);
  const [mezziSalita, setMezziSalita] = useState(["Scala interna", "Scala esterna", "Scala aerea", "Scala a mano", "Gru", "Elevatore", "Ponteggio", "Nessuno"]);
  const [showAddPiano, setShowAddPiano] = useState(false);
  const [newPiano, setNewPiano] = useState("");

  // Responsive width
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 430);
  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // == Persistence ==
  useEffect(()=>{
      try{const _v=localStorage.getItem("mastro:cantieri");if(_v)setCantieri(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:tasks");if(_v)setTasks(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:events");if(_v)setEvents(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:colori");if(_v)setColoriDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:sistemi");if(_v)setSistemiDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:vetri");if(_v)setVetriDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:coprifili");if(_v)setCoprifiliDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:lamiere");if(_v)setLamiereDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:team");if(_v)setTeam(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:contatti");if(_v)setContatti(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:pipeline");if(_v)setPipelineDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:azienda");if(_v)setAziendaInfo(JSON.parse(_v));}catch(e){}
},[]);
  useEffect(()=>{try{localStorage.setItem("mastro:cantieri",JSON.stringify(cantieri));}catch(e){}},[cantieri]);
  useEffect(()=>{try{localStorage.setItem("mastro:tasks",JSON.stringify(tasks));}catch(e){}},[tasks]);
  useEffect(()=>{try{localStorage.setItem("mastro:events",JSON.stringify(events));}catch(e){}},[events]);
  useEffect(()=>{try{localStorage.setItem("mastro:colori",JSON.stringify(coloriDB));}catch(e){}},[coloriDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:sistemi",JSON.stringify(sistemiDB));}catch(e){}},[sistemiDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:vetri",JSON.stringify(vetriDB));}catch(e){}},[vetriDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:coprifili",JSON.stringify(coprifiliDB));}catch(e){}},[coprifiliDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:lamiere",JSON.stringify(lamiereDB));}catch(e){}},[lamiereDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:team",JSON.stringify(team));}catch(e){}},[team]);
  useEffect(()=>{try{localStorage.setItem("mastro:contatti",JSON.stringify(contatti));}catch(e){}},[contatti]);
  useEffect(()=>{try{localStorage.setItem("mastro:pipeline",JSON.stringify(pipelineDB));}catch(e){}},[pipelineDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:azienda",JSON.stringify(aziendaInfo));}catch(e){}},[aziendaInfo]);

  // === SUPABASE DATA LAYER ===
  const [azId, setAzId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const id = await getAziendaId();
        if (!mounted || !id) { setDbLoading(false); return; }
        setAzId(id);
        const data = await loadAllData(id);
        if (!mounted) return;
        if (data.cantieri.length > 0) setCantieri(data.cantieri);
        if (data.events.length > 0) setEvents(data.events);
        if (data.contatti.length > 0) setContatti(data.contatti);
        if (data.team.length > 0) setTeam(data.team);
        if (data.tasks.length > 0) setTasks(data.tasks);
        if (data.msgs.length > 0) setMsgs(data.msgs);
        if (data.sistemi) setSistemiDB(data.sistemi);
        if (data.colori) setColoriDB(data.colori);
        if (data.vetri) setVetriDB(data.vetri);
        if (data.coprifili) setCoprifiliDB(data.coprifili);
        if (data.lamiere) setLamiereDB(data.lamiere);
        if (data.pipeline) setPipelineDB(data.pipeline);
        if (data.azienda) setAziendaInfo(prev => ({
          ...prev,
          ragione: data.azienda.ragione || prev.ragione,
          piva: data.azienda.piva || prev.piva,
          indirizzo: data.azienda.indirizzo || prev.indirizzo,
          telefono: data.azienda.telefono || prev.telefono,
          email: data.azienda.email || prev.email,
        }));
      } catch (e) { console.error('Supabase load error:', e); }
      if (mounted) setDbLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { if (!azId || dbLoading) return; cantieri.forEach(ct => saveCantiere(azId, ct)); }, [cantieri, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; events.forEach(ev => saveEvent(azId, ev)); }, [events, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; contatti.forEach(ct => saveContatto(azId, ct)); }, [contatti, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; team.forEach(t => saveTeamMember(azId, t)); }, [team, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; saveAzienda(azId, aziendaInfo); }, [aziendaInfo, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; savePipeline(azId, pipelineDB); }, [pipelineDB, azId, dbLoading]);


  const PIPELINE = pipelineDB.filter(p => p.attiva !== false);
  const parseDataCM = (s) => {
    const oggi0 = new Date(); oggi0.setHours(0,0,0,0);
    if(!s) return null;
    if(s==="oggi"||s==="Oggi"||s==="Adesso") return oggi0;
    const mesi2 = {gen:0,feb:1,mar:2,apr:3,mag:4,giu:5,lug:6,ago:7,set:8,ott:9,nov:10,dic:11};
    const m2 = s.toLowerCase().match(/(\d+)\s+([a-z]+)/);
    if(m2) return new Date(oggi0.getFullYear(), mesi2[m2[2]]??0, parseInt(m2[1]));
    return null;
  };
  const giorniFermaCM = (c) => {
    const oggi0 = new Date(); oggi0.setHours(0,0,0,0);
    const d = parseDataCM(c.aggiornato);
    if(!d) return 0;
    return Math.floor((oggi0 - d) / 86400000);
  };
  const isTablet = winW >= 768;
  const isDesktop = winW >= 1024;

  const goBack = () => {
    if (showRiepilogo) { setShowRiepilogo(false); return; }
    if (selectedVano) { setSelectedVano(null); setVanoStep(0); return; }
    if (showNuovoRilievo) { setShowNuovoRilievo(false); return; }
    if (selectedRilievo) { setSelectedRilievo(null); return; }
    if (selectedCM) { setSelectedCM(null); return; }
  };

  /* == Helpers == */
  // Ritorna i vani del rilievo attivo (o dell'ultimo se nessuno selezionato)
  const getVaniCM = (c) => {
    if (!c?.rilievi || c.rilievi.length === 0) return [];
    if (selectedRilievo && selectedCM?.id === c.id) return selectedRilievo.vani || [];
    return c.rilievi[c.rilievi.length - 1]?.vani || [];
  };
  const getVaniAttivi = (c) => {
    if (!c?.rilievi || c.rilievi.length === 0) return [];
    // Per stats generali: tutti i vani dell'ultimo rilievo
    return c.rilievi[c.rilievi.length - 1]?.vani || [];
  };
  const countVani = () => cantieri.reduce((s, c) => s + getVaniAttivi(c).length, 0);
  const urgentCount = () => cantieri.filter(c => c.alert).length;
  const readyCount = () => cantieri.filter(c => c.fase === "posa" || c.fase === "chiusura").length;
  const faseIndex = (fase) => PIPELINE.findIndex(p => p.id === fase);
  const priColor = (p) => p === "alta" ? T.red : p === "media" ? T.orange : T.sub2;

  const toggleTask = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = () => {
    if (!newTask.text.trim()) return;
    setTasks(ts => [...ts, { id: Date.now(), ...newTask, done: false, allegati: [...taskAllegati] }]);
    setTaskAllegati([]);
    setNewTask({ text: "", meta: "", time: "", priority: "media", cm: "", date: "", persona: "" });
    setShowModal(null);
  };

  const addCommessa = () => {
    if (!newCM.cliente.trim()) return;
    const code = "S-" + String(cantieri.length + 1).padStart(4, "0");
    const nc = { id: Date.now(), code, cliente: newCM.cliente, cognome: newCM.cognome||"", indirizzo: newCM.indirizzo, telefono: newCM.telefono, email: newCM.email||"", fase: "sopralluogo", rilievi: [], sistema: newCM.sistema, tipo: newCM.tipo, difficoltaSalita: newCM.difficoltaSalita, mezzoSalita: newCM.mezzoSalita, foroScale: newCM.foroScale, pianoEdificio: newCM.pianoEdificio, note: newCM.note, allegati: [], creato: new Date().toLocaleDateString("it-IT",{day:"numeric",month:"short"}), aggiornato: new Date().toLocaleDateString("it-IT",{day:"numeric",month:"short"}), log: [{ chi: "Fabio", cosa: "creato la commessa", quando: "Adesso", color: T.sub }] };
    setCantieri(cs => [nc, ...cs]);
    setNewCM({ cliente: "", cognome: "", indirizzo: "", telefono: "", email: "", sistema: "", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "", note: "" });
    setShowModal(null);
    setSelectedCM(nc);
    setTab("commesse");
  };

  const addVano = () => {
    if (!selectedCM || !selectedRilievo) return;
    const tipObj = TIPOLOGIE_RAPIDE.find(t => t.code === newVano.tipo);
    const nome = newVano.nome.trim() || `${tipObj?.label || newVano.tipo} ${(selectedRilievo.vani?.length || 0) + 1}`;
    const v = { id: Date.now(), nome, tipo: newVano.tipo, stanza: newVano.stanza, piano: newVano.piano, sistema: newVano.sistema, pezzi: newVano.pezzi||1, coloreInt: newVano.coloreInt, coloreEst: newVano.coloreEst, bicolore: newVano.bicolore, coloreAcc: newVano.coloreAcc, vetro: newVano.vetro, telaio: newVano.telaio, telaioAlaZ: newVano.telaioAlaZ, rifilato: newVano.rifilato, rifilSx: newVano.rifilSx, rifilDx: newVano.rifilDx, rifilSopra: newVano.rifilSopra, rifilSotto: newVano.rifilSotto, coprifilo: newVano.coprifilo, lamiera: newVano.lamiera, misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
    const updRilievo = { ...selectedRilievo, vani: [...(selectedRilievo.vani || []), v] };
    setCantieri(cs => cs.map(c => c.id === selectedCM.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRilievo : r), aggiornato: "Oggi" } : c));
    setSelectedRilievo(updRilievo);
    setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRilievo : r) }));
    setNewVano(prev => ({ nome: "", tipo: prev.tipo, stanza: "Soggiorno", piano: prev.piano, sistema: prev.sistema, coloreInt: prev.coloreInt, coloreEst: prev.coloreEst, bicolore: prev.bicolore, coloreAcc: prev.coloreAcc, vetro: prev.vetro, telaio: prev.telaio, telaioAlaZ: prev.telaioAlaZ, rifilato: prev.rifilato, rifilSx: prev.rifilSx, rifilDx: prev.rifilDx, rifilSopra: prev.rifilSopra, rifilSotto: prev.rifilSotto, coprifilo: prev.coprifilo, lamiera: prev.lamiera }));
    setShowModal(null);
    setSelectedVano(v);
    setVanoStep(0);
  };

  const updateMisura = (vanoId, key, value) => {
    const numVal = parseInt(value) || 0;
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, misure: { ...v.misure, [key]: numVal } } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, misure: { ...prev.misure, [key]: numVal } }));
  };

  const toggleAccessorio = (vanoId, acc) => {
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, accessori: { ...v.accessori, [acc]: { ...v.accessori[acc], attivo: !v.accessori[acc].attivo } } } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, accessori: { ...prev.accessori, [acc]: { ...prev.accessori[acc], attivo: !prev.accessori[acc].attivo } } }));
  };

  const updateAccessorio = (vanoId, acc, field, value) => {
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, accessori: { ...v.accessori, [acc]: { ...v.accessori[acc], [field]: value } } } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, accessori: { ...prev.accessori, [acc]: { ...prev.accessori[acc], [field]: value } } }));
  };

  // DELETE functions
  const deleteTask = (taskId) => { if ((()=>{try{return window.confirm("Eliminare questo task?");}catch(e){return false;}})()) setTasks(ts => ts.filter(t => t.id !== taskId)); };
  const deleteVano = (vanoId) => {
    if (!(()=>{try{return window.confirm("Eliminare questo vano e tutte le sue misure?");}catch(e){return false;}})()) return;
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.filter(v => v.id !== vanoId) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) { setSelectedVano(null); setVanoStep(0); }
  };
  const deleteCommessa = (cmId) => {
    if (!(()=>{try{return window.confirm("Eliminare questa commessa e tutti i suoi vani?");}catch(e){return false;}})()) return;
    setCantieri(cs => cs.filter(c => c.id !== cmId));
    if (selectedCM?.id === cmId) { setSelectedCM(null); setSelectedVano(null); }
  };
  const deleteEvent = (evId) => { if ((()=>{try{return window.confirm("Eliminare questo evento?");}catch(e){return false;}})()) setEvents(ev => ev.filter(e => e.id !== evId)); };
  const deleteMsg = (msgId) => { if ((()=>{try{return window.confirm("Eliminare questo messaggio?");}catch(e){return false;}})()) setMsgs(ms => ms.filter(m => m.id !== msgId)); };

  const addAllegato = (tipo, content) => {
    if (!selectedCM) return;
    const a = { id: Date.now(), tipo, nome: content || (tipo === "file" ? "Allegato" : tipo === "vocale" ? "Nota vocale" : tipo === "video" ? "Video" : "Nota"), data: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), durata: tipo === "vocale" ? "0:" + String(Math.floor(Math.random() * 30 + 5)).padStart(2, "0") : tipo === "video" ? "0:" + String(Math.floor(Math.random() * 45 + 10)).padStart(2, "0") : "" };
    setCantieri(cs => cs.map(x => x.id === selectedCM.id ? { ...x, allegati: [...(x.allegati || []), a] } : x));
    setSelectedCM(p => ({ ...p, allegati: [...(p.allegati || []), a] }));
  };

  const playAllegato = (id) => {
    if (playingId === id) { clearInterval(playInterval.current); setPlayingId(null); setPlayProgress(0); return; }
    clearInterval(playInterval.current);
    setPlayingId(id); setPlayProgress(0);
    let prog = 0;
    playInterval.current = setInterval(() => { prog += 2; setPlayProgress(prog); if (prog >= 100) { clearInterval(playInterval.current); setPlayingId(null); setPlayProgress(0); } }, 100);
  };

  // SETTINGS CRUD
  const addSettingsItem = () => {
    const f = settingsForm;
    if (settingsModal === "sistema" && f.marca && f.sistema) {
      setSistemiDB(s => [...s, { id: Date.now(), marca: f.marca, sistema: f.sistema, euroMq: parseInt(f.euroMq)||0, prezzoMq: parseFloat(f.prezzoMq||f.euroMq)||0, sovRAL: parseInt(f.sovRAL)||0, sovLegno: parseInt(f.sovLegno)||0, colori: [], sottosistemi: f.sottosistemi ? f.sottosistemi.split(",").map(s => s.trim()) : [] }]);
    } else if (settingsModal === "colore" && f.nome && f.code) {
      setColoriDB(c => [...c, { id: Date.now(), nome: f.nome, code: f.code, hex: f.hex || "#888888", tipo: f.tipo || "RAL" }]);
    } else if (settingsModal === "vetro" && f.nome && f.code) {
      setVetriDB(v => [...v, { id: Date.now(), nome: f.nome, code: f.code, ug: parseFloat(f.ug)||1.0, prezzoMq: parseFloat(f.prezzoMq)||0 }]);
    } else if (settingsModal === "coprifilo" && f.nome && f.cod) {
      setCoprifiliDB(c => [...c, { id: Date.now(), nome: f.nome, cod: f.cod, prezzoMl: parseFloat(f.prezzoMl)||0 }]);
    } else if (settingsModal === "lamiera" && f.nome && f.cod) {
      setLamiereDB(l => [...l, { id: Date.now(), nome: f.nome, cod: f.cod, prezzoMl: parseFloat(f.prezzoMl)||0 }]);
    } else if (settingsModal === "tipologia" && f.code && f.label) {
      TIPOLOGIE_RAPIDE.push({ code: f.code, label: f.label, icon: f.icon || "🪟" });
    } else if (settingsModal === "membro" && f.nome) {
      const colori = ["#007aff","#34c759","#af52de","#ff9500","#ff3b30","#5ac8fa"];
      setTeam(t => [...t, { id: Date.now(), nome: f.nome, ruolo: f.ruolo || "Posatore", compiti: f.compiti || "", colore: colori[t.length % colori.length] }]);
    } else return;
    setSettingsModal(null); setSettingsForm({});
  };
  const deleteSettingsItem = (type, id) => {
    if (!(()=>{try{return window.confirm("Eliminare?");}catch(e){return false;}})()) return;
    if (type === "sistema") setSistemiDB(s => s.filter(x => x.id !== id));
    if (type === "colore") setColoriDB(c => c.filter(x => x.id !== id));
    if (type === "vetro") setVetriDB(v => v.filter(x => x.id !== id));
    if (type === "coprifilo") setCoprifiliDB(c => c.filter(x => x.id !== id));
    if (type === "lamiera") setLamiereDB(l => l.filter(x => x.id !== id));
  };

  const advanceFase = (cmId) => {
    const FASE_TEAM = { preventivo: "Sara Greco", conferma: "Sara Greco", misure: "Marco Ferraro", ordini: "Sara Greco", produzione: "Marco Ferraro", posa: "Marco Ferraro", chiusura: "Fabio Cozza" };
    setCantieri(cs => cs.map(c => {
      if (c.id !== cmId) return c;
      const idx = faseIndex(c.fase);
      if (idx < PIPELINE.length - 1) {
        const next = PIPELINE[idx + 1];
        return { ...c, fase: next.id, log: [{ chi: "Fabio", cosa: `avanzato a ${next.nome}`, quando: "Adesso", color: next.color }, ...c.log] };
      }
      return c;
    }));
    if (selectedCM?.id === cmId) {
      const idx = faseIndex(selectedCM.fase);
      if (idx < PIPELINE.length - 1) {
        const next = PIPELINE[idx + 1];
        const addetto = FASE_TEAM[next.id] || "Fabio Cozza";
        setSelectedCM(prev => ({ ...prev, fase: next.id, log: [{ chi: "Fabio", cosa: `avanzato a ${next.nome}`, quando: "Adesso", color: next.color }, ...prev.log] }));
        setFaseNotif({ fase: next.nome, addetto, color: next.color });
        setTimeout(() => setFaseNotif(null), 4000);
      }
    }
  };

  const addEvent = () => {
    const _evTitle = newEvent.text.trim() || (newEvent.persona ? "Appuntamento " + newEvent.persona : "");
    if (!_evTitle) return;
    newEvent.text = _evTitle;
    // If tipo is "task", create a task instead of an event
    if (newEvent.tipo === "task") {
      const taskDate = newEvent.date || selDate.toISOString().split("T")[0];
      setTasks(ts => [...ts, { id: Date.now(), text: newEvent.text, meta: (newEvent as any)._taskMeta || "", time: newEvent.time, priority: (newEvent as any)._taskPriority || "media", cm: newEvent.cm, date: taskDate, persona: newEvent.persona, done: false, allegati: [] }]);
      setNewEvent({ text: "", time: "", tipo: "appuntamento", cm: "", persona: "", date: "", reminder: "", addr: "" });
      setShowNewEvent(false);
      return;
    }
    if ((newEvent as any)._newCliente && (newEvent as any)._nomeCliente) {
      const nc = { id: "CT-" + Date.now(), nome: (newEvent as any)._nomeCliente, cognome: (newEvent as any)._cognomeCliente || "", tipo: "cliente", telefono: (newEvent as any)._telCliente || "", indirizzo: (newEvent as any)._addrCliente || "" };
      setContatti(prev => [...prev, nc]);
      newEvent.persona = nc.nome + (nc.cognome ? " " + nc.cognome : "");
    }
    if (!newEvent.time) newEvent.time = "09:00";
    setEvents(ev => [...ev, { id: Date.now(), ...newEvent, date: newEvent.date || selDate.toISOString().split("T")[0], addr: newEvent.addr || "", color: newEvent.tipo === "appuntamento" ? "#007aff" : newEvent.tipo === "sopr_riparazione" ? "#FF6B00" : newEvent.tipo === "riparazione" ? "#FF3B30" : newEvent.tipo === "collaudo" ? "#5856D6" : newEvent.tipo === "garanzia" ? "#8E8E93" : "#ff9500" }]);
    setNewEvent({ text: "", time: "", tipo: "appuntamento", cm: "", persona: "", date: "", reminder: "", addr: "" });
    setShowNewEvent(false);
  };

  const sendCommessa = () => {
    setSendConfirm("sent");
    setTimeout(() => { setSendConfirm(null); setShowSendModal(false); }, 2500);
  };

  const handleAI = () => {
    if (!aiInput.trim()) return;
    const q = aiInput.toLowerCase();
    setAiMsgs(m => [...m, { role: "user", text: aiInput }]);
    setAiInput("");
    let resp = "Non ho capito, prova a riformulare la domanda.";
    if (q.includes("oggi") || q.includes("programma")) {
      const t = tasks.filter(x => !x.done);
      resp = `Oggi hai ${t.length} task aperti:\n${t.map((x, i) => `${i + 1}. ${x.text}${x.time ? ` (${x.time})` : ""}`).join("\n")}`;
    } else if (q.includes("commess") || q.includes("stato") || q.includes("pipeline")) {
      resp = `Hai ${cantieri.length} commesse:\n${cantieri.map(c => `• ${c.code} ${c.cliente} — ${PIPELINE.find(p => p.id === c.fase)?.nome}`).join("\n")}`;
    } else if (q.includes("vani") || q.includes("misur")) {
      resp = `Totale vani: ${countVani()}\nCommesse con vani da misurare:\n${cantieri.filter(c => getVaniAttivi(c).some(v => Object.keys(v.misure || {}).length < 6)).map(c => `• ${c.code}: ${getVaniAttivi(c).filter(v => Object.keys(v.misure || {}).length < 6).length} vani incompleti`).join("\n")}`;
    } else if (q.includes("urgent") || q.includes("priorit")) {
      const u = tasks.filter(x => x.priority === "alta" && !x.done);
      resp = u.length ? `Task urgenti:\n${u.map(x => `• ${x.text}`).join("\n")}` : "Nessun task urgente!";
    }
    setTimeout(() => setAiMsgs(m => [...m, { role: "ai", text: resp }]), 300);
  };

  const exportPDF = () => {
    if (!selectedCM) return;
    const cm = selectedCM;
    let html = `<html><head><title>MASTRO MISURE — ${cm.code}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#0066cc;border-bottom:3px solid #0066cc;padding-bottom:10px}h2{color:#333;margin-top:30px}.vano{border:1px solid #ddd;border-radius:8px;padding:15px;margin:10px 0;page-break-inside:avoid}.misure-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.m-item{background:#f5f5f7;padding:6px 10px;border-radius:4px;font-size:13px}.m-label{color:#666;font-size:11px}.m-val{font-weight:700;color:#1d1d1f}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.info{color:#666;font-size:13px}@media print{body{padding:0}}</style></head><body>`;
    html += `<div class="header"><div><h1>MASTRO MISURE</h1><p class="info">Report Misure — ${cm.code}</p></div><div style="text-align:right"><p><strong>${cm.cliente}</strong></p><p class="info">${cm.indirizzo}</p><p class="info">Sistema: ${cm.sistema || "N/D"} | Tipo: ${cm.tipo === "riparazione" ? "Riparazione" : "Nuova"}</p></div></div>`;
    cm.vani.forEach((v, i) => {
      const m = v.misure || {};
      html += `<div class="vano"><h3>${i + 1}. ${v.nome} — ${v.tipo} (${v.stanza}, ${v.piano})</h3><div class="misure-grid">`;
      [["L alto", m.lAlto], ["L centro", m.lCentro], ["L basso", m.lBasso], ["H sinistra", m.hSx], ["H centro", m.hCentro], ["H destra", m.hDx], ["Diag. 1", m.d1], ["Diag. 2", m.d2], ["Spall. SX", m.spSx], ["Spall. DX", m.spDx], ["Architrave", m.arch], ["Dav. int.", m.davInt], ["Dav. est.", m.davEst]].forEach(([l, val]) => {
        html += `<div class="m-item"><div class="m-label">${l}</div><div class="m-val">${val || "—"} mm</div></div>`;
      });
      html += `</div>`;
      if (v.cassonetto) html += `<p style="margin-top:8px;font-size:13px">Cassonetto: ${v.casH || "—"} × ${v.casP || "—"} mm</p>`;
      if (v.note) html += `<p style="margin-top:4px;font-size:12px;color:#666">Note: ${v.note}</p>`;
      html += `</div>`;
    });
    html += `<div style="margin-top:40px;border-top:1px solid #ddd;padding-top:20px;display:flex;justify-content:space-between"><div><p class="info">Firma tecnico</p><div style="border-bottom:1px solid #333;width:200px;height:40px"></div></div><div><p class="info">Firma cliente</p><div style="border-bottom:1px solid #333;width:200px;height:40px"></div></div></div>`;
    html += `<p style="text-align:center;margin-top:30px;color:#999;font-size:11px">Generato da MASTRO MISURE — ${new Date().toLocaleDateString("it-IT")}</p></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  /* ======= STYLES ======= */
  const fs = isDesktop ? 1.1 : isTablet ? 1.05 : 1;
  const S = {
    app: { fontFamily: FF, background: T.bg, color: T.text, width: "100%", minHeight: "100vh", position: "relative", WebkitFontSmoothing: "antialiased" },
    header: { padding: `${14*fs}px ${16*fs}px ${12*fs}px`, background: T.card, borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 10 },
    headerTitle: { fontSize: 19*fs, fontWeight: 700, letterSpacing: -0.3, color: T.text },
    headerSub: { fontSize: 12*fs, color: T.sub, marginTop: 1 },
    section: { margin: `0 ${16*fs}px`, padding: "10px 0 4px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 13*fs, fontWeight: 700, color: T.text },
    sectionBtn: { fontSize: 12*fs, color: T.acc, fontWeight: 600, background: "none", border: "none", cursor: "pointer" },
    card: { background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, overflow: "hidden", marginBottom: 8, cursor: "pointer", transition: "box-shadow 0.15s" },
    cardInner: { padding: `${12*fs}px ${14*fs}px` },
    chip: (active) => ({ padding: `${6*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${active ? T.acc : T.bdr}`, background: active ? T.acc : T.card, color: active ? "#fff" : T.text, fontSize: 12*fs, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }),
    stat: { flex: 1, textAlign: "center", padding: `${10*fs}px 4px`, background: T.card, cursor: "pointer" },
    statNum: { fontSize: 18*fs, fontWeight: 700 },
    statLabel: { fontSize: 9*fs, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginTop: 1 },
    badge: (bg, color) => ({ fontSize: 11*fs, fontWeight: 600, padding: `${3*fs}px ${8*fs}px`, borderRadius: 6, background: bg, color, display: "inline-block" }),
    input: { width: "100%", padding: `${10*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14*fs, color: T.text, outline: "none", fontFamily: FF, boxSizing: "border-box" },
    select: { width: "100%", padding: `${10*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14*fs, color: T.text, outline: "none", fontFamily: FF, boxSizing: "border-box" },
    btn: { width: "100%", padding: `${14*fs}px`, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 15*fs, fontWeight: 700, cursor: "pointer", fontFamily: FF },
    btnCancel: { width: "100%", padding: `${12*fs}px`, borderRadius: 10, border: "none", background: "none", color: T.sub, fontSize: 14*fs, fontWeight: 600, cursor: "pointer", fontFamily: FF },
    tabBar: { position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: T.card + "ee", backdropFilter: "blur(20px)", borderTop: `1px solid ${T.bdr}`, display: "flex", padding: `${6*fs}px 0 ${8*fs}px`, zIndex: 100 },
    tabItem: (active) => ({ flex: 1, textAlign: "center", padding: "4px 0", cursor: "pointer", opacity: active ? 1 : 0.5, transition: "opacity 0.15s" }),
    tabLabel: (active) => ({ fontSize: 10*fs, fontWeight: 600, color: active ? T.acc : T.sub, marginTop: 1 }),
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-end" },
    modalInner: { background: T.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: isDesktop ? 600 : 500, padding: `${20*fs}px ${16*fs}px ${30*fs}px`, maxHeight: "85vh", overflowY: "auto" },
    modalTitle: { fontSize: 17*fs, fontWeight: 700, marginBottom: 16, color: T.text },
    fieldLabel: { fontSize: 12*fs, fontWeight: 600, color: T.sub, marginBottom: 4, display: "block" },
    pipeStep: (done, current) => ({ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52, cursor: "pointer" }),
    pipeCircle: (done, current, color) => ({ width: current ? 32 : 26, height: current ? 32 : 26, borderRadius: "50%", background: done ? color : "transparent", border: done ? "none" : current ? `3px solid ${color}` : `2px dashed ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: current ? 14 : 12, boxShadow: current ? `0 0 12px ${color}40` : "none", transition: "all 0.2s" }),
    pipeLine: (done) => ({ flex: 1, height: 2, background: done ? T.grn : T.bdr, minWidth: 12, alignSelf: "center", marginTop: -14 }),
    pipeLabel: (current) => ({ fontSize: 9*fs, fontWeight: current ? 700 : 500, color: current ? T.text : T.sub, marginTop: 4, textAlign: "center", maxWidth: 52 }),
  };

  /* ======= CALENDAR STRIP ======= */
  const today = new Date();
  const calDays = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i - 2);
    return { day: d.getDate(), name: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getDay()], isToday: i === 2, hasDot: [0, 2, 4, 6].includes(i) };
  });

  /* ======= PIPELINE COMPONENT ======= */
  const PipelineBar = ({ fase }) => {
    const idx = faseIndex(fase);
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", padding: "8px 0", WebkitOverflowScrolling: "touch" }}>
        {PIPELINE.map((p, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "flex-start", flex: i < PIPELINE.length - 1 ? 1 : "none" }}>
              <div style={S.pipeStep(done, current)}>
                <div style={S.pipeCircle(done, current, p.color)}>
                  {done ? <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span> : <span>{p.ico}</span>}
                </div>
                <div style={S.pipeLabel(current)}>{p.nome}</div>
              </div>
              {i < PIPELINE.length - 1 && <div style={S.pipeLine(done)} />}
            </div>
          );
        })}
      </div>
    );
  };

  /* ======= VANO SVG SCHEMA ======= */
  const VanoSVG = ({ v, onTap }) => {
    const m = v.misure || {};
    return (
      <svg viewBox="0 0 200 260" style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }}>
        {/* Vano outline */}
        <rect x="30" y="15" width="140" height="220" fill={T.accLt} stroke={T.acc} strokeWidth={1.5} rx={2} />
        {/* Spallette */}
        <rect x="15" y="12" width="15" height="226" fill={T.blueLt} stroke={T.blue} strokeWidth={0.5} rx={1} strokeDasharray="3,2" />
        <rect x="170" y="12" width="15" height="226" fill={T.blueLt} stroke={T.blue} strokeWidth={0.5} rx={1} strokeDasharray="3,2" />
        {/* Cassonetto */}
        {v.cassonetto && <rect x="28" y="0" width="144" height="15" fill={T.orangeLt} stroke={T.orange} strokeWidth={0.5} rx={2} />}
        {v.cassonetto && <text x="100" y="11" textAnchor="middle" fontSize={7} fill={T.orange} fontFamily={FM}>CASSONETTO</text>}
        {/* Davanzale */}
        <line x1="25" y1="237" x2="175" y2="237" stroke={T.sub2} strokeWidth={1} strokeDasharray="4,3" />
        <text x="100" y="252" textAnchor="middle" fontSize={8} fill={T.sub2} fontFamily={FM}>Davanzale</text>
        {/* 3 Larghezze lines */}
        <line x1="35" y1="28" x2="165" y2="28" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="35" y1="125" x2="165" y2="125" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="35" y1="222" x2="165" y2="222" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* 3 Altezze lines */}
        <line x1="35" y1="20" x2="35" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="100" y1="20" x2="100" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="165" y1="20" x2="165" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* Diagonals */}
        <line x1="35" y1="20" x2="165" y2="232" stroke={T.purple + "30"} strokeWidth={0.5} strokeDasharray="4,3" />
        <line x1="165" y1="20" x2="35" y2="232" stroke={T.purple + "30"} strokeWidth={0.5} strokeDasharray="4,3" />
        {/* Tap points */}
        {PUNTI_MISURE.map(p => {
          const val = m[p.key];
          const col = T[p.color] || T.acc;
          return (
            <g key={p.key} onClick={() => onTap && onTap(p.key)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={val ? 14 : 12} fill={val ? col + "20" : T.bdr + "60"} stroke={val ? col : T.sub2} strokeWidth={val ? 1.5 : 1} />
              <text x={p.x} y={p.y + (val ? 1 : 4)} textAnchor="middle" fontSize={val ? 8 : 7} fill={val ? col : T.sub} fontWeight={val ? 700 : 500} fontFamily={FM} dominantBaseline="middle">
                {val || p.label}
              </text>
            </g>
          );
        })}
        {/* Spalletta labels */}
        <text x="22" y="130" textAnchor="middle" fontSize={7} fill={T.sub} fontFamily={FM} transform="rotate(-90,22,130)">
          Sp.SX {m.spSx || ""}
        </text>
        <text x="178" y="130" textAnchor="middle" fontSize={7} fill={T.sub} fontFamily={FM} transform="rotate(90,178,130)">
          Sp.DX {m.spDx || ""}
        </text>
      </svg>
    );
  };

  /* ======= FILTERED CANTIERI ======= */
  const filtered = cantieri.filter(c => {
    if (filterFase !== "tutte" && c.fase !== filterFase) return false;
    if (searchQ && !c.cliente.toLowerCase().includes(searchQ.toLowerCase()) && !c.code.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  /* ==================================== */
  /* ====       RENDER SECTIONS       == */
  /* ==================================== */

  /* == HOME TAB == */
  const renderHome = () => (
    <div style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
        {/* Logo row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Logo — quadrato nero con M bianca, uguale in tutte le app MASTRO */}
            <div style={{ width: 44, height: 44, borderRadius: 10, background: T.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: T.card, fontFamily: FF, letterSpacing: -1 }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: -0.3, lineHeight: 1.1 }}>MASTRO</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>misure</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 20 }}>{weather?.icon || "🌡"}</span>
                <span style={{ fontSize: 18, fontWeight: 600 }}>{weather?.temp != null ? `${weather.temp}°` : "—"}</span>
              </div>
              <div style={{ fontSize: 11, color: T.sub }}>{weather?.city || "—"}</div>
            </div>
            {/* #08 Riordina nascosto pre-lancio */}
          </div>
        </div>
        {/* Saluto */}
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>
          {(() => { const h = today.getHours(); return h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera"; })()}, Fabio
        </div>
        <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>
          {today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>



      {/* Global search */}
      <div style={{ padding: "0 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
          <Ico d={ICO.search} s={16} c={T.sub} />
          <input
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }}
            placeholder="Cerca commesse, clienti, vani..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
          />
          {globalSearch && <div onClick={() => setGlobalSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>}
        </div>
        {globalSearch.trim().length > 1 && (() => {
          const q = globalSearch.toLowerCase();
          const cmResults = cantieri.filter(c => c.cliente?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.indirizzo?.toLowerCase().includes(q));
          const vanoResults = cantieri.flatMap(c => getVaniAttivi(c).filter(v => v.nome?.toLowerCase().includes(q) || v.tipo?.toLowerCase().includes(q) || v.stanza?.toLowerCase().includes(q)).map(v => ({ ...v, cmCode: c.code, cmCliente: c.cliente, cmId: c.id, cm: c })));
          const taskResults = tasks.filter(t => t.text?.toLowerCase().includes(q) || t.meta?.toLowerCase().includes(q));
          const evResults = events.filter(e => e.text?.toLowerCase().includes(q) || e.persona?.toLowerCase().includes(q));
          const total = cmResults.length + vanoResults.length + taskResults.length + evResults.length;
          return total > 0 ? (
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginTop: 6, maxHeight: 280, overflowY: "auto" }}>
              {cmResults.map(c => (
                <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📁</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{c.cliente}</div><div style={{ fontSize: 10, color: T.sub }}>{c.code} · {c.indirizzo}</div></div>
                </div>
              ))}
              {vanoResults.map(v => (
                <div key={v.id} onClick={() => { setSelectedCM(v.cm); setSelectedVano(v); setTab("commesse"); setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🪟</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{v.nome}</div><div style={{ fontSize: 10, color: T.sub }}>{v.cmCode} · {v.stanza} · {v.tipo}</div></div>
                </div>
              ))}
              {taskResults.map(t => (
                <div key={t.id} onClick={() => { setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>☑️</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{t.text}</div><div style={{ fontSize: 10, color: T.sub }}>{t.cm || "Task"} · {t.meta}</div></div>
                </div>
              ))}
              {evResults.map(e => (
                <div key={e.id} onClick={() => { setTab("agenda"); setAgendaView("giorno"); setSelDate(new Date(e.date)); setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{e.text}</div><div style={{ fontSize: 10, color: T.sub }}>{e.date} {e.time} · {e.persona}</div></div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginTop: 6, fontSize: 12, color: T.sub, textAlign: "center" }}>Nessun risultato per "{globalSearch}"</div>
          );
        })()}
      </div>

      {/* == SEZIONI RIORDINABILI == */}
      {(() => {
        const sections = {
          banner: (() => {
            const todayISO = today.toISOString().split("T")[0];
            const todayEvents = events.filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
            const urgenti = cantieri.filter(c => c.alert);
            // Calcola giorni ferma
            const oggi2 = new Date(); oggi2.setHours(0,0,0,0);
            // parseDataCM defined at component level
            // giorniFermaCM defined at component level
            const SOGLIA_GIORNI = sogliaDays;
            const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= SOGLIA_GIORNI);
            const misureInAttesa = cantieri.filter(c => c.fase === "misure" && getVaniAttivi(c).some(v => Object.keys(v.misure || {}).length < 4));
            const preventiviDaFare = cantieri.filter(c => c.fase === "preventivo");
            const taskUrgenti = tasks.filter(t => !t.done && t.priority === "alta");
            const nextEvent = todayEvents[0];
            let banner = null;
            if (urgenti.length > 0) { const c=urgenti[0]; banner = { color:T.red, bg:"rgba(255,59,48,0.07)", border:"rgba(255,59,48,0.18)", tag:"⚠️ URGENTE", title:c.alert, sub:`${c.code} · ${c.cliente}`, act:()=>{setSelectedCM(c);setTab("commesse");} }; }
            else if (nextEvent) { banner = { color:nextEvent.color||T.acc, bg:`${nextEvent.color||T.acc}10`, border:`${nextEvent.color||T.acc}25`, tag:`📅 OGGI ${nextEvent.time?"ALLE "+nextEvent.time:""}`, title:nextEvent.text, sub:[nextEvent.persona,nextEvent.cm,nextEvent.addr].filter(Boolean).join(" · "), act:()=>{setTab("agenda");setAgendaView("giorno");setSelDate(new Date(nextEvent.date));} }; }
            else if (misureInAttesa.length > 0) { const c=misureInAttesa[0]; const mn=getVaniAttivi(c).filter(v=>Object.keys(v.misure||{}).length<4).length; banner = { color:T.orange, bg:"rgba(255,149,0,0.07)", border:"rgba(255,149,0,0.18)", tag:"📐 MISURE IN ATTESA", title:`${c.code} · ${c.cliente}`, sub:`${mn} ${mn===1?"vano":"vani"} da misurare`, act:()=>{setSelectedCM(c);setTab("commesse");} }; }
            else if (preventiviDaFare.length > 0) { banner = { color:"#7c3aed", bg:"rgba(124,58,237,0.07)", border:"rgba(124,58,237,0.18)", tag:"📋 PREVENTIVI", title:`${preventiviDaFare.length} ${preventiviDaFare.length===1?"preventivo da inviare":"preventivi da inviare"}`, sub:preventiviDaFare.map(c=>c.code).join(" · "), act:()=>setTab("commesse") }; }
            else if (taskUrgenti.length > 0) { const t=taskUrgenti[0]; banner = { color:T.red, bg:"rgba(255,59,48,0.07)", border:"rgba(255,59,48,0.18)", tag:"⚡ TASK URGENTE", title:t.text, sub:t.cm?`Commessa ${t.cm}`:(t.meta||""), act:()=>{ setSelectedTask(t); } }; }
            else if (ferme.length > 0) { const c=ferme[0]; const gg=giorniFermaCM(c); banner = { color:"#ff6b00", bg:"rgba(255,107,0,0.07)", border:"rgba(255,107,0,0.18)", tag:`🔔 FERMA DA ${gg} GIORNI`, title:`${c.code} · ${c.cliente}`, sub:`In fase "${PIPELINE.find(p=>p.id===c.fase)?.nome||c.fase}" dal ${c.aggiornato}${ferme.length>1?" · e altre "+(ferme.length-1):""}`, act:()=>{setSelectedCM(c);setTab("commesse");} }; }
            else { banner = { color:T.grn, bg:"rgba(52,199,89,0.07)", border:"rgba(52,199,89,0.18)", tag:"✅ TUTTO IN ORDINE", title:"Nessuna azione urgente", sub:`${cantieri.length} commesse attive`, act:null }; }
            return (
              <div onClick={banner.act} style={{ margin:"0 16px 12px", borderRadius:12, background:banner.bg, border:`1px solid ${banner.border}`, padding:"12px 14px", cursor:banner.act?"pointer":"default", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:banner.color, borderRadius:"12px 0 0 12px" }}/>
                <div style={{ paddingLeft:8 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:banner.color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4, fontFamily:FM }}>{banner.tag}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, lineHeight:1.3, marginBottom:2 }}>{banner.title}</div>
                  {banner.sub && <div style={{ fontSize:12, color:T.sub, lineHeight:1.4 }}>{banner.sub}</div>}
                  {banner.act && <div style={{ marginTop:6, fontSize:11, fontWeight:700, color:banner.color }}>Tocca per aprire →</div>}
                </div>
              </div>
            );
          })(),

          calendario: (() => {
            const dateStr2 = (d) => d.toISOString().split("T")[0];
            const todayISO = dateStr2(today);
            const dashY = selDate.getFullYear(), dashMo = selDate.getMonth();
            const handleCalSwipe = () => {
              const diff = calTouchStartRef.current - calTouchEndRef.current;
              if (Math.abs(diff) < 50) return;
              const d = new Date(selDate); const dir = diff > 0 ? 1 : -1;
              if (agendaView === "giorno") d.setDate(d.getDate() + dir);
              else if (agendaView === "settimana") d.setDate(d.getDate() + dir * 7);
              else d.setMonth(d.getMonth() + dir);
              setSelDate(d);
            };
            const navPrev = () => { const d = new Date(selDate); if (agendaView === "giorno") d.setDate(d.getDate()-1); else if (agendaView === "settimana") d.setDate(d.getDate()-7); else d.setMonth(d.getMonth()-1); setSelDate(d); };
            const navNext = () => { const d = new Date(selDate); if (agendaView === "giorno") d.setDate(d.getDate()+1); else if (agendaView === "settimana") d.setDate(d.getDate()+7); else d.setMonth(d.getMonth()+1); setSelDate(d); };
            const getWeekDays = () => { const d = new Date(selDate); const day = d.getDay(); const mo = day === 0 ? -6 : 1 - day; return Array.from({length:7}, (_,i) => { const wd = new Date(d); wd.setDate(d.getDate() + mo + i); return wd; }); };
            const weekDays = getWeekDays();
            const firstDay = new Date(dashY, dashMo, 1).getDay();
            const calOff = firstDay === 0 ? 6 : firstDay - 1;
            const dIM = new Date(dashY, dashMo+1, 0).getDate();
            const cells = Array.from({length: calOff + dIM}, (_,i) => i < calOff ? null : i - calOff + 1);
            const hdrL = agendaView === "giorno" ? selDate.toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }) : agendaView === "settimana" ? weekDays[0].getDate() + "–" +  weekDays[6].getDate() + " " + selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" }) : selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" });
            const hours = [7,8,9,10,11,12,13,14,15,16,17,18,19];
            const _homeTasks = tasks.filter(t => t.date).map(t => ({ ...t, _isTask: true, color: t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93" }));
            const _homeAll = [...events, ..._homeTasks];
            const dayEvs = _homeAll.filter(e => e.date === dateStr2(selDate)).sort((a,b) => (a.time||"99").localeCompare(b.time||"99"));
            return (<div style={{ marginBottom:12 }}>
                <div style={S.section}><div style={S.sectionTitle}>Calendario</div><div onClick={() => { setTab("agenda"); }} style={{ padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", color:T.acc }}> Apri  </div></div>
                <div style={{ padding:"0 16px" }}>
                  <div style={{ background:T.card, borderRadius:T.r, border:`1px solid ${T.bdr}`, overflow:"hidden" }}
                    onTouchStart={(e) => { calTouchStartRef.current = e.targetTouches[0].clientX; }}
                    onTouchMove={(e) => { calTouchEndRef.current = e.targetTouches[0].clientX; }}
                    onTouchEnd={handleCalSwipe}>
                    <div style={{ display:"flex", borderBottom:`1px solid ${T.bdr}`, background:T.bg }}>
                      {["giorno","settimana","mese"].map(v => (<div key={v} onClick={() => setAgendaView(v)} style={{ flex:1, padding:"8px 4px", textAlign:"center", fontSize:11, fontWeight:700, background: agendaView === v ? T.acc : "transparent", color: agendaView === v ? "#fff" : T.sub, cursor:"pointer", textTransform:"capitalize", transition:"all 0.2s" }}>{v}</div>))}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:`1px solid ${T.bdr}` }}>
                      <div onClick={navPrev} style={{ width:28, height:28, borderRadius:8, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color:T.sub }}>‹</div>
                      <div onClick={() => setSelDate(new Date())} style={{ fontSize:12, fontWeight:700, color:T.text, textTransform:"capitalize", cursor:"pointer" }}>{hdrL}</div><div onClick={() => setSelDate(new Date())} style={{ fontSize:10, fontWeight:700, color:"#fff", background:T.acc, cursor:"pointer", padding:"3px 10px", borderRadius:12, marginLeft:8 }}>Oggi</div>
                      <div onClick={navNext} style={{ width:28, height:28, borderRadius:8, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color:T.sub }}>›</div>
                    </div>
                    {agendaView === "giorno" && (<div style={{ maxHeight:360, overflowY:"auto" }}>
                        {dayEvs.length === 0 ? (<div style={{ padding:"24px 16px", textAlign:"center", color:T.sub, fontSize:13 }}>Nessun evento o task</div>) : (<div style={{ padding:"8px 0" }}>
                            {hours.map(h => { const hStr = String(h).padStart(2,"0"); const hEvs = dayEvs.filter(e => e.time && e.time.startsWith(hStr));
                              return (<div key={h} style={{ display:"flex", minHeight: hEvs.length > 0 ? 48 : 28, borderBottom:`1px solid ${T.bdr}20` }}>
                                  <div style={{ width:42, fontSize:10, fontWeight:600, color:T.sub, textAlign:"right", padding:"4px 8px 0 0" }}>{hStr}:00</div>
                                  <div style={{ flex:1, padding:"2px 8px 2px 0" }}>
                                    {hEvs.map(ev => ev._isTask ? (
                                      <div key={ev.id} onClick={() => setSelectedTask(tasks.find(t => t.id === ev.id) || ev)} style={{ padding:"6px 10px", borderRadius:8, marginBottom:2, background:(ev.color||T.acc)+"15", cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity: ev.done ? 0.55 : 1 }}>
                                        <div onClick={(e) => { e.stopPropagation(); toggleTask(ev.id); }} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${ev.done ? T.grn : T.bdr}`, background: ev.done ? T.grn : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ev.done && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}</div>
                                        <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:700, color:T.text, textDecoration: ev.done ? "line-through" : "none" }}>{ev.text}</div>
                                          <div style={{ fontSize:10, color:T.sub }}>{[ev.time, ev.persona, ev.cm].filter(Boolean).join(" · ")}</div></div>
                                        <div style={{ fontSize:14, color:T.sub }}>›</div>
                                      </div>
                                    ) : (
                                      <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ padding:"6px 10px", borderRadius:8, marginBottom:2, background:(ev.color||T.acc)+"15", borderLeft:`3px solid ${ev.color||T.acc}`, cursor:"pointer" }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ev.text}</div>
                                        <div style={{ fontSize:10, color:T.sub }}>{[ev.time, ev.persona, ev.cm, ev.addr].filter(Boolean).join("  ")}</div>
                                      </div>
                                    ))}
                                  </div></div>); })}
                            {dayEvs.filter(e => !e.time).length > 0 && (<div style={{ padding:"8px 12px", borderTop:`1px solid ${T.bdr}` }}>
                              <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:4 }}>Senza orario</div>
                              {dayEvs.filter(e => !e.time).map(ev => ev._isTask ? (
                                <div key={ev.id} onClick={() => setSelectedTask(tasks.find(t => t.id === ev.id) || ev)} style={{ padding:"8px 10px", borderRadius:8, marginBottom:4, background:(ev.color||T.acc)+"15", cursor:"pointer", display:"flex", alignItems:"center", gap:8, opacity: ev.done ? 0.55 : 1 }}>
                                  <div onClick={(e) => { e.stopPropagation(); toggleTask(ev.id); }} style={{ width:18, height:18, borderRadius:5, border:`2px solid ${ev.done ? T.grn : T.bdr}`, background: ev.done ? T.grn : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ev.done && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}</div>
                                  <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:700, color:T.text, textDecoration: ev.done ? "line-through" : "none" }}>{ev.text}</div>
                                    <div style={{ fontSize:10, color:T.sub }}>{[ev.persona, ev.cm].filter(Boolean).join(" · ")}</div></div>
                                  <div style={{ fontSize:14, color:T.sub }}>›</div>
                                </div>
                              ) : (
                                <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ padding:"6px 10px", borderRadius:8, marginBottom:2, background:(ev.color||T.acc)+"15", borderLeft:`3px solid ${ev.color||T.acc}`, cursor:"pointer" }}>
                                  <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ev.text}</div>
                                  {ev.persona && <div style={{ fontSize:10, color:T.sub }}>{ev.persona}</div>}
                                </div>
                              ))}
                            </div>)}
                          </div>)}
                      </div>)}
                    {agendaView === "settimana" && (<div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${T.bdr}` }}>
                          {weekDays.map((wd,i) => { const wdISO = dateStr2(wd); const isT = wdISO === todayISO; const wEvs = _homeAll.filter(e => e.date === wdISO);
                            return (<div key={i} onClick={() => { setSelDate(new Date(wd)); setAgendaView("giorno"); }}
                                style={{ textAlign:"center", padding:"6px 2px", cursor:"pointer", borderRight: i<6 ? `1px solid ${T.bdr}` : "none", background: isT ? T.accLt : "transparent" }}>
                                <div style={{ fontSize:9, fontWeight:600, color: i>=5 ? T.orange : T.sub, textTransform:"uppercase" }}>{wd.toLocaleDateString("it-IT",{weekday:"short"}).slice(0,3)}</div>
                                <div style={{ fontSize:14, fontWeight: isT ? 800 : 500, marginTop:2, width:24, height:24, borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", background: isT ? T.acc : "transparent", color: isT ? "#fff" : T.text }}>{wd.getDate()}</div>
                                {wEvs.length > 0 && <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:3 }}>{wEvs.slice(0,3).map((ev,j) => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:ev.color||T.acc }}/>)}</div>}
                              </div>); })}
                        </div>
                        <div style={{ maxHeight:200, overflowY:"auto", padding:"6px 0" }}>
                          {weekDays.map(wd => { const wdISO = dateStr2(wd); const wEvs = _homeAll.filter(e => e.date === wdISO).sort((a,b) => (a.time||"99").localeCompare(b.time||"99"));
                            if (wEvs.length === 0) return null;
                            return wEvs.map(ev => (<div key={ev.id} onClick={() => { setSelDate(new Date(wd)); setAgendaView("giorno"); }}
                                style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", cursor:"pointer", borderBottom:`1px solid ${T.bdr}20` }}>
                                <div style={{ width:4, height:24, borderRadius:2, background:ev.color||T.acc, flexShrink:0 }}/>
                                <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{ev.text}</div>
                                  <div style={{ fontSize:10, color:T.sub }}>{wd.toLocaleDateString("it-IT",{weekday:"short",day:"numeric"}).slice(0,6)} {ev.time ? " "+ev.time : ""}</div></div>
                              </div>)); })}
                        </div></div>)}
                    {agendaView === "mese" && (<div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${T.bdr}` }}>
                          {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d,i) => (<div key={i} style={{ textAlign:"center", fontSize:9, fontWeight:700, color: i>=5 ? T.orange : T.sub, padding:"5px 2px", borderRight: i<6 ? `1px solid ${T.bdr}` : "none" }}>{d}</div>))}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                          {cells.map((day,i) => {
                            if (!day) return <div key={i} style={{ borderRight:`1px solid ${T.bdr}`, borderBottom:`1px solid ${T.bdr}`, minHeight:44 }}/>;
                            const iso = dashY + "-" + String(dashMo+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
                            const isT = iso === todayISO; const evs = _homeAll.filter(e => e.date === iso); const col = i % 7; const isW = col >= 5;
                            return (<div key={i} onClick={() => { setSelDate(new Date(iso+"T12:00:00")); setAgendaView("giorno"); }}
                                style={{ minHeight:44, padding:"3px 2px", borderRight: col<6 ? `1px solid ${T.bdr}` : "none", borderBottom:`1px solid ${T.bdr}`, background: isW ? T.bg+"80" : T.card, cursor:"pointer" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div style={{ width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight: isT ? 800 : 400, background: isT ? T.acc : "transparent", color: isT ? "#fff" : isW ? T.orange : T.text }}>{day}</div>
                                  {evs.length > 0 && <div style={{ fontSize:8, fontWeight:700, color:"#fff", background:evs[0].color||T.acc, borderRadius:8, padding:"1px 4px" }}>{evs.length}</div>}
                                </div>
                                {evs.slice(0,1).map(ev => (<div key={ev.id} style={{ fontSize:8, fontWeight:600, padding:"1px 2px", borderRadius:2, marginTop:1, background:(ev.color||T.acc)+"20", borderLeft:`2px solid ${ev.color||T.acc}`, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", color:ev.color||T.acc }}>{ev.time?.slice(0,5)} {ev.text}</div>))}
                              </div>); })}
                        </div></div>)}
                  </div></div></div>);
          })(),

          email: (() => {
            const emailsOnly = msgs.filter(m => m.canale === "email");
            const unreadEmails = emailsOnly.filter(m => !m.read).length;
            return (
              <div style={{ marginBottom:12 }}>
                <div style={S.section}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={S.sectionTitle}>Email</div>
                    {unreadEmails>0 && <div style={{ ...S.badge(T.redLt, T.red), fontSize:10 }}>{unreadEmails}</div>}
                  </div>
                  <button style={S.sectionBtn} onClick={() => { setMsgFilter("email"); setTab("messaggi"); }}>Vedi tutte</button>
                </div>
                <div style={{ padding:"0 16px" }}>
                  <div style={{ background:T.card, borderRadius:T.r, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
                    {emailsOnly.length===0
                      ? <div style={{ padding:"16px", textAlign:"center", fontSize:12, color:T.sub }}>Nessuna email</div>
                      : emailsOnly.slice(0,3).map((m,i) => (
                        <div key={m.id} onClick={() => { setMsgs(ms => ms.map(x => x.id===m.id?{...x,read:true}:x)); setSelectedMsg(m); }}
                          style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"11px 14px", borderBottom:i<Math.min(emailsOnly.length,3)-1?`1px solid ${T.bg}`:"none", cursor:"pointer", background:m.read?"transparent":T.acc+"05" }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:m.read?"transparent":T.acc, flexShrink:0, marginTop:5 }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                              <div style={{ fontSize:13, fontWeight:m.read?500:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.from}</div>
                              <div style={{ fontSize:10, color:T.sub, flexShrink:0 }}>{m.time}</div>
                            </div>
                            <div style={{ fontSize:12, color:T.sub, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.preview}</div>
                            {m.cm && <span style={{ ...S.badge(T.accLt, T.acc), marginTop:3, display:"inline-block" }}>{m.cm}</span>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            );
          })(),

          commesse: (() => {
            const fasi = ["tutte", ...PIPELINE.filter(p=>p.attiva).map(p=>p.id)];
            const faseSel = fasi[cmFaseIdx];
            const cmFiltrate = faseSel === "tutte" ? cantieri : cantieri.filter(c => c.fase === faseSel);
            let swCmX = 0;
            const onSwCmStart = (e) => { swCmX = e.touches[0].clientX; };
            const onSwCmEnd = (e) => {
              const dx = e.changedTouches[0].clientX - swCmX;
              if (Math.abs(dx) > 40) setCmFaseIdx(i => Math.max(0, Math.min(fasi.length-1, i+(dx<0?1:-1))));
            };
            const oggi = new Date().toISOString().split("T")[0];
            return (
              <div>
                <div style={S.section}>
                  <div style={S.sectionTitle}>📁 Commesse <span style={{ fontSize:11, color:T.sub, fontWeight:500 }}>{cmFiltrate.length}</span></div>
                  <button style={S.sectionBtn} onClick={() => setTab("commesse")}>Vedi tutte</button>
                </div>
                {/* Filtro fasi swipeable */}
                <div style={{ display:"flex", gap:5, padding:"0 16px 10px", overflowX:"auto" }} onTouchStart={onSwCmStart} onTouchEnd={onSwCmEnd}>
                  {fasi.map((f,i) => {
                    const p = PIPELINE.find(x=>x.id===f);
                    const n = f==="tutte" ? cantieri.length : cantieri.filter(c=>c.fase===f).length;
                    return (
                      <div key={f} onClick={() => setCmFaseIdx(i)} style={{
                        padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                        cursor:"pointer", flexShrink:0, whiteSpace:"nowrap",
                        background: cmFaseIdx===i ? (p?.color||T.acc) : T.card,
                        color: cmFaseIdx===i ? "#fff" : T.sub,
                        border: `1px solid ${cmFaseIdx===i ? (p?.color||T.acc) : T.bdr}`,
                      }}>
                        {p?.ico||"📁"} {p?.nome||"Tutte"} {n>0&&<span style={{fontWeight:800}}>{n}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Lista commesse */}
                <div style={{ padding:"0 16px" }} onTouchStart={onSwCmStart} onTouchEnd={onSwCmEnd}>
                  {cmFiltrate.length === 0 ? (
                    <div style={{ textAlign:"center", padding:"20px", color:T.sub, fontSize:12 }}>Nessuna commessa in questa fase</div>
                  ) : cmFiltrate.map(c => {
                    const p = PIPELINE.find(x=>x.id===c.fase);
                    const vaniA = getVaniAttivi(c);
                    const vaniMis = vaniA.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
                    const prog = vaniA.length > 0 ? Math.round(vaniMis/vaniA.length*100) : 0;
                    const faseIdx = PIPELINE.findIndex(x=>x.id===c.fase);
                    const progFase = faseIdx >= 0 ? Math.round((faseIdx+1)/PIPELINE.length*100) : 0;
                    const gg = giorniFermaCM(c);
                    const isScaduta = c.scadenza && c.scadenza < oggi;
                    const isFerma = gg >= sogliaDays && c.fase !== "chiusura";
                    return (
                      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }} style={{
                        ...S.card, marginBottom:8, padding:"11px 13px", cursor:"pointer",
                        borderLeft: `3px solid ${isFerma ? T.red : isScaduta ? T.orange : p?.color||T.acc}`,
                      }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                              <span style={{ fontSize:11, color:T.sub, fontFamily:FM }}>{c.code}</span>
                              <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{c.cliente}</span>
                              {isFerma && <span style={{ fontSize:9, fontWeight:800, color:T.red, background:T.redLt, borderRadius:8, padding:"1px 6px" }}>FERMA {gg}gg</span>}
                              {isScaduta && !isFerma && <span style={{ fontSize:9, fontWeight:800, color:T.orange, background:T.orangeLt, borderRadius:8, padding:"1px 6px" }}>SCADUTA</span>}
                            </div>
                            <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{c.indirizzo||"—"}</div>
                            {/* Badge fase + scadenza */}
                            <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
                              <span style={{ ...S.badge(p?.color+"18"||T.accLt, p?.color||T.acc), fontSize:10 }}>{p?.ico} {p?.nome||c.fase}</span>
                              {c.scadenza && <span style={{ fontSize:10, color: isScaduta ? T.red : T.sub }}>📅 {c.scadenza}</span>}
                              {c.importo && <span style={{ fontSize:10, color:T.grn, fontWeight:700 }}>€{c.importo}</span>}
                            </div>
                          </div>
                          <span style={{ color:T.sub, fontSize:16, flexShrink:0 }}>›</span>
                        </div>
                        {/* Barra avanzamento fase */}
                        <div style={{ marginTop:8 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                            <span style={{ fontSize:10, color:T.sub }}>Avanzamento pipeline</span>
                            <span style={{ fontSize:10, fontWeight:700, color: isFerma ? T.red : p?.color||T.acc }}>{progFase}%</span>
                          </div>
                          <div style={{ height:4, borderRadius:2, background:T.bg, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${progFase}%`, background: isFerma ? T.red : p?.color||T.acc, borderRadius:2, transition:"width 0.3s" }}/>
                          </div>
                          {vaniA.length > 0 && (
                            <div style={{ fontSize:10, color:T.sub, marginTop:4 }}>
                              🪟 {vaniMis}/{vaniA.length} vani misurati
                              {prog === 100 && <span style={{ color:T.grn, fontWeight:700 }}> ✅ Completo</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })(),
        };

        const LABELS = { banner:"🔔 Avviso", urgenti:"⚠️ Urgenti", calendario:"📅 Calendario", email:"📧 Email", commesse:"📁 Commesse" };

        // Widget urgenti: centro allerta multi-categoria con swipe
        const urgentiCM = cantieri.filter(c => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura");
        const todayEventsUrgenti = events.filter(e => e.date === new Date().toISOString().split("T")[0]).sort((a,b) => (a.time||"99").localeCompare(b.time||"99"));
        const prevInAttesa = cantieri.filter(c => c.fase === "preventivo" && giorniFermaCM(c) > 5);
        const vaniBloccatiAll = cantieri.flatMap(c => {
          const r = c.rilievi?.[c.rilievi.length-1];
          return (r?.vani||[]).filter(v => v.note?.startsWith("🔴 BLOCCATO")).map(v => ({ ...v, cm: c }));
        });
        const vaniIncompleti = cantieri.flatMap(c => {
          const r = c.rilievi?.[c.rilievi.length-1];
          return (r?.vani||[]).filter(v => {
            const n = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
            return n > 0 && n < 6 && !v.note?.startsWith("🔴 BLOCCATO");
          }).map(v => ({ ...v, cm: c }));
        });

        const allertaCategorie = [
          { id: "ferme", ico: "⚠️", label: "Ferme", count: urgentiCM.length, color: T.red },
          { id: "oggi", ico: "📅", label: "Oggi", count: todayEventsUrgenti.length, color: T.blue },
          { id: "prev", ico: "💰", label: "Preventivi", count: prevInAttesa.length, color: T.orange },
          { id: "vani", ico: "🪟", label: "Vani", count: vaniBloccatiAll.length + vaniIncompleti.length, color: T.purple },
        ].filter(c => c.count > 0);

        const totalAllerte = allertaCategorie.reduce((s,c) => s+c.count, 0);

        sections["urgenti"] = totalAllerte > 0 ? (() => {
          const cat = allertaCategorie[Math.min(catIdx, allertaCategorie.length-1)];
          let swX = 0;
          const onSwipeStart = (e) => { swX = e.touches[0].clientX; };
          const onSwipeEnd = (e) => {
            const dx = e.changedTouches[0].clientX - swX;
            if (Math.abs(dx) > 40) setCatIdx(i => Math.max(0, Math.min(allertaCategorie.length-1, i + (dx<0?1:-1))));
          };
          return (
            <div style={{ padding: "0 16px" }}>
              {/* Header con tab categorie */}
              <div style={S.section}>
                <div style={S.sectionTitle}>⚡ Allerte <span style={{ fontSize:11, fontWeight:700, color:"#fff", background:T.red, borderRadius:10, padding:"1px 7px", marginLeft:4 }}>{totalAllerte}</span></div>
              </div>
              {/* Tab categorie */}
              <div style={{ display:"flex", gap:6, marginBottom:10, overflowX:"auto" }}>
                {allertaCategorie.map((c,i) => (
                  <div key={c.id} onClick={() => setCatIdx(i)} style={{
                    padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0,
                    background: catIdx===i ? c.color : T.card,
                    color: catIdx===i ? "#fff" : T.sub,
                    border: `1px solid ${catIdx===i ? c.color : T.bdr}`,
                  }}>
                    {c.ico} {c.label} <span style={{ fontWeight:800 }}>{c.count}</span>
                  </div>
                ))}
              </div>
              {/* Contenuto categoria con swipe */}
              <div onTouchStart={onSwipeStart} onTouchEnd={onSwipeEnd}>
                {cat?.id === "ferme" && urgentiCM.map(c => (
                  <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }} style={{
                    padding:"11px 13px", borderRadius:10, background:"rgba(255,59,48,0.07)",
                    border:"1px solid rgba(255,59,48,0.15)", borderLeft:`3px solid ${T.red}`,
                    cursor:"pointer", marginBottom:6, display:"flex", alignItems:"center", gap:10
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:T.red, letterSpacing:1 }}>⚠ FERMA DA {giorniFermaCM(c)} GIORNI</div>
                      <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{c.cliente}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{c.code} · {c.fase} · {c.indirizzo||"—"}</div>
                    </div>
                    <span style={{ color:T.sub, fontSize:16 }}>›</span>
                  </div>
                ))}
                {cat?.id === "oggi" && todayEventsUrgenti.map(ev => (
                  <div key={ev.id} onClick={() => { setTab("agenda"); setAgendaView("giorno"); setSelDate(new Date()); }} style={{
                    padding:"11px 13px", borderRadius:10, background:`${ev.color||T.blue}10`,
                    border:`1px solid ${ev.color||T.blue}25`, borderLeft:`3px solid ${ev.color||T.blue}`,
                    cursor:"pointer", marginBottom:6, display:"flex", alignItems:"center", gap:10
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:ev.color||T.blue, letterSpacing:1 }}>📅 OGGI {ev.time||""}</div>
                      <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{ev.text}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{[ev.persona, ev.addr, ev.cm].filter(Boolean).join(" · ")}</div>
                    </div>
                    {ev.addr && <div onClick={e=>{e.stopPropagation();window.open("https://maps.google.com/?q="+encodeURIComponent(ev.addr));}} style={{ padding:"5px 8px", borderRadius:7, background:T.blueLt, color:T.blue, fontSize:10, fontWeight:700, flexShrink:0 }}>🗝º</div>}
                  </div>
                ))}
                {cat?.id === "prev" && prevInAttesa.map(c => (
                  <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }} style={{
                    padding:"11px 13px", borderRadius:10, background:"rgba(255,149,0,0.07)",
                    border:"1px solid rgba(255,149,0,0.18)", borderLeft:`3px solid ${T.orange}`,
                    cursor:"pointer", marginBottom:6, display:"flex", alignItems:"center", gap:10
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:T.orange, letterSpacing:1 }}>💰 PREVENTIVO IN ATTESA {giorniFermaCM(c)}gg</div>
                      <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{c.cliente}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{c.code} · {c.sistema||"—"}</div>
                    </div>
                    <span style={{ color:T.sub, fontSize:16 }}>›</span>
                  </div>
                ))}
                {cat?.id === "vani" && [
                  ...vaniBloccatiAll.map(v => ({...v, tipo_alert:"bloccato"})),
                  ...vaniIncompleti.map(v => ({...v, tipo_alert:"incompleto"}))
                ].map((v,i) => (
                  <div key={i} onClick={() => { setSelectedCM(v.cm); setTab("commesse"); }} style={{
                    padding:"11px 13px", borderRadius:10,
                    background: v.tipo_alert==="bloccato" ? "rgba(255,59,48,0.07)" : "rgba(255,149,0,0.07)",
                    border: `1px solid ${v.tipo_alert==="bloccato" ? "rgba(255,59,48,0.18)" : "rgba(255,149,0,0.18)"}`,
                    borderLeft: `3px solid ${v.tipo_alert==="bloccato" ? T.red : T.orange}`,
                    cursor:"pointer", marginBottom:6, display:"flex", alignItems:"center", gap:10
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:9, fontWeight:800, color: v.tipo_alert==="bloccato"?T.red:T.orange, letterSpacing:1 }}>
                        {v.tipo_alert==="bloccato" ? "🔴 VANO BLOCCATO" : "⚠ MISURE INCOMPLETE"}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{v.nome} — {v.cm.cliente}</div>
                      <div style={{ fontSize:11, color:T.sub }}>{v.cm.code} · {v.tipo_alert==="bloccato" ? (v.note||"").replace("🔴 BLOCCATO: ","") : `${Object.values(v.misure||{}).filter(x=>(x as number)>0).length}/6 misure`}</div>
                    </div>
                    <span style={{ color:T.sub, fontSize:16 }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })() : null;

        return drag.order.map((id) => {
          if (!sections[id]) return null;
          const isDrag = drag.dragging === id;
          const isOver = drag.over === id;
          return (
            <div key={id}
              draggable={homeEditMode}
              onDragStart={() => { if(homeEditMode) drag.start(id); }}
              onDragOver={e => { e.preventDefault(); if(homeEditMode) drag.onOver(id); }}
              onDrop={e => { e.preventDefault(); if(homeEditMode) drag.drop(id); }}
              onDragEnd={() => { if(homeEditMode) drag.end(); }}
              style={{ opacity: isDrag ? 0.4 : 1, transition:"opacity 0.15s",
                outline: isOver ? `2px dashed ${T.acc}` : "none",
                borderRadius: 12, position:"relative" }}>
              {homeEditMode && (
                <div style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", zIndex:10, display:"flex", alignItems:"center", gap:6,
                  background:T.card, border:`1px solid ${T.bdr}`, borderRadius:8, padding:"4px 10px", boxShadow:"0 1px 6px rgba(0,0,0,0.08)", pointerEvents:"none" }}>
                  <span style={{ fontSize:14, color:T.sub }}>☰</span>
                  <span style={{ fontSize:11, fontWeight:700, color:T.sub }}>{LABELS[id]}</span>
                </div>
              )}
              <div style={{ filter: homeEditMode ? "brightness(0.97)" : "none", transition:"filter 0.15s" }}>
                {sections[id]}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
// =======================================================
// MASTRO ERP v2 — PARTE 2/5
// Righe 1281-2638: renderCMCard (con AFASE+euro+scadenza+borderLeft),
//                 renderCommesse, renderCMDetail (wizard 4-step + 3 tab
//                 sopralluoghi/misure/info + cronologia visite),
//                 renderRiepilogo, renderFasePanel
// =======================================================
  /* == COMMESSA CARD == */
  const renderCMCard = (c, inGrid) => {
    const fase = PIPELINE.find(p => p.id === c.fase);
    const progress = ((faseIndex(c.fase) + 1) / PIPELINE.length) * 100;
    const az = AFASE[c.fase] || AFASE["sopralluogo"];
    const TODAY_ISO = new Date().toISOString().split("T")[0];
    const isScad = c.scadenza && c.scadenza < TODAY_ISO;
    const isUrgente = (giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura") || isScad;
    // Conta vani misurati da visite
    const vaniMisurati = c.vaniList?.length > 0
      ? [...new Set((c.visite || []).flatMap(v => v.vaniMisurati))].length
      : null;
    return (
      <div key={c.id} style={{
        ...S.card,
        margin: inGrid ? "0" : "0 16px 8px",
        borderLeft: `3px solid ${isUrgente ? T.red : progress > 50 ? T.grn : T.blue}`
      }} onClick={() => { setSelectedCM(c); setTab("commesse"); }}>
        <div style={S.cardInner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, fontFamily: FM }}>{c.code}</span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{c.cliente}</span>
              </div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>
                {c.indirizzo}
                {vaniMisurati !== null
                  ? ` · ${vaniMisurati}/${c.vaniList.length} vani rilevati`
                  : ` · ${(c.rilievi||[]).length} rilievi`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {isUrgente && <span style={{ ...S.badge(T.redLt, T.red), fontSize: 9 }}>FERMA</span>}
              {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}>🔧</span>}
              <span style={S.badge(fase?.color + "18", fase?.color)}>{fase?.nome}</span>
            </div>
          </div>
          {c.alert && <div style={{ ...S.badge(c.alert.includes("Nessun") ? T.orangeLt : T.redLt, c.alert.includes("Nessun") ? T.orange : T.red), marginTop: 6 }}>{c.alert}</div>}
          <div style={{ height: 3, background: T.bdr, borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: "100%", borderRadius: 2, background: isUrgente ? T.red : fase?.color, width: `${progress}%`, transition: "width 0.3s" }} />
          </div>
          {/* Box azione suggerita per fase */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "7px 10px", borderRadius: 7, marginTop: 8,
            background: isUrgente ? T.redLt : az.c + "12",
            border: `1px solid ${isUrgente ? T.red + "30" : az.c + "30"}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{isUrgente ? "🔴" : az.i}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: isUrgente ? T.red : az.c }}>
                  {isUrgente ? "Commessa bloccata" : az.t}
                </div>
                <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>
                  {Math.round(progress)}%
                  {c.euro ? ` · €${c.euro.toLocaleString("it-IT")}` : ""}
                  {c.scadenza ? <span style={{ color: isScad ? T.red : T.sub }}>
                    {` · scad. ${new Date(c.scadenza + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}`}
                  </span> : null}
                </div>
              </div>
            </div>
            <div style={{ padding: "5px 10px", borderRadius: 6, background: isUrgente ? T.red : az.c, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              {isUrgente ? "Sblocca" : "→"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* == COMMESSE TAB == */
  // ============================================================
  // RENDER LISTA RILIEVI (livello intermedio: commessa → rilievi)
  // ============================================================
  const renderRilieviList = () => {
    const c = selectedCM;
    const rilievi = c.rilievi || [];

    const salvaRilievo = () => {
      const n = rilievi.length + 1;
      const nr = {
        id: Date.now(), n,
        data: nuovoRilData.data || new Date().toISOString().split("T")[0],
        ora: nuovoRilData.ora || "",
        rilevatore: nuovoRilData.rilevatore || "",
        tipo: nuovoRilTipo,
        motivoModifica: nuovoRilData.motivoModifica || "",
        note: nuovoRilData.note || "",
        stato: "nuovo",
        vani: [],
      };
      const updCM = { ...c, rilievi: [...rilievi, nr], aggiornato: "Oggi" };
      setCantieri(cs => cs.map(x => x.id === c.id ? updCM : x));
      setSelectedCM(updCM);
      setShowNuovoRilievo(false);
      setNuovoRilData({ data: "", ora: "", rilevatore: "", note: "", motivoModifica: "" });
      setNuovoRilTipo("rilievo");
      setSelectedRilievo(nr);
    };

    // == WIZARD NUOVO RILIEVO ==
    if (showNuovoRilievo) return (
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div onClick={() => setShowNuovoRilievo(false)} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Nuovo Rilievo</div>
            <div style={S.headerSub}>{c.code} · {c.cliente} {c.cognome}</div>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          {/* Tipo */}
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Tipo di visita</div>
          {[
            { k: "rilievo",    ico: "📐", l: "Rilievo misure",    d: "Misuri i vani del cantiere" },
            { k: "definitiva", ico: "✅", l: "Misure definitive", d: "Conferma finale — si va in produzione" },
            { k: "modifica",   ico: "🔧", l: "Modifica",          d: "Cliente cambia configurazione o aggiunge vani" },
          ].map(t => (
            <div key={t.k} onClick={() => setNuovoRilTipo(t.k)}
              style={{ ...S.card, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                border: `1.5px solid ${nuovoRilTipo === t.k ? T.acc : T.bdr}`,
                background: nuovoRilTipo === t.k ? T.accLt : T.card,
                display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22 }}>{t.ico}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: nuovoRilTipo === t.k ? T.acc : T.text }}>{t.l}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{t.d}</div>
              </div>
              {nuovoRilTipo === t.k && <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11 }}>✓</div>}
            </div>
          ))}
          {nuovoRilTipo === "modifica" && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>MOTIVO MODIFICA</div>
              <input style={S.input} placeholder="Es: cliente cambia 3 balconi in finestre..." value={nuovoRilData.motivoModifica} onChange={e => setNuovoRilData(d => ({...d, motivoModifica: e.target.value}))} />
            </div>
          )}
          {/* Dati */}
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>Data e rilevatore</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>DATA</div>
              <input style={S.input} type="date" value={nuovoRilData.data} onChange={e => setNuovoRilData(d => ({...d, data: e.target.value}))} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>ORA</div>
              <input style={S.input} type="time" value={nuovoRilData.ora} onChange={e => setNuovoRilData(d => ({...d, ora: e.target.value}))} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>RILEVATORE</div>
            <input style={S.input} placeholder="Chi esegue il rilievo..." value={nuovoRilData.rilevatore} onChange={e => setNuovoRilData(d => ({...d, rilevatore: e.target.value}))} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>NOTE</div>
            <textarea style={{ ...S.input, minHeight: 60, resize: "vertical" }} placeholder="Note preliminari..." value={nuovoRilData.note} onChange={e => setNuovoRilData(d => ({...d, note: e.target.value}))} />
          </div>
          <button onClick={salvaRilievo} style={{ ...S.btn, width: "100%", marginTop: 20, background: T.grn }}>✓ Crea Rilievo</button>
        </div>
      </div>
    );

    // == REPORT DIFFERENZE ==
    const renderReportDiff = () => {
      if (rilievi.length < 2) return (
        <div style={{ padding: 20, textAlign: "center", color: T.sub, fontSize: 12 }}>
          Servono almeno 2 rilievi per generare il report differenze.
        </div>
      );
      return (
        <div style={{ padding: "0 16px 80px" }}>
          {rilievi.slice(1).map((r, idx) => {
            const prev = rilievi[idx];
            const prevVani = prev?.vani || [];
            const currVani = r.vani || [];
            const aggiunti = currVani.filter(v => !prevVani.some(p => p.nome.replace(" ❌","") === v.nome.replace(" ❌","")));
            const rimossi  = prevVani.filter(p => !currVani.some(v => v.nome.replace(" ❌","") === p.nome.replace(" ❌","")));
            const modificati = currVani.filter(v => {
              const match = prevVani.find(p => p.nome.replace(" ❌","") === v.nome.replace(" ❌",""));
              if (!match) return false;
              return JSON.stringify(v.misure) !== JSON.stringify(match.misure) ||
                     v.sistema !== match.sistema || v.tipo !== match.tipo;
            });
            return (
              <div key={r.id} style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ padding: "11px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 20 }}>🔀</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>R{prev.n} → R{r.n}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>
                      {new Date(prev.data + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short" })} → {new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short" })}
                    </div>
                  </div>
                  {aggiunti.length + rimossi.length + modificati.length === 0
                    ? <span style={S.badge(T.grnLt, T.grn)}>Nessuna differenza</span>
                    : <span style={S.badge(T.orangeLt, T.orange)}>{aggiunti.length + rimossi.length + modificati.length} diff</span>}
                </div>
                <div style={{ padding: "10px 14px" }}>
                  {aggiunti.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.grn, marginBottom: 4 }}>+ AGGIUNTI</div>
                      {aggiunti.map(v => <span key={v.id} style={{ ...S.badge(T.grnLt, T.grn), marginRight: 4, marginBottom: 4, display: "inline-block" }}>+ {v.nome.replace(" ❌","")}</span>)}
                    </div>
                  )}
                  {rimossi.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.red, marginBottom: 4 }}>- RIMOSSI</div>
                      {rimossi.map(v => <span key={v.id} style={{ ...S.badge(T.redLt, T.red), marginRight: 4, marginBottom: 4, display: "inline-block" }}>- {v.nome.replace(" ❌","")}</span>)}
                    </div>
                  )}
                  {modificati.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.orange, marginBottom: 6 }}>~ MODIFICATI</div>
                      {modificati.map(v => {
                        const match = prevVani.find(p => p.nome.replace(" ❌","") === v.nome.replace(" ❌",""));
                        const diffMisure = Object.entries(v.misure || {}).filter(([k, val]) => match?.misure?.[k] !== val);
                        return (
                          <div key={v.id} style={{ marginBottom: 8, padding: "8px 10px", background: T.orangeLt, borderRadius: 8, border: `1px solid ${T.orange}30` }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.orange, marginBottom: 4 }}>~ {v.nome.replace(" ❌","")}</div>
                            {v.sistema !== match?.sistema && <div style={{ fontSize: 11, color: T.text, marginBottom: 2 }}>Sistema: <strong>{match?.sistema || "—"}</strong> → <strong>{v.sistema}</strong></div>}
                            {v.tipo !== match?.tipo && <div style={{ fontSize: 11, color: T.text, marginBottom: 2 }}>Tipo: <strong>{match?.tipo || "—"}</strong> → <strong>{v.tipo}</strong></div>}
                            {diffMisure.slice(0, 5).map(([k, val]) => (
                              <div key={k} style={{ fontSize: 11, color: T.sub }}>
                                {k}: <span style={{ color: T.red }}>{match?.misure?.[k] || 0}</span> → <span style={{ color: T.grn }}>{val as any}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {aggiunti.length + rimossi.length + modificati.length === 0 && (
                    <div style={{ fontSize: 12, color: T.sub }}>Nessuna variazione tra i due rilievi.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    };

    // == LISTA RILIEVI ==
    const tipoColor = { rilievo: T.blue, definitiva: T.grn, modifica: T.orange };
    const tipoIco   = { rilievo: "📐", definitiva: "✅", modifica: "🔧" };
    const [rilTab, setRilTab] = (window as any).__rilTab__ || [null, null];
    // Use local state via component trick: riutilizza cmSubTab per il tab rilievi/report
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header */}
        <div style={S.header}>
          <div onClick={() => { setSelectedCM(null); setSelectedRilievo(null); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>{c.code} · {c.cliente} {c.cognome || ""}</div>
            <div style={S.headerSub}>{c.indirizzo}</div>
          </div>
          <div onClick={() => setShowNuovoRilievo(true)}
            style={{ padding: "7px 14px", borderRadius: 9, background: T.acc, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            + Rilievo
          </div>
        </div>

        {/* Info badges */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          <PipelineBar fase={c.fase} />
        </div>
        <div style={{ padding: "0 16px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.tipo === "nuova" && <span style={S.badge(T.grnLt, T.grn)}>🆕 Nuova</span>}
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}>🔧 Riparazione</span>}
          {c.telefono && <span onClick={() => window.open(`tel:${c.telefono}`)} style={{ ...S.badge(T.grnLt, T.grn), cursor: "pointer" }}>📞 {c.telefono}</span>}
          {c.euro > 0 && <span style={S.badge(T.accLt, T.acc)}>€{c.euro.toLocaleString("it-IT")}</span>}
        </div>

        {/* Tab: Rilievi | Report */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 4px 0" }}>
          {["rilievi", "report"].map(t => (
            <div key={t} onClick={() => setCmSubTab(t)}
              style={{ flex: 1, padding: "9px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderBottom: `2px solid ${cmSubTab === t ? T.acc : "transparent"}`,
                color: cmSubTab === t ? T.acc : T.sub, textTransform: "capitalize" }}>
              {t === "rilievi" ? `📁 Rilievi (${rilievi.length})` : "📊 Report Differenze"}
            </div>
          ))}
        </div>

        {/* TAB REPORT */}
        {cmSubTab === "report" && renderReportDiff()}

        {/* TAB RILIEVI */}
        {cmSubTab !== "report" && (
          <div style={{ padding: "8px 16px" }}>
            {rilievi.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>Nessun rilievo ancora</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 20 }}>Crea il primo rilievo per iniziare a misurare i vani</div>
                <button onClick={() => setShowNuovoRilievo(true)} style={{ ...S.btn, margin: "0 auto" }}>+ Crea primo rilievo</button>
              </div>
            )}
            {[...rilievi].reverse().map((r, idx) => {
              const vaniCount = (r.vani || []).length;
              const vaniMisurati = (r.vani || []).filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6).length;
              const colore = tipoColor[r.tipo] || T.blue;
              const ico = tipoIco[r.tipo] || "📐";
              const isUltimo = idx === 0;
              return (
                <div key={r.id} onClick={() => { setSelectedRilievo(r); setCmSubTab("sopralluoghi"); }}
                  style={{ ...S.card, marginBottom: 10, cursor: "pointer", overflow: "hidden",
                    border: `1.5px solid ${isUltimo ? colore + "50" : T.bdr}`,
                    background: isUltimo ? colore + "06" : T.card }}>
                  {/* Header rilievo */}
                  <div style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: colore + "15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${colore}30` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: colore, fontFamily: FM }}>R{r.n}</div>
                      <div style={{ fontSize: 14 }}>{ico}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        {isUltimo && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: colore, color: "#fff" }}>ULTIMO</span>}
                      </div>
                      <div style={{ fontSize: 11, color: T.sub }}>
                        {r.ora && `🕐 ${r.ora} · `}👤 {r.rilevatore || "—"}
                      </div>
                      {r.motivoModifica && <div style={{ fontSize: 11, color: T.orange, marginTop: 2 }}>🔧 {r.motivoModifica}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colore }}>{vaniCount}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>vani</div>
                    </div>
                    <span style={{ transform: "rotate(180deg)", display:"inline-flex", marginLeft: 4 }}><Ico d={ICO.back} s={14} c={T.sub} /></span>
                  </div>
                  {/* Barra progresso vani */}
                  {vaniCount > 0 && (
                    <div style={{ padding: "0 14px 12px" }}>
                      <div style={{ height: 4, background: T.bdr, borderRadius: 2, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ height: "100%", width: `${Math.round(vaniMisurati / vaniCount * 100)}%`, background: vaniMisurati === vaniCount ? T.grn : colore, borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.sub }}>{vaniMisurati}/{vaniCount} vani con misure</div>
                    </div>
                  )}
                  {/* Note */}
                  {r.note && <div style={{ padding: "0 14px 10px", fontSize: 11, color: T.sub, fontStyle: "italic" }}>"{r.note}"</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Card compatta per vista lista
  const renderCMCardCompact = (c) => {
    const fase = PIPELINE.find(p => p.id === c.fase);
    const TODAY_ISO = new Date().toISOString().split("T")[0];
    const isScad = c.scadenza && c.scadenza < TODAY_ISO;
    const isFerma = giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
    const vaniA = getVaniAttivi(c);
    const vaniMis = vaniA.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
    const vaniInc = vaniA.filter(v => { const n=Object.values(v.misure||{}).filter(x=>(x as number)>0).length; return n>0&&n<6; }).length;
    const vaniBloc = vaniA.filter(v => v.note?.startsWith("🔴 BLOCCATO")).length;
    const az = AFASE[c.fase] || AFASE["sopralluogo"];
    const faseIdx = PIPELINE.findIndex(x => x.id === c.fase);
    const progFase = faseIdx >= 0 ? Math.round((faseIdx+1)/PIPELINE.length*100) : 0;
    return (
      <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:`1px solid ${T.bdr}`,
          borderLeft:`3px solid ${isFerma?T.red:isScad?T.orange:fase?.color||T.acc}`,
          background: isFerma ? "rgba(255,59,48,0.03)" : T.card, cursor:"pointer" }}>
        {/* Colonna sinistra: codice + cliente */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, color:T.sub, fontFamily:FM }}>{c.code}</span>
            <span style={{ fontSize:14, fontWeight:700 }}>{c.cliente}</span>
            {isFerma && <span style={{ fontSize:9, fontWeight:800, color:T.red, background:T.redLt, borderRadius:6, padding:"1px 5px" }}>FERMA {giorniFermaCM(c)}gg</span>}
            {isScad && !isFerma && <span style={{ fontSize:9, fontWeight:800, color:T.orange, background:T.orangeLt, borderRadius:6, padding:"1px 5px" }}>SCAD</span>}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:3, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ ...S.badge(fase?.color+"18"||T.accLt, fase?.color||T.acc), fontSize:10 }}>{fase?.ico} {fase?.nome}</span>
            {c.euro && <span style={{ fontSize:11, color:T.grn, fontWeight:700 }}>€{c.euro.toLocaleString("it-IT")}</span>}
            {c.scadenza && <span style={{ fontSize:10, color: isScad ? T.red : T.sub }}>📅 {c.scadenza}</span>}
          </div>
        </div>
        {/* Colonna destra: info mancanti */}
        <div style={{ textAlign:"right", flexShrink:0, minWidth:80 }}>
          {vaniA.length > 0 ? (
            <div style={{ fontSize:11, fontWeight:600 }}>
              {vaniBloc > 0 && <div style={{ color:T.red }}>🔴 {vaniBloc} bloccati</div>}
              {vaniInc > 0 && <div style={{ color:T.orange }}>⚠ {vaniInc} incompleti</div>}
              {vaniBloc===0 && vaniInc===0 && <div style={{ color:T.grn }}>✅ {vaniMis}/{vaniA.length}</div>}
            </div>
          ) : (
            <div style={{ fontSize:10, color:T.sub }}>Nessun vano</div>
          )}
          <div style={{ marginTop:4, fontSize:10, color: isFerma?T.red:fase?.color||T.acc, fontWeight:700 }}>{progFase}%</div>
          <div style={{ marginTop:3, height:3, width:60, background:T.bdr, borderRadius:2, marginLeft:"auto" }}>
            <div style={{ height:"100%", width:`${progFase}%`, background:isFerma?T.red:fase?.color||T.acc, borderRadius:2 }}/>
          </div>
        </div>
        <span style={{ color:T.sub, fontSize:16 }}>›</span>
      </div>
    );
  };

  
  const renderCommesse = () => {
    if (showRiepilogo && selectedCM) return renderRiepilogo();
    if (selectedVano) return renderVanoDetail();

      if (selectedRilievo) return renderCMDetail();
    if (selectedCM) return renderRilieviList();
    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Commesse</div>
            <div style={S.headerSub}>{cantieri.length} totali · {filtered.length} visibili</div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {/* Toggle vista */}
            <div style={{ display:"flex", background:T.bg, borderRadius:8, padding:2, gap:1 }}>
              <div onClick={() => setCmView("list")} style={{ padding:"4px 8px", borderRadius:6, background:cmView==="list"?T.card:"transparent", cursor:"pointer", fontSize:14 }} title="Lista compatta">☰</div>
              <div onClick={() => setCmView("card")} style={{ padding:"4px 8px", borderRadius:6, background:cmView==="card"?T.card:"transparent", cursor:"pointer", fontSize:14 }} title="Card grandi">▦</div>
            </div>
            <div onClick={() => setShowModal("commessa")} style={{ width:36, height:36, borderRadius:10, background:T.acc, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:20, fontWeight:300 }}>+</div>
          </div>
        </div>

        {/* Filtri fase */}
        <div style={{ display:"flex", gap:6, padding:"4px 16px 10px", overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
          <div style={S.chip(filterFase === "tutte")} onClick={() => setFilterFase("tutte")}>Tutte ({cantieri.length})</div>
          {PIPELINE.map(p => {
            const n = cantieri.filter(c => c.fase === p.id).length;
            return n > 0 ? <div key={p.id} style={S.chip(filterFase === p.id)} onClick={() => setFilterFase(p.id)}>{p.ico} {p.nome} ({n})</div> : null;
          })}
        </div>

        {/* Search */}
        <div style={{ padding:"0 16px", marginBottom:10 }}>
          <input style={{ ...S.input, width:"100%", boxSizing:"border-box" }} placeholder="Cerca per cliente, codice, indirizzo..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>

        {/* Lista o Card */}
        {cmView === "list" ? (
          <div style={{ background:T.card, margin:"0 16px", borderRadius:T.r, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
            {filtered.length === 0
              ? <div style={{ padding:"24px", textAlign:"center", color:T.sub }}>Nessuna commessa trovata</div>
              : filtered.map(c => renderCMCardCompact(c))
            }
          </div>
        ) : (
          <div style={isDesktop ? { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"0 16px" } : isTablet ? { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"0 16px" } : {}}>
            {filtered.map(c => renderCMCard(c, isTablet || isDesktop))}
          </div>
        )}
      </div>
    );
  };

  /* == COMMESSA DETAIL == */
  const renderCMDetail = () => {
    const c = selectedCM;
    const r = selectedRilievo; // rilievo corrente
    const fase = PIPELINE.find(p => p.id === c.fase);

    // Vani del rilievo corrente
    const vaniList = r?.vani || [];
    // Compatibilità wizard vecchio
    const viste = []; // non più usato con nuova arch
    const vaniM: number[] = [];
    const vaniA = vaniList;
    const tipoRil = r?.tipo || "rilievo";
    const tipoColRil = tipoRil === "definitiva" ? T.grn : tipoRil === "modifica" ? T.orange : T.blue;
    const tipoIcoRil = tipoRil === "definitiva" ? "✅" : tipoRil === "modifica" ? "🔧" : "📐";
    const tipoLblRil = tipoRil === "definitiva" ? "Misure Definitive" : tipoRil === "modifica" ? "Modifica" : "Rilievo Misure";

    // Calcolo avanzamento misure
    const vaniMisurati = vaniList.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6);
    const vaniBloccati = vaniList.filter(v => v.note?.startsWith("🔴 BLOCCATO"));
    const vaniDaFare   = vaniList.filter(v => vaniMisurati.every(m => m.id !== v.id));
    const progVani = vaniList.length > 0 ? Math.round(vaniMisurati.length / vaniList.length * 100) : 0;
    const tutteMis = vaniMisurati.length === vaniList.length && vaniList.length > 0;

    // == Wizard helpers (legacy) ==
    function togV(id) { setNvVani(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
    function togB(id) {
      setNvBlocchi(b => b[id]
        ? (()=>{ const n = {...b}; delete n[id]; return n; })()
        : { ...b, [id]: { motivo: "", note: "" } }
      );
    }
    function sbF(id, f, v) { setNvBlocchi(b => ({ ...b, [id]: { ...b[id], [f]: v } })); }
    function salvaVisita() {
      const vaniBloccati = Object.entries(nvBlocchi).map(([id, b]) => ({
        vanoId: parseInt(id), motivo: b.motivo || "Altro", note: b.note || ""
      }));
      const stato = nvTipo === "modifica" ? "modifica" :
        nvVani.length === vaniA.length && vaniBloccati.length === 0 ? "completo" : "parziale";
      const nuova = {
        id: Date.now(), n: viste.length + 1,
        data: nvData.data || new Date().toISOString().split("T")[0],
        ora: nvData.ora || "", rilevatore: nvData.rilevatore || "",
        tipo: nvTipo, motivoModifica: nvMotivoModifica,
        stato, vaniMisurati: nvVani.map(Number), vaniBloccati, note: nvNote
      };
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, visite: [...(x.visite||[]), nuova] } : x));
      setSelectedCM(prev => ({ ...prev, visite: [...(prev.visite||[]), nuova] }));
      setNvView(false); setNvStep(1);
      setNvData({ data: "", ora: "", rilevatore: "" });
      setNvTipo("rilievo"); setNvMotivoModifica("");
      setNvVani([]); setNvBlocchi({}); setNvNote("");
    }

    // == VISTA WIZARD ==
    if (nvView) return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header wizard */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setNvView(false); setNvStep(1); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Nuova visita</div>
            <div style={S.headerSub}>{c.code} · {c.cliente}</div>
          </div>
          <div style={{ fontSize: 11, color: T.sub }}>Step {nvStep}/5</div>
        </div>
        {/* Tab step */}
        <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          {["Tipo", "Dati", "Vani", "Blocchi", "Salva"].map((l, i) => (
            <div key={i} onClick={() => i < nvStep && setNvStep(i+1)}
              style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 600,
                borderBottom: `2px solid ${nvStep===i+1 ? T.acc : "transparent"}`,
                color: nvStep===i+1 ? T.acc : T.sub, cursor: i < nvStep ? "pointer" : "default" }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          {/* STEP 1 — Tipo visita */}
          {nvStep === 1 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🏷 Tipo di visita</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Seleziona il tipo di sopralluogo</div>
            {[
              { k: "rilievo",    ico: "📐", label: "Rilievo misure",     desc: "Prima visita o misure di vani mancanti" },
              { k: "definitiva", ico: "✅", label: "Misure definitive",  desc: "Conferma finale di tutte le misure" },
              { k: "modifica",   ico: "🔧", label: "Modifica cantiere",  desc: "Variazione, problema o sopralluogo post-vendita" },
            ].map(t => (
              <div key={t.k} onClick={() => setNvTipo(t.k)}
                style={{ ...S.card, padding: "13px 14px", marginBottom: 10, cursor: "pointer",
                  border: `1.5px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.accLt : T.card,
                  display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>{t.ico}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: nvTipo === t.k ? T.acc : T.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.acc : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12 }}>{nvTipo === t.k ? "✓" : ""}</div>
              </div>
            ))}
            {nvTipo === "modifica" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>MOTIVO MODIFICA</div>
                <input style={S.input} placeholder="Es: cliente ha cambiato idea su un vano, problema rilevato..." value={nvMotivoModifica} onChange={e => setNvMotivoModifica(e.target.value)} />
              </div>
            )}
            <button onClick={() => setNvStep(2)} style={{ ...S.btn, marginTop: 12, width: "100%" }}>Avanti →</button>
          </>}
          {/* STEP 2 — Dati */}
          {nvStep === 2 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📋 Dati della visita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>DATA</div>
                <input style={S.input} type="date" value={nvData.data} onChange={e => setNvData(d => ({...d, data: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>ORA</div>
                <input style={S.input} type="time" value={nvData.ora} onChange={e => setNvData(d => ({...d, ora: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>RILEVATORE</div>
                <input style={S.input} placeholder="Chi ha eseguito il rilievo..." value={nvData.rilevatore} onChange={e => setNvData(d => ({...d, rilevatore: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => setNvStep(1)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(3)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 2 — Vani misurati */}
          {nvStep === 3 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>✅ Vani misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Seleziona i vani che hai misurato</div>
            {vaniA.length === 0
              ? <div style={{ textAlign: "center", padding: "20px", color: T.sub }}>Tutti già misurati!</div>
              : vaniA.map(v => (
                <div key={v.id} onClick={() => togV(v.id)} style={{
                  ...S.card, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                  background: nvVani.includes(v.id) ? T.grnLt : T.card,
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>~{v.mq}m²</div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                    background: nvVani.includes(v.id) ? T.grn : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14 }}>
                    {nvVani.includes(v.id) ? "✓" : ""}
                  </div>
                </div>
              ))
            }
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setNvStep(2)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(4)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 4 — Vani bloccati */}
          {nvStep === 4 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔴 Vani non misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Indica il motivo per ogni vano saltato</div>
            {vaniA.filter(v => !nvVani.includes(v.id)).map(v => {
              const hB = !!nvBlocchi[v.id];
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 10, overflow: "hidden", border: `1.5px solid ${hB ? T.red : T.bdr}` }}>
                  <div onClick={() => togB(v.id)} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: hB ? T.redLt : T.card }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{hB ? "Indica motivo" : "Tocca per segnare bloccato"}</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${hB ? T.red : T.bdr}`, background: hB ? T.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
                      {hB ? "✓" : ""}
                    </div>
                  </div>
                  {hB && (
                    <div style={{ padding: "0 14px 12px", background: T.redLt }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, paddingTop: 8 }}>
                        {MOTIVI_BLOCCO.map(m => (
                          <div key={m} onClick={() => sbF(v.id, "motivo", m)} style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                            background: nvBlocchi[v.id]?.motivo === m ? T.red : T.card,
                            border: `1.5px solid ${nvBlocchi[v.id]?.motivo === m ? T.red : T.bdr}`,
                            color: nvBlocchi[v.id]?.motivo === m ? "#fff" : T.sub
                          }}>{m}</div>
                        ))}
                      </div>
                      <input style={S.input} placeholder="Note aggiuntive..." value={nvBlocchi[v.id]?.note || ""} onChange={e => sbF(v.id, "note", e.target.value)} />
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>NOTE GENERALI</div>
              <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} placeholder="Osservazioni sull'intera visita..." value={nvNote} onChange={e => setNvNote(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setNvStep(3)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(5)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 5 — Riepilogo */}
          {nvStep === 5 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📋 Riepilogo</div>
            <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.sub }}>📅 {nvData.data ? new Date(nvData.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "—"} · 🕐 {nvData.ora || "--:--"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>👤 {nvData.rilevatore || "Non specificato"}</div>
            </div>
            {nvVani.length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.grn}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.grn, marginBottom: 7 }}>✅ Misurati</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {nvVani.map(id => { const v = vaniA.find(x => x.id === id); return <span key={id} style={S.badge(T.grnLt, T.grn)}>{v?.nome}</span>; })}
                </div>
              </div>
            )}
            {Object.keys(nvBlocchi).length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.red}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 7 }}>🔴 Bloccati</div>
                {Object.entries(nvBlocchi).map(([id, b]) => {
                  const v = vaniA.find(x => x.id === parseInt(id));
                  return <div key={id} style={{ fontSize: 11, marginBottom: 4 }}><strong>{v?.nome}</strong>: {b.motivo || "—"}{b.note && ` — ${b.note}`}</div>;
                })}
              </div>
            )}
            {nvNote && <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, fontStyle: "italic", fontSize: 11, color: T.sub }}>"{nvNote}"</div>}
            <div style={{ ...S.card, padding: "10px 14px", marginBottom: 10, background: T.accLt, border: `1px solid ${T.acc}30` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Tipo visita</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>
                {nvTipo === "rilievo" ? "📐 Rilievo misure" : nvTipo === "definitiva" ? "✅ Misure definitive" : "🔧 Modifica cantiere"}
              </div>
              {nvTipo === "modifica" && nvMotivoModifica && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{nvMotivoModifica}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setNvStep(4)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Modifica</button>
              <button onClick={salvaVisita} style={{ ...S.btn, flex: 2, background: T.grn }}>✓ Salva visita</button>
            </div>
          </>}
        </div>
      </div>
    );

    // == VISTA RILIEVO CON VANI ==
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header rilievo */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setSelectedRilievo(null); setCmSubTab("rilievi"); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{tipoIcoRil}</span>
              <div style={S.headerTitle}>{tipoLblRil} — R{r?.n}</div>
            </div>
            <div style={S.headerSub}>{c.code} · {c.cliente} {c.cognome || ""} · {r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) : ""}</div>
          </div>
          {vaniList.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tipoColRil }}>{progVani}%</div>
              <div style={{ fontSize: 10, color: T.sub }}>{vaniMisurati.length}/{vaniList.length} vani</div>
            </div>
          )}
          <div onClick={() => setShowRiepilogo(true)} style={{ padding: "6px 10px", borderRadius: 6, background: T.accLt, cursor: "pointer", marginLeft: 6 }}>
            <span style={{ fontSize: 14 }}>📋</span>
          </div>
          <div onClick={exportPDF} style={{ padding: "6px 10px", borderRadius: 6, background: T.redLt, cursor: "pointer" }}>
            <Ico d={ICO.file} s={16} c={T.red} />
          </div>
        </div>

        {/* Banner rilievo info */}
        {r?.motivoModifica && (
          <div style={{ margin: "4px 16px 0", padding: "8px 12px", background: T.orangeLt, borderRadius: 8, border: `1px solid ${T.orange}30`, fontSize: 12, color: T.orange }}>
            🔧 <strong>Modifica:</strong> {r.motivoModifica}
          </div>
        )}

        {/* Barra progresso vani */}
        {vaniList.length > 0 && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ height: 5, background: T.bdr, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${progVani}%`, background: progVani === 100 ? T.grn : tipoColRil, borderRadius: 3 }} />
            </div>
            {vaniDaFare.filter(v => !v.note?.startsWith("🔴")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("🔴")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 600 }}>✅ Tutte le misure raccolte</div>}
          </div>
        )}

        {/* Info badges */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}>🔧 Riparazione</span>}
          {c.tipo === "nuova" && <span style={S.badge(T.grnLt, T.grn)}>🆕 Nuova</span>}
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.difficoltaSalita && <span style={S.badge(c.difficoltaSalita === "facile" ? T.grnLt : c.difficoltaSalita === "media" ? T.orangeLt : T.redLt, c.difficoltaSalita === "facile" ? T.grn : c.difficoltaSalita === "media" ? T.orange : T.red)}>Salita: {c.difficoltaSalita}</span>}
          {c.mezzoSalita && <span style={S.badge(T.purpleLt, T.purple)}>🪜 {c.mezzoSalita}</span>}
          {c.pianoEdificio && <span style={S.badge(T.blueLt, T.blue)}>Piano: {c.pianoEdificio}</span>}
          {c.foroScale && <span style={S.badge(T.redLt, T.red)}>Foro: {c.foroScale}</span>}
          {c.telefono && <span onClick={() => window.open(`tel:${c.telefono}`)} style={{ ...S.badge(T.grnLt, T.grn), cursor: "pointer" }}>📞 {c.telefono}</span>}
        </div>
        {c.note && <div style={{ padding: "0 16px", marginBottom: 6 }}><div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}>📝 {c.note}</div></div>}

        {/* Pipeline */}
        <div style={{ padding: "4px 16px 0" }}>
          <PipelineBar fase={c.fase} />
        </div>
        <div style={{ marginTop: 8 }}>{renderFasePanel(c)}</div>
        {faseIndex(c.fase) < PIPELINE.length - 1 && (
          <div style={{ padding: "0 16px", marginTop: 4, marginBottom: 4 }}>
            <button onClick={() => advanceFase(c.id)} style={{ ...S.btn, background: fase?.color, fontSize: 13, padding: 10, width: "100%" }}>
              ✓ Avanza a {PIPELINE[faseIndex(c.fase) + 1]?.nome} →
            </button>
          </div>
        )}

        {/* Contact actions */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          {[
            { ico: ICO.phone, label: "Chiama",   col: T.grn,  act: () => window.open(`tel:${c.telefono || ""}`) },
            { ico: ICO.map,   label: "Naviga",   col: T.blue, act: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(c.indirizzo || "")}`) },
            { ico: ICO.send,  label: "WhatsApp", col: "#25d366", act: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Commessa ${c.code} - ${c.cliente}`)}`) },
          ].map((a, i) => (
            <div key={i} onClick={a.act} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, cursor: "pointer" }}>
              <Ico d={a.ico} s={18} c={a.col} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.sub }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* == TAB: vani / info == */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 0 0" }}>
          {[{k:"sopralluoghi",l:`🪟 Vani (${vaniList.length})`},{k:"info",l:"ℹ Info rilievo"}].map(t => (
            <div key={t.k} onClick={() => setCmSubTab(t.k)} style={{
              flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderBottom: `2px solid ${cmSubTab === t.k ? T.acc : "transparent"}`,
              color: cmSubTab === t.k ? T.acc : T.sub
            }}>{t.l}</div>
          ))}
        </div>

        {/* == TAB VANI (lista vani del rilievo) == */}
        {cmSubTab === "sopralluoghi" && (
          <div style={{ padding: "0 16px 14px" }}>
            {vaniList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🪟</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>Nessun vano in questo rilievo</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 18 }}>Aggiungi i vani da misurare</div>
                <button onClick={() => setShowModal("vano")} style={{ ...S.btn, margin: "0 auto" }}>+ Aggiungi vano</button>
              </div>
            ) : vaniList.map(v => {
              const nMisure = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
              const completo = nMisure >= 6;
              const bloccato = v.note?.startsWith("🔴 BLOCCATO");
              const colore = bloccato ? T.red : completo ? T.grn : T.orange;
              return (
                <div key={v.id} onClick={() => { setSelectedVano(v); setVanoStep(0); }}
                  style={{ ...S.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                    borderLeft: `3px solid ${colore}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{v.nome}</span>
                      {/* Badge rilievo di appartenenza */}
                      {(() => {
                        const rIdx = c.rilievi?.findIndex(r => r.vani?.some(vv => vv.id === v.id));
                        if (rIdx < 0) return null;
                        const ril = c.rilievi[rIdx];
                        const questoBloccato = v.note?.startsWith("🔴 BLOCCATO");
                        const questoIncompleto = !questoBloccato && Object.values(v.misure||{}).filter(x=>(x as number)>0).length > 0 && Object.values(v.misure||{}).filter(x=>(x as number)>0).length < 6;
                        const haProblema = questoBloccato || questoIncompleto;
                        return (
                          <span style={{
                            fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "1px 6px",
                            background: haProblema ? T.redLt : T.bg,
                            color: haProblema ? T.red : T.sub,
                            border: `1px solid ${haProblema ? T.red+"40" : T.bdr}`
                          }}>
                            R{rIdx + 1} · {ril.data || ril.dataRilievo || "—"}
                            {haProblema && " ⚠"}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>{v.tipo} · {v.stanza} · {v.piano}</div>
                    {bloccato && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{v.note?.replace("🔴 BLOCCATO: ","")}</div>}
                  </div>
                  <div style={{ textAlign: "right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    {/* Badge pezzi */}
                    <span style={{ fontSize:12, fontWeight:800, color:"#fff",
                      background: bloccato ? T.red : completo ? T.grn : T.orange,
                      borderRadius:8, padding:"2px 8px", minWidth:28, textAlign:"center" }}>
                      {v.pezzi||1} pz
                    </span>
                    {bloccato
                      ? <span style={S.badge(T.redLt, T.red)}>🔴 Bloccato</span>
                      : completo
                      ? <span style={S.badge(T.grnLt, T.grn)}>✅ {nMisure} mis.</span>
                      : <span style={S.badge(T.orangeLt, T.orange)}>⚠ {nMisure} mis.</span>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14 }}>›</span>
                </div>
              );
            })}
            {vaniList.length > 0 && (
              <div onClick={() => setShowModal("vano")}
                style={{ ...S.card, padding: "11px 14px", marginTop: 6, cursor: "pointer",
                  border: `1px dashed ${T.bdr}`, background: "transparent",
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                <span style={{ fontSize: 18, color: T.acc }}>+</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>Aggiungi vano</span>
              </div>
            )}
          </div>
        )}

        {/* == TAB MISURE (stato per vano) == */}
        {vaniList.length > 0 && cmSubTab === "misure_tab" && (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Stato per vano</div>
            {vaniList.map(v => {
              const mis = vaniM.includes(v.id);
              const blk = !mis && ulB(v.id);
              let daV = null;
              for (let i = viste.length - 1; i >= 0; i--) {
                if (viste[i].vaniMisurati?.includes(v.id)) { daV = viste[i]; break; }
              }
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 8 }}>
                  <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: mis ? T.grnLt : blk ? T.redLt : T.bdr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {mis ? "✅" : blk ? "🔴" : "⏳"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
                        <span style={{ fontSize: 10, color: T.sub }}>~{v.mq}m²</span>
                      </div>
                      {mis && daV && <div style={{ fontSize: 11, color: T.sub }}>{daV.n}ª visita · {new Date(daV.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>}
                      {!mis && blk && <div style={{ fontSize: 11, color: T.red }}>{blk.motivo}{blk.note && <span style={{ color: T.sub }}> — {blk.note}</span>}</div>}
                      {!mis && !blk && <div style={{ fontSize: 11, color: T.sub }}>Non ancora visitato</div>}
                    </div>
                    {!mis && <span style={{ ...S.badge(T.redLt, T.red), flexShrink: 0, fontSize: 9 }}>DA FARE</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB INFO RILIEVO == */}
        {cmSubTab === "info" && (
          <div style={{ padding: "14px 16px" }}>
            {/* Info rilievo */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Dettagli Rilievo</div>
            {[
              ["Tipo",       tipoLblRil],
              ["Data",       r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "—"],
              ["Ora",        r?.ora || "—"],
              ["Rilevatore", r?.rilevatore || "—"],
              ["N. vani",    `${vaniList.length} vani`],
              ["Avanzamento",`${progVani}% (${vaniMisurati.length}/${vaniList.length})`],
              ...(r?.motivoModifica ? [["Motivo", r.motivoModifica]] : []),
              ...(r?.note ? [["Note", r.note]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 }}>Commessa</div>
            {[
              ["Cliente",   `${c.cliente} ${c.cognome || ""}`],
              ["Codice",    c.code],
              ["Indirizzo", c.indirizzo],
              ["Telefono",  c.telefono || "—"],
              ["Sistema",   c.sistema || "—"],
              ...(c.euro ? [["Importo", `€${c.euro.toLocaleString("it-IT")}`]] : []),
              ["Rilievi",   `${(c.rilievi||[]).length} totali`],
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* PREVENTIVO + INVIA */}
        <div style={{ padding: "0 16px", marginBottom: 8, display:"flex", gap:8 }}>
          <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"file",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/>
          <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"foto",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/>
          <button onClick={() => setShowPreventivoModal(true)} style={{ flex:1, padding: "12px", borderRadius: 10, border: "1.5px solid #ff9500", background: c.firmaCliente ? "#fff8ec" : "#fff", color: "#ff9500", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, position:"relative" }}>
            📄 {c.firmaCliente ? "Preventivo ✅" : "Crea Preventivo"}
            {(vaniList||[]).some(v=>!v.sistema) && !c.firmaCliente && <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#ff3b30",color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>!</span>}
          </button>
          <button onClick={() => setShowSendModal(true)} style={{ flex:1, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #007aff, #0055cc)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,122,255,0.3)" }}>
            <Ico d={ICO.send} s={14} c="#fff" sw={2} /> Invia
          </button>
        </div>

        {/* Allegati / Note / Vocali / Video */}
        <div style={{ padding: "0 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { ico: "📎", label: "File", act: () => fileInputRef.current?.click() },
              { ico: "📷", label: "Foto", act: () => fotoInputRef.current?.click() },
              { ico: "📝", label: "Nota", act: () => { setShowAllegatiModal("nota"); setAllegatiText(""); }},
              { ico: "🎤", label: "Vocale", act: () => { setShowAllegatiModal("vocale"); }},
              { ico: "🎬", label: "Video", act: () => { setShowAllegatiModal("video"); }},
            ].map((b, i) => (
              <div key={i} onClick={b.act} style={{ flex: 1, padding: "10px 4px", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 18 }}>{b.ico}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.sub, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
          {/* Lista allegati */}
          {(c.allegati || []).length > 0 && (
            <div style={{ marginTop: 6, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {(c.allegati || []).map(a => (
                <div key={a.id} style={{ borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 16 }}>{a.tipo === "nota" ? "📝" : a.tipo === "vocale" ? "🎤" : a.tipo === "video" ? "🎬" : a.tipo === "foto" ? "📷" : "📎"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.nome}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{a.data}{a.durata ? ` · ${a.durata}` : ""}</div>
                      {a.dataUrl && (a.tipo==="foto" ? <a href={a.dataUrl} target="_blank" rel="noreferrer" style={{fontSize:10,color:T.acc,fontWeight:600,marginTop:2,display:"block",textDecoration:"none"}}>🔍 Apri</a> : <a href={a.dataUrl} download={a.nome} style={{fontSize:10,color:T.acc,fontWeight:600,marginTop:2,display:"block",textDecoration:"none"}}>⬇ Scarica</a>)}
                    </div>
                    {a.tipo==="foto"&&a.dataUrl&&<img src={a.dataUrl} style={{width:44,height:44,objectFit:"cover",borderRadius:6,flexShrink:0}} alt=""/>}
                    {(a.tipo === "vocale" || a.tipo === "video") && (
                      <div onClick={() => playAllegato(a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: playingId === a.id ? T.redLt : T.accLt, fontSize: 10, fontWeight: 600, color: playingId === a.id ? T.red : T.acc, cursor: "pointer" }}>
                        {playingId === a.id ? "⏸ Stop" : "▶ Play"}
                      </div>
                    )}
                    {a.tipo === "foto" && <div onClick={() => alert("📷 Anteprima foto: " + a.nome)} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer" }}>👁 Vedi</div>}
                    {a.tipo === "file" && <div onClick={() => alert("📎 Apertura file: " + a.nome)} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer" }}>📂 Apri</div>}
                    <div onClick={() => { setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, allegati: (x.allegati || []).filter(al => al.id !== a.id) } : x)); setSelectedCM(p => ({ ...p, allegati: (p.allegati || []).filter(al => al.id !== a.id) })); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={12} c={T.sub} /></div>
                  </div>
                  {/* Progress bar for playing */}
                  {playingId === a.id && (
                    <div style={{ height: 3, background: T.bdr, margin: "0 12px 6px" }}>
                      <div style={{ height: "100%", background: a.tipo === "video" ? T.blue : T.acc, borderRadius: 2, width: `${playProgress}%`, transition: "width 0.1s linear" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vani */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Vani R{r?.n} ({vaniList.length})</div>
          <button style={S.sectionBtn} onClick={() => {
              if (!selectedCM) return;
              const tipObj = TIPOLOGIE_RAPIDE[0];
              if (!selectedRilievo) return;
              const v = { id: Date.now(), nome: `Vano ${(selectedRilievo.vani?.length||0)+1}`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
              const updR1 = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
              setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR1 : r2), aggiornato: "Oggi" } : c));
              setSelectedRilievo(updR1);
              setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR1 : r2) }));
              setSelectedVano(v);
              setVanoStep(0);
            }}>+ Nuovo vano</button>
        </div>
        <div style={{ padding: "0 16px", ...((isTablet || isDesktop) && vaniList.length > 0 ? { display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 } : {}) }}>
          {vaniList.length === 0 ? (
            <div onClick={() => {
              if (!selectedCM) return;
              const v = { id: Date.now(), nome: `Vano 1`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
              if (selectedRilievo) { const updR2 = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] }; setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR2 : r2) } : c)); setSelectedRilievo(updR2); setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR2 : r2) })); }
              setSelectedVano(v);
              setVanoStep(0);
            }} style={{ padding: "20px", textAlign: "center", background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}`, cursor: "pointer", color: T.sub, fontSize: 13 }}>
              Nessun vano. Tocca per aggiungerne uno.
            </div>
          ) : vaniList.map(v => {
            const filled = Object.values(v.misure || {}).filter(x => (x as number) > 0).length;
            const total = 8;
            const fotoCount = Object.values(v.foto || {}).filter(Boolean).length;
            return (
              <div key={v.id} style={{ ...S.card, margin: "0 0 8px" }} onClick={() => setSelectedVano(v)}>
                <div style={S.cardInner}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.icon || "🪟"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{v.nome}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: filled >= 6 ? T.grn : T.orange }}>{filled}/{total}<div style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>misure</div></div>
                      <div onClick={e => { e.stopPropagation(); deleteVano(v.id); }} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: T.redLt, cursor: "pointer" }}><Ico d={ICO.trash} s={13} c={T.red} /></div>
                    </div>
                  </div>
                  {/* Tags */}
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {fotoCount > 0 && <span style={S.badge(T.blueLt, T.blue)}>{fotoCount} foto</span>}
                    {v.cassonetto && <span style={S.badge(T.orangeLt, T.orange)}>Cassonetto</span>}
                    {v.accessori?.tapparella?.attivo && <span style={S.badge(T.grnLt, T.grn)}>Tapparella</span>}
                    {v.accessori?.zanzariera?.attivo && <span style={S.badge(T.purpleLt, T.purple)}>Zanzariera</span>}
                    {v.note && <span style={S.badge(T.cyanLt, T.cyan)}>Note</span>}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 3, background: T.bdr, borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: "100%", borderRadius: 2, background: filled >= 6 ? T.grn : T.acc, width: `${(filled / total) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline/Log */}
        {c.log && c.log.length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 8 }}>
              <div style={S.sectionTitle}>Cronologia</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              {c.log.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                    {i < c.log.length - 1 && <div style={{ width: 1, flex: 1, background: T.bdr, marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.3 }}><strong>{l.chi}</strong> {l.cosa}</div>
                    <div style={{ fontSize: 10, color: T.sub2, marginTop: 1 }}>{l.quando}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Elimina — bottom, small */}
        <div style={{ padding: "16px", textAlign: "center" }}>
          <span onClick={() => deleteCommessa(c.id)} style={{ fontSize: 11, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>🗝‘ Elimina commessa</span>
        </div>
      </div>
    );
  };

  /* == RIEPILOGO COMMESSA — SCHERMATA INVIO == */

  /* ===============================================
     PANNELLI DI FASE — renderFasePanel(c)
     Appare nella commessa detail, sotto la pipeline
     Un pannello specifico per ogni fase
  =============================================== */
  const renderFasePanel = (c) => {
    const fi = faseIndex(c.fase);
    const nextFase = PIPELINE[fi + 1];
    const fase = PIPELINE[fi];

    // Helper: aggiorna campo dentro la commessa selezionata
    const updateCM = (field, val) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
      setSelectedCM(prev => ({ ...prev, [field]: val }));
    };
    const updateCMNested = (obj) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, ...obj } : x));
      setSelectedCM(prev => ({ ...prev, ...obj }));
    };

    // Chip checklist riusabile
    const Chip = ({ label, done, onClick }) => (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
        borderRadius:8, border:`1.5px solid ${done ? T.grn : T.bdr}`, background: done ? T.grn+"12" : T.card,
        cursor:"pointer", marginBottom:6 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${done ? T.grn : T.bdr}`,
          background: done ? T.grn : "transparent", display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0 }}>
          {done && <span style={{fontSize:10,color:"white",fontWeight:800}}>✓</span>}
        </div>
        <span style={{fontSize:12, fontWeight:600, color: done ? T.grn : T.text}}>{label}</span>
      </div>
    );

    // Campo input riusabile
    const Field = ({ label, field, placeholder, type="text" }) => (
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
        <input type={type} placeholder={placeholder||""} value={c[field]||""}
          onChange={e => updateCM(field, e.target.value)}
          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.bdr}`,
            background:T.card,fontSize:13,color:T.text,fontFamily:FF,boxSizing:"border-box"}}/>
      </div>
    );

    const panelStyle = {
      margin:"0 16px 12px", borderRadius:12, border:`1.5px solid ${fase?.color}30`,
      background:T.card, overflow:"hidden"
    };
    const headerStyle = {
      padding:"10px 14px", background:fase?.color+"15", borderBottom:`1px solid ${fase?.color}25`,
      display:"flex", alignItems:"center", gap:8
    };

    // Toggle accordion per id fase
    const isOpen = (id) => fasePanelOpen[id] !== false; // default aperto
    const togglePanel = (id) => setFasePanelOpen(s => ({...s, [id]: !isOpen(id)}));

    // Wrapper accordion semplice — stessa UI di prima, solo con toggle
    const FasePanel = ({ id, children, taskNonFatti = 0 }) => (
      <div style={panelStyle}>
        <div onClick={() => togglePanel(id)} style={{ ...headerStyle, cursor:"pointer",
          borderBottom: isOpen(id) ? `1px solid ${fase?.color}25` : "none", userSelect:"none" }}>
          {/* Contenuto header originale passato come primo child */}
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,pointerEvents:"none"}}>
            {(children as any[])[0]}
          </div>
          {/* Badge alert se task non completati */}
          {taskNonFatti > 0 && (
            <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6,flexShrink:0}}/>
          )}
          <span style={{fontSize:13,color:T.sub,transform:isOpen(id)?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s",flexShrink:0}}>▾</span>
        </div>
        {isOpen(id) && (
          <div style={{padding:"12px 14px"}}>
            {(children as any[]).slice(1)}
          </div>
        )}
      </div>
    );

    // === SOPRALLUOGO ===
    if (c.fase === "sopralluogo") {
      const vaniAttivi2 = getVaniAttivi(c); const vaniCompletati = vaniAttivi2.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
      const tuttiCompletati = vaniCompletati === vaniAttivi2.length && vaniAttivi2.length > 0;
      const ndone = [!c.ck_foto, !c.ck_accesso, !c.ck_riepilogo_inviato, !tuttiCompletati].filter(Boolean).length;
      const open_sopr = fasePanelOpen["sopralluogo"] !== false;
      return (
        <div style={panelStyle}>
          <div onClick={()=>togglePanel("sopralluogo")} style={{...headerStyle,cursor:"pointer",borderBottom:open_sopr?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
            <span style={{fontSize:16}}>🔍</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Sopralluogo</span>
            <span style={{fontSize:11,fontWeight:700,color:tuttiCompletati?T.grn:T.orange,marginRight:4}}>{vaniCompletati}/{vaniAttivi2.length} vani ✓</span>
            {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
            <span style={{fontSize:13,color:T.sub,transform:open_sopr?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
          </div>
          {open_sopr && <div style={{padding:"12px 14px"}}>
            <Chip label="Fotografie scattate" done={c.ck_foto} onClick={()=>updateCM("ck_foto",!c.ck_foto)}/>
            <Chip label="Difficoltà accesso rilevata" done={c.ck_accesso} onClick={()=>updateCM("ck_accesso",!c.ck_accesso)}/>
            <Chip label="Riepilogo inviato al cliente" done={c.ck_riepilogo_inviato} onClick={()=>updateCM("ck_riepilogo_inviato",!c.ck_riepilogo_inviato)}/>
            <Chip label={`Tutte le misure inserite (${vaniCompletati}/${vaniAttivi2.length})`} done={tuttiCompletati} onClick={()=>{}}/>
            <Field label="Data sopralluogo" field="dataSopralluogo" type="date"/>
            <Field label="Note sopralluogo" field="noteSopralluogo" placeholder="Annotazioni rapide..."/>
            {tuttiCompletati && (
              <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,fontSize:12,color:T.grn,fontWeight:600,textAlign:"center"}}>
                ✅ Pronto per il preventivo
              </div>
            )}
          </div>}
        </div>
      );
    }

    // === PREVENTIVO ===
    if (c.fase === "preventivo") {
      const vaniCalc = vaniList.length > 0 ? vaniList : getVaniAttivi(c); const totale = vaniCalc.reduce((sum, v) => {
        const m = v.misure||{};
        const lc = (m.lCentro||0)/1000;
        const hc = (m.hCentro||0)/1000;
        const mq = lc * hc;
        const pxmq = parseFloat(c.prezzoMq||350);
        return sum + mq * pxmq;
      }, 0);
      const iva = totale * 0.1;
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>📋</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Preventivo</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Prezzo base €/mq" field="prezzoMq" placeholder="350" type="number"/>
            <Field label="Sconto %" field="sconto" placeholder="0" type="number"/>
            <Field label="Note preventivo" field="notePreventivo" placeholder="Condizioni, garanzie..."/>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>Totale imponibile</span><span style={{fontWeight:700,color:T.text}}>€ {totale.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>IVA 10%</span><span>€ {iva.toFixed(2)}</span>
              </div>
              {c.sconto > 0 && (
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.orange,marginBottom:4}}>
                  <span>Sconto {c.sconto}%</span><span>- € {(totale * c.sconto/100).toFixed(2)}</span>
                </div>
              )}
              <div style={{borderTop:`1px solid ${T.bdr}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800}}>
                <span>TOTALE IVA inclusa</span>
                <span style={{color:T.acc}}>€ {(totale + iva - (totale*(c.sconto||0)/100)).toFixed(2)}</span>
              </div>
            </div>
            <Chip label="Preventivo inviato al cliente" done={c.ck_prev_inviato} onClick={()=>updateCM("ck_prev_inviato",!c.ck_prev_inviato)}/>
            <Chip label="Cliente ha accettato verbalmente" done={c.ck_prev_accettato} onClick={()=>updateCM("ck_prev_accettato",!c.ck_prev_accettato)}/>
          </div>
        </div>
      );
    }

    // === CONFERMA ===
    if (c.fase === "conferma") {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>✍️</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Conferma Ordine</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Data conferma" field="dataConferma" type="date"/>
            <Field label="Acconto ricevuto €" field="accontoRicevuto" placeholder="0" type="number"/>
            <Field label="Metodo pagamento" field="metodoPagamento" placeholder="Bonifico / Contanti / Carta..."/>
            <Field label="Data prevista posa" field="dataPosaPrevista" type="date"/>
            <Chip label="Contratto firmato" done={c.ck_contratto} onClick={()=>updateCM("ck_contratto",!c.ck_contratto)}/>
            <Chip label="Acconto incassato" done={c.ck_acconto_inc} onClick={()=>updateCM("ck_acconto_inc",!c.ck_acconto_inc)}/>
            <Chip label="Data posa concordata" done={c.ck_data_posa} onClick={()=>updateCM("ck_data_posa",!c.ck_data_posa)}/>
          </div>
        </div>
      );
    }

    // === MISURE ===
    if (c.fase === "misure") {
      const vaniCalc = getVaniAttivi(c);
      const vaniOk = vaniCalc.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 9).length;
      return (
        (() => {
          const ndone = [!c.ck_misure_ok,!c.ck_diag_ok,!c.ck_pdf_prod,!c.ck_sistema_ok].filter(Boolean).length;
          const open = fasePanelOpen["misure"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("misure")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>📐</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Rilievo Misure Definitivo</span>
                <span style={{fontSize:11,fontWeight:700,color:vaniOk===vaniCalc.length?T.grn:T.orange,marginRight:4}}>{vaniOk}/{vaniCalc.length}</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Chip label="Tutte le misure verificate" done={c.ck_misure_ok} onClick={()=>updateCM("ck_misure_ok",!c.ck_misure_ok)}/>
                <Chip label="Diagonali controllate" done={c.ck_diag_ok} onClick={()=>updateCM("ck_diag_ok",!c.ck_diag_ok)}/>
                <Chip label="Riepilogo PDF inviato a produzione" done={c.ck_pdf_prod} onClick={()=>updateCM("ck_pdf_prod",!c.ck_pdf_prod)}/>
                <Chip label="Conferma sistema/colori approvata" done={c.ck_sistema_ok} onClick={()=>updateCM("ck_sistema_ok",!c.ck_sistema_ok)}/>
                <Field label="Tecnico misuratore" field="tecnicoMisure" placeholder="Nome tecnico..."/>
                <Field label="Data rilievo definitivo" field="dataRilievo" type="date"/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === ORDINI ===
    if (c.fase === "ordini") {
      return (
        (() => {
          const ndone = [!c.ck_ordine_inviato,!c.ck_ordine_confermato,!c.ck_cliente_avvisato].filter(Boolean).length;
          const open = fasePanelOpen["ordini"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("ordini")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>📦</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Ordini Fornitore</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Fornitore" field="fornitore" placeholder="Es. Schüco, Rehau..."/>
                <Field label="N° Ordine fornitore" field="numOrdine" placeholder="ORD-2026-XXXX"/>
                <Field label="Data ordine" field="dataOrdine" type="date"/>
                <Field label="Data consegna prevista" field="dataConsegna" type="date"/>
                <Chip label="Ordine inviato" done={c.ck_ordine_inviato} onClick={()=>updateCM("ck_ordine_inviato",!c.ck_ordine_inviato)}/>
                <Chip label="Conferma ricezione da fornitore" done={c.ck_ordine_confermato} onClick={()=>updateCM("ck_ordine_confermato",!c.ck_ordine_confermato)}/>
                <Chip label="Materiale in arrivo comunicato al cliente" done={c.ck_cliente_avvisato} onClick={()=>updateCM("ck_cliente_avvisato",!c.ck_cliente_avvisato)}/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === PRODUZIONE ===
    if (c.fase === "produzione") {
      return (
        (() => {
          const ndone = [!c.ck_mat_ricevuto,!c.ck_colori_ok,!c.ck_accessori_ok,!c.ck_posa_confermata].filter(Boolean).length;
          const open = fasePanelOpen["produzione"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("produzione")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>🏭</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Produzione</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data consegna in magazzino" field="dataInMagazzino" type="date"/>
                <Chip label="Materiale ricevuto e controllato" done={c.ck_mat_ricevuto} onClick={()=>updateCM("ck_mat_ricevuto",!c.ck_mat_ricevuto)}/>
                <Chip label="Colori verificati" done={c.ck_colori_ok} onClick={()=>updateCM("ck_colori_ok",!c.ck_colori_ok)}/>
                <Chip label="Accessori completi (maniglie, guarnizioni)" done={c.ck_accessori_ok} onClick={()=>updateCM("ck_accessori_ok",!c.ck_accessori_ok)}/>
                <Chip label="Data posa confermata al cliente" done={c.ck_posa_confermata} onClick={()=>updateCM("ck_posa_confermata",!c.ck_posa_confermata)}/>
                <Field label="Note magazzino" field="noteMagazzino" placeholder="Anomalie, sostituzioni..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === POSA ===
    if (c.fase === "posa") {
      return (
        (() => {
          const ndone = [!c.ck_posati,!c.ck_finiture,!c.ck_pulizia,!c.ck_test,!c.ck_foto_posa,!c.ck_cliente_ok].filter(Boolean).length;
          const open = fasePanelOpen["posa"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("posa")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>🔧</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Posa in Opera</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data posa effettiva" field="dataPosa" type="date"/>
                <Field label="Squadra posatori" field="squadraPosa" placeholder="Marco + Luigi..."/>
                <Chip label="Tutti i vani posati" done={c.ck_posati} onClick={()=>updateCM("ck_posati",!c.ck_posati)}/>
                <Chip label="Sigillature e finiture completate" done={c.ck_finiture} onClick={()=>updateCM("ck_finiture",!c.ck_finiture)}/>
                <Chip label="Pulizia cantiere" done={c.ck_pulizia} onClick={()=>updateCM("ck_pulizia",!c.ck_pulizia)}/>
                <Chip label="Test funzionamento maniglie/chiusure" done={c.ck_test} onClick={()=>updateCM("ck_test",!c.ck_test)}/>
                <Chip label="Foto lavoro completato scattate" done={c.ck_foto_posa} onClick={()=>updateCM("ck_foto_posa",!c.ck_foto_posa)}/>
                <Chip label="Cliente presente e soddisfatto" done={c.ck_cliente_ok} onClick={()=>updateCM("ck_cliente_ok",!c.ck_cliente_ok)}/>
                <Field label="Note posa" field="notePosa" placeholder="Problemi riscontrati, extra..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === CHIUSURA ===
    if (c.fase === "chiusura") {
      const vaniCalc2 = vaniList.length > 0 ? vaniList : getVaniAttivi(c); const totale = vaniCalc2.reduce((sum, v) => {
        const m = v.misure||{};
        const mq = ((m.lCentro||0)/1000) * ((m.hCentro||0)/1000);
        return sum + mq * parseFloat(c.prezzoMq||350);
      }, 0);
      const iva = totale * 0.1;
      const totIva = totale + iva - (totale*(c.sconto||0)/100);
      const saldo = totIva - parseFloat(c.accontoRicevuto||0);
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>✅</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Chiusura Commessa</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Totale commessa</span><span style={{fontWeight:700}}>€ {totIva.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Acconto ricevuto</span><span style={{color:T.grn,fontWeight:700}}>- € {parseFloat(c.accontoRicevuto||0).toFixed(2)}</span>
              </div>
              <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:6,marginTop:2,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800}}>
                <span>Saldo da incassare</span><span style={{color:saldo>0?T.red:T.grn}}>€ {saldo.toFixed(2)}</span>
              </div>
            </div>
            <Field label="Data chiusura" field="dataChiusura" type="date"/>
            <Field label="Saldo incassato €" field="saldoIncassato" placeholder="0" type="number"/>
            <Field label="Metodo saldo" field="metodoSaldo" placeholder="Bonifico / Contanti..."/>
            <Chip label="Saldo incassato" done={c.ck_saldo} onClick={()=>updateCM("ck_saldo",!c.ck_saldo)}/>
            <Chip label="Fattura emessa" done={c.ck_fattura} onClick={()=>updateCM("ck_fattura",!c.ck_fattura)}/>
            <Chip label="Garanzia consegnata al cliente" done={c.ck_garanzia} onClick={()=>updateCM("ck_garanzia",!c.ck_garanzia)}/>
            <Chip label="Scheda commessa archiviata" done={c.ck_archiviata} onClick={()=>updateCM("ck_archiviata",!c.ck_archiviata)}/>
            {c.ck_saldo && c.ck_fattura && (
              <div style={{marginTop:8,padding:"12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,textAlign:"center"}}>
                <div style={{fontSize:22}}>🎉</div>
                <div style={{fontSize:13,fontWeight:800,color:T.grn,marginTop:4}}>Commessa completata!</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>{c.code} · {c.cliente} {c.cognome||""}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderRiepilogo = () => {
    const c = selectedCM;
    if (!c) return null;
    const today = new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});
    const vaniR = getVaniAttivi(c); const vaniFilled = vaniR.filter(v=>Object.values(v.misure||{}).filter(x=>(x as number)>0).length>=6).length;
    const fuoriSqN = vaniR.filter(v=>{const d=(v.misure?.d1 as number)>0&&(v.misure?.d2 as number)>0?Math.abs(v.misure.d1-v.misure.d2):null;return (d as number)>5;}).length;

    const SEP = "━━━━━━━━━━━━━━━━━━━━━";
    const waMsg = [
      "📋 *SOPRALLUOGO "+c.code+"*",
      "👤 "+c.cliente+" "+(c.cognome||"")+(c.telefono?" · "+c.telefono:""),
      "📍 "+c.indirizzo,
      [c.pianoEdificio, c.mezzoSalita, c.foroScale].filter(Boolean).map((x,i)=>i===0?"🏢 "+x:x).join(" · "),
      c.sistema?"⚙️ "+c.sistema+" · "+(c.tipo==="nuova"?"Nuova costruzione":"Ristrutturazione"):"",
      "",
      ...vaniR.map((v,i)=>{
        const m=v.misure||{};
        const tl=TIPOLOGIE_RAPIDE.find(tp=>tp.code===v.tipo)?.label||v.tipo||"—";
        const diff=m.d1>0&&m.d2>0?Math.abs(m.d1-m.d2):null;
        const fuori=diff!==null&&(diff as number)>5;
        const ok=!fuori;
        const lines=[
          SEP,
          "*"+(i+1)+". "+v.nome.toUpperCase()+"* — "+v.tipo+" · "+v.piano+" "+(fuori?"⚠️":"✅"),
          SEP,
          "📏 L: "+(m.lAlto||"—")+" / *"+(m.lCentro||"—")+"* / "+(m.lBasso||"—"),
          "📐 H: "+(m.hSx||"—")+" / *"+(m.hCentro||"—")+"* / "+(m.hDx||"—"),
          (m.d1>0&&m.d2>0)
            ?(fuori?"⚠️ D: "+m.d1+" / "+m.d2+" — *FUORI SQUADRA +"+diff+"mm*":"↗ D: "+m.d1+" / "+m.d2+" ✅")
            :"",
          (m.spSx>0||m.spDx>0)?"⬛ Sp: "+(m.spSx?"Sx "+m.spSx:"")+(m.spDx?" · Dx "+m.spDx:"")+(m.spSopra?" · Sop "+m.spSopra:""):"",
          "",
          v.sistema?"🔧 "+v.sistema+(v.vetro?" · "+v.vetro:""):"",
          v.coloreInt?"🎨 "+(v.bicolore?"INT: "+v.coloreInt+" / EST: "+v.coloreEst:v.coloreInt):"",
          v.telaio?"📐 Tel "+v.telaio+(v.telaioAlaZ?" "+v.telaioAlaZ+"mm":"")+(v.rifilato&&(v.rifilSx||v.rifilDx)?" · Rif Sx:"+v.rifilSx+" Dx:"+v.rifilDx+(v.rifilSopra?" Sop:"+v.rifilSopra:""):""):"",
          (v.coprifilo||v.lamiera)?"🔩 "+(v.coprifilo||"")+(v.lamiera?" / "+v.lamiera:""):"",
          "",
          v.cassonetto?"📦 Cass "+v.casH+"×"+v.casP:"",
          v.accessori?.tapparella?.attivo?"⬇ Tap "+v.accessori.tapparella.colore+" · "+v.accessori.tapparella.l+"×"+v.accessori.tapparella.h:"",
          v.accessori?.persiana?.attivo?"🪟 Pers "+v.accessori.persiana.colore:"",
          v.accessori?.zanzariera?.attivo?"🕸 Zan "+v.accessori.zanzariera.l+"×"+v.accessori.zanzariera.h:"",
          v.note?"📝 "+v.note:"",
          fuori?"⚠️ Verificare con muratore prima dell'ordine":"",
        ].filter(x=>x!==undefined&&x!==null&&x!=="");
        return lines.join("\n");
      }),
      SEP,
      c.note?"📝 *NOTE GENERALI*\n"+c.note+"\n"+SEP:"",
      "",
      "_Generato con MASTRO · "+today+"_",
    ].filter(Boolean).join("\n");

    const BLU="#2563eb", VRD="#059669", ROS="#dc2626", GRY="#94a3b8", AMB="#d97706", VIO="#7c3aed";
    const FM="'DM Mono',monospace";

    // Disegno SVG per ogni tipologia
    const DrawVano = ({v}) => {
      const m = v.misure||{};
      const lc = m.lCentro||0, hc = m.hCentro||0, hasM = lc>0&&hc>0;
      const diff = m.d1>0&&m.d2>0 ? Math.abs(m.d1-m.d2) : null;
      const fuori = diff!==null && diff>5;
      const t = v.tipo||"";
      // dimensioni fisse proporzionate al tipo
      const isPorta = t==="PF1A"||t==="PF2A"||t==="PF3A"||t==="BLI";
      const isSC = t==="SC2A"||t==="SC4A"||t==="SCRDX"||t==="SCRSX"||t==="ALZDX"||t==="ALZSX"||t==="ALZSC";
      const W = isSC ? 260 : (t==="F3A"||t==="PF3A") ? 300 : (t==="F2A"||t==="PF2A") ? 220 : 160;
      const H = isPorta ? 240 : 160;
      const BW = 6; // bordo telaio fisso
      const GX = BW+10, GY = BW+10; // inizio vetro/anta
      const GW = W-GX*2, GH = H-GY*2;
      const cx = W/2, cy = H/2;
      const F = "monospace";
      const OR = "#e09010"; // arancio OB

      // Anta singola (riusabile)
      const anta1 = (ax,ay,aw,ah,ob,hingeLeft) => {
        const elems = [];
        elems.push(<rect key="v" x={ax} y={ay} width={aw} height={ah} fill="#ddeefa"/>);
        elems.push(<rect key="p" x={ax} y={ay} width={aw} height={ah} fill="none" stroke="#333" strokeWidth={1.2}/>);
        // triangolo: apice al centro del lato di apertura (opposto al cardine)
        if(hingeLeft) {
          // cardine SX → apice centro-DX
          elems.push(<line key="t1" x1={ax} y1={ay} x2={ax+aw} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          elems.push(<line key="t2" x1={ax} y1={ay+ah} x2={ax+aw} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          if(ob) {
            // OB aggiunge V vasistas in arancio (apice centro-basso)
            elems.push(<line key="ob1" x1={ax} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
            elems.push(<line key="ob2" x1={ax+aw} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
          }
          elems.push(<rect key="m" x={ax+aw-5} y={ay+ah/2-9} width={5} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>);
        } else {
          // cardine DX → apice centro-SX
          elems.push(<line key="t1" x1={ax+aw} y1={ay} x2={ax} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          elems.push(<line key="t2" x1={ax+aw} y1={ay+ah} x2={ax} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          if(ob) {
            elems.push(<line key="ob1" x1={ax} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
            elems.push(<line key="ob2" x1={ax+aw} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
          }
          elems.push(<rect key="m" x={ax} y={ay+ah/2-9} width={5} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>);
        }
        return elems;
      };

      let body = null;

      if (t==="F1A"||t==="PF1A") {
        body = anta1(GX,GY,GW,GH,false,true);
      } else if (t==="F2A"||t==="PF2A") {
        const hw = Math.floor((GW-8)/2);
        body = [
          <rect key="mont" x={GX+hw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, hw, GH, false, true).map((e,i)=><g key={"l"+i}>{e}</g>),
          ...anta1(GX+hw+8, GY, GW-hw-8, GH, false, false).map((e,i)=><g key={"r"+i}>{e}</g>),
        ];
      } else if (t==="F3A"||t==="PF3A") {
        const tw = Math.floor((GW-16)/3);
        body = [
          <rect key="m1" x={GX+tw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m2" x={GX+tw*2+8} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, tw, GH, true, true).map((e,i)=><g key={"a"+i}>{e}</g>),
          ...anta1(GX+tw+8, GY, tw, GH, false, true).map((e,i)=><g key={"b"+i}>{e}</g>),
          ...anta1(GX+tw*2+16, GY, tw, GH, true, false).map((e,i)=><g key={"c"+i}>{e}</g>),
        ];
      } else if (t==="SC2A"||t==="SC4A"||t==="SCRDX"||t==="SCRSX") {
        const hw = Math.floor(GW/2);
        body = [
          <line key="bt" x1={GX} y1={GY-3} x2={GX+GW} y2={GY-3} stroke="#666" strokeWidth={2}/>,
          <line key="bb" x1={GX} y1={GY+GH+3} x2={GX+GW} y2={GY+GH+3} stroke="#666" strokeWidth={2}/>,
          <rect key="la" x={GX} y={GY} width={hw} height={GH} fill="#ddeefa" stroke="#333" strokeWidth={1.5}/>,
          <rect key="lb" x={GX+hw} y={GY} width={GW-hw} height={GH} fill="#ddeefa" fillOpacity={0.4} stroke="#555" strokeWidth={0.8} strokeDasharray="5,3"/>,
          <rect key="mh" x={GX+hw-4} y={cy-9} width={4} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>,
          <line key="ar" x1={GX+hw+14} y1={cy} x2={GX+hw+GW*0.35} y2={cy} stroke="#1a56db" strokeWidth={1.2}/>,
          <polygon key="ap" points={(GX+hw+GW*0.35)+","+(cy-4)+" "+(GX+hw+GW*0.35)+","+(cy+4)+" "+(GX+hw+GW*0.35+8)+","+cy} fill="#1a56db"/>,
        ];
      } else if (t==="ALZDX"||t==="ALZSX"||t==="ALZSC") {
        const hw = Math.floor(GW/2);
        body = [
          <line key="bt" x1={GX} y1={GY-3} x2={GX+GW} y2={GY-3} stroke="#666" strokeWidth={2}/>,
          <line key="bb" x1={GX} y1={GY+GH+3} x2={GX+GW} y2={GY+GH+3} stroke="#666" strokeWidth={2}/>,
          <rect key="la" x={GX} y={GY} width={hw} height={GH} fill="#ddeefa" stroke="#333" strokeWidth={1.5}/>,
          <rect key="lb" x={GX+hw} y={GY} width={GW-hw} height={GH} fill="#ddeefa" fillOpacity={0.4} stroke="#555" strokeWidth={0.8} strokeDasharray="5,3"/>,
          <line key="av" x1={GX+hw+GW*0.22} y1={cy+12} x2={GX+hw+GW*0.22} y2={cy-14} stroke="#1a56db" strokeWidth={1.2}/>,
          <polygon key="ap" points={(GX+hw+GW*0.22-4)+","+(cy-10)+" "+(GX+hw+GW*0.22+4)+","+(cy-10)+" "+(GX+hw+GW*0.22)+","+(cy-18)} fill="#1a56db"/>,
        ];
      } else if (t==="VAS") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <line key="v1" x1={GX} y1={GY} x2={cx} y2={GY+GH} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="v2" x1={GX+GW} y1={GY} x2={cx} y2={GY+GH} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={cx-12} y={GY+GH-4} width={24} height={4} fill="white" stroke="#444" strokeWidth={0.8}/>,
        ];
      } else if (t==="RIBALTA") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <line key="v1" x1={GX} y1={GY+GH} x2={cx} y2={GY} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="v2" x1={GX+GW} y1={GY+GH} x2={cx} y2={GY} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={cx-12} y={GY} width={24} height={4} fill="white" stroke="#444" strokeWidth={0.8}/>,
        ];
      } else if (t==="BLI") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={2}/>,
          <line key="t1" x1={GX} y1={GY} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="t2" x1={GX} y1={GY+GH} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={GX+GW-5} y={cy-11} width={5} height={22} fill="white" stroke="#444" strokeWidth={0.8}/>,
          <circle key="mk" cx={GX+GW-3} cy={cy} r={5} fill="white" stroke="#333" strokeWidth={1.2}/>,
        ];
      } else if (t==="FISDX"||t==="FISSX"||t==="SOPR") {
        body = [<rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>];
      } else {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <text key="tx" x={cx} y={cy+4} textAnchor="middle" fontSize={10} fill="#888" fontFamily={F}>{t||"?"}</text>
        ];
      }

      // soglia per porte
      const hasSoglia = isPorta || t==="SC2A"||t==="ALZDX"||t==="ALZSX";

      return (
        <svg viewBox={"0 0 "+W+" "+H} width="100%" style={{display:"block",background:"white",border:"1px solid #ddd",borderRadius:3}}>
          {/* cassonetto */}
          {v.cassonetto&&<rect x={0} y={-14} width={W} height={14} fill="#fffde7" stroke="#ca8a04" strokeWidth={0.8}/>}
          {v.cassonetto&&<text x={cx} y={-4} textAnchor="middle" fontSize={6} fill="#92400e" fontFamily={F} fontWeight="700">{"CASS. "+v.casH+"×"+v.casP}</text>}
          {/* telaio fisso */}
          <rect x={1} y={1} width={W-2} height={H-2} fill="white" stroke="#333" strokeWidth={BW}/>
          {/* soglia */}
          {hasSoglia&&<line x1={1} y1={H-BW/2} x2={W-1} y2={H-BW/2} stroke="#333" strokeWidth={3}/>}
          {/* corpo */}
          {body}
          {/* quadratura: solo badge, no linee */}
          {fuori&&<rect x={cx-26} y={cy-9} width={52} height={18} rx={3} fill="#dc2626"/>}
          {fuori&&<text x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="white" fontFamily={F} fontWeight="700">{"⚠ +"+diff+"mm"}</text>}
          {!fuori&&diff!==null&&<rect x={cx-18} y={cy-7} width={36} height={14} rx={3} fill="#15803d"/>}
          {!fuori&&diff!==null&&<text x={cx} y={cy+4} textAnchor="middle" fontSize={8} fill="white" fontFamily={F} fontWeight="700">{"✓ sq."}</text>}
          {/* quote */}
          {hasM&&<rect x={cx-26} y={1} width={52} height={14} rx={2} fill="#1d4ed8"/>}
          {hasM&&<text x={cx} y={12} textAnchor="middle" fontSize={10} fill="white" fontFamily={F} fontWeight="700">{lc}</text>}
          {hasM&&<rect x={1} y={cy-8} width={14} height={16} rx={2} fill="#15803d"/>}
          {hasM&&<text x={8} y={cy+4} textAnchor="middle" fontSize={10} fill="white" fontFamily={F} fontWeight="700" transform={"rotate(-90,8,"+cy+")"}>{hc}</text>}
          {/* badge telaio/accessori */}
          {v.telaio&&<text x={GX+2} y={GY+9} fontSize={6} fill="#6d28d9" fontFamily={F} fontWeight="700">{"Tel."+v.telaio+(v.telaio==="Z"&&v.telaioAlaZ?" "+v.telaioAlaZ:"")}</text>}
          {v.accessori?.tapparella?.attivo&&<text x={GX+GW-2} y={GY+9} textAnchor="end" fontSize={6} fill="#d97706" fontFamily={F} fontWeight="700">TAP</text>}
          {v.accessori?.zanzariera?.attivo&&<text x={GX+GW-2} y={GY+17} textAnchor="end" fontSize={6} fill="#6d28d9" fontFamily={F} fontWeight="700">ZAN</text>}
        </svg>
      );
    };

    return (
      <div style={{paddingBottom:110,background:"#f1f5f9",minHeight:"100vh"}}>
        {/* Header */}
        <div style={{background:"#0f172a",padding:"13px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <div onClick={()=>setShowRiepilogo(false)} style={{cursor:"pointer",padding:4}}>
            <Ico d={ICO.back} s={20} c="#64748b"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:"white"}}>Riepilogo Sopralluogo</div>
            <div style={{fontSize:10,color:"#64748b"}}>{c.code} · {c.cliente} {c.cognome||""} · {today}</div>
          </div>
          <div style={{padding:"4px 8px",borderRadius:6,background:vaniFilled===vaniR.length?"#16a34a":"#d97706",fontSize:10,fontWeight:700,color:"white"}}>{vaniFilled}/{vaniR.length} ✓</div>
        </div>

        <div style={{padding:"10px 12px"}}>
          {/* Dati cantiere */}
          <div style={{background:"white",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:9,fontWeight:800,color:BLU,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>📍 Dati Cantiere</div>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"3px 8px",fontSize:11.5}}>
              <span style={{color:GRY,fontWeight:600}}>Cliente</span><span style={{fontWeight:700}}>{c.cliente} {c.cognome||""}</span>
              <span style={{color:GRY,fontWeight:600}}>Indirizzo</span><span>{c.indirizzo}</span>
              {c.telefono&&<><span style={{color:GRY,fontWeight:600}}>Tel</span><span>{c.telefono}</span></>}
              {c.pianoEdificio&&<><span style={{color:GRY,fontWeight:600}}>Piano</span><span style={{fontWeight:600}}>{c.pianoEdificio}</span></>}
              {c.mezzoSalita&&<><span style={{color:GRY,fontWeight:600}}>Salita</span><span>{c.mezzoSalita}</span></>}
              {c.sistema&&<><span style={{color:GRY,fontWeight:600}}>Sistema</span><span style={{fontWeight:700,color:BLU}}>{c.sistema}</span></>}
            </div>
            {c.note&&<div style={{marginTop:8,padding:"5px 8px",background:"#fffbeb",borderRadius:6,fontSize:11,color:"#713f12",borderLeft:"3px solid "+AMB}}>📝 {c.note}</div>}
          </div>

          {/* Vani */}
          {vaniR.map((v,vi)=>{
            const m=v.misure||{};
            const lc=m.lCentro||0, hc=m.hCentro||0;
            const diff=m.d1>0&&m.d2>0?Math.abs(m.d1-m.d2):null;
            const fuori=diff!==null&&(diff as number)>5;
            const misN=Object.values(m).filter(x=>(x as number)>0).length;
            const tipLabel=TIPOLOGIE_RAPIDE.find(tp=>tp.code===v.tipo)?.label||v.tipo||"—";
            return (
              <div key={v.id} style={{background:"white",borderRadius:10,border:"1.5px solid "+(fuori?"#fca5a5":"#e2e8f0"),marginBottom:10,overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"8px 12px",background:fuori?"#fef2f2":"#0f172a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:800,color:fuori?"#991b1b":"white"}}>{vi+1}. {v.nome}</span>
                    <span style={{fontSize:10,color:fuori?"#b91c1c":"#64748b",marginLeft:6}}>{tipLabel} · {v.stanza} · {v.piano}</span>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {fuori&&<span style={{padding:"2px 6px",borderRadius:3,background:ROS,color:"white",fontSize:8,fontWeight:800}}>⚠ +{diff}mm</span>}
                    <span style={{padding:"2px 6px",borderRadius:3,background:misN>=6?"#16a34a":"#d97706",color:"white",fontSize:8,fontWeight:700}}>{misN}mis</span>
                  </div>
                </div>

                <div style={{display:"flex"}}>
                  {/* SVG disegno */}
                  <div style={{width:"50%",padding:"10px 6px 8px 10px",borderRight:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:7,fontWeight:700,color:GRY,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Schema</div>
                    <DrawVano v={v}/>
                  </div>

                  {/* Misure */}
                  <div style={{flex:1,padding:"10px 10px 8px 10px"}}>
                    <div style={{fontSize:7,fontWeight:700,color:GRY,textTransform:"uppercase",marginBottom:5}}>Misure (mm)</div>
                    {[["LARGH",BLU,[["Alto",m.lAlto],["Centro●",m.lCentro],["Basso",m.lBasso]]],
                      ["ALT",VRD,[["Sx",m.hSx],["Centro●",m.hCentro],["Dx",m.hDx]]]
                    ].map(([lbl,col,rows])=>(
                      <div key={lbl} style={{marginBottom:5}}>
                        <div style={{fontSize:7,fontWeight:800,color:col,marginBottom:2,display:"flex",alignItems:"center",gap:2}}>
                          <span style={{width:6,height:6,borderRadius:1,background:col,display:"inline-block"}}/>
                          {lbl}
                        </div>
                        {rows.map(([l,val])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10.5,padding:"1.5px 0",borderBottom:"1px solid #f8fafc"}}>
                            <span style={{color:GRY,fontSize:9.5}}>{l}</span>
                            <span style={{fontWeight:700,color:val?"#0f172a":"#e2e8f0",fontFamily:"'DM Mono',monospace"}}>{val||"—"}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {(m.d1>0||m.d2>0)&&<div style={{marginBottom:4}}>
                      <div style={{fontSize:7,fontWeight:800,color:fuori?ROS:VIO,marginBottom:2}}>DIAG. {fuori?"⚠ +"+diff:"✓"}</div>
                      {[["D1↗",m.d1],["D2↘",m.d2]].map(([l,val])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10.5,padding:"1px 0"}}>
                          <span style={{color:GRY,fontSize:9.5}}>{l}</span>
                          <span style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{val||"—"}</span>
                        </div>
                      ))}
                    </div>}
                    {(m.spSx>0||m.spDx>0)&&<div>
                      <div style={{fontSize:7,fontWeight:800,color:AMB,marginBottom:2}}>SPALL.</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {[["Sx",m.spSx],["Dx",m.spDx],["Sop",m.spSopra]].filter(([,val])=>val>0).map(([l,val])=>(
                          <span key={l} style={{fontSize:10}}><span style={{color:GRY,fontSize:9}}>{l} </span><strong style={{fontFamily:"'DM Mono',monospace"}}>{val}</strong></span>
                        ))}
                      </div>
                    </div>}
                  </div>
                </div>

                {/* Prodotto */}
                {(v.sistema||v.vetro||v.telaio||v.accessori?.tapparella?.attivo||v.accessori?.zanzariera?.attivo||v.accessori?.persiana?.attivo||v.cassonetto||v.note)&&(
                  <div style={{padding:"7px 12px",background:"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:3}}>
                      {v.sistema&&<span style={{padding:"2px 7px",borderRadius:4,background:"#eff6ff",color:"#1d4ed8",fontSize:9.5,fontWeight:700}}>⚙ {v.sistema}</span>}
                      {v.vetro&&<span style={{padding:"2px 7px",borderRadius:4,background:"#f0fdf4",color:"#15803d",fontSize:9.5,fontWeight:700}}>🔲 {v.vetro}</span>}
                      {v.coloreInt&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fafafa",border:"1px solid #e2e8f0",color:"#374151",fontSize:9.5}}>🎨 {v.bicolore?"INT:"+v.coloreInt+"/EST:"+v.coloreEst:v.coloreInt}</span>}
                      {v.telaio&&<span style={{padding:"2px 7px",borderRadius:4,background:"#f5f3ff",color:"#6d28d9",fontSize:9.5,fontWeight:700}}>📐 Tel.{v.telaio}{v.telaio==="Z"&&v.telaioAlaZ?" ("+v.telaioAlaZ+"mm)":""}</span>}
                      {v.rifilato&&(v.rifilSx||v.rifilDx)&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fdf4ff",color:"#7e22ce",fontSize:9.5}}>Rif Sx:{v.rifilSx} Dx:{v.rifilDx} Sop:{v.rifilSopra}</span>}
                      {v.coprifilo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fefce8",color:"#92400e",fontSize:9.5}}>🔩 {v.coprifilo}</span>}
                      {v.lamiera&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fff7ed",color:"#9a3412",fontSize:9.5}}>📏 {v.lamiera}</span>}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {v.cassonetto&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fef3c7",color:"#b45309",fontSize:9.5,fontWeight:700}}>📦 Cass. {v.casH}×{v.casP}</span>}
                      {v.accessori?.tapparella?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fef3c7",color:"#b45309",fontSize:9.5,fontWeight:700}}>⬇ Tap. {v.accessori.tapparella.colore} {v.accessori.tapparella.l}×{v.accessori.tapparella.h}</span>}
                      {v.accessori?.persiana?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#eff6ff",color:"#1e40af",fontSize:9.5,fontWeight:700}}>🪟 Pers. {v.accessori.persiana.colore}</span>}
                      {v.accessori?.zanzariera?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fdf4ff",color:"#6b21a8",fontSize:9.5,fontWeight:700}}>🕸 Zan. {v.accessori.zanzariera.l}×{v.accessori.zanzariera.h}</span>}
                    </div>
                    {v.note&&<div style={{marginTop:5,fontSize:10.5,color:"#475569",fontStyle:"italic",padding:"3px 6px",background:"#fffbeb",borderRadius:4,borderLeft:"2px solid "+AMB}}>📝 {v.note}</div>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sommario */}
          <div style={{background:"#0f172a",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Sommario</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Vani",vaniR.length,"#60a5fa"],["Misure ✓",vaniFilled,"#4ade80"],["⚠ Fuori sq.",fuoriSqN,fuoriSqN>0?"#fbbf24":"#4ade80"]].map(([l,val,col])=>(
                <div key={l} style={{textAlign:"center",padding:"8px 4px",background:"rgba(255,255,255,0.05)",borderRadius:8}}>
                  <div style={{fontSize:22,fontWeight:800,color:col,fontFamily:"'DM Mono',monospace"}}>{val}</div>
                  <div style={{fontSize:8,color:"#94a3b8",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Anteprima messaggio WA */}
          <div style={{background:"#dcf8c6",border:"1.5px solid #16a34a",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:800,color:"#166534",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>📱 Anteprima messaggio</div>
            <pre style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:"#14532d",whiteSpace:"pre-wrap",lineHeight:1.65,margin:0,maxHeight:220,overflow:"auto"}}>{waMsg}</pre>
          </div>

        {/* Barra invio */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"white",borderTop:"2px solid #e2e8f0",padding:"10px 12px 22px",boxShadow:"0 -6px 20px rgba(0,0,0,0.08)"}}>
          <div style={{fontSize:9,fontWeight:700,color:GRY,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7,textAlign:"center"}}>Invia riepilogo</div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent(waMsg))}
              style={{flex:1,padding:"13px 8px",borderRadius:11,background:"#16a34a",color:"white",textAlign:"center",cursor:"pointer",fontWeight:800,fontSize:13}}>💬 WhatsApp</div>
            <div onClick={()=>window.open("mailto:?subject="+encodeURIComponent("Sopralluogo "+c.code)+"&body="+encodeURIComponent(waMsg.replace(/\*/g,"")))}
              style={{flex:1,padding:"13px 8px",borderRadius:11,background:BLU,color:"white",textAlign:"center",cursor:"pointer",fontWeight:800,fontSize:13}}>📧 Email</div>
            <div onClick={()=>window.print()}
              style={{padding:"13px 14px",borderRadius:11,background:"#f1f5f9",color:"#475569",cursor:"pointer",fontWeight:800,fontSize:15}}>🖨</div>
          </div>
        </div>
      </div>
    );
  };

// =======================================================
// MASTRO ERP v2 — PARTE 3/5
// Righe 2639-3594: Vano Detail Wizard completo
// =======================================================
  /* == VANO DETAIL — WIZARD A STEP == */
  const STEPS = [
    { id: "larghezze", title: "LARGHEZZE", desc: "Misura la larghezza in 3 punti: alto, centro, basso", color: "#507aff", icon: "📏", fields: ["lAlto", "lCentro", "lBasso"], labels: ["Larghezza ALTO", "Larghezza CENTRO (luce netta)", "Larghezza BASSO"] },
    { id: "altezze", title: "ALTEZZE", desc: "Misura l'altezza in 3 punti: sinistra, centro, destra", color: "#34c759", icon: "📐", fields: ["hSx", "hCentro", "hDx"], labels: ["Altezza SINISTRA", "Altezza CENTRO", "Altezza DESTRA"] },
    { id: "diagonali", title: "DIAGONALI", desc: "Misura le 2 diagonali per verificare la squadra", color: "#ff9500", icon: "✕", fields: ["d1", "d2"], labels: ["Diagonale 1 ↗", "Diagonale 2 ↘"] },
    { id: "spallette", title: "SPALLETTE", desc: "Misura le spallette e l'imbotte", color: "#32ade6", icon: "🧱", fields: ["spSx", "spDx", "spSopra", "imbotte"], labels: ["Spalletta SINISTRA", "Spalletta DESTRA", "Spalletta SOPRA", "Profondità IMBOTTE"] },
    { id: "davanzale", title: "DAVANZALE", desc: "Davanzale, soglia e cassonetto", color: "#ff2d55", icon: "⬇", fields: ["davProf", "davSporg", "soglia"], labels: ["Davanzale PROFONDITÀ", "Davanzale SPORGENZA", "Altezza SOGLIA"] },
    { id: "accessori", title: "ACCESSORI", desc: "Tapparella, persiana, zanzariera", color: "#af52de", icon: "+" },
    { id: "disegno", title: "DISEGNO + FOTO", desc: "Disegna, fotografa e annota il vano", color: "#ff6b6b", icon: "📷" },
    { id: "riepilogo", title: "RIEPILOGO", desc: "Anteprima completa del vano", color: "#34c759", icon: "📋" },
  ];

  const renderVanoDetail = () => {
    const v = selectedVano;
    const m = v.misure || {};
    const step = STEPS[vanoStep];
    const filled = Object.values(m).filter(x => (x as number) > 0).length;
    const TIPO_TIPS = { Scorrevole: { t: "Scorrevole (alzante/traslante)", dim: "2000 × 2200 mm", w: ["Binario inferiore: serve spazio incasso", "Verifica portata parete"] }, Portafinestra: { t: "Portafinestra standard", dim: "800-900 × 2200 mm", w: ["Soglia a taglio termico", "Verifica altezza architrave"] }, Finestra: { t: "Finestra", dim: "1200 × 1400 mm", w: ["Verifica spazio per anta"] } };
    const tip = TIPO_TIPS[v.tipo] || null;
    const hasWarnings = !m.lAlto && !m.lCentro && !m.lBasso;
    const hasHWarnings = !m.hSx && !m.hCentro && !m.hDx;
    const fSq = m.d1 > 0 && m.d2 > 0 ? Math.abs(m.d1 - m.d2) : null;

    // Mini SVG per step
    const MiniSVG = ({ type }) => {
      const w = 60, h = 70;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
          <rect x={5} y={5} width={w-10} height={h-10} fill={step.color + "12"} stroke={step.color + "40"} strokeWidth={1.5} rx={3} />
          {type === "larghezze" && <>
            <line x1={10} y1={18} x2={w-10} y2={18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h-18} x2={w-10} y2={h-18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "altezze" && <>
            <line x1={14} y1={10} x2={14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w/2} y1={10} x2={w/2} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-14} y1={10} x2={w-14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "diagonali" && <>
            <line x1={10} y1={10} x2={w-10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-10} y1={10} x2={10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "spallette" && <>
            <rect x={2} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={w-12} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={5} y={2} width={w-10} height={8} fill={step.color + "18"} stroke={step.color+"40"} rx={1} />
          </>}
          {type === "davanzale" && <>
            <rect x={5} y={h-16} width={w-10} height={10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
          </>}
        </svg>
      );
    };

    // Inline input renderer (no sub-component = no focus loss)
    const bInput = (label, field) => (
      <div key={field} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
        <input
          key={`input-${field}`}
          style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 500, fontFamily: FM, textAlign: "center", border: `1px solid ${T.bdr}`, borderRadius: 12, background: m[field] > 0 ? step.color + "08" : T.card, color: T.text, outline: "none", boxSizing: "border-box" }}
          type="number" inputMode="numeric" placeholder="Tocca per inserire" value={m[field] || ""}
          onChange={e => updateMisura(v.id, field, e.target.value)}
        />
      </div>
    );

    return (
      <div style={{ paddingBottom: 80, background: T.bg }}>
        {/* Back + vano name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          <div onClick={() => { setSelectedVano(null); setVanoStep(0); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
          </div>
          <div onClick={() => { setShowAIPhoto(true); setAiPhotoStep(0); }} style={{ padding: "5px 10px", borderRadius: 8, background: "linear-gradient(135deg, #af52de20, #007aff20)", border: "1px solid #af52de40", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#af52de" }}>AI</span>
          </div>
        </div>

        {/* == INFO VANO — fisarmoniche (solo step 0) == */}
        {vanoStep === 0 && (() => {
          const updateV = (field, val) => {
            setCantieri(cs => cs.map(c => c.id === selectedCM?.id
              ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, [field]: val } : vn) } : r2) } : c));
            setSelectedVano(prev => ({ ...prev, [field]: val }));
          };
          const cats = ["Finestre","Balconi","Scorrevoli","Persiane","Altro"];
          const pianiList = ["S2","S1","PT","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15","P16","P17","P18","P19","P20","M"];
          const coloriRAL = ["RAL 9010","RAL 9016","RAL 9001","RAL 7016","RAL 7021","RAL 8014","RAL 8016","RAL 1013","Altro"];

          const sections = [
            { id:"accesso", icon:"🏗", label:"Accesso / Difficoltà",
              badge: v.difficoltaSalita||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"facile",l:"Facile",c:T.grn,e:"✅"},{id:"media",l:"Media",c:T.orange,e:"⚠️"},{id:"difficile",l:"Difficile",c:T.red,e:"🔴"}].map(d=>(
                    <div key={d.id} onClick={()=>updateV("difficoltaSalita",d.id)}
                      style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1.5px solid ${v.difficoltaSalita===d.id?d.c:T.bdr}`,background:v.difficoltaSalita===d.id?d.c+"15":T.card,textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:13}}>{d.e}</div>
                      <div style={{fontSize:10,fontWeight:700,color:v.difficoltaSalita===d.id?d.c:T.sub}}>{d.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:2}}>MEZZO DI SALITA</div>
                <select style={S.select} value={v.mezzoSalita||""} onChange={e=>updateV("mezzoSalita",e.target.value)}>
                  <option value="">— Seleziona —</option>
                  {mezziSalita.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            },
            { id:"tipologia", icon:"🪟", label:"Tipologia",
              badge: v.tipo||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bdr}`,paddingBottom:0,marginBottom:4}}>
                  {cats.map(cat=>(
                    <div key={cat} onClick={()=>setTipCat(cat)}
                      style={{padding:"5px 8px",fontSize:10,fontWeight:700,cursor:"pointer",color:tipCat===cat?T.acc:T.sub,borderBottom:`2px solid ${tipCat===cat?T.acc:"transparent"}`,marginBottom:-1,whiteSpace:"nowrap"}}>
                      {cat}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
                  {TIPOLOGIE_RAPIDE.filter(t=>t.cat===tipCat).map(t=>(
                    <div key={t.code} onClick={()=>updateV("tipo",t.code)}
                      style={{padding:"7px 10px",borderRadius:10,border:`1.5px solid ${v.tipo===t.code?T.acc:T.bdr}`,background:v.tipo===t.code?T.accLt:T.card,fontSize:11,fontWeight:700,color:v.tipo===t.code?T.acc:T.text,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      {t.icon} {t.code}
                    </div>
                  ))}
                </div>
              </div>
            },
            { id:"posizione", icon:"🏠", label:"Stanza / Piano",
              badge: v.stanza?`${v.stanza} · ${v.piano}`:null,
              body: <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>STANZA</div>
                  <select style={S.select} value={v.stanza||""} onChange={e=>updateV("stanza",e.target.value)}>
                    {["Soggiorno","Cucina","Camera","Bagno","Studio","Ingresso","Corridoio","Altro"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>PIANO</div>
                  <select style={S.select} value={v.piano||""} onChange={e=>updateV("piano",e.target.value)}>
                    {pianiList.map(p=><option key={p} value={p}>{p==="S2"?"S2 — 2° Seminterrato":p==="S1"?"S1 — Seminterrato":p==="PT"?"PT — Piano Terra":p==="M"?"M — Mansarda":`${p} — ${p.replace("P","")}° Piano`}</option>)}
                  </select>
                </div>
                <div style={{width:80}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>PEZZI</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div onClick={()=>updateV("pezzi",Math.max(1,(v.pezzi||1)-1))} style={{width:28,height:32,borderRadius:6,background:T.bg,border:`1px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>−</div>
                    <div style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:T.acc}}>{v.pezzi||1}</div>
                    <div onClick={()=>updateV("pezzi",(v.pezzi||1)+1)} style={{width:28,height:32,borderRadius:6,background:T.bg,border:`1px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>+</div>
                  </div>
                </div>
              </div>
            },
            { id:"sistema", icon:"⚙️", label:"Sistema / Vetro",
              badge: v.sistema?v.sistema.split(" ").slice(0,2).join(" · "):null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>SISTEMA</div>
                  <select style={S.select} value={v.sistema||""} onChange={e=>updateV("sistema",e.target.value)}>
                    <option value="">— Seleziona —</option>
                    {sistemiDB.map(s=><option key={s.id} value={`${s.marca} ${s.sistema}`}>{s.marca} {s.sistema}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>VETRO</div>
                  <select style={S.select} value={v.vetro||""} onChange={e=>updateV("vetro",e.target.value)}>
                    <option value="">— Seleziona —</option>
                    {vetriDB.map(g=><option key={g.id} value={g.code}>{g.code} Ug={g.ug}</option>)}
                  </select>
                </div>
              </div>
            },
            { id:"colori", icon:"🎨", label:"Colori profili",
              badge: v.coloreInt||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub}}>INT</div>
                  <div onClick={()=>updateV("bicolore",!v.bicolore)}
                    style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:v.bicolore?T.accLt:"transparent",border:`1px solid ${v.bicolore?T.acc:T.bdr}`,color:v.bicolore?T.acc:T.sub,cursor:"pointer",fontWeight:600}}>
                    Bicolore {v.bicolore?"✓":""}
                  </div>
                </div>
                {!v.bicolore
                  ? <select style={S.select} value={v.coloreInt||""} onChange={e=>updateV("coloreInt",e.target.value)}>
                      <option value="">— Seleziona —</option>
                      {coloriDB.map(c=><option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                    </select>
                  : <div style={{display:"flex",gap:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:T.sub,marginBottom:2}}>INT</div>
                        <select style={S.select} value={v.coloreInt||""} onChange={e=>updateV("coloreInt",e.target.value)}>
                          <option value="">—</option>{coloriDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:T.sub,marginBottom:2}}>EST</div>
                        <select style={S.select} value={v.coloreEst||""} onChange={e=>updateV("coloreEst",e.target.value)}>
                          <option value="">—</option>{coloriDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                    </div>
                }
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>ACCESSORI</div>
                  <select style={S.select} value={v.coloreAcc||""} onChange={e=>updateV("coloreAcc",e.target.value)}>
                    <option value="">— Come profili —</option>
                    {coloriDB.map(c=><option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                  </select>
                </div>
              </div>
            },
            { id:"telaio", icon:"📐", label:"Telaio / Rifilato",
              badge: v.telaio?(v.telaio==="Z"?"Telaio Z":"Telaio L"):(v.rifilato?"Rifilato":null),
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"Z",l:"Telaio a Z"},{id:"L",l:"Telaio a L"}].map(t=>(
                    <div key={t.id} onClick={()=>updateV("telaio",v.telaio===t.id?"":t.id)}
                      style={{flex:1,padding:"9px",borderRadius:8,border:`1.5px solid ${v.telaio===t.id?T.acc:T.bdr}`,background:v.telaio===t.id?T.accLt:T.card,textAlign:"center",fontSize:12,fontWeight:700,color:v.telaio===t.id?T.acc:T.sub,cursor:"pointer"}}>
                      {t.l}
                    </div>
                  ))}
                </div>
                {v.telaio==="Z" && <div>
                  <div style={{fontSize:10,color:T.sub,fontWeight:600,marginBottom:2}}>Lunghezza ala (mm)</div>
                  <input style={S.input} type="number" inputMode="numeric" placeholder="es. 35" value={v.telaioAlaZ||""} onChange={e=>updateV("telaioAlaZ",e.target.value)}/>
                </div>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div onClick={()=>updateV("rifilato",!v.rifilato)}
                    style={{width:40,height:22,borderRadius:11,background:v.rifilato?T.acc:T.bdr,cursor:"pointer",position:"relative",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:v.rifilato?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.15s"}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:T.text}}>Rifilato</span>
                </div>
                {v.rifilato && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {[["rifilSx","↙ Sx"],["rifilDx","↘ Dx"],["rifilSopra","↑ Sopra"],["rifilSotto","↓ Sotto"]].map(([f,l])=>(
                    <div key={f}><div style={{fontSize:9,color:T.sub,fontWeight:600,marginBottom:2}}>{l} (mm)</div>
                    <input style={S.input} type="number" inputMode="numeric" placeholder="0" value={v[f]||""} onChange={e=>updateV(f,e.target.value)}/></div>
                  ))}
                </div>}
              </div>
            },
            { id:"finiture", icon:"🔩", label:"Coprifilo / Lamiera",
              badge: (v.coprifilo||v.lamiera)?"✓":null,
              body: <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>COPRIFILO</div>
                  <select style={S.select} value={v.coprifilo||""} onChange={e=>updateV("coprifilo",e.target.value)}>
                    <option value="">— No —</option>
                    {coprifiliDB.map(c=><option key={c.id} value={c.cod}>{c.cod} — {c.nome}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>LAMIERA</div>
                  <select style={S.select} value={v.lamiera||""} onChange={e=>updateV("lamiera",e.target.value)}>
                    <option value="">— No —</option>
                    {lamiereDB.map(l=><option key={l.id} value={l.cod}>{l.cod} — {l.nome}</option>)}
                  </select>
                </div>
              </div>
            },
          ];

          return (
            <div style={{padding:"6px 16px 2px"}}>
              {sections.map(sec=>{
                const isOpen = vanoInfoOpen===sec.id;
                return (
                  <div key={sec.id} style={{marginBottom:3,borderRadius:10,border:`1px solid ${isOpen?T.acc+"50":T.bdr}`,overflow:"hidden"}}>
                    <div onClick={()=>setVanoInfoOpen(isOpen?null:sec.id)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:isOpen?T.acc+"06":T.card,cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:14}}>{sec.icon}</span>
                        <span style={{fontSize:12,fontWeight:600,color:T.text}}>{sec.label}</span>
                        {sec.badge && <span style={{...S.badge(T.accLt,T.acc),fontSize:9,padding:"1px 6px"}}>{sec.badge}</span>}
                      </div>
                      <span style={{fontSize:9,color:T.sub,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
                    </div>
                    {isOpen && <div style={{padding:"12px",background:T.bg,borderTop:`1px solid ${T.bdr}`}}>{sec.body}</div>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Dots progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 16px 6px" }}>
          {STEPS.map((s, i) => (
            <div key={i} onClick={() => setVanoStep(i)} style={{ width: i === vanoStep ? 18 : 8, height: 8, borderRadius: 4, background: i === vanoStep ? s.color : i < vanoStep ? s.color + "60" : T.bdr, cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        <div style={{ padding: "8px 16px" }}>
          {/* Step header card */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: step.color + "10", borderRadius: 14, border: `1px solid ${step.color}25`, marginBottom: 12 }}>
            {(vanoStep <= 4) && <MiniSVG type={step.id} />}
            {vanoStep > 4 && <div style={{ width: 50, height: 50, borderRadius: 12, background: step.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{step.icon}</div>}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: step.color }}>{step.icon} {step.title}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{step.desc}</div>
              {step.fields && <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 2 }}>{step.fields.filter(f => m[f] > 0).length}/{step.fields.length} inserite</div>}
            </div>
          </div>

          {/* Warnings */}
          {vanoStep <= 2 && (hasWarnings || hasHWarnings) && (
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 11, color: "#e65100" }}>
              {hasWarnings && <div>⚠ Nessuna larghezza inserita</div>}
              {hasHWarnings && <div>⚠ Nessuna altezza inserita</div>}
            </div>
          )}

          {/* === STEP 0: LARGHEZZE === */}
          {vanoStep === 0 && (
            <>
              {bInput("Larghezza ALTO", "lAlto")}
              {m.lAlto > 0 && !m.lCentro && !m.lBasso && (
                <div onClick={() => { updateMisura(v.id, "lCentro", m.lAlto); updateMisura(v.id, "lBasso", m.lAlto); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.lAlto} mm)
                </div>
              )}
              {bInput("Larghezza CENTRO (luce netta)", "lCentro")}
              {bInput("Larghezza BASSO", "lBasso")}
              {tip && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff8e1", border: "1px solid #ffecb3", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f57f17" }}>💡 {tip.t}</div>
                  <div style={{ fontSize: 11, color: "#795548" }}>Dimensioni tipiche: {tip.dim}</div>
                  {tip.w.map((w, i) => <div key={i} style={{ fontSize: 10, color: "#e65100", marginTop: 2 }}>⚠ {w}</div>)}
                </div>
              )}
            </>
          )}

          {/* === STEP 1: ALTEZZE === */}
          {vanoStep === 1 && (
            <>
              {bInput("Altezza SINISTRA", "hSx")}
              {m.hSx > 0 && !m.hCentro && !m.hDx && (
                <div onClick={() => { updateMisura(v.id, "hCentro", m.hSx); updateMisura(v.id, "hDx", m.hSx); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.hSx} mm)
                </div>
              )}
              {bInput("Altezza CENTRO", "hCentro")}
              {bInput("Altezza DESTRA", "hDx")}
              {tip && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff8e1", border: "1px solid #ffecb3", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f57f17" }}>💡 {tip.t}</div>
                  <div style={{ fontSize: 11, color: "#795548" }}>Dimensioni tipiche: {tip.dim}</div>
                  {tip.w.map((w, i) => <div key={i} style={{ fontSize: 10, color: "#e65100", marginTop: 2 }}>⚠ {w}</div>)}
                </div>
              )}
            </>
          )}

          {/* === STEP 2: DIAGONALI === */}
          {vanoStep === 2 && (
            <>
              {bInput("Diagonale 1 ↗", "d1")}
              {bInput("Diagonale 2 ↘", "d2")}
              {fSq !== null && fSq > 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#ffebee", border: "1px solid #ef9a9a", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#c62828" }}>⚠ Fuori squadra: {fSq}mm</div>
                  <div style={{ fontSize: 11, color: "#b71c1c" }}>Differenza superiore a 3mm — segnalare in ufficio</div>
                </div>
              )}
              {fSq !== null && fSq <= 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>✅ In squadra — differenza: {fSq}mm</div>
                </div>
              )}
              {tip && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff8e1", border: "1px solid #ffecb3", marginTop: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#f57f17" }}>💡 {tip.t}</div>
                  <div style={{ fontSize: 11, color: "#795548" }}>Dimensioni tipiche: {tip.dim}</div>
                  {tip.w.map((w, i) => <div key={i} style={{ fontSize: 10, color: "#e65100", marginTop: 2 }}>⚠ {w}</div>)}
                </div>
              )}
            </>
          )}

          {/* === STEP 3: SPALLETTE === */}
          {vanoStep === 3 && (
            <>
              {bInput("Spalletta SINISTRA", "spSx")}
              {bInput("Spalletta DESTRA", "spDx")}
              {bInput("Spalletta SOPRA", "spSopra")}
              {bInput("Profondità IMBOTTE", "imbotte")}
              {/* DISEGNO LIBERO SPALLETTE */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginTop: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#32ade6" }}>✏️ Disegno spallette</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { const ctx = spCanvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 380, 200); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗝‘ Pulisci</button>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: T.grn, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                  </div>
                </div>
                <canvas ref={spCanvasRef} width={380} height={200} style={{ width: "100%", height: 200, background: "#fff", touchAction: "none", cursor: "crosshair" }}
                  onPointerDown={e=>{spCanvasRef.current?.setPointerCapture(e.pointerId);setSpDrawing(true);const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle=penColor;ctx.lineWidth=penSize;ctx.lineCap="round";ctx.lineJoin="round";}}}
                  onPointerMove={e=>{if(!spDrawing)return;const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}}
                  onPointerUp={() => setSpDrawing(false)}
                  onPointerLeave={() => setSpDrawing(false)}
                />
                <div style={{ padding: "6px 14px", display: "flex", gap: 4 }}>
                  {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500"].map(c => (
                    <div key={c} onClick={() => setPenColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: penColor === c ? `3px solid ${T.acc}` : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                    {[1, 2, 4].map(s => (
                      <div key={s} onClick={() => setPenSize(s)} style={{ width: 22, height: 22, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <div style={{ width: s * 2 + 2, height: s * 2 + 2, borderRadius: "50%", background: T.text }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === STEP 4: DAVANZALE === */}
          {vanoStep === 4 && (
            <>
              {bInput("Davanzale PROFONDITÀ", "davProf")}
              {bInput("Davanzale SPORGENZA", "davSporg")}
              {bInput("Altezza SOGLIA", "soglia")}
              {/* Cassonetto toggle */}
              <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: `1px dashed ${T.bdr}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => {
                const nv = { ...v, cassonetto: !v.cassonetto };
                setSelectedVano(nv);
                if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);}
              }}>
                <span style={{ fontSize: 12, color: T.sub }}>+</span>
                <span style={{ fontSize: 14 }}>🧊</span>
                <span style={{ fontSize: 13, color: T.sub }}>{v.cassonetto ? "Cassonetto attivo" : "Ha un cassonetto? Tocca per aggiungere"}</span>
              </div>
              {v.cassonetto && (
                <div style={{ marginTop: 8 }}>
                  {bInput("Cassonetto ALTEZZA", "casH")}
                  {bInput("Cassonetto PROFONDITÀ", "casP")}
                </div>
              )}
            </>
          )}

          {/* === STEP 5: ACCESSORI === */}
          {vanoStep === 5 && (
            <>
              {["tapparella", "persiana", "zanzariera", "cassonetto"].map(acc => {
                if (acc === "cassonetto") {
                  return (
                    <div key={acc} onClick={() => {
                      const nv = { ...v, cassonetto: !v.cassonetto };
                      setSelectedVano(nv);
                      if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);}
                    }} style={{ padding: "14px 16px", borderRadius: 12, border: `1px dashed ${v.cassonetto ? "#ff9500" : T.bdr}`, background: v.cassonetto ? "#fff8e1" : T.card, marginBottom: 8, cursor: "pointer", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: v.cassonetto ? "#ff9500" : T.sub }}>+ 🧊 {v.cassonetto ? "Cassonetto attivo — tocca per rimuovere" : "Aggiungi Cassonetto"}</span>
                    </div>
                  );
                }
                const a = v.accessori?.[acc] || { attivo: false };
                const accColors = { tapparella: "#ff9500", persiana: "#007aff", zanzariera: "#ff2d55" };
                const accIcons = { tapparella: "🪟", persiana: "🏠", zanzariera: "🦟" };
                return (
                  <div key={acc} style={{ marginBottom: 8, borderRadius: 12, border: `1px ${a.attivo ? "solid" : "dashed"} ${a.attivo ? accColors[acc] + "40" : T.bdr}`, overflow: "hidden", background: T.card }}>
                    {!a.attivo ? (
                      <div onClick={() => toggleAccessorio(v.id, acc)} style={{ padding: "14px 16px", textAlign: "center", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>+ {accIcons[acc]} Aggiungi {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: accColors[acc] }}>{accIcons[acc]} {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ fontSize: 11, color: T.sub, cursor: "pointer" }}>▲ Chiudi</div>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Larghezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" placeholder="" value={v.accessori?.[acc]?.l || ""} onChange={e => updateAccessorio(v.id, acc, "l", parseInt(e.target.value) || 0)} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                            </div>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Altezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" placeholder="" value={v.accessori?.[acc]?.h || ""} onChange={e => updateAccessorio(v.id, acc, "h", parseInt(e.target.value) || 0)} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                            </div>
                          </div>
                          {acc === "tapparella" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Materiale</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {["PVC", "Alluminio", "Acciaio", "Legno"].map(mat => (
                                  <div key={mat} onClick={() => updateAccessorio(v.id, acc, "materiale", mat)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.bdr}`, background: v.accessori?.[acc]?.materiale === mat ? "#ff950018" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.materiale === mat ? 700 : 400, color: v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.text }}>{mat}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Motorizzata</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                                {["Sì", "No"].map(mot => (
                                  <div key={mot} onClick={() => updateAccessorio(v.id, acc, "motorizzata", mot)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.bdr}`, background: v.accessori?.[acc]?.motorizzata === mot ? "#34c75918" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.motorizzata === mot ? 700 : 400, color: v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.text }}>{mot}</div>
                                ))}
                              </div>
                            </>
                          )}
                          {acc === "persiana" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipologia Telaio</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {telaiPersianaDB.map(tp => (
                                  <div key={tp.id} onClick={() => updateAccessorio(v.id, acc, "telaio", tp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.telaio === tp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.telaio === tp.code ? 700 : 400, color: v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.text }}>{tp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>4° Lato / Posizionamento</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {posPersianaDB.map(pp => (
                                  <div key={pp.id} onClick={() => updateAccessorio(v.id, acc, "posizionamento", pp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.posizionamento === pp.code ? 700 : 400, color: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.text }}>{pp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Colore</div>
                          <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF }} value={v.accessori?.[acc]?.colore || ""} onChange={e => updateAccessorio(v.id, acc, "colore", e.target.value)}>
                            <option value="">Colore</option>
                            {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                          </select>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ marginTop: 10, padding: "8px", borderRadius: 8, border: `1px dashed #ef5350`, textAlign: "center", fontSize: 11, color: "#ef5350", cursor: "pointer" }}>
                            🗝‘ Rimuovi {acc}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* === STEP 6: DISEGNO + FOTO + NOTE === */}
          {vanoStep === 6 && (
            <>
              {/* Disegno mano libera */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>✏️ Disegno a mano libera</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 380, 340); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗝‘ Pulisci</button>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ff3b30", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                  </div>
                </div>
                <canvas ref={canvasRef} width={380} height={340} style={{ width: "100%", height: 340, background: "#fff", touchAction: "none", cursor: "crosshair" }}
                  onPointerDown={e=>{canvasRef.current?.setPointerCapture(e.pointerId);setIsDrawing(true);const cv=canvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle=penColor;ctx.lineWidth=penSize;ctx.lineCap="round";ctx.lineJoin="round";}}}
                  onPointerMove={e=>{if(!isDrawing)return;const cv=canvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}}
                  onPointerUp={() => setIsDrawing(false)}
                  onPointerLeave={() => setIsDrawing(false)}
                />
                <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 4 }}>
                  {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#ffffff"].map(c => (
                    <div key={c} onClick={() => setPenColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: penColor === c ? `3px solid ${T.acc}` : c === "#ffffff" ? `1px solid ${T.bdr}` : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                  <div style={{ width: 1, height: 20, background: T.bdr, margin: "0 4px" }} />
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: 12 }}>🩹</span>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                    {[1, 2, 4, 6].map(s => (
                      <div key={s} onClick={() => setPenSize(s)} style={{ width: 24, height: 24, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <div style={{ width: s * 2 + 1, height: s * 2 + 1, borderRadius: "50%", background: T.text }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Foto */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>📷 FOTO ({(v.foto && Object.keys(v.foto).length) || 0})</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => document.getElementById("fotoVanoInput").click()}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>📷 Foto</button>
                    <button onClick={() => { setPendingFotoCat(null); videoVanoRef.current?.click(); }}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.blue, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🎬 Video</button>
                  </div>
                </div>
                <input ref={fotoVanoRef} type="file" accept="image/*" capture="environment" multiple style={{ display: "none" }}
                  onChange={e => {
                    const cat = pendingFotoCat;
                    Array.from(e.target.files || []).forEach(file => {
                      const r = new FileReader();
                      r.onload = ev => {
                        const key = "foto_" + Date.now() + "_" + file.name;
                        const fotoObj = { dataUrl: ev.target.result, nome: file.name, tipo: "foto", categoria: cat || null };
                        setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
                        setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
                      };
                      r.readAsDataURL(file);
                    });
                    setPendingFotoCat(null);
                    e.target.value = "";
                  }}/>
                <input ref={videoVanoRef} type="file" accept="video/*" capture="environment" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const key = "video_" + Date.now();
                    setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: { nome: file.name, tipo: "video" } } } : vn) } : r2) } : c));
                    setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: { nome: file.name, tipo: "video" } } }));
                    e.target.value = "";
                  }}/>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{Object.keys(v.foto||{}).length} allegati</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { n: "Panoramica", r: true, c: "#ff3b30" }, { n: "Spalle muro", r: true, c: "#007aff" }, { n: "Soglia", r: true, c: "#007aff" },
                    { n: "Cassonetto", r: false, c: "#34c759" }, { n: "Dettagli critici", r: true, c: "#ff3b30" }, { n: "Imbotto", r: false, c: "#34c759" },
                    { n: "Contesto", r: false, c: "#34c759" }, { n: "Altro", r: false, c: "#34c759" },
                  ].map((cat, i) => {
                    const fotoCount = Object.values(v.foto||{}).filter(f=>f.categoria===cat.n).length;
                    return (
                    <div key={i} onClick={()=>{ setPendingFotoCat(cat.n); fotoVanoRef.current?.click(); }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${fotoCount>0 ? "#34c759" : cat.r ? cat.c + "40" : T.bdr}`, background: fotoCount>0 ? "#34c75915" : cat.r ? cat.c + "08" : "transparent", fontSize: 10, fontWeight: 600, color: fotoCount>0 ? "#1a9e40" : cat.r ? cat.c : T.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, position:"relative" }}>
                      {fotoCount>0 ? <span style={{fontSize:8,background:"#34c759",color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{fotoCount}</span> : cat.r ? <span style={{ fontSize: 8 }}>✕</span> : null}
                      <span style={{ fontSize: 10 }}>📷</span> {cat.n}
                    </div>
                    );
                  })}
                </div>
                {Object.keys(v.foto||{}).length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: T.sub, fontSize: 11 }}>Nessun allegato — tocca 📷 Foto o 🎬 Video</div>
                  : <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {Object.entries(v.foto||{}).map(([k, f]) => (
                        <div key={k} style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: T.bg, border: `1px solid ${T.bdr}` }}>
                          {f.tipo === "foto" && f.dataUrl
                            ? <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={f.nome}/>
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontSize: 24 }}>🎬</span>
                                <span style={{ fontSize: 8, color: T.sub, textAlign: "center", padding: "0 4px" }}>{f.nome?.slice(0,12)}</span>
                              </div>
                          }
                          {f.categoria && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:7,fontWeight:700,padding:"2px 3px",textAlign:"center",lineHeight:1.2}}>{f.categoria}</div>}
                          <div onClick={() => {
                            const newFoto = { ...(v.foto||{}) }; delete newFoto[k];
                            setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: newFoto } : vn) } : r2) } : c));
                            setSelectedVano(prev => ({ ...prev, foto: newFoto }));
                          }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Note */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ff9500", marginBottom: 8 }}>📝 NOTE</div>
                <textarea style={{ width: "100%", padding: 10, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, minHeight: 60, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Note sul vano..." defaultValue={v.note || ""} />
              </div>
            </>
          )}

          {/* === STEP 7: RIEPILOGO === */}
          {vanoStep === 7 && (
            <>
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 16, marginBottom: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v.nome}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{v.tipo} • {v.stanza} • {v.piano}</div>
                </div>
                {/* Larghezze */}
                <div style={{ borderRadius: 10, border: `1px solid #507aff25`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#507aff10", fontSize: 11, fontWeight: 700, color: "#507aff" }}>📏 LARGHEZZE</div>
                  {[["Alto", m.lAlto], ["Centro", m.lCentro], ["Basso", m.lBasso]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span style={{ color: T.text }}>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Altezze */}
                <div style={{ borderRadius: 10, border: `1px solid #34c75925`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#34c75910", fontSize: 11, fontWeight: 700, color: "#34c759" }}>📐 ALTEZZE</div>
                  {[["Sinistra", m.hSx], ["Centro", m.hCentro], ["Destra", m.hDx]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Diagonali */}
                <div style={{ borderRadius: 10, border: `1px solid #ff950025`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#ff950010", fontSize: 11, fontWeight: 700, color: "#ff9500" }}>✕ DIAGONALI</div>
                  {[["D1", m.d1], ["D2", m.d2], ["Fuori squadra", fSq !== null ? `${fSq}mm` : ""]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: l === "Fuori squadra" && fSq > 3 ? "#ff3b30" : val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Spallette */}
                <div style={{ borderRadius: 10, border: `1px solid #32ade625`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#32ade610", fontSize: 11, fontWeight: 700, color: "#32ade6" }}>🧱 SPALLETTE</div>
                  {[["Sinistra", m.spSx], ["Destra", m.spDx], ["Sopra", m.spSopra], ["Imbotte", m.imbotte]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Davanzale */}
                <div style={{ borderRadius: 10, border: `1px solid #ff2d5525`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#ff2d5510", fontSize: 11, fontWeight: 700, color: "#ff2d55" }}>⬇ DAVANZALE</div>
                  {[["Profondità", m.davProf], ["Sporgenza", m.davSporg], ["Soglia", m.soglia]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Accessori */}
                {(v.accessori?.tapparella?.attivo || v.accessori?.persiana?.attivo || v.accessori?.zanzariera?.attivo) && (
                  <div style={{ borderRadius: 10, border: `1px solid #af52de25`, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ padding: "6px 12px", background: "#af52de10", fontSize: 11, fontWeight: 700, color: "#af52de" }}>✚ ACCESSORI</div>
                    {v.accessori?.tapparella?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🪟 Tapparella</div>}
                    {v.accessori?.persiana?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🏠 Persiana</div>}
                    {v.accessori?.zanzariera?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🦟 Zanzariera</div>}
                  </div>
                )}
              </div>
            </>
          )}

          {/* === NAV BUTTONS === */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {vanoStep > 0 && (
              <button onClick={() => setVanoStep(s => s - 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.text }}>← Indietro</button>
            )}
            {vanoStep < 7 && (
              <button onClick={() => setVanoStep(s => s + 1)} style={{ flex: vanoStep === 0 ? "1 1 100%" : 1, padding: "14px", borderRadius: 12, border: "none", background: step.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>Avanti →</button>
            )}
            {vanoStep === 7 && (
              <button onClick={() => { setVanoStep(0); goBack(); }} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>💾 SALVA TUTTO</button>
            )}
          </div>

          {/* === RIEPILOGO RAPIDO === */}
          <div style={{ marginTop: 12, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Riepilogo rapido</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                ["L", m.lCentro || m.lAlto || m.lBasso],
                ["H", m.hCentro || m.hSx || m.hDx],
                ["D1", m.d1], ["D2", m.d2],
                ["F.sq", fSq !== null ? `${fSq}` : null],
              ].map(([l, val]) => (
                <div key={l} style={{ padding: "3px 8px", borderRadius: 4, background: T.bg, fontSize: 10, fontFamily: FM, color: val ? T.text : T.sub2 }}>
                  {l}: {val || "—"}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  /* == AGENDA TAB — Giorno / Settimana / Mese == */
  const renderAgenda = () => {
    const dateStr = (d) => d.toISOString().split("T")[0];
    // Merge events + tasks with dates
    const tasksWithDate = tasks.filter(t => t.date).map(t => ({ ...t, _isTask: true, color: t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93" }));
    const allItems = [...events, ...tasksWithDate];
    const dayEvents = allItems.filter(e => e.date === dateStr(selDate)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    const weekStart = new Date(selDate); weekStart.setDate(selDate.getDate() - selDate.getDay() + 1);
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const monthStart = new Date(selDate.getFullYear(), selDate.getMonth(), 1);
    const monthDays = Array.from({ length: 35 }, (_, i) => { const d = new Date(monthStart); d.setDate(d.getDate() + i - monthStart.getDay() + 1); return d; });
    const isSameDay = (a, b) => dateStr(a) === dateStr(b);
    const isToday2 = (d) => isSameDay(d, new Date());
    const eventsOn = (d) => allItems.filter(e => e.date === dateStr(d));
  // Helper: colore per tipo evento
  const tipoEvColor = (tipo) => {
    if (tipo === "appuntamento") return "#007aff";
    if (tipo === "sopr_riparazione") return "#FF6B00";
    if (tipo === "riparazione") return "#FF3B30";
    if (tipo === "collaudo") return "#5856D6";
    if (tipo === "garanzia") return "#8E8E93";
    return "#ff9500"; // sopralluogo default
  };


    const navDate = (dir) => {
      const d = new Date(selDate);
      if (agendaView === "giorno") d.setDate(d.getDate() + dir);
      else if (agendaView === "settimana") d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      setSelDate(d);
    };

    // Swipe handlers
    let touchStartX = 0;
    const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) navDate(dx < 0 ? 1 : -1);
    };

    // Prossimi eventi (dal giorno di oggi in avanti, max 3)
    const todayStr = dateStr(new Date());
    const prossimiEventi = allItems
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time||"99").localeCompare(b.time||"99"))
      .slice(0, 3);

    // Ore rimanenti agli eventi di oggi
    const now = new Date();
    const oraOra = now.getHours() * 60 + now.getMinutes();
    const eventiOggi = events.filter(e => e.date === todayStr && e.time).map(e => {
      const [hh, mm] = e.time.split(":").map(Number);
      const minuti = hh * 60 + mm - oraOra;
      return { ...e, minutiAlEvento: minuti };
    }).filter(e => e.minutiAlEvento > 0).sort((a,b) => a.minutiAlEvento - b.minutiAlEvento);

    const renderEventCard = (ev) => (
      <div key={ev.id} style={{ ...S.card, margin: "0 0 8px", opacity: ev._isTask && ev.done ? 0.5 : 1 }} onClick={() => !ev._isTask && setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}>
        <div style={{ ...S.cardInner, display: "flex", gap: 10 }}>
          {ev._isTask ? (
            <div onClick={(e) => { e.stopPropagation(); toggleTask(ev.id); }} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${ev.done ? T.grn : T.bdr}`, background: ev.done ? T.grn : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
              {ev.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
          ) : (
            <div style={{ width: 3, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
          )}
          {ev.time && <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, minWidth: 38, fontFamily: FM }}>{ev.time}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textDecoration: ev._isTask && ev.done ? "line-through" : "none" }}>{ev.text}</div>
            {ev._isTask && ev.meta && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>📝 {ev.meta}</div>}
            {!ev._isTask && ev.addr && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>📍 {ev.addr}</div>}
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
              {ev.cm && <span onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ ...S.badge(T.accLt, T.acc), cursor: "pointer" }}>{ev.cm}</span>}
              {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>{ev.persona}</span>}
              {ev._isTask && <span style={S.badge(ev.priority === "alta" ? "#FF3B3018" : ev.priority === "media" ? "#FF950018" : "#8E8E9318", ev.priority === "alta" ? "#FF3B30" : ev.priority === "media" ? "#FF9500" : "#8E8E93")}>task · {ev.priority}</span>}
              {!ev._isTask && ev.reminder && <span style={S.badge(ev.reminderSent ? T.grnLt : "#FF950015", ev.reminderSent ? T.grn : "#FF9500")}>{ev.reminderSent ? "✓ Reminder inviato" : `⏰ ${ev.reminder}`}</span>}
              {!ev._isTask && <span style={S.badge(ev.tipo==="appuntamento"?T.blueLt:ev.tipo==="sopr_riparazione"?"#FF6B0018":ev.tipo==="riparazione"?"#FF3B3018":ev.tipo==="collaudo"?"#5856D618":"#8E8E9318", ev.tipo==="appuntamento"?T.blue:ev.tipo==="sopr_riparazione"?"#FF6B00":ev.tipo==="riparazione"?"#FF3B30":ev.tipo==="collaudo"?"#5856D6":ev.tipo==="garanzia"?"#8E8E93":T.orange)}>{ev.tipo}</span>}
            </div>
          </div>
          <div style={{ alignSelf: "center", transition: "transform 0.2s", transform: selectedEvent?.id === ev.id ? "rotate(90deg)" : "rotate(0deg)" }}>
            <Ico d={ICO.back} s={14} c={T.sub} />
          </div>
        </div>
        {/* Expanded detail */}
        {selectedEvent?.id === ev.id && (
          <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.bdr}`, marginTop: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 0" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Data</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{new Date(ev.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Orario</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{ev.time || "Tutto il giorno"}</div>
              </div>
              {ev.persona && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Assegnato a</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>👤 {ev.persona}</div>
              </div>}
              {ev.addr && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Luogo</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>📍 {ev.addr}</div>
              </div>}
            </div>
            {ev.cm && (
              <div style={{ padding: "8px 10px", background: T.accLt, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5 }}>Commessa collegata</div>
                <div onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginTop: 2, cursor: "pointer" }}>{ev.cm} → Apri commessa</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <div onClick={(e) => { e.stopPropagation(); if (ev.addr) window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr)); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.blue }}>🗝º Mappa</div>
              <div onClick={(e) => { e.stopPropagation(); if (ev.persona) window.open("tel:"); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.grn }}>📞 Chiama</div>
              <div onClick={(e) => {
                e.stopPropagation();
                const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                setMailBody(tpl);
                setShowMailModal({ ev, cm: cmObj });
              }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.accLt, border: `1px solid ${T.acc}30`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.acc }}>✉️ Mail</div>
              <div onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); setSelectedEvent(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.redLt, border: `1px solid ${T.red}30`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.red }}>🗝‘</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#007aff" }}>{"📁"} Commessa</div>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#ff9500" }}>{"📏"} Misure</div>
              <div onClick={(e) => { e.stopPropagation(); const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#34c759" }}>{"🔧"} Intervento</div>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Agenda</div>
            <div style={S.headerSub}>
              {agendaView === "giorno" ? selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) :
               agendaView === "settimana" ? `${weekDays[0].getDate()}–${weekDays[6].getDate()} ${selDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}` :
               selDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div onClick={() => setShowNewEvent(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, fontWeight: 300 }}>+</div>
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", gap: 0, margin: "8px 16px", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.bdr}` }}>
          {["giorno", "settimana", "mese"].map(v => (
            <div key={v} onClick={() => setAgendaView(v)} style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, background: agendaView === v ? T.acc : T.card, color: agendaView === v ? "#fff" : T.sub, cursor: "pointer", textTransform: "capitalize" }}>
              {v}
            </div>
          ))}
        </div>

        {/* Nav arrows */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 16px" }}>
          <div onClick={() => navDate(-1)} style={{ cursor: "pointer", padding: "4px 8px" }}><Ico d={ICO.back} s={18} c={T.sub} /></div>
          <div onClick={() => setSelDate(new Date())} style={{ fontSize: 12, fontWeight: 600, color: T.acc, cursor: "pointer" }}>Oggi</div>
          <div onClick={() => navDate(1)} style={{ cursor: "pointer", padding: "4px 8px", transform: "rotate(180deg)" }}><Ico d={ICO.back} s={18} c={T.sub} /></div>
        </div>

        {/* === BANNER REMINDER PENDENTI === */}
        {(() => {
          const today = dateStr(new Date());
          const tomorrow = dateStr(new Date(Date.now() + 86400000));
          const reminderPendenti = events.filter(ev => {
            if (!ev.reminder || ev.reminderSent) return false;
            if (ev.reminder === "giorno" && ev.date === today) return true;
            if (ev.reminder === "24h" && ev.date === tomorrow) return true;
            if (ev.reminder === "1h") {
              if (ev.date !== today) return false;
              if (!ev.time) return true;
              const [hh, mm] = ev.time.split(":").map(Number);
              const evMin = hh * 60 + mm;
              const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
              return evMin - nowMin <= 60 && evMin - nowMin > 0;
            }
            return false;
          });
          if (reminderPendenti.length === 0) return null;
          return (
            <div style={{ margin: "0 16px 10px", padding: "10px 12px", borderRadius: 10, background: "#FF950010", border: "1px solid #FF950040", borderLeft: "3px solid #FF9500" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>⏰</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#FF9500" }}>
                    {reminderPendenti.length} reminder da inviare
                  </div>
                  <div style={{ fontSize: 10, color: T.sub }}>Avvisa i clienti con 1 click</div>
                </div>
              </div>
              {reminderPendenti.map(ev => {
                const cmObj = cantieri.find(c => c.code === ev.cm);
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : ev.persona || "Cliente";
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le ricordiamo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarci.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                return (
                  <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", background:"#fff", borderRadius:8, marginBottom:4, border:"1px solid #FF950030" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ev.text}</div>
                      <div style={{ fontSize:10, color:T.sub }}>{cliente} · {ev.time || "tutto il giorno"}</div>
                    </div>
                    <div onClick={() => {
                      setMailBody(tpl);
                      setShowMailModal({ ev: { ...ev, addr: ev.addr || "" }, cm: cmObj || null });
                      setEvents(es => es.map(x => x.id === ev.id ? { ...x, reminderSent: true } : x));
                    }} style={{ padding:"5px 10px", borderRadius:7, background:"#FF9500", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
                      ✉️ Invia
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div style={{ padding: "0 16px" }}>

          {/* === VISTA MESE === */}
          {agendaView === "mese" && (
            <>
              {/* Banner prossimo evento di oggi */}
              {eventiOggi.length > 0 && (
                <div style={{ ...S.card, marginBottom: 10, padding: "10px 14px", borderLeft: `3px solid ${eventiOggi[0].color || tipoEvColor(eventiOggi[0].tipo)}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>
                      Prossimo evento tra {eventiOggi[0].minutiAlEvento < 60
                        ? `${eventiOggi[0].minutiAlEvento} min`
                        : `${Math.floor(eventiOggi[0].minutiAlEvento/60)}h ${eventiOggi[0].minutiAlEvento%60>0?eventiOggi[0].minutiAlEvento%60+"min":""}`}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{eventiOggi[0].text}</div>
                    {eventiOggi[0].addr && <div style={{ fontSize: 11, color: T.sub }}>📍 {eventiOggi[0].addr}</div>}
                  </div>
                  {eventiOggi[0].addr && (
                    <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(eventiOggi[0].addr))}
                      style={{ padding: "6px 10px", borderRadius: 8, background: T.blueLt, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      🗝º Naviga
                    </div>
                  )}
                </div>
              )}
              {/* GRIGLIA MENSILE A RIQUADRI */}
              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 12 }}>
                {/* Intestazione giorni */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.bdr}` }}>
                  {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.sub, padding: "7px 4px", textAlign: "center", borderRight: i < 6 ? `1px solid ${T.bdr}` : "none" }}>{d}</div>
                  ))}
                </div>
                {/* Celle mese */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {monthDays.map((d, i) => {
                    const inMonth = d.getMonth() === selDate.getMonth();
                    const sel = isSameDay(d, selDate);
                    const tod = isToday2(d);
                    const evs = eventsOn(d);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isExp = expandedDay === dateStr(d);
                    const col = Math.floor(i % 7);
                    return (
                      <div key={i}
                        onClick={() => { setSelDate(new Date(d)); setExpandedDay(isExp ? null : dateStr(d)); }}
                        onDoubleClick={() => { setSelDate(new Date(d)); setNewEvent(prev => ({...prev, date: dateStr(d)})); setShowNewEvent(true); }}
                        style={{
                        minHeight: 72, padding: "5px 6px",
                        borderRight: col < 6 ? `1px solid ${T.bdr}` : "none",
                        borderBottom: `1px solid ${T.bdr}`,
                        background: sel ? T.acc + "18" : isExp ? T.accLt : isWeekend && inMonth ? T.bg : T.card,
                        cursor: "pointer", position: "relative",
                        outline: sel ? `2px solid ${T.acc}` : isExp ? `1.5px solid ${T.acc}50` : "none",
                        outlineOffset: -1,
                      }}>
                        {/* Numero giorno */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: "50%", fontSize: 12, fontWeight: sel || tod ? 800 : 400,
                          background: tod ? T.acc : "transparent",
                          color: tod ? "#fff" : !inMonth ? T.sub2 : sel ? T.acc : T.text,
                          marginBottom: 3,
                        }}>{d.getDate()}</div>
                        {/* Eventi (max 3 visibili) */}
                        {evs.slice(0, 3).map((ev, ei) => (
                          <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setSelDate(new Date(d)); }} style={{
                            display: "flex", alignItems: "center", gap: 3, marginBottom: 1,
                            padding: "1px 4px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                            background: (ev.color || tipoEvColor(ev.tipo)) + "20",
                            borderLeft: `2px solid ${ev.color || tipoEvColor(ev.tipo)}`,
                            overflow: "hidden", whiteSpace: "nowrap",
                          }}>
                            <span style={{ color: ev.color || tipoEvColor(ev.tipo), overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {ev.time ? ev.time.slice(0,5) + " " : ""}{ev.text}
                            </span>
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div style={{ fontSize: 9, color: T.sub, fontWeight: 600 }}>+{evs.length - 3} altri</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Sezione prossimi eventi */}
              {prossimiEventi.length > 0 && (
                <div style={{ ...S.card, marginBottom: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Prossimi eventi</div>
                  {prossimiEventi.map((ev, i) => {
                    const evDate = new Date(ev.date + "T12:00:00");
                    const isEvToday = ev.date === todayStr;
                    const isEvTomorrow = ev.date === dateStr(new Date(Date.now() + 86400000));
                    const labelData = isEvToday ? "Oggi" : isEvTomorrow ? "Domani" : evDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={ev.id} onClick={() => { setSelDate(evDate); setSelectedEvent(ev); }}
                        style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < prossimiEventi.length-1 ? `1px solid ${T.bdr}` : "none", cursor: "pointer", alignItems: "center" }}>
                        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: ev.color || tipoEvColor(ev.tipo), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.text}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                            {ev.cm && <span style={S.badge(T.accLt, T.acc)}>{ev.cm}</span>}
                            {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>👤 {ev.persona}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isEvToday ? T.acc : T.sub }}>{labelData}</div>
                          {ev.time && <div style={{ fontSize: 11, color: T.sub }}>{ev.time}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pannello evento selezionato (click su evento nella griglia) */}
              {selectedEvent && isSameDay(new Date(selectedEvent.date), selDate) && (
                <div style={{ ...S.card, padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${selectedEvent.color || T.acc}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{selectedEvent.text}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {selectedEvent.time && <span style={S.badge(T.bg, T.sub)}>🕐 {selectedEvent.time}</span>}
                        {selectedEvent.cm && <span style={S.badge(T.accLt, T.acc)}>{selectedEvent.cm}</span>}
                        {selectedEvent.persona && <span style={S.badge(T.purpleLt, T.purple)}>👤 {selectedEvent.persona}</span>}
                        {selectedEvent.addr && <span style={S.badge(T.grnLt, T.grn)}>📍 {selectedEvent.addr}</span>}
                      </div>
                    </div>
                    <div onClick={() => setSelectedEvent(null)} style={{ padding: 4, cursor: "pointer", color: T.sub, fontSize: 16 }}>×</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {selectedEvent.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(selectedEvent.addr))} style={{ flex:1, padding:"6px", borderRadius:6, background:T.blueLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.blue }}>🗝º Mappa</div>}
                    <div onClick={() => {
                      const ev = selectedEvent;
                      const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                      const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                      const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                      const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                      setMailBody(tpl);
                      setShowMailModal({ ev, cm: cmObj });
                    }} style={{ flex:1, padding:"6px", borderRadius:6, background:T.accLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.acc }}>✉️ Mail</div>
                    <div onClick={() => deleteEvent(selectedEvent.id)} style={{ flex:1, padding:"6px", borderRadius:6, background:T.redLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.red }}>🗝‘ Elimina</div>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: T.sub, fontSize: 12, background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}` }}>Nessun evento. Tocca + per aggiungere.</div>
              ) : dayEvents.map(renderEventCard)}
            </>
          )}

          {/* === VISTA SETTIMANA === */}
          {agendaView === "settimana" && (
            <>
              <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                {weekDays.map((d, i) => {
                  const sel = isSameDay(d, selDate);
                  const tod = isToday2(d);
                  const n = eventsOn(d).length;
                  return (
                    <div key={i} onClick={() => setSelDate(new Date(d))} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 10, background: sel ? T.acc : tod ? T.accLt : T.card, border: `1px solid ${sel ? T.acc : T.bdr}`, cursor: "pointer" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: sel ? "#fff" : T.sub, textTransform: "uppercase" }}>
                        {["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"][i]}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? "#fff" : T.text, marginTop: 2 }}>{d.getDate()}</div>
                      {n > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel ? "#fff" : T.red, margin: "2px auto 0" }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: T.sub, fontSize: 12, background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}` }}>Nessun evento</div>
              ) : dayEvents.map(renderEventCard)}
            </>
          )}

          {/* === VISTA GIORNO === */}
          {agendaView === "giorno" && (
            <>
              {/* Timeline ore — scrollabile con dito */}
              <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflowY: "auto", overflowX: "hidden", marginBottom: 12, maxHeight: "60vh" } as any}>
                {Array.from({ length: 15 }, (_, i) => i + 6).map(h => {
                  const hour = `${String(h).padStart(2, "0")}:00`;
                  const hourEvents = dayEvents.filter(e => e.time && e.time.startsWith(String(h).padStart(2, "0")));
                  return (
                    <div key={h} style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, minHeight: 48 }}>
                      <div style={{ width: 48, padding: "4px 6px", fontSize: 10, color: T.sub, fontFamily: FM, fontWeight: 600, borderRight: `1px solid ${T.bdr}`, flexShrink: 0 }}>{hour}</div>
                      <div style={{ flex: 1, padding: "4px 8px" }}>
                        {hourEvents.map(ev => (
                          <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "6px 10px", marginBottom: 2, borderRadius: 6, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer", transition: "all 0.15s" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{ev.text} {ev.persona && <span style={{ fontWeight: 400, color: T.sub }}>· {ev.persona}</span>}</div>
                            {ev.addr && <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{ev.addr}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Unscheduled */}
              {dayEvents.filter(e => !e.time).length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: T.sub }}>Senza orario</div>
                  {dayEvents.filter(e => !e.time).map(ev => (<div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>{ev.persona && <div style={{ fontSize: 11, color: T.sub }}>{ev.persona} {ev.addr ? "· " + ev.addr : ""}</div>}</div>))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

// =======================================================
// MASTRO ERP v2 — PARTE 4/5
// Righe 3595-4130: Agenda (Giorno/Settimana/Mese), Chat AI, Settings
// =======================================================
  /* == CHAT / AI TAB == */
  const renderMessaggi = () => {
    const chIco = { email: "📧", whatsapp: "💬", sms: "📱", telegram: "✈️" };
    const chCol = { email: T.blue, whatsapp: "#25d366", sms: T.orange, telegram: "#0088cc" };
    const chBg = { email: T.blueLt, whatsapp: "#25d36618", sms: T.orangeLt, telegram: "#0088cc18" };
    const filteredMsgs = msgs.filter(m => {
      const matchFilter = msgFilter === "tutti" || m.canale === msgFilter;
      const matchSearch = !msgSearch.trim() || m.from.toLowerCase().includes(msgSearch.toLowerCase()) || m.preview.toLowerCase().includes(msgSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
    const unread = msgs.filter(m => !m.read).length;

    const filteredContatti = [...contatti, ...team.map(t => ({ id: "t" + t.id, nome: t.nome, tipo: "team", ruolo: t.ruolo, tel: "", email: "", preferito: true, canali: ["whatsapp", "email"], cm: "", colore: t.colore }))].filter(c => {
      const matchF = rubricaFilter === "tutti" || (rubricaFilter === "preferiti" && c.preferito) || (rubricaFilter === "team" && c.tipo === "team") || (rubricaFilter === "clienti" && c.tipo === "cliente") || (rubricaFilter === "fornitori" && (c.tipo === "fornitore" || c.tipo === "professionista"));
      const matchS = !rubricaSearch.trim() || c.nome.toLowerCase().includes(rubricaSearch.toLowerCase());
      return matchF && matchS;
    }).sort((a, b) => (b.preferito ? 1 : 0) - (a.preferito ? 1 : 0) || a.nome.localeCompare(b.nome));

    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Messaggi</div>
            <div style={S.headerSub}>{unread > 0 ? `${unread} non letti` : "Tutti letti"} · {msgs.length} conversazioni</div>
          </div>
          <div onClick={() => setShowCompose(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Ico d={ICO.pen} s={16} c="#fff" />
          </div>
        </div>

        {/* Sub-tabs: Chat / Rubrica / AI */}
        <div style={{ display: "flex", margin: "8px 16px", borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
          {[
            { id: "chat", l: "💬 Chat", count: unread },
            { id: "ai", l: "🤖 AI Inbox", count: aiInbox.filter(m => !m.read).length },
            { id: "rubrica", l: "📒 Rubrica", count: 0 }
          ].map(st => (
            <div key={st.id} onClick={() => setMsgSubTab(st.id)} style={{ flex: 1, padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: msgSubTab === st.id ? T.acc : T.card, color: msgSubTab === st.id ? "#fff" : T.sub, transition: "all 0.2s", position: "relative" }}>
              {st.l}
              {st.count > 0 && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 8, background: msgSubTab === st.id ? "rgba(255,255,255,0.3)" : T.red, color: "#fff" }}>{st.count}</span>}
            </div>
          ))}
        </div>

        {/* == CHAT TAB == */}
        {msgSubTab === "chat" && (<>
          <div style={{ padding: "4px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <Ico d={ICO.search} s={14} c={T.sub} />
              <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca contatto o messaggio..." value={msgSearch} onChange={e => setMsgSearch(e.target.value)} />
              {msgSearch && <div onClick={() => setMsgSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "0 16px 10px", overflowX: "auto" }}>
            {[
              { id: "tutti", l: "Tutti", c: T.acc },
              { id: "whatsapp", l: "💬 WhatsApp", c: "#25d366" },
              { id: "email", l: "📧 Email", c: T.blue },
              { id: "sms", l: "📱 SMS", c: T.orange },
              { id: "telegram", l: "✈️ Telegram", c: "#0088cc" },
            ].map(f => {
              const unr = f.id === "tutti" ? unread : msgs.filter(m => m.canale === f.id && !m.read).length;
              return (
                <div key={f.id} onClick={() => setMsgFilter(f.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${msgFilter === f.id ? f.c : T.bdr}`, background: msgFilter === f.id ? f.c + "15" : T.card, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: msgFilter === f.id ? f.c : T.sub, display: "flex", alignItems: "center", gap: 4 }}>
                  {f.l}
                  {unr > 0 && <span style={{ width: 16, height: 16, borderRadius: "50%", background: f.c, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unr}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "0 16px" }}>
            {filteredMsgs.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.sub, fontSize: 13 }}>Nessun messaggio</div>
            ) : (
              <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
                {filteredMsgs.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", background: m.read ? "transparent" : T.acc + "06" }} onClick={() => { setMsgs(ms => ms.map(x => x.id === m.id ? { ...x, read: true } : x)); setSelectedMsg(m); }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: chBg[m.canale] || T.bg, border: `2px solid ${chCol[m.canale] || T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, position: "relative" }}>
                      {m.from.charAt(0).toUpperCase()}
                      <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: 10, background: T.card, borderRadius: "50%", padding: 1 }}>{chIco[m.canale]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: m.read ? 500 : 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</div>
                        <div style={{ fontSize: 10, color: m.read ? T.sub : T.acc, fontWeight: m.read ? 400 : 700, flexShrink: 0, marginLeft: 8 }}>{m.time}</div>
                      </div>
                      <div style={{ fontSize: 12, color: m.read ? T.sub : T.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: m.read ? 400 : 500 }}>{m.preview}</div>
                      {m.cm && <div style={{ marginTop: 3 }}><span style={S.badge(T.accLt, T.acc)}>{m.cm}</span></div>}
                    </div>
                    {!m.read && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.acc, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}

        {/* == AI INBOX TAB == */}
        {msgSubTab === "ai" && (<>
          {/* Header spiegazione */}
          <div style={{ margin: "0 16px 10px", padding: "10px 12px", borderRadius: 10, background: "linear-gradient(135deg, #1A1A1C, #2A2008)", border: `1px solid ${T.acc}30`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>AI classifica le tue email</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>Collegata al tuo indirizzo mail — suggerisce dove archiviare ogni messaggio</div>
            </div>
          </div>

          {/* Lista email classificate */}
          <div style={{ padding: "0 16px" }}>
            {aiInbox.map(m => {
              const isSelected = selectedAiMsg?.id === m.id;
              return (
                <div key={m.id} style={{ ...S.card, marginBottom: 8, padding: 0, overflow: "hidden", opacity: m.archiviata ? 0.5 : 1 }}>
                  {/* Header messaggio */}
                  <div onClick={() => setSelectedAiMsg(isSelected ? null : m)}
                    style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: m.read ? T.card : T.acc + "06" }}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.ai.color + "20", border: `2px solid ${m.ai.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: m.ai.color, flexShrink: 0 }}>
                      {m.from.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: m.read ? 500 : 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.from}</div>
                        <div style={{ fontSize: 10, color: T.sub, flexShrink: 0 }}>{m.time}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: m.read ? 400 : 600, color: T.text, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                      {/* Badge AI */}
                      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: m.ai.color + "18", color: m.ai.color, border: `1px solid ${m.ai.color}30` }}>
                          {m.ai.emoji} {m.ai.label}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: T.sub }}>
                          🤖 {m.ai.confidenza}% sicuro
                        </span>
                        {m.ai.cmSuggerita && <span style={{ ...S.badge(T.accLt, T.acc) }}>{m.ai.cmSuggerita}</span>}
                        {m.archiviata && <span style={{ fontSize: 9, fontWeight: 700, color: T.grn }}>✓ Archiviata</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: T.sub, transform: isSelected ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }}>›</span>
                  </div>

                  {/* Dettaglio espanso */}
                  {isSelected && (
                    <div style={{ borderTop: `1px solid ${T.bdr}`, padding: "12px 13px" }}>
                      {/* Testo email */}
                      <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, marginBottom: 10, padding: "8px 10px", background: T.bg, borderRadius: 8 }}>
                        {m.body}
                      </div>

                      {/* Analisi AI */}
                      <div style={{ background: m.ai.color + "10", border: `1px solid ${m.ai.color}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: m.ai.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>🤖 Analisi AI</div>
                        <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><strong>Tipo:</strong> {m.ai.emoji} {m.ai.label} ({m.ai.confidenza}% confidenza)</div>
                        <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><strong>Azione suggerita:</strong> {m.ai.azione}</div>
                        {m.ai.note && <div style={{ fontSize: 11, color: T.sub, fontStyle: "italic" }}>"{m.ai.note}"</div>}
                      </div>

                      {/* Dati estratti (se nuova commessa) */}
                      {m.ai.estratto && (
                        <div style={{ background: T.grnLt, border: `1px solid ${T.grn}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.grn, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>📋 Dati estratti automaticamente</div>
                          {m.ai.estratto.cliente && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}>👤 <strong>Cliente:</strong> {m.ai.estratto.cliente}</div>}
                          {m.ai.estratto.indirizzo && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}>📍 <strong>Indirizzo:</strong> {m.ai.estratto.indirizzo}</div>}
                          {m.ai.estratto.email && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}>✉️ <strong>Email:</strong> {m.ai.estratto.email}</div>}
                          {m.ai.estratto.note && <div style={{ fontSize: 12, color: T.text }}>📝 <strong>Note:</strong> {m.ai.estratto.note}</div>}
                        </div>
                      )}

                      {/* Azioni */}
                      {!m.archiviata && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <div onClick={() => {
                            setAiInbox(ai => ai.map(x => x.id === m.id ? { ...x, archiviata: true, read: true } : x));
                            setSelectedAiMsg(null);
                            if (m.ai.cmSuggerita) {
                              const cm = cantieri.find(c => c.code === m.ai.cmSuggerita);
                              if (cm) { setSelectedCM(cm); setTab("commesse"); }
                            }
                          }} style={{ flex: 2, padding: "10px", borderRadius: 9, background: m.ai.color, color: "#fff", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            {m.ai.cmNuova ? "➕ Crea Commessa" : `🔗 ${m.ai.azione.split(" ").slice(0,3).join(" · ")}`}
                          </div>
                          <div onClick={() => {
                            setAiInbox(ai => ai.map(x => x.id === m.id ? { ...x, archiviata: true, read: true } : x));
                            setSelectedAiMsg(null);
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: T.bg, border: `1px solid ${T.bdr}`, color: T.sub, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            Ignora
                          </div>
                          <div onClick={() => {
                            const dest = m.email || "";
                            const tpl = `Gentile ${m.from.split(" ")[0]},

Grazie per il suo messaggio.

`;
                            setMailBody(tpl);
                            setShowMailModal({ ev: { text: m.subject, date: new Date().toISOString().slice(0,10), time: "", addr: "" }, cm: null, emailOverride: dest });
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: T.accLt, border: `1px solid ${T.acc}30`, color: T.acc, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            ✉️
                          </div>
                        </div>
                      )}
                      {m.archiviata && (
                        <div style={{ padding: "8px 12px", background: T.grnLt, borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, color: T.grn }}>
                          ✓ Archiviata con successo
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>)}

        {/* == RUBRICA TAB == */}
        {msgSubTab === "rubrica" && (<>
          <div style={{ padding: "4px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <Ico d={ICO.search} s={14} c={T.sub} />
              <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca nella rubrica..." value={rubricaSearch} onChange={e => setRubricaSearch(e.target.value)} />
              {rubricaSearch && <div onClick={() => setRubricaSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "0 16px 10px", overflowX: "auto" }}>
            {[
              { id: "tutti", l: "Tutti", c: T.acc },
              { id: "preferiti", l: "⭐ Preferiti", c: "#ff9500" },
              { id: "team", l: "👥 Team", c: "#34c759" },
              { id: "clienti", l: "🏠 Clienti", c: T.blue },
              { id: "fornitori", l: "🏭 Fornitori", c: "#af52de" },
            ].map(f => (
              <div key={f.id} onClick={() => setRubricaFilter(f.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${rubricaFilter === f.id ? f.c : T.bdr}`, background: rubricaFilter === f.id ? f.c + "15" : T.card, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: rubricaFilter === f.id ? f.c : T.sub }}>
                {f.l}
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {filteredContatti.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: T.sub, fontSize: 13 }}>Nessun contatto trovato</div>
              ) : filteredContatti.map(c => {
                const tipoColor = c.tipo === "team" ? "#34c759" : c.tipo === "cliente" ? T.blue : c.tipo === "fornitore" ? "#af52de" : "#ff9500";
                const tipoLabel = c.tipo === "team" ? "Team" : c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista";
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.bg}` }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: (c.colore || tipoColor) + "18", border: `2px solid ${c.colore || tipoColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: c.colore || tipoColor, flexShrink: 0, position: "relative" }}>
                      {c.nome.split(" ").map(w => w[0]).join("").substring(0, 2)}
                      {c.preferito && <div style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>⭐</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.nome}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={S.badge(tipoColor + "18", tipoColor)}>{tipoLabel}</span>
                        {c.ruolo && <span style={{ fontSize: 10, color: T.sub }}>{c.ruolo}</span>}
                        {c.cm && <span style={S.badge(T.accLt, T.acc)}>{c.cm}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(c.canali || []).includes("whatsapp") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale: "whatsapp", to: c.nome })); setShowCompose(true); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#25d36618", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>💬</div>
                      )}
                      {(c.canali || []).includes("email") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale: "email", to: c.nome })); setShowCompose(true); }} style={{ width: 32, height: 32, borderRadius: "50%", background: T.blueLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>📧</div>
                      )}
                      <div onClick={() => { setContatti(cs => cs.map(x => x.id === c.id ? { ...x, preferito: !x.preferito } : x)); }} style={{ width: 32, height: 32, borderRadius: "50%", background: c.preferito ? "#ff950018" : T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>
                        {c.preferito ? "⭐" : "☆"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>)}

      </div>
    );
  };

  /* == SETTINGS TAB == */
  const renderSettings = () => (
    <div style={{ paddingBottom: 80 }}>
      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <div style={S.headerTitle}>Impostazioni</div>
        </div>
        {/* FIX: rimosso supabase.auth.signOut() — usa localStorage clear */}
        <div onClick={async () => { try { localStorage.clear(); const { createClient } = await import("@/lib/supabase"); await createClient().auth.signOut(); } catch(e) {} window.location.href = "/login"; }}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #e5e5ea",background:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",color:"#86868b"}}>
          Esci
        </div>
      </div>

      {/* Settings sub-tabs — scrollable */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "8px 16px 12px", borderRadius: 8, border: `1px solid ${T.bdr}` }}>
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {[{ id: "azienda", l: "🏢 Azienda" }, { id: "generali", l: "⚙️ Generali" }, { id: "team", l: "👥 Team" }, { id: "sistemi", l: "🏗 Sistemi" }, { id: "colori", l: "🎨 Colori" }, { id: "vetri", l: "🪟 Vetri" }, { id: "tipologie", l: "📐 Tipologie" }, { id: "coprifili", l: "📏 Coprifili" }, { id: "lamiere", l: "🔩 Lamiere" }, { id: "persiana", l: "🏠 Persiana" }, { id: "salita", l: "🪜 Salita" }, { id: "pipeline", l: "📊 Pipeline" }, { id: "guida", l: "📖 Guida" }].map(t => (
            <div key={t.id} onClick={() => setSettingsTab(t.id)} style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, fontWeight: 600, background: settingsTab === t.id ? T.acc : T.card, color: settingsTab === t.id ? "#fff" : T.sub, cursor: "pointer", whiteSpace: "nowrap" }}>
              {t.l}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* === AZIENDA === */}
        {settingsTab === "azienda" && (
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`}}>
            <div style={{padding:"12px 14px",background:T.acc,color:"#fff"}}>
              <div style={{fontSize:13,fontWeight:800}}>Dati Azienda</div>
              <div style={{fontSize:10,opacity:0.8,marginTop:2}}>Questi dati appaiono sul PDF del preventivo</div>
            </div>
            {/* LOGO */}
            <div style={{padding:"14px",borderBottom:`1px solid ${T.bdr}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Logo Azienda</div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{display:"none"}} onChange={e=>{
                const f=e.target.files?.[0]; if(!f) return;
                const r=new FileReader(); r.onload=ev=>setAziendaInfo(a=>({...a,logo:ev.target.result}));
                r.readAsDataURL(f); e.target.value="";
              }}/>
              {aziendaInfo.logo ? (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:80,height:60,border:`1px solid ${T.bdr}`,borderRadius:8,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9f9f9"}}>
                    <img src={aziendaInfo.logo} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} alt="logo"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:4}}>Logo caricato ✓</div>
                    <div style={{display:"flex",gap:6}}>
                      <div onClick={()=>logoInputRef.current?.click()} style={{fontSize:11,color:T.acc,fontWeight:700,cursor:"pointer"}}>Cambia</div>
                      <span style={{color:T.bdr}}>·</span>
                      <div onClick={()=>setAziendaInfo(a=>({...a,logo:null}))} style={{fontSize:11,color:"#ff3b30",fontWeight:700,cursor:"pointer"}}>Rimuovi</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={()=>logoInputRef.current?.click()} style={{border:`2px dashed ${T.bdr}`,borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                  <div style={{fontSize:24,marginBottom:4}}>🖼</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>Carica logo</div>
                  <div style={{fontSize:10,color:T.sub,marginTop:2}}>PNG, JPG, SVG · max 2MB</div>
                </div>
              )}
            </div>
            {[
              {label:"Ragione Sociale",field:"ragione",placeholder:"Es. Walter Cozza Serramenti SRL"},
              {label:"Partita IVA",field:"piva",placeholder:"Es. 01234567890"},
              {label:"Indirizzo",field:"indirizzo",placeholder:"Es. Via Roma 1, 87100 Cosenza (CS)"},
              {label:"Telefono",field:"telefono",placeholder:"Es. +39 0984 000000"},
              {label:"Email",field:"email",placeholder:"Es. info@azienda.it"},
              {label:"Sito web",field:"website",placeholder:"Es. www.azienda.it"},
              {label:"IBAN",field:"iban",placeholder:"Es. IT60 X054 2811 1010 0000 0123 456"},
              {label:"CCIAA / REA",field:"cciaa",placeholder:"Es. CS-123456"},
            ].map(({label,field,placeholder})=>(
              <div key={field} style={{padding:"10px 14px",borderBottom:`1px solid ${T.bdr}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                <input
                  value={aziendaInfo[field]||""}
                  onChange={e=>setAziendaInfo(a=>({...a,[field]:e.target.value}))}
                  placeholder={placeholder}
                  style={{width:"100%",border:"none",fontSize:13,fontWeight:600,color:T.text,background:"transparent",fontFamily:FF,outline:"none",padding:0,boxSizing:"border-box"}}
                />
              </div>
            ))}
            <div style={{padding:"12px 14px",background:"#f0fdf4",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>✅</span>
              <span style={{fontSize:11,color:"#1a9e40",fontWeight:600}}>Salvato automaticamente in ogni preventivo PDF</span>
            </div>
          </div>
        )}

        {/* === GENERALI === */}
        {settingsTab === "generali" && (
          <>
            <div style={{...S.card,marginBottom:8}}><div style={S.cardInner}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>🔔 Soglia commesse ferme</div>
                  <div style={{fontSize:11,color:T.sub}}>Alert se una commessa non avanza da N giorni</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" min="1" max="30" value={sogliaDays} onChange={e=>setSogliaDays(parseInt(e.target.value)||5)}
                    style={{width:50,padding:"5px 8px",borderRadius:8,border:`1px solid ${T.bdr}`,fontSize:14,fontWeight:700,textAlign:"center",fontFamily:FF}}/>
                  <span style={{fontSize:11,color:T.sub}}>giorni</span>
                </div>
              </div>
            </div></div>
            <div style={S.card}><div style={S.cardInner}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {aziendaInfo.logo
                  ? <img src={aziendaInfo.logo} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:`1px solid ${T.bdr}`}} alt="logo"/>
                  : <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>FC</div>
                }
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Fabio Cozza</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{aziendaInfo.ragione}</div>
                </div>
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>TEMA</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["chiaro", "☀️"], ["scuro", "🌙"], ["oceano", "🌊"]].map(([id, ico]) => (
                  <div key={id} onClick={() => setTheme(id)} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: `1.5px solid ${theme === id ? T.acc : T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 18 }}>{ico}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>{id}</div>
                  </div>
                ))}
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>STATISTICHE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.acc }}>{cantieri.length}</div>Commesse</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{countVani()}</div>Vani</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.grn }}>{tasks.filter(t => t.done).length}/{tasks.length}</div>Task</div>
              </div>
            </div></div>
          </>
        )}

        {/* === TEAM === */}
        {settingsTab === "team" && (
          <>
            {team.map(m => (
              <div key={m.id} style={{ ...S.card, marginBottom: 8 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.colore, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.nome.split(" ").map(n => n[0]).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{m.ruolo} — {m.compiti}</div>
                </div>
                <Ico d={ICO.pen} s={14} c={T.sub} />
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("membro"); setSettingsForm({ nome: "", ruolo: "Posatore", compiti: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.bdr}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi membro</div>
          </>
        )}

        {/* === SISTEMI E SOTTOSISTEMI === */}
        {settingsTab === "sistemi" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura marche, sistemi e sottosistemi con colori collegati</div>
            {sistemiDB.map(s => (
              <div key={s.id} style={{ ...S.card, marginBottom: 8 }}><div style={S.cardInner}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>{s.marca}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.sistema}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.grn, fontFamily: FM }}>€{s.euroMq}/mq</div>
                    <div style={{ fontSize: 9, color: T.sub }}>+{s.sovRAL}% RAL · +{s.sovLegno}% Legno</div>
                  </div>
                </div>
                {s.sottosistemi && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Sottosistemi</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {s.sottosistemi.map(ss => <span key={ss} style={S.badge(T.blueLt, T.blue)}>{ss}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Colori disponibili</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.colori.map(c => {
                    const col = coloriDB.find(x => x.code === c);
                    return <span key={c} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: col?.hex + "20", color: T.text, border: `1px solid ${col?.hex || T.bdr}40` }}>{col?.hex && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: col.hex, marginRight: 4, verticalAlign: "middle" }} />}{c}</span>;
                  })}
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("sistema"); setSettingsForm({ marca: "", sistema: "", euroMq: "", sovRAL: "", sovLegno: "", sottosistemi: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi sistema</div>
          </>
        )}

        {/* === COLORI === */}
        {settingsTab === "colori" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Colori disponibili — collegati ai sistemi</div>
            {coloriDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: `1px solid ${T.bdr}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{c.code} · {c.tipo}</div>
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>{sistemiDB.filter(s => s.colori.includes(c.code)).map(s => s.marca).join(", ") || "—"}</div>
                <div onClick={() => deleteSettingsItem("colore", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("colore"); setSettingsForm({ nome: "", code: "", hex: "#888888", tipo: "RAL" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi colore</div>
          </>
        )}

        {/* === VETRI === */}
        {settingsTab === "vetri" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie vetro disponibili per i vani</div>
            {vetriDB.map(g => (
              <div key={g.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{g.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub, fontFamily: FM }}>{g.code}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: g.ug <= 0.7 ? T.grnLt : g.ug <= 1.0 ? T.orangeLt : T.redLt, fontSize: 12, fontWeight: 700, fontFamily: FM, color: g.ug <= 0.7 ? T.grn : g.ug <= 1.0 ? T.orange : T.red }}>Ug={g.ug}</span>
                  <div onClick={() => deleteSettingsItem("vetro", g.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("vetro"); setSettingsForm({ nome: "", code: "", ug: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi vetro</div>
          </>
        )}

        {/* === TIPOLOGIE === */}
        {settingsTab === "tipologie" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie serramento — trascina ⭐ per i preferiti</div>
            {TIPOLOGIE_RAPIDE.map(t => {
              const isFav = favTipologie.includes(t.code);
              return (
                <div key={t.code} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                  <div onClick={() => setFavTipologie(fav => isFav ? fav.filter(f => f !== t.code) : [...fav, t.code])} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: 16, color: isFav ? "#ff9500" : T.bdr }}>{isFav ? "⭐" : "☆"}</span>
                  </div>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM }}>{t.code}</span>
                    <span style={{ fontSize: 11, color: T.sub, marginLeft: 6 }}>{t.label}</span>
                  </div>
                  <Ico d={ICO.pen} s={14} c={T.sub} />
                </div></div>
              );
            })}
            <div onClick={() => { setSettingsModal("tipologia"); setSettingsForm({ code: "", label: "", icon: "🪟" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipologia</div>
          </>
        )}

        {/* === COPRIFILI === */}
        {settingsTab === "coprifili" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista coprifili disponibili nella creazione vano</div>
            {coprifiliDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.acc }}>{c.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{c.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("coprifilo", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("coprifilo"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi coprifilo</div>
          </>
        )}

        {/* === LAMIERE === */}
        {settingsTab === "lamiere" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista lamiere e scossaline</div>
            {lamiereDB.map(l => (
              <div key={l.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.orange }}>{l.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{l.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("lamiera", l.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("lamiera"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi lamiera</div>
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "persiana" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le persiane</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>🔧 Tipologia Telaio</div>
            {telaiPersianaDB.map(tp => (
              <div key={tp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tp.code}</span>
                <div onClick={() => setTelaiPersianaDB(prev => prev.filter(x => x.id !== tp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuova tipologia telaio (es. Z 35):");}catch(e){} if (n?.trim()) setTelaiPersianaDB(prev => [...prev, { id: "tp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi telaio</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>📐 4° Lato / Posizionamento</div>
            {posPersianaDB.map(pp => (
              <div key={pp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{pp.code}</span>
                <div onClick={() => setPosPersianaDB(prev => prev.filter(x => x.id !== pp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo posizionamento (es. A muro):");}catch(e){} if (n?.trim()) setPosPersianaDB(prev => [...prev, { id: "pp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi posizionamento</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 16, marginBottom: 8 }}>📏 Tipo Misura</div>
            {tipoMisuraDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura (es. Luce netta):");}catch(e){} if (n?.trim()) setTipoMisuraDB(prev => [...prev, { id: "tm" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "salita" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura i mezzi di salita disponibili</div>
            {mezziSalita.map((m, i) => (
              <div key={i} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🪜</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
                </div>
                <div onClick={() => { if ((()=>{try{return window.confirm(`Eliminare "${m}"?`);}catch(e){return false;}})()) setMezziSalita(ms => ms.filter((_, j) => j !== i)); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nome mezzo di salita:");}catch(e){} if (n?.trim()) setMezziSalita(ms => [...ms, n.trim()]); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi mezzo salita</div>
          </>
        )}

        {/* === PIPELINE === */}
        {settingsTab === "pipeline" && (
          <>
            <div style={{fontSize:12,color:T.sub,padding:"0 4px 10px",lineHeight:1.5}}>Personalizza il flusso di lavoro. Disattiva le fasi che non usi, rinominale o riordinale.</div>
            {pipelineDB.map((p, i) => (
              <div key={p.id} style={{...S.card, marginBottom:6, opacity: p.attiva===false ? 0.45 : 1}}>
                <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px"}}>
                  <div style={{display:"flex",flexDirection:"column",gap:1}}>
                    <div onClick={()=>{ if(i===0) return; const a=[...pipelineDB]; [a[i-1],a[i]]=[a[i],a[i-1]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===0?"default":"pointer",color:i===0?T.bdr:T.sub,lineHeight:1}}>▲</div>
                    <div onClick={()=>{ if(i===pipelineDB.length-1) return; const a=[...pipelineDB]; [a[i],a[i+1]]=[a[i+1],a[i]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===pipelineDB.length-1?"default":"pointer",color:i===pipelineDB.length-1?T.bdr:T.sub,lineHeight:1}}>▼</div>
                  </div>
                  <span style={{fontSize:20,flexShrink:0}}>{p.ico}</span>
                  <input value={p.nome} onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,nome:e.target.value}:x))}
                    style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0}}/>
                  <div style={{width:12,height:12,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                  <div onClick={()=>{ if(p.id==="chiusura") return; setPipelineDB(db=>db.map((x,j)=>j===i?{...x,attiva:x.attiva===false?true:false}:x)); }}
                    style={{width:36,height:20,borderRadius:10,background:p.attiva===false?T.bdr:T.grn,cursor:p.id==="chiusura"?"default":"pointer",transition:"background 0.2s",position:"relative",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:p.attiva===false?2:18,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                  </div>
                  {p.custom && <div onClick={()=>setPipelineDB(db=>db.filter((_,j)=>j!==i))} style={{fontSize:12,cursor:"pointer",color:T.red}}>✕</div>}
                </div>
              </div>
            ))}
            <div onClick={()=>{ let nome; try{nome=window.prompt("Nome nuova fase:");}catch(e){} if(nome?.trim()) setPipelineDB(db=>[...db.slice(0,-1),{id:"custom_"+Date.now(),nome:nome.trim(),ico:"⭐",color:"#8e8e93",attiva:true,custom:true},...db.slice(-1)]); }}
              style={{...S.card,marginTop:4,textAlign:"center",padding:"10px",cursor:"pointer",color:T.acc,fontSize:13,fontWeight:700}}>+ Aggiungi fase personalizzata</div>
            <div onClick={()=>{if((()=>{try{return window.confirm("Ripristinare le fasi predefinite?");}catch(e){return false;}})())setPipelineDB(PIPELINE_DEFAULT);}}
              style={{textAlign:"center",padding:"10px 0 4px",fontSize:11,color:T.sub,cursor:"pointer"}}>Ripristina predefinita</div>
          </>
        )}

        {/* === GUIDA === */}
        {settingsTab === "guida" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Header */}
            <div style={{background:T.acc,borderRadius:12,padding:"16px 18px",color:"#fff"}}>
              <div style={{fontSize:15,fontWeight:800}}>📖 Guida rapida MASTRO</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Tutto quello che ti serve sapere, in pillole da 30 secondi.</div>
            </div>

            {/* CARD 1: CREARE COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#007aff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📁</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come creare una commessa</div><div style={{fontSize:10,color:T.sub}}>⏱ 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Commesse</b> dal menu in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>+ Nuova Commessa</b> in alto</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila <b>nome cliente, indirizzo</b> e tipo di lavoro</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✓</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>La commessa parte in fase "Sopralluogo"</div>
                </div>
              </div>
            </div>

            {/* CARD 2: AGGIUNGERE VANI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🪟</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come aggiungere i vani</div><div style={{fontSize:10,color:T.sub}}>⏱ 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa e vai nella sezione <b>Rilievi</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Aggiungi vano</b> — scegli tipo (F1A, PF2A, SC2A...)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dai un nome al vano (es. "Cucina", "Salone") e scegli la stanza</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>💡 <b>Tipologie rapide:</b> F1A = 1 anta, F2A = 2 ante, PF = portafinestra, SC = scorrevole, VAS = vasistas</div>
              </div>
            </div>

            {/* CARD 3: INSERIRE MISURE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#5856d615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📏</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come inserire le misure</div><div style={{fontSize:10,color:T.sub}}>⏱ 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca un vano per aprirlo — vai nel tab <b>Misure</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci <b>3 larghezze</b> (alto, centro, basso) e <b>3 altezze</b> (sx, centro, dx)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Completa <b>spallette</b>, <b>davanzale</b>, telaio e accessori</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>💡 <b>Regola d'oro:</b> misura sempre dal CENTRO del vano — è il punto più affidabile per il taglio</div>
              </div>
            </div>

            {/* CARD 4: GENERARE PREVENTIVO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#34c75915",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📄</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come generare un preventivo PDF</div><div style={{fontSize:10,color:T.sub}}>⏱ 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa con almeno un vano misurato</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>€ Preventivo</b> nella barra azioni</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Controlla il riepilogo — fai <b>firmare il cliente</b> sul telefono</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>4</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>Genera & Scarica PDF</b> — pronto per inviare via WhatsApp!</div>
                </div>
              </div>
            </div>

            {/* CARD 5: FASI COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🔄</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Le 8 fasi di una commessa</div><div style={{fontSize:10,color:T.sub}}>⏱ 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {f:"Sopralluogo",i:"📐",d:"Vai dal cliente, valuta il lavoro",c:"#007aff"},
                  {f:"Preventivo",i:"📝",d:"Prepara e invia l'offerta",c:"#ff9500"},
                  {f:"Conferma",i:"✍️",d:"Il cliente accetta e firma",c:"#af52de"},
                  {f:"Misure",i:"📏",d:"Rilievo preciso di ogni vano",c:"#5856d6"},
                  {f:"Ordini",i:"🛒",d:"Ordina profili, vetri e accessori",c:"#ff2d55"},
                  {f:"Produzione",i:"🏭",d:"Attendi che il materiale sia pronto",c:"#ff9500"},
                  {f:"Posa",i:"🔧",d:"Installa tutto dal cliente",c:"#34c759"},
                  {f:"Chiusura",i:"✅",d:"Saldo finale e garanzia",c:"#30b0c7"},
                ].map((p,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<7?6:0}}>
                    <div style={{fontSize:14,width:22,textAlign:"center"}}>{p.i}</div>
                    <div style={{fontSize:12,fontWeight:700,color:p.c,width:85}}>{p.f}</div>
                    <div style={{fontSize:11,color:T.sub}}>{p.d}</div>
                    {i<7 && <div style={{marginLeft:"auto",fontSize:10,color:T.sub}}>→</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 6: SCORCIATOIE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff2d5515",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Trucchi da Pro</div><div style={{fontSize:10,color:T.sub}}>⏱ 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {t:"Barra di ricerca",d:"Cerca qualsiasi cosa: clienti, commesse, indirizzi — tutto da Home"},
                  {t:"Allerte rosse",d:"Le commesse ferme da troppo tempo appaiono in Home — toccale per aprirle"},
                  {t:"Drag & drop fasi",d:"In Commesse, tieni premuto su una card per spostarla tra le fasi"},
                  {t:"Foto e firma",d:"Puoi fotografare il vano e far firmare il cliente direttamente sul telefono"},
                  {t:"SVG in tempo reale",d:"Mentre inserisci le misure, il disegno del vano si aggiorna live"},
                ].map((tip,i) => (
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<4?8:0,alignItems:"flex-start"}}>
                    <div style={{fontSize:10,color:T.acc,fontWeight:900,marginTop:2}}>▸</div>
                    <div><span style={{fontSize:12,fontWeight:700,color:T.text}}>{tip.t}: </span><span style={{fontSize:11,color:T.sub}}>{tip.d}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIVEDI TUTORIAL */}
            <div onClick={() => { try{localStorage.removeItem("mastro:onboarded")}catch(e){} setTutoStep(1); }} style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),padding:"14px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
              <div style={{fontSize:18}}>🔄</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Rivedi il tutorial iniziale</div>
                <div style={{fontSize:11,color:T.sub}}>Riavvia la guida di benvenuto</div>
              </div>
              <div style={{marginLeft:"auto",fontSize:14,color:T.sub}}>→</div>
            </div>

            <div style={{height:20}}/>
          </div>
        )}

      </div>
    </div>
  );

// =======================================================
// MASTRO ERP v2 — PARTE 5/5
// Righe 4131-5248: Modals (Task, Commessa, Vano, Allegati, Firma, AI Photo),
//                 Main Render finale
// =======================================================
  /* ======= MODALS ======= */
  const renderModal = () => {
    if (!showModal) return null;
    return (
      <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(null)}>
        <div style={S.modalInner}>
          {/* TASK MODAL */}
          {/* === MODAL MANDA MAIL === */}
          {showMailModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
              onClick={e => e.target === e.currentTarget && setShowMailModal(null)}>
              <div style={{ background:T.bg, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", paddingBottom:24 }}>
                {/* Header */}
                <div style={{ padding:"16px 16px 10px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:T.bg, zIndex:1, borderBottom:`1px solid ${T.bdr}` }}>
                  <span style={{ fontSize:22 }}>✉️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>Manda Mail</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {showMailModal.cm ? `${showMailModal.cm.cliente} ${showMailModal.cm.cognome||""}`.trim() : showMailModal.ev.persona || "Cliente"}
                      {showMailModal.cm?.email ? ` · ${showMailModal.cm.email}` : ""}
                    </div>
                  </div>
                  <div onClick={() => setShowMailModal(null)} style={{ width:30, height:30, borderRadius:"50%", background:T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:T.sub }}>×</div>
                </div>

                <div style={{ padding:"14px 16px" }}>
                  {/* Info evento */}
                  <div style={{ background:T.accLt, borderRadius:10, padding:"10px 12px", marginBottom:12, borderLeft:`3px solid ${T.acc}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.acc, marginBottom:2 }}>{showMailModal.ev.text}</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"short", day:"numeric", month:"short" })}
                      {showMailModal.ev.time ? " · " + showMailModal.ev.time : ""}
                      {showMailModal.ev.addr ? " · 📍 " + showMailModal.ev.addr : ""}
                    </div>
                  </div>

                  {/* Campo email destinatario */}
                  {!showMailModal.cm?.email && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Email destinatario</div>
                      <input
                        type="email" placeholder="cliente@email.com"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.card, fontSize:13, color:T.text, fontFamily:"inherit", boxSizing:"border-box" as any }}
                        onChange={e => {
                          const v = e.target.value;
                          setShowMailModal(prev => prev ? { ...prev, emailOverride: v } : prev);
                        }}
                      />
                    </div>
                  )}

                  {/* Testo mail modificabile */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Testo della mail</div>
                    <textarea
                      value={mailBody}
                      onChange={e => setMailBody(e.target.value)}
                      rows={10}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.card, fontSize:12, color:T.text, fontFamily:"inherit", resize:"vertical" as any, boxSizing:"border-box" as any, lineHeight:1.6 }}
                    />
                  </div>

                  {/* Template rapidi */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Template rapidi</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[
                        { lbl:"📅 Conferma", tpl: `Gentile Cliente,

Le confermo l'appuntamento del ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}.

📍 ${showMailModal.ev.addr || "Luogo da concordare"}

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"⏰ Reminder", tpl: `Gentile Cliente,

Le ricordiamo che domani, ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}, è previsto il nostro appuntamento.

📍 ${showMailModal.ev.addr || "Luogo da concordare"}

In caso di impedimento la preghiamo di avvertirci il prima possibile.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"✅ Preventivo pronto", tpl: `Gentile Cliente,

Siamo lieti di comunicarle che il preventivo relativo alla fornitura e posa è pronto.

Può contattarci per concordare un incontro o richiedere il documento via mail.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"🔧 Posa confermata", tpl: `Gentile Cliente,

Confermiamo la data di posa in opera per il ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " a partire dalle " + showMailModal.ev.time : ""}.

La preghiamo di assicurarsi che i locali siano accessibili.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                      ].map(({ lbl, tpl }) => (
                        <div key={lbl} onClick={() => setMailBody(tpl)}
                          style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${T.bdr}`, background:T.card, fontSize:11, fontWeight:600, color:T.text, cursor:"pointer" }}>
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottoni azione */}
                  <div style={{ display:"flex", gap:8 }}>
                    <div
                      onClick={() => {
                        const dest = (showMailModal as any).emailOverride || showMailModal.cm?.email || "";
                        const sogg = encodeURIComponent(`Appuntamento - ${showMailModal.ev.text}`);
                        const corpo = encodeURIComponent(mailBody);
                        window.open(`mailto:${dest}?subject=${sogg}&body=${corpo}`);
                      }}
                      style={{ flex:1, padding:"12px", borderRadius:10, background:T.acc, color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      ✉️ Apri in Mail
                    </div>
                    <div
                      onClick={() => {
                        navigator.clipboard?.writeText(mailBody);
                        alert("Testo copiato negli appunti!");
                      }}
                      style={{ padding:"12px 14px", borderRadius:10, background:T.bg, border:`1px solid ${T.bdr}`, color:T.sub, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      📋 Copia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showModal === "task" && (
            <>
              <div style={S.modalTitle}>Nuovo task</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Cosa devi fare?</label>
                <input style={S.input} placeholder="es. Sopralluogo, chiamare fornitore..." value={newTask.text} onChange={e => setNewTask(t => ({ ...t, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Data</label>
                  <input style={S.input} type="date" value={newTask.date} onChange={e => setNewTask(t => ({ ...t, date: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Ora (opz.)</label>
                  <input style={S.input} type="time" value={newTask.time} onChange={e => setNewTask(t => ({ ...t, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "alta", l: "Urgente", c: T.red }, { id: "media", l: "Normale", c: T.orange }, { id: "bassa", l: "Bassa", c: T.sub }].map(p => (
                    <div key={p.id} onClick={() => setNewTask(t => ({ ...t, priority: p.id }))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${newTask.priority === p.id ? p.c : T.bdr}`, background: newTask.priority === p.id ? p.c + "18" : "transparent", color: p.c, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa (opzionale)</label>
                <select style={S.select} value={newTask.cm} onChange={e => setNewTask(t => ({ ...t, cm: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona (opzionale)</label>
                <select style={S.select} value={newTask.persona} onChange={e => setNewTask(t => ({ ...t, persona: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {[...contatti.filter(ct => ct.tipo === "cliente"), ...team].map(m => <option key={m.id} value={m.nome}>{m.nome}{(m as any).ruolo ? " — " + (m as any).ruolo : ""}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Note (opzionale)</label>
                <input style={S.input} placeholder="Dettagli, materiale da portare..." value={newTask.meta} onChange={e => setNewTask(t => ({ ...t, meta: e.target.value }))} />
              </div>
              {/* Task Allegati */}
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Allegati</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { ico: "📎", l: "File", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "file", nome: "Allegato_" + (a.length + 1) }]) },
                    { ico: "📝", l: "Nota", act: () => { let txt; try{txt=window.prompt("Nota:");}catch(e){} if (txt) setTaskAllegati(a => [...a, { id: Date.now(), tipo: "nota", nome: txt }]); }},
                    { ico: "🎤", l: "Audio", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "vocale", nome: "Audio " + (a.length + 1) }]) },
                    { ico: "📷", l: "Foto", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "foto", nome: "Foto " + (a.length + 1) }]) },
                  ].map((b, i) => (
                    <div key={i} onClick={b.act} style={{ flex: 1, padding: "8px 4px", background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 16 }}>{b.ico}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.sub, marginTop: 1 }}>{b.l}</div>
                    </div>
                  ))}
                </div>
                {taskAllegati.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {taskAllegati.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10 }}>
                        <span>{a.tipo === "nota" ? "📝" : a.tipo === "vocale" ? "🎤" : a.tipo === "foto" ? "📷" : "📎"}</span>
                        <span style={{ color: T.text, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                        <span onClick={() => setTaskAllegati(al => al.filter(x => x.id !== a.id))} style={{ cursor: "pointer", color: T.red }}>✕</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={S.btn} onClick={addTask}>Crea task</button>
              <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
            </>
          )}

          {/* COMMESSA MODAL */}
          {showModal === "contatto" && (
            <div style={{ padding: "20px 0" }}>
              <div style={S.modalTitle}>Nuovo cliente</div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Nome *</label>
                <input style={S.input} placeholder="Nome" value={(newCM as any)._ctNome || ""} onChange={e => setNewCM(p => ({ ...p, _ctNome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Cognome</label>
                <input style={S.input} placeholder="Cognome" value={(newCM as any)._ctCognome || ""} onChange={e => setNewCM(p => ({ ...p, _ctCognome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Telefono</label>
                <input style={S.input} type="tel" placeholder="333 1234567" value={(newCM as any)._ctTel || ""} onChange={e => setNewCM(p => ({ ...p, _ctTel: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Email</label>
                <input style={S.input} type="email" placeholder="nome@email.it" value={(newCM as any)._ctEmail || ""} onChange={e => setNewCM(p => ({ ...p, _ctEmail: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Indirizzo</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza" value={(newCM as any)._ctAddr || ""} onChange={e => setNewCM(p => ({ ...p, _ctAddr: e.target.value } as any))} /></div>
              <div onClick={() => {
                const nome = ((newCM as any)._ctNome || "").trim();
                if (!nome) return;
                setContatti(prev => [...prev, { id: "CT-" + Date.now(), nome, cognome: (newCM as any)._ctCognome || "", tipo: "cliente", telefono: (newCM as any)._ctTel || "", email: (newCM as any)._ctEmail || "", indirizzo: (newCM as any)._ctAddr || "", preferito: false }]);
                setNewCM({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova" });
                setShowModal(null);
              }} style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${T.acc}, #b86e06)`, color: "#fff", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Salva cliente ✓
              </div>
            </div>
          )}

          {showModal === "commessa" && (
            <>
              <div style={S.modalTitle}>Nuova commessa</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[{ id: "nuova", l: "🆕 Nuova installazione", c: T.acc }, { id: "riparazione", l: "🔧 Riparazione", c: T.orange }].map(t => (
                  <div key={t.id} onClick={() => { setNewCM(c => ({ ...c, tipo: t.id })); setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media"); }}
                    style={{ flex: 1, padding: "12px 6px", borderRadius: 12, border: `2px solid ${newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.bdr}`, background: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange)+"12" : T.card, textAlign: "center", cursor: "pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.sub }}>{t.l}</div>
                  </div>
                ))}
              </div>

              {/* == FLUSSO RIPARAZIONE == */}
              {newCM.tipo === "riparazione" && (() => {
                const addRipFoto = (e) => {
                  const file = e.target.files?.[0]; if(!file) return;
                  const r = new FileReader();
                  r.onload = ev => setRipFotos(fs => [...fs, { id: Date.now(), dataUrl: ev.target.result, nome: file.name }]);
                  r.readAsDataURL(file); e.target.value = "";
                };
                const cmResults = ripSearch.length > 1
                  ? cantieri.filter(c => c.cliente.toLowerCase().includes(ripSearch.toLowerCase()) || c.code.toLowerCase().includes(ripSearch.toLowerCase()) || c.indirizzo.toLowerCase().includes(ripSearch.toLowerCase()))
                  : [];
                const addRiparazione = () => {
                  if (!ripProblema.trim()) return;
                  const code = "CM-" + String(cantieri.length + 1).padStart(4, "0");
                  const nuova = {
                    id: Date.now(), code,
                    cliente: ripCMSel ? ripCMSel.cliente : (newCM.cliente || ripSearch),
                    indirizzo: newCM.indirizzo || ripCMSel?.indirizzo || "",
                    telefono: newCM.telefono || ripCMSel?.telefono || "",
                    sistema: ripCMSel?.sistema || "",
                    tipo: "riparazione", fase: "sopralluogo",
                    cmCollegata: ripCMSel?.code || null,
                    problema: ripProblema,
                    tipoProblema: newCM.tipoProblema || "",
                    tipoInfisso: newCM.tipoInfisso || "",
                    vanoProblema: newCM.vanoProblema || "",
                    dataRichiesta: newCM.dataRichiesta || "",
                    chiSegnala: newCM.chiSegnala || "",
                    preventivoStimato: newCM.preventivoStimato || "",
                    urgenza: ripUrgenza,
                    fotoProblema: ripFotos,
                    vani: ripCMSel?.vani || [], note: ripProblema,
                    alert: ripUrgenza === "urgente" ? "⚠️ Riparazione urgente" : null,
                    creato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    aggiornato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    allegati: [],
                  };
                  setCantieri(cs => [nuova, ...cs]);
                  setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media");
                  setNewCM(c => ({...c, tipo:"nuova", cliente:"", indirizzo:"", telefono:"", tipoProblema:"", tipoInfisso:"", vanoProblema:"", dataRichiesta:"", chiSegnala:"", preventivoStimato:""}));
                  setShowModal(null);
                  setSelectedCM(nuova); setTab("commesse");
                };
                return (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                    <div>
                      <label style={S.fieldLabel}>Cliente o commessa esistente</label>
                      <input style={S.input} placeholder="Cerca nome, codice CM, indirizzo…"
                        value={ripSearch} onChange={e => { setRipSearch(e.target.value); if(ripCMSel) setRipCMSel(null); }}/>
                      {cmResults.length > 0 && !ripCMSel && (
                        <div style={{ marginTop:4, background:T.card, border:`1px solid ${T.bdr}`, borderRadius:10, overflow:"hidden" }}>
                          {cmResults.slice(0,4).map(c => (
                            <div key={c.id} onClick={() => { setRipCMSel(c); setRipSearch(c.cliente); setNewCM(x=>({...x,indirizzo:c.indirizzo,telefono:c.telefono})); }}
                              style={{ padding:"10px 14px", borderBottom:`1px solid ${T.bg}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.cliente}</div>
                                <div style={{ fontSize:11, color:T.sub, marginTop:1 }}>{c.code} · {c.indirizzo}</div>
                                {getVaniAttivi(c).length>0 && <div style={{ fontSize:10, color:T.sub }}>{getVaniAttivi(c).length} vani</div>}
                              </div>
                              <div style={{ fontSize:10, fontWeight:600, color:T.acc }}>Collega →</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {ripCMSel && (
                        <div style={{ marginTop:6, padding:"8px 12px", background:T.accLt, border:`1px solid ${T.acc}30`, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.acc }}>✓ Collegata a {ripCMSel.code}</div>
                            <div style={{ fontSize:11, color:T.sub, marginTop:1 }}>{ripCMSel.cliente} · {ripCMSel.indirizzo}</div>
                          </div>
                          <div onClick={() => { setRipCMSel(null); setRipSearch(""); setNewCM(x=>({...x,indirizzo:"",telefono:""})); }} style={{ fontSize:14, color:T.sub, cursor:"pointer", padding:4 }}>✕</div>
                        </div>
                      )}
                      {!ripCMSel && (
                        <div style={{ fontSize:10, color:T.sub, marginTop:3 }}>Lascia vuoto per cliente nuovo</div>
                      )}
                    </div>

                    {!ripCMSel && (
                      <div style={{ padding:"12px", background:T.bg, borderRadius:10, border:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.06em" }}>Dati cliente nuovo</div>
                        <input style={S.input} placeholder="Nome e cognome" value={newCM.cliente} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))}/>
                        <div style={{ display:"flex", gap:8 }}>
                          <input style={{...S.input,flex:2}} placeholder="Indirizzo" value={newCM.indirizzo} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))}/>
                          <input style={{...S.input,flex:1}} placeholder="Telefono" value={newCM.telefono} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))}/>
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={S.fieldLabel}>Urgenza</label>
                      <div style={{ display:"flex", gap:6 }}>
                        {[{id:"normale",l:"Normale",c:T.grn,e:"🟢"},{id:"media",l:"Media",c:T.orange,e:"🟡"},{id:"urgente",l:"Urgente",c:T.red,e:"🔴"}].map(u => (
                          <div key={u.id} onClick={() => setRipUrgenza(u.id)}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${ripUrgenza===u.id?u.c:T.bdr}`, background:ripUrgenza===u.id?u.c+"15":T.card, textAlign:"center", cursor:"pointer", transition:"all 0.12s" }}>
                            <div style={{ fontSize:14 }}>{u.e}</div>
                            <div style={{ fontSize:10, fontWeight:700, color:ripUrgenza===u.id?u.c:T.sub, marginTop:2 }}>{u.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Tipo problema</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Vetro rotto","Cardine","Guarnizione","Serratura","Maniglia","Tapparella","Infiltrazioni","Deformazione","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,tipoProblema:c.tipoProblema===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.tipoProblema===t?T.orange:T.bdr}`, background:newCM.tipoProblema===t?T.orangeLt:T.card, fontSize:11, fontWeight:600, color:newCM.tipoProblema===t?T.orange:T.sub, cursor:"pointer", transition:"all 0.12s" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Tipo infisso</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Finestra","Porta","Portafinestra","Scorrevole","Tapparella","Persiana","Zanzariera","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,tipoInfisso:c.tipoInfisso===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.tipoInfisso===t?T.acc:T.bdr}`, background:newCM.tipoInfisso===t?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.tipoInfisso===t?T.acc:T.sub, cursor:"pointer", transition:"all 0.12s" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {ripCMSel && ripCMSel.vani.length > 0 && (
                      <div>
                        <label style={S.fieldLabel}>Vano con il problema</label>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {ripCMSel.vani.map(v => (
                            <div key={v.id} onClick={() => setNewCM(c=>({...c,vanoProblema:c.vanoProblema===v.nome?"":v.nome}))}
                              style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.vanoProblema===v.nome?T.acc:T.bdr}`, background:newCM.vanoProblema===v.nome?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.vanoProblema===v.nome?T.acc:T.sub, cursor:"pointer" }}>
                              {v.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={S.fieldLabel}>Descrizione problema *</label>
                      <textarea style={{ ...S.input, minHeight:70, resize:"vertical" }}
                        placeholder="Descrivi il problema in dettaglio…"
                        value={ripProblema} onChange={e => setRipProblema(e.target.value)}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Chi segnala</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Cliente","Posatore","Tecnico","Subappaltatore","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,chiSegnala:c.chiSegnala===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.chiSegnala===t?T.acc:T.bdr}`, background:newCM.chiSegnala===t?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.chiSegnala===t?T.acc:T.sub, cursor:"pointer" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Data richiesta intervento</label>
                      <input type="date" style={S.input} value={newCM.dataRichiesta} onChange={e=>setNewCM(c=>({...c,dataRichiesta:e.target.value}))}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Preventivo stimato (€)</label>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="es. 250" value={newCM.preventivoStimato} onChange={e=>setNewCM(c=>({...c,preventivoStimato:e.target.value}))}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Foto del problema ({ripFotos.length})</label>
                      {ripFotos.length === 0
                        ? <div onClick={() => ripFotoRef.current?.click()}
                            style={{ border:`1.5px dashed ${T.bdr}`, borderRadius:10, padding:"20px", textAlign:"center", cursor:"pointer" }}>
                            <div style={{ fontSize:28, marginBottom:4 }}>📷</div>
                            <div style={{ fontSize:12, color:T.sub }}>Scatta o allega una foto</div>
                            <div style={{ fontSize:10, color:T.sub2||T.sub, marginTop:2 }}>Puoi aggiungerne quante vuoi</div>
                          </div>
                        : <div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                              {ripFotos.map((f,i) => (
                                <div key={f.id} style={{ position:"relative", width:76, height:76, borderRadius:10, overflow:"hidden", background:T.bg }}>
                                  <img src={f.dataUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={`Foto ${i+1}`}/>
                                  <div onClick={() => setRipFotos(fs => fs.filter(x => x.id !== f.id))}
                                    style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontWeight:700 }}>✕</div>
                                  <div style={{ position:"absolute", bottom:2, left:4, fontSize:9, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.7)" }}>#{i+1}</div>
                                </div>
                              ))}
                              {/* FIX: usa ref invece di getElementById */}
                              <div onClick={() => ripFotoRef.current?.click()}
                                style={{ width:76, height:76, borderRadius:10, border:`1.5px dashed ${T.bdr}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.sub }}>
                                <div style={{ fontSize:22 }}>+</div>
                                <div style={{ fontSize:9, fontWeight:600 }}>Aggiungi</div>
                              </div>
                            </div>
                          </div>
                      }
                      <input ref={ripFotoRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={addRipFoto}/>
                    </div>

                    <div style={{ paddingTop:4 }}>
                      {!ripProblema.trim() && (
                        <div style={{ fontSize:11, color:T.orange, fontWeight:600, marginBottom:8, textAlign:"center" }}>⚠️ Descrivi il problema per procedere</div>
                      )}
                      <button style={{ ...S.btn, background:ripProblema.trim()?T.orange:"#ccc", cursor:ripProblema.trim()?"pointer":"not-allowed" }}
                        onClick={addRiparazione} disabled={!ripProblema.trim()}>
                        🔧 Crea riparazione
                      </button>
                      <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
                    </div>

                  </div>
                );
              })()}

              {/* == FLUSSO NUOVA INSTALLAZIONE == */}
              {newCM.tipo === "nuova" && (() => {
                const AccordionSection = ({ id, icon, label, badge, children }) => {
                  const open = newCM._open === id;
                  return (
                    <div style={{ marginBottom:8, borderRadius:10, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
                      <div onClick={() => setNewCM(c=>({...c,_open:open?null:id}))}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", background:T.card, cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{icon}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{label}</span>
                          {badge && <span style={{ ...S.badge(T.accLt,T.acc), fontSize:10 }}>{badge}</span>}
                        </div>
                        <span style={{ fontSize:12, color:T.sub, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
                      </div>
                      {open && <div style={{ padding:"12px 14px", background:T.bg, borderTop:`1px solid ${T.bdr}` }}>{children}</div>}
                    </div>
                  );
                };

                const previewCode = "S-" + String(cantieri.length + 1).padStart(4,"0");

                return (
                  <>
                    <div style={{ marginBottom:14, padding:"8px 12px", background:T.bg, borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:T.sub }}>Numero commessa:</span>
                      <span style={{ fontSize:13, fontWeight:800, color:T.acc, fontFamily:FM }}>{previewCode}</span>
                      <span style={{ fontSize:10, color:T.sub }}>(assegnato automaticamente)</span>
                    </div>

                    <div style={{ marginBottom:14, padding:"14px", background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}` }}>
                      <div style={{ fontSize:10, fontWeight:800, color:T.sub, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>👤 Dati cliente *</div>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <input style={{...S.input,flex:1}} placeholder="Nome" value={newCM.cliente} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Cognome" value={newCM.cognome||""} onChange={e=>setNewCM(c=>({...c,cognome:e.target.value}))}/>
                      </div>
                      <input style={{...S.input,marginBottom:8}} placeholder="Indirizzo lavori (Via, CAP, Città)" value={newCM.indirizzo} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))}/>
                      <div style={{ display:"flex", gap:8 }}>
                        <input style={{...S.input,flex:1}} placeholder="Telefono" inputMode="tel" value={newCM.telefono} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Email" inputMode="email" value={newCM.email||""} onChange={e=>setNewCM(c=>({...c,email:e.target.value}))}/>
                      </div>
                    </div>

                    <AccordionSection id="accesso" icon="🏗" label="Accesso / Difficoltà salita"
                      badge={newCM.difficoltaSalita||null}>
                      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                        {[{id:"facile",l:"Facile",c:T.grn,e:"✅"},{id:"media",l:"Media",c:T.orange,e:"⚠️"},{id:"difficile",l:"Difficile",c:T.red,e:"🔴"}].map(d => (
                          <div key={d.id} onClick={()=>setNewCM(c=>({...c,difficoltaSalita:d.id}))}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${newCM.difficoltaSalita===d.id?d.c:T.bdr}`, background:newCM.difficoltaSalita===d.id?d.c+"15":T.card, textAlign:"center", cursor:"pointer" }}>
                            <div style={{ fontSize:14 }}>{d.e}</div>
                            <div style={{ fontSize:10, fontWeight:600, color:newCM.difficoltaSalita===d.id?d.c:T.sub }}>{d.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Piano edificio</div>
                          <select style={S.select} value={newCM.pianoEdificio} onChange={e=>setNewCM(c=>({...c,pianoEdificio:e.target.value}))}>
                            <option value="">— Seleziona —</option>
                            {["S2 — 2° Seminterrato","S1 — Seminterrato","PT — Piano Terra","P1 — 1° Piano","P2 — 2° Piano","P3 — 3° Piano","P4 — 4° Piano","P5 — 5° Piano","P6 — 6° Piano","P7 — 7° Piano","P8 — 8° Piano","P9 — 9° Piano","P10 — 10° Piano","P11 — 11° Piano","P12 — 12° Piano","P13 — 13° Piano","P14 — 14° Piano","P15 — 15° Piano","P16 — 16° Piano","P17 — 17° Piano","P18 — 18° Piano","P19 — 19° Piano","P20 — 20° Piano","M — Mansarda"].map(p=><option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Foro scale (cm)</div>
                          <input style={S.input} placeholder="es. 80×200" value={newCM.foroScale} onChange={e=>setNewCM(c=>({...c,foroScale:e.target.value}))}/>
                        </div>
                      </div>
                      <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Mezzo di salita</div>
                      <select style={S.select} value={newCM.mezzoSalita} onChange={e=>setNewCM(c=>({...c,mezzoSalita:e.target.value}))}>
                        <option value="">— Seleziona —</option>
                        {mezziSalita.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </AccordionSection>

                    <AccordionSection id="note" icon="📝" label="Note aggiuntive"
                      badge={newCM.note ? "✓" : null}>
                      <textarea style={{...S.input,minHeight:70,resize:"vertical"}}
                        placeholder="Note aggiuntive sulla commessa…"
                        defaultValue={newCM.note} onBlur={e=>setNewCM(c=>({...c,note:e.target.value}))}/>
                    </AccordionSection>

                    <div style={{ marginTop:6 }}>
                      {!newCM.cliente.trim() && (
                        <div style={{ fontSize:11, color:T.sub, textAlign:"center", marginBottom:8 }}>Inserisci almeno il nome per procedere</div>
                      )}
                      <button style={{ ...S.btn, background:newCM.cliente.trim()?T.acc:"#ccc", cursor:newCM.cliente.trim()?"pointer":"not-allowed" }}
                        onClick={addCommessa} disabled={!newCM.cliente.trim()}>
                        ✓ Crea commessa {previewCode}
                      </button>
                      <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    );
  };


  const generaPreventivoPDF = (c) => {
    const calcolaVanoPDF = (v) => {
      const m = v.misure||{};
      const lc=(m.lCentro||0)/1000, hc=(m.hCentro||0)/1000;
      const mq=lc*hc, perim=2*(lc+hc);
      const sysRec = sistemiDB.find(s=>(s.marca+" "+s.sistema)===v.sistema||s.sistema===v.sistema);
      let tot = mq * parseFloat(sysRec?.prezzoMq||sysRec?.euroMq||c.prezzoMq||350);
      const vetroRec = vetriDB.find(g=>g.code===v.vetro||g.nome===v.vetro);
      if(vetroRec?.prezzoMq) tot += mq * parseFloat(vetroRec.prezzoMq);
      const copRec = coprifiliDB.find(cp=>cp.cod===v.coprifilo);
      if(copRec?.prezzoMl) tot += perim * parseFloat(copRec.prezzoMl);
      const lamRec = lamiereDB.find(l=>l.cod===v.lamiera);
      if(lamRec?.prezzoMl) tot += lc * parseFloat(lamRec.prezzoMl);
      const tapp=v.accessori?.tapparella; if(tapp?.attivo&&c.prezzoTapparella){const tmq=((tapp.l||m.lCentro||0)/1000)*((tapp.h||m.hCentro||0)/1000);tot+=tmq*parseFloat(c.prezzoTapparella);}
      const pers=v.accessori?.persiana; if(pers?.attivo&&c.prezzoPersiana){const pmq=((pers.l||m.lCentro||0)/1000)*((pers.h||m.hCentro||0)/1000);tot+=pmq*parseFloat(c.prezzoPersiana);}
      const zanz=v.accessori?.zanzariera; if(zanz?.attivo&&c.prezzoZanzariera){const zmq=((zanz.l||m.lCentro||0)/1000)*((zanz.h||m.hCentro||0)/1000);tot+=zmq*parseFloat(c.prezzoZanzariera);}
      return { tot, mq };
    };
    const vaniPDF = getVaniAttivi(c); const totale = vaniPDF.reduce((s,v)=>s+calcolaVanoPDF(v).tot, 0);
    const sconto = parseFloat(c.sconto||0);
    const scontoVal = totale * sconto / 100;
    const imponibile = totale - scontoVal;
    const iva = imponibile * 0.10;
    const totIva = imponibile + iva;
    const oggi = new Date().toLocaleDateString("it-IT");
    const righeVani = vaniPDF.map((v, i) => {
      const { tot: sub, mq } = calcolaVanoPDF(v);
      const m = v.misure||{};
      return '<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">'+(i+1)+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;">'+(v.nome||"Vano "+(i+1))+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;">'+(v.tipo||"")+" — "+(v.stanza||"")+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;">'+(v.sistema||c.sistema||"")+'</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">'+(m.lCentro||0)+" × "+(m.hCentro||0)+' mm</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">'+mq.toFixed(2)+' mq</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">€ '+sub.toFixed(2)+'</td></tr>';
    }).join("");
    const scontoHtml = sconto>0 ? '<div class="row" style="color:#ff9500;"><span>Sconto '+sconto+'%</span><span>− € '+scontoVal.toFixed(2)+'</span></div><div class="row"><span>Imponibile netto</span><span>€ '+imponibile.toFixed(2)+'</span></div>' : '';
    const noteHtml = c.notePreventivo ? '<div style="border:1px solid #eee;border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:12px;color:#444;line-height:1.6;"><strong>Note:</strong> '+c.notePreventivo+'</div>' : '';
    const firmaHtml = c.firmaCliente ? '<img src="'+c.firmaCliente+'" style="max-height:60px;max-width:100%;display:block;margin:0 auto 4px;"/>' : '<div class="linea"></div>';
    const dataFirmaHtml = c.dataFirma ? ' — '+c.dataFirma : '';
    const html = '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"/><title>Preventivo '+c.code+'</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,Arial,sans-serif;color:#1a1a1c;font-size:13px;padding:40px;max-width:900px;margin:0 auto;}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #007aff;}.azienda{font-size:22px;font-weight:900;color:#007aff;}.doc-title{text-align:right;}.doc-title h1{font-size:28px;font-weight:900;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}thead{background:#007aff;color:white;}thead th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;}thead th:last-child,thead th:nth-last-child(-n+3){text-align:right;}.totali{max-width:340px;margin-left:auto;background:#f5f5f7;border-radius:10px;padding:16px 20px;margin-bottom:24px;}.totali .row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;}.totali .row.main{font-size:16px;font-weight:900;padding-top:10px;border-top:2px solid #1a1a1c;margin-top:4px;color:#007aff;}.cliente-box{background:#f5f5f7;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;gap:40px;}.cliente-box .label{font-size:10px;font-weight:700;color:#999;text-transform:uppercase;margin-bottom:4px;}.cliente-box .val{font-size:14px;font-weight:700;}.validita{background:#fff8ec;border:1px solid #ffb800;border-radius:8px;padding:10px 16px;font-size:11px;color:#7a5000;margin-bottom:20px;}.firma{display:flex;gap:40px;margin-top:40px;padding-top:20px;border-top:1px solid #eee;}.firma .box{flex:1;text-align:center;}.firma .linea{border-bottom:1px solid #999;margin-bottom:6px;height:50px;}.firma .label{font-size:10px;color:#666;text-transform:uppercase;}.footer{font-size:10px;color:#999;text-align:center;padding-top:20px;border-top:1px solid #eee;}@media print{body{padding:20px;}button{display:none!important;}}</style></head><body>'
      +(aziendaInfo.logo?'<div class="header" style="display:flex;justify-content:space-between;align-items:flex-start;"><div style="display:flex;align-items:center;gap:14px;"><img src="'+aziendaInfo.logo+'" style="height:56px;max-width:120px;object-fit:contain;" alt="logo"/><div>':'<div class="header"><div>')+'<div style="font-size:20px;font-weight:900;color:#007aff;">'+aziendaInfo.ragione+'</div>'+'<div style="font-size:11px;color:#666;">'+aziendaInfo.indirizzo+'</div>'+'<div style="font-size:11px;color:#666;">'+aziendaInfo.telefono+(aziendaInfo.email?' · '+aziendaInfo.email:'')+'</div>'+(aziendaInfo.piva?'<div style="font-size:10px;color:#999;">P.IVA '+aziendaInfo.piva+(aziendaInfo.cciaa?' · CCIAA '+aziendaInfo.cciaa:'')+'</div>':'')+(aziendaInfo.logo?'</div></div>':'</div>')+'<div style="text-align:right">'+'<h1 style="font-size:28px;font-weight:900;">PREVENTIVO</h1>'+'<div style="font-size:14px;color:#007aff;font-weight:700;">'+c.code+'</div>'+'<div style="font-size:11px;color:#666;">Data: '+oggi+'</div>'+'</div></div>'
      +'<div class="cliente-box"><div><div class="label">Cliente</div><div class="val">'+c.cliente+' '+(c.cognome||'')+'</div><div style="font-size:12px;color:#444;">'+(c.indirizzo||'')+'</div></div><div><div class="label">Contatto</div><div class="val">'+(c.telefono||'—')+'</div></div><div><div class="label">Vani</div><div class="val">'+vaniPDF.length+'</div></div></div>'
      +'<button onclick="window.print()" style="margin-bottom:16px;padding:10px 24px;background:#007aff;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨 Stampa / Salva PDF</button>'
      +'<table><thead><tr><th>#</th><th>Vano</th><th>Tipologia</th><th>Sistema</th><th>Misura</th><th>Mq</th><th>Importo</th></tr></thead><tbody>'+righeVani+'</tbody></table>'
      +'<div class="totali"><div class="row"><span>Totale imponibile</span><span>€ '+totale.toFixed(2)+'</span></div>'+scontoHtml+'<div class="row"><span>IVA 10%</span><span>€ '+iva.toFixed(2)+'</span></div><div class="row main"><span>TOTALE</span><span>€ '+totIva.toFixed(2)+'</span></div></div>'
      +noteHtml
      +'<div class="validita">⏰ Preventivo valido 30 giorni. Prezzi IVA 10% inclusa per lavori di ristrutturazione.</div>'
      +'<div class="firma"><div class="box"><div class="linea"></div><div class="label">Timbro e firma azienda</div></div><div class="box">'+firmaHtml+'<div class="label">Firma cliente per accettazione'+dataFirmaHtml+'</div></div></div>'
      +'<div class="footer">'+aziendaInfo.ragione+(aziendaInfo.piva?' · P.IVA '+aziendaInfo.piva:'')+(aziendaInfo.iban?'<br>IBAN: '+aziendaInfo.iban:'')+'</div></body></html>';
    const blob = new Blob([html], {type:"text/html"});
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };


  const renderFirmaModal = () => {
    if (!showFirmaModal) return null;
    const c = selectedCM;
    const clearFirma = () => { const cv=firmaRef.current; if(cv){const ctx=cv.getContext("2d");ctx.clearRect(0,0,cv.width,cv.height);} };
    const salvaFirma = () => {
      const cv=firmaRef.current; if(!cv)return;
      const dataUrl=cv.toDataURL("image/png");
      setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,firmaCliente:dataUrl,dataFirma:new Date().toLocaleDateString("it-IT")}:x));
      setSelectedCM(p=>({...p,firmaCliente:dataUrl,dataFirma:new Date().toLocaleDateString("it-IT")}));
      setShowFirmaModal(false);
    };
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:420,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>✍️</span>
            <div><div style={{fontSize:14,fontWeight:800}}>Firma del Cliente</div><div style={{fontSize:11,color:"#666"}}>{c?.code}</div></div>
            <div onClick={()=>setShowFirmaModal(false)} style={{marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:"#f5f5f7",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>✕</div>
          </div>
          <div style={{padding:"12px 16px 0"}}>
            <div style={{fontSize:11,color:"#666",marginBottom:8,textAlign:"center"}}>Firma nella casella qui sotto</div>
            <div style={{border:"2px solid #007aff",borderRadius:10,overflow:"hidden",background:"#fafafa",touchAction:"none"}}>
              <canvas ref={firmaRef} width={388} height={160} style={{width:"100%",height:160,display:"block",cursor:"crosshair"}}
                onPointerDown={e=>{firmaRef.current?.setPointerCapture(e.pointerId);setFirmaDrawing(true);const cv=firmaRef.current;const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const ctx=cv.getContext("2d");ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle="#1a1a1c";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.lineJoin="round";}}
                onPointerMove={e=>{if(!firmaDrawing)return;const cv=firmaRef.current;const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const ctx=cv.getContext("2d");ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}
                onPointerUp={()=>setFirmaDrawing(false)} onPointerLeave={()=>setFirmaDrawing(false)}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0 10px"}}>
              <div style={{fontSize:10,color:"#999"}}>📅 {new Date().toLocaleDateString("it-IT")}</div>
              <div onClick={clearFirma} style={{fontSize:11,color:"#ff3b30",cursor:"pointer",fontWeight:600}}>🗝‘ Cancella</div>
            </div>
          </div>
          <div style={{padding:"0 16px 16px",display:"flex",gap:8}}>
            <button onClick={()=>setShowFirmaModal(false)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid #eee",background:"#f5f5f7",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#666"}}>Annulla</button>
            <button onClick={salvaFirma} style={{flex:2,padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#34c759,#1a9e40)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>✅ Conferma firma</button>
          </div>
        </div>
      </div>
    );
  };


  const renderPreventivoModal = () => {
    if (!showPreventivoModal || !selectedCM) return null;
    const c = selectedCM;
    const updateCMp = (field, val) => { setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,[field]:val}:x)); setSelectedCM(p=>({...p,[field]:val})); };
    const calcolaVano = (v) => {
      const m=v.misure||{}; const lc=(m.lCentro||0)/1000,hc=(m.hCentro||0)/1000; const mq=lc*hc,perim=2*(lc+hc);
      const sysRec=sistemiDB.find(s=>(s.marca+" "+s.sistema)===v.sistema||s.sistema===v.sistema);
      let tot=mq*parseFloat(sysRec?.prezzoMq||sysRec?.euroMq||c.prezzoMq||350);
      const vetroRec=vetriDB.find(g=>g.code===v.vetro||g.nome===v.vetro); if(vetroRec?.prezzoMq) tot+=mq*parseFloat(vetroRec.prezzoMq);
      const copRec=coprifiliDB.find(cp=>cp.cod===v.coprifilo); if(copRec?.prezzoMl) tot+=perim*parseFloat(copRec.prezzoMl);
      const lamRec=lamiereDB.find(l=>l.cod===v.lamiera); if(lamRec?.prezzoMl) tot+=lc*parseFloat(lamRec.prezzoMl);
      const tapp=v.accessori?.tapparella; if(tapp?.attivo&&c.prezzoTapparella){const tmq=((tapp.l||m.lCentro||0)/1000)*((tapp.h||m.hCentro||0)/1000);tot+=tmq*parseFloat(c.prezzoTapparella);}
      const pers=v.accessori?.persiana; if(pers?.attivo&&c.prezzoPersiana){const pmq=((pers.l||m.lCentro||0)/1000)*((pers.h||m.hCentro||0)/1000);tot+=pmq*parseFloat(c.prezzoPersiana);}
      const zanz=v.accessori?.zanzariera; if(zanz?.attivo&&c.prezzoZanzariera){const zmq=((zanz.l||m.lCentro||0)/1000)*((zanz.h||m.hCentro||0)/1000);tot+=zmq*parseFloat(c.prezzoZanzariera);}
      return {tot,mq,sysRec,vetroRec,copRec,lamRec};
    };
    const vaniCalc=(c.vani||[]).map(v=>({...v,calc:calcolaVano(v)}));
    const totale=vaniCalc.reduce((s,v)=>s+v.calc.tot,0);
    const vaniSenzaSistema = vaniCalc.filter(v=>!v.calc.sysRec && !v.sistema);
    const vaniSenzaMisure = vaniCalc.filter(v=>!(v.misure?.lCentro) || !(v.misure?.hCentro));
    const hasWarnings = vaniSenzaSistema.length>0 || vaniSenzaMisure.length>0;
    const scontoVal=totale*parseFloat(c.sconto||0)/100;
    const imponibile=totale-scontoVal; const iva=imponibile*0.10; const totIva=imponibile+iva;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowPreventivoModal(false)}>
        <div style={{background:"#f5f5f7",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",paddingBottom:24}}>
          <div style={{padding:"16px 16px 10px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,background:"#f5f5f7",zIndex:1}}>
            <span style={{fontSize:20}}>📄</span>
            <div><div style={{fontSize:15,fontWeight:800}}>Preventivo</div><div style={{fontSize:11,color:"#666"}}>{c.code} — {c.cliente} {c.cognome||""}</div></div>
            <div onClick={()=>setShowPreventivoModal(false)} style={{marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:"#e5e5ea",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>✕</div>
          </div>
          <div style={{padding:"0 16px"}}>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",marginBottom:10}}>Parametri</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>SCONTO %</div><input type="number" value={c.sconto||0} onChange={e=>updateCMp("sconto",e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:15,fontWeight:700,textAlign:"right",boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>ACCONTO €</div><input type="number" value={c.accontoRicevuto||0} onChange={e=>updateCMp("accontoRicevuto",e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:15,fontWeight:700,textAlign:"right",boxSizing:"border-box"}}/></div>
              </div>
              <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>NOTE</div><textarea value={c.notePreventivo||""} onChange={e=>updateCMp("notePreventivo",e.target.value)} placeholder="Condizioni, garanzie..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:12,minHeight:50,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
            </div>
            {hasWarnings && (
              <div style={{background:"#fff8ec",borderRadius:12,padding:"12px 14px",marginBottom:10,border:"1.5px solid #ff9500"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:16}}>⚠️</span>
                  <span style={{fontSize:12,fontWeight:800,color:"#7a4500"}}>Preventivo incompleto</span>
                </div>
                {vaniSenzaSistema.length>0 && (
                  <div style={{fontSize:11,color:"#7a4500",marginBottom:4}}>
                    • {vaniSenzaSistema.length} vano/i senza sistema assegnato → prezzo €0
                    <div onClick={()=>{setShowPreventivoModal(false);setSelectedVano(vaniSenzaSistema[0]);setVanoStep(2);}} style={{display:"inline",marginLeft:8,color:"#007aff",fontWeight:700,cursor:"pointer"}}>Vai →</div>
                  </div>
                )}
                {vaniSenzaMisure.length>0 && (
                  <div style={{fontSize:11,color:"#7a4500"}}>
                    • {vaniSenzaMisure.length} vano/i senza misure → calcolo non accurato
                    <div onClick={()=>{setShowPreventivoModal(false);setSelectedVano(vaniSenzaMisure[0]);setVanoStep(1);}} style={{display:"inline",marginLeft:8,color:"#007aff",fontWeight:700,cursor:"pointer"}}>Vai →</div>
                  </div>
                )}
              </div>
            )}
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",marginBottom:8}}>Voci</div>
              {vaniCalc.length===0?<div style={{fontSize:12,color:"#999",textAlign:"center",padding:12}}>Nessun vano</div>:vaniCalc.map((v,i)=>(
                <div key={v.id} style={{padding:"8px 0",borderBottom:"1px solid #f5f5f7",background:v.calc.tot===0?"#fff5f5":"transparent",borderRadius:v.calc.tot===0?8:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{v.nome||"Vano "+(i+1)}{v.calc.tot===0&&<span style={{fontSize:9,background:"#ff3b30",color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:800}}>MANCA SISTEMA</span>}</div><div style={{fontSize:10,color:"#666"}}>{v.tipo} · {(v.misure?.lCentro||0)}×{(v.misure?.hCentro||0)}mm · {v.calc.mq.toFixed(2)} mq</div></div><div style={{fontSize:13,fontWeight:800,color:v.calc.tot===0?"#ff3b30":"#1a1a1c"}}>€ {v.calc.tot.toFixed(2)}</div></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:3}}>
                    {v.calc.sysRec&&<span style={{fontSize:9,background:"#007aff15",color:"#007aff",padding:"1px 5px",borderRadius:4}}>{v.calc.sysRec.sistema}</span>}
                    {v.calc.vetroRec&&<span style={{fontSize:9,background:"#34c75915",color:"#1a9e40",padding:"1px 5px",borderRadius:4}}>{v.calc.vetroRec.code}</span>}
                    {v.calc.copRec&&<span style={{fontSize:9,background:"#ff950015",color:"#7a4500",padding:"1px 5px",borderRadius:4}}>{v.calc.copRec.cod}</span>}
                    {v.calc.lamRec&&<span style={{fontSize:9,background:"#af52de15",color:"#7c2d9e",padding:"1px 5px",borderRadius:4}}>{v.calc.lamRec.cod}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              {parseFloat(c.sconto||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#ff9500",marginBottom:6}}><span>Sconto {c.sconto}%</span><span>− € {scontoVal.toFixed(2)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:6}}><span>Imponibile</span><span>€ {imponibile.toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:10}}><span>IVA 10%</span><span>€ {iva.toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:900,paddingTop:10,borderTop:"2px solid #1a1a1c"}}><span>TOTALE</span><span style={{color:"#007aff"}}>€ {totIva.toFixed(2)}</span></div>
              {parseFloat(c.accontoRicevuto||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#34c759",marginTop:8,fontWeight:700}}><span>Saldo da incassare</span><span>€ {(totIva-parseFloat(c.accontoRicevuto)).toFixed(2)}</span></div>}
            </div>
            {c.firmaCliente?(<div style={{background:"#f0fdf4",borderRadius:12,padding:14,border:"1.5px solid #34c759",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span>✅</span><span style={{fontSize:12,fontWeight:700,color:"#1a9e40"}}>Firmato {c.dataFirma}</span><div onClick={()=>{setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,firmaCliente:null,dataFirma:null}:x));setSelectedCM(p=>({...p,firmaCliente:null,dataFirma:null}));}} style={{marginLeft:"auto",fontSize:11,color:"#ff3b30",cursor:"pointer"}}>✕ Rimuovi</div></div><img src={c.firmaCliente} style={{width:"100%",maxHeight:70,objectFit:"contain",background:"#fff",borderRadius:8}} alt=""/></div>):(<button onClick={()=>{setShowPreventivoModal(false);setShowFirmaModal(true);}} style={{width:"100%",padding:13,borderRadius:12,border:"1.5px solid #34c759",background:"#f0fdf4",color:"#1a9e40",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✍️ Firma cliente sul telefono</button>)}
            {hasWarnings && (
              <div style={{fontSize:11,color:"#999",textAlign:"center",marginBottom:6}}>⚠️ Correggi i problemi per un preventivo accurato</div>
            )}
            <button onClick={()=>generaPreventivoPDF(c)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:hasWarnings?"linear-gradient(135deg,#8e8e93,#636366)":"linear-gradient(135deg,#007aff,#0055cc)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:hasWarnings?"none":"0 4px 12px rgba(0,122,255,0.3)"}}>
              {hasWarnings?"⚠️ Genera PDF (incompleto)":"📄 Genera & Scarica PDF"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* == AI PHOTO MODAL VARS == */
  const _aiVt = selectedVano?.tipo || "F1A";
  const _aiSizes: Record<string, [number, number]> = {
    "F1A": [700, 1200], "F2A": [1200, 1400], "F3A": [1800, 1400],
    "PF1A": [800, 2200], "PF2A": [1400, 2200], "PF3A": [2100, 2200],
    "VAS": [700, 500], "SOPR": [800, 400], "FIS": [600, 1000], "FISTONDO": [600, 600],
    "SC2A": [1600, 2200], "SC4A": [2800, 2200], "ALZSC": [3000, 2200],
    "BLI": [900, 2100], "TRIANG": [800, 800], "OBLICA": [700, 1200]
  };
  const [_aiStdW, _aiStdH] = _aiSizes[_aiVt] || [1100, 1300];
  const _aiEx = (selectedVano?.misure || {}) as any;
  const _aiBaseW = (_aiEx.lCentro ?? 0) > 0 ? (_aiEx.lCentro + Math.floor(Math.random() * 7 - 3)) : (_aiStdW + Math.floor(Math.random() * 11 - 5));
  const _aiBaseH = (_aiEx.hCentro ?? 0) > 0 ? (_aiEx.hCentro + Math.floor(Math.random() * 7 - 3)) : (_aiStdH + Math.floor(Math.random() * 11 - 5));
  const _aiTip = TIPOLOGIE_RAPIDE.find(t => t.code === _aiVt)?.label || _aiVt;


  /* ======= MAIN RENDER ======= */
  return (
    <>
      <link href={FONT} rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: ${T.bg}; }
        input, select, textarea, button { font-size: inherit; }
      `}</style>
      <div style={S.app}>
        {/* Content */}
        {tab === "home" && !selectedCM && !selectedMsg && renderHome()}
        {tab === "commesse" && renderCommesse()}
        {tab === "messaggi" && !selectedMsg && renderMessaggi()}
        {tab === "agenda" && renderAgenda()}
        {tab === "settings" && renderSettings()}

        {/* FAB — Quick Actions */}
        {/* FAB — Compose menu */}
        <style>{`
          @keyframes fabPulse { 0%,100% { box-shadow: 0 4px 20px rgba(0,122,255,0.4); } 50% { box-shadow: 0 4px 30px rgba(0,122,255,0.6); } }
        `}</style>
        {/* EVENT POPUP OVERLAY — Google Calendar style */}
        {selectedEvent && !selectedEvent._isTask && (tab === "agenda" || tab === "home") && (() => {
          const ev = selectedEvent;
          const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null;
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)" }} />
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", zIndex: 9999, background: T.bg, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <input defaultValue={ev.text} onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== ev.text) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, text: val } : x)); setSelectedEvent({ ...ev, text: val }); } }} style={{ fontSize: 18, fontWeight: 800, color: T.text, border: "none", background: "transparent", width: "100%", outline: "none", padding: 0, fontFamily: "inherit" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <input type="date" defaultValue={ev.date} onChange={(e) => { if (e.target.value) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, date: e.target.value } : x)); setSelectedEvent({ ...ev, date: e.target.value }); } }} style={{ fontSize: 13, color: T.sub, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                      <input type="time" defaultValue={ev.time || ""} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, time: e.target.value } : x)); setSelectedEvent({ ...ev, time: e.target.value }); }} style={{ fontSize: 13, color: T.sub, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                    </div>
                  </div>
                  <div onClick={() => setSelectedEvent(null)} style={{ cursor: "pointer", fontSize: 22, color: T.sub, padding: "0 4px" }}>{"✕"}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>{"👤"} {ev.persona}</span>}
                  {ev.addr && <span style={{ fontSize: 11, color: T.sub, background: T.blueLt, padding: "3px 8px", borderRadius: 6 }}>{"📍"} {ev.addr}</span>}
                  {ev.cm && <span style={S.badge(T.blueLt, T.blue)}>{"📁"} {ev.cm}</span>}
                  <select defaultValue={ev.tipo || "appuntamento"} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, tipo: e.target.value } : x)); setSelectedEvent({ ...ev, tipo: e.target.value }); }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: ev.tipo==="appuntamento"?T.blueLt:ev.tipo==="task"?T.accLt:T.redLt, color: ev.tipo==="appuntamento"?T.blue:ev.tipo==="task"?T.acc:T.red, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    <option value="appuntamento">appuntamento</option>
                    <option value="sopralluogo">sopralluogo</option>
                    <option value="consegna">consegna</option>
                    <option value="montaggio">montaggio</option>
                    <option value="intervento">intervento</option>
                    <option value="preventivo">preventivo</option>
                    <option value="task">task</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
                  {ev.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr))} style={{ padding: "12px 4px", borderRadius: 10, background: T.blueLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.blue }}>{"📍"} Mappa</div>}
                  <div onClick={() => { const tel = cmObj?.telefono || contatti.find(c => c.nome === ev.persona)?.telefono; if (tel) window.open("tel:" + tel); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.grnLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.grn }}>{"📞"} Chiama</div>
                  <div onClick={() => { const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente"); const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }); setMailBody(`Gentile ${cliente},\n\nLe confermo l'appuntamento:\n\n${dataFmt}${ev.time ? " alle " + ev.time : ""}\n${ev.addr || ""}\n\n${ev.text}\n\nCordiali saluti,\nFabio Cozza`); setShowMailModal({ ev, cm: cmObj }); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.accLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.acc }}>{"✉️"} Mail</div>
                  <div onClick={() => { deleteEvent(ev.id); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.redLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.red }}>{"🗑️"} Elimina</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#007aff" }}>{"📁"} Commessa</div>
                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#ff9500" }}>{"📏"} Misure</div>
                  <div onClick={() => { const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#34c759" }}>{"🔧"} Intervento</div>
                </div>
              </div>
            </div>
          );
        })()}
        {/* TASK DETAIL MODAL */}
        {selectedTask && (() => {
          const t = tasks.find(x => x.id === selectedTask.id) || selectedTask;
          const prioColor = t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93";
          const prioLabel = t.priority === "alta" ? "🔴 Urgente" : t.priority === "media" ? "🟠 Normale" : "⚪ Bassa";
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedTask(null)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)" }} />
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", zIndex: 9999, background: T.bg, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: prioColor, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: FM }}>✅ TASK · {prioLabel}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>{t.text}</div>
                    {t.date && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>📅 {new Date(t.date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}{t.time ? " alle " + t.time : ""}</div>}
                  </div>
                  <div onClick={() => setSelectedTask(null)} style={{ cursor: "pointer", fontSize: 22, color: T.sub, padding: "0 4px" }}>✕</div>
                </div>
                {t.meta && <div style={{ fontSize: 13, color: T.sub, marginBottom: 12, padding: "8px 12px", background: T.bgSec, borderRadius: 8, border: `1px solid ${T.bdr}` }}>📝 {t.meta}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  <span style={S.badge(prioColor + "18", prioColor)}>{prioLabel}</span>
                  {t.cm && <span onClick={() => { const cm = cantieri.find(c => c.code === t.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); setSelectedTask(null); } }} style={{ ...S.badge(T.accLt, T.acc), cursor: "pointer" }}>📁 {t.cm}</span>}
                  {t.persona && <span style={S.badge(T.purpleLt, T.purple)}>👤 {t.persona}</span>}
                  {t.done && <span style={S.badge(T.grnLt, T.grn)}>✅ Completato</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div onClick={() => { toggleTask(t.id); setSelectedTask({ ...t, done: !t.done }); }} style={{ padding: "14px", borderRadius: 12, background: t.done ? T.bg : T.grn, color: t.done ? T.sub : "#fff", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 800, border: `1px solid ${t.done ? T.bdr : T.grn}` }}>{t.done ? "↩ Riapri" : "✓ Completa"}</div>
                  <div onClick={() => { setTasks(ts => ts.filter(x => x.id !== t.id)); setSelectedTask(null); }} style={{ padding: "14px", borderRadius: 12, background: "#FF3B3010", color: "#FF3B30", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 800, border: "1px solid #FF3B3020" }}>🗑 Elimina</div>
                </div>
              </div>
            </div>
          );
        })()}
        {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 89 }} />}
        {[
          { id: "evento", ico: "📅", l: "Appuntamento", c: "#007aff", action: () => { setFabOpen(false); setShowNewEvent(true); } },
          { id: "cliente", ico: "👤", l: "Nuovo cliente", c: "#34c759", action: () => { setFabOpen(false); setShowModal("contatto"); } },
          { id: "commessa", ico: "📁", l: "Nuova commessa", c: "#ff9500", action: () => { setFabOpen(false); setShowModal("commessa"); } },
          { id: "messaggio", ico: "💬", l: "Messaggio", c: "#5856d6", action: () => { setFabOpen(false); setShowCompose(true); } },
        ].map((item, i) => (
          <div key={item.id} onClick={item.action} style={{
            position: "fixed", bottom: 90 + (i + 1) * 58, right: 20, zIndex: 90,
            display: "flex", alignItems: "center", gap: 10, flexDirection: "row-reverse",
            opacity: fabOpen ? 1 : 0, transform: fabOpen ? "translateY(0) scale(1)" : "translateY(30px) scale(0.5)",
            transition: `all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) ${fabOpen ? i * 0.06 : 0}s`,
            pointerEvents: fabOpen ? "auto" : "none",
          }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: item.c, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: `0 4px 16px ${item.c}50`, cursor: "pointer" }}>
              {item.ico}
            </div>
            <div style={{ padding: "6px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, boxShadow: "0 2px 12px rgba(0,0,0,0.1)", fontSize: 12, fontWeight: 700, color: item.c, whiteSpace: "nowrap" }}>
              {item.l}
            </div>
          </div>
        ))}
        <div onClick={() => setFabOpen(!fabOpen)} style={{
          position: "fixed", bottom: 90, right: 20, zIndex: 91,
          width: 56, height: 56, borderRadius: "50%",
          background: fabOpen ? T.sub : "linear-gradient(135deg, #007aff, #5856d6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: fabOpen ? "0 4px 16px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,122,255,0.4)",
          cursor: "pointer", transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          animation: fabOpen ? "none" : "fabPulse 2s infinite",
        }}>
          <div style={{ fontSize: 24, color: "#fff", transition: "transform 0.3s ease", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)" }}>✏️</div>
        </div>

        {/* MESSAGE DETAIL OVERLAY */}
        {selectedMsg && (() => {
          const chIco = { email: "📧", whatsapp: "💬", sms: "📱", telegram: "✈️" };
          const chCol = { email: T.blue, whatsapp: "#25d366", sms: T.orange, telegram: "#0088cc" };
          const [replyChannel, setReplyChannelX] = [selectedMsg._replyChannel || selectedMsg.canale, (ch) => setSelectedMsg(p => ({...p, _replyChannel: ch}))];
          return (
          <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 100, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", background: T.card, borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div onClick={() => { setSelectedMsg(null); setReplyText(""); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{chIco[selectedMsg.canale]}</span> {selectedMsg.from}
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{selectedMsg.cm ? `${selectedMsg.cm} · ` : ""}{selectedMsg.thread?.length || 0} messaggi</div>
              </div>
              {selectedMsg.cm && (
                <div onClick={() => { const cm = cantieri.find(c => c.code === selectedMsg.cm); if (cm) { setSelectedMsg(null); setSelectedCM(cm); setTab("commesse"); } }} style={{ padding: "4px 10px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 700, color: T.acc, cursor: "pointer" }}>
                  📂 {selectedMsg.cm}
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {(selectedMsg.thread || []).map((msg, i) => {
                const isMe = msg.who === "Tu";
                const mChIco = chIco[msg.canale] || chIco[selectedMsg.canale] || "💬";
                return (
                  <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3, fontWeight: 600 }}>{mChIco} {msg.who} · {msg.date} {msg.time}</div>
                    <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? (chCol[msg.canale || selectedMsg.canale] || T.acc) : T.card, color: isMe ? "#fff" : T.text, border: isMe ? "none" : `1px solid ${T.bdr}`, fontSize: 13, lineHeight: 1.4 }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: `1px solid ${T.bdr}`, background: T.card }}>
              <div style={{ display: "flex", gap: 2, padding: "6px 16px 0" }}>
                {["email", "whatsapp", "sms", "telegram"].map(ch => (
                  <div key={ch} onClick={() => setReplyChannelX(ch)} style={{ padding: "4px 8px", borderRadius: "8px 8px 0 0", fontSize: 14, cursor: "pointer", background: replyChannel === ch ? chCol[ch] + "18" : "transparent", borderBottom: replyChannel === ch ? `2px solid ${chCol[ch]}` : "2px solid transparent" }}>
                    {chIco[ch]}
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 16px 10px", display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>📎</div>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>🎤</div>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>📷</div>
                </div>
                <input
                  style={{ flex: 1, padding: "10px 14px", fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 20, background: T.bg, outline: "none", fontFamily: FF }}
                  placeholder={`Rispondi via ${replyChannel}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && replyText.trim()) {
                      const newThread = [...(selectedMsg.thread || []), { who: "Tu", text: replyText, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), canale: replyChannel }];
                      setMsgs(ms => ms.map(m => m.id === selectedMsg.id ? { ...m, thread: newThread, preview: replyText } : m));
                      setSelectedMsg(prev => ({ ...prev, thread: newThread }));
                      setReplyText("");
                    }
                  }}
                />
                <div onClick={() => {
                  if (replyText.trim()) {
                    const newThread = [...(selectedMsg.thread || []), { who: "Tu", text: replyText, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), canale: replyChannel }];
                    setMsgs(ms => ms.map(m => m.id === selectedMsg.id ? { ...m, thread: newThread, preview: replyText } : m));
                    setSelectedMsg(prev => ({ ...prev, thread: newThread }));
                    setReplyText("");
                  }
                }} style={{ width: 38, height: 38, borderRadius: "50%", background: replyText.trim() ? (chCol[replyChannel] || T.acc) : T.bdr, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <Ico d={ICO.send} s={16} c={replyText.trim() ? "#fff" : T.sub} />
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* SETTINGS ADD MODAL */}
        {settingsModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setSettingsModal(null)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
                {settingsModal === "sistema" && "Nuovo Sistema"}
                {settingsModal === "colore" && "Nuovo Colore"}
                {settingsModal === "vetro" && "Nuovo Vetro"}
                {settingsModal === "coprifilo" && "Nuovo Coprifilo"}
                {settingsModal === "lamiera" && "Nuova Lamiera"}
                {settingsModal === "tipologia" && "Nuova Tipologia"}
                {settingsModal === "membro" && "Nuovo Membro Team"}
              </div>

              {settingsModal === "membro" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome e cognome</label><input style={S.input} placeholder="es. Marco Ferraro" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Ruolo</label><select style={S.select} value={settingsForm.ruolo || "Posatore"} onChange={e => setSettingsForm(f => ({ ...f, ruolo: e.target.value }))}><option>Titolare</option><option>Posatore</option><option>Ufficio</option><option>Magazzino</option></select></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Compiti</label><input style={S.input} placeholder="es. Misure, installazione" value={settingsForm.compiti || ""} onChange={e => setSettingsForm(f => ({ ...f, compiti: e.target.value }))} /></div>
              </>)}

              {settingsModal === "sistema" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Marca</label><input style={S.input} placeholder="es. Aluplast" value={settingsForm.marca || ""} onChange={e => setSettingsForm(f => ({ ...f, marca: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Sistema</label><input style={S.input} placeholder="es. Ideal 4000" value={settingsForm.sistema || ""} onChange={e => setSettingsForm(f => ({ ...f, sistema: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>€/mq</label><input style={S.input} type="number" placeholder="180" value={settingsForm.euroMq || ""} onChange={e => setSettingsForm(f => ({ ...f, euroMq: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Sovr. RAL %</label><input style={S.input} type="number" placeholder="12" value={settingsForm.sovRAL || ""} onChange={e => setSettingsForm(f => ({ ...f, sovRAL: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Sovr. Legno %</label><input style={S.input} type="number" placeholder="22" value={settingsForm.sovLegno || ""} onChange={e => setSettingsForm(f => ({ ...f, sovLegno: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Sottosistemi (separati da virgola)</label><input style={S.input} placeholder="es. Classicline, Roundline" value={settingsForm.sottosistemi || ""} onChange={e => setSettingsForm(f => ({ ...f, sottosistemi: e.target.value }))} /></div>
              </>)}

              {settingsModal === "colore" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome</label><input style={S.input} placeholder="es. Grigio antracite" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder="es. RAL 7016" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Tipo</label><select style={S.select} value={settingsForm.tipo || "RAL"} onChange={e => setSettingsForm(f => ({ ...f, tipo: e.target.value }))}><option>RAL</option><option>Legno</option><option>Satinato</option><option>Altro</option></select></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Colore HEX</label><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="color" value={settingsForm.hex || "#888888"} onChange={e => setSettingsForm(f => ({ ...f, hex: e.target.value }))} style={{ width: 40, height: 34, border: "none", cursor: "pointer" }} /><input style={{ ...S.input, flex: 1 }} value={settingsForm.hex || "#888888"} onChange={e => setSettingsForm(f => ({ ...f, hex: e.target.value }))} /></div></div>
              </>)}

              {settingsModal === "vetro" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome</label><input style={S.input} placeholder="es. Triplo basso emissivo" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}><label style={S.fieldLabel}>Codice composizione</label><input style={S.input} placeholder="es. 4/16/4 BE" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Ug</label><input style={S.input} type="number" step="0.1" placeholder="1.1" value={settingsForm.ug || ""} onChange={e => setSettingsForm(f => ({ ...f, ug: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Prezzo €/mq</label><input style={S.input} type="number" step="0.5" placeholder="es. 45" value={settingsForm.prezzoMq || ""} onChange={e => setSettingsForm(f => ({ ...f, prezzoMq: parseFloat(e.target.value)||0 }))} /></div>
              </>)}

              {(settingsModal === "coprifilo" || settingsModal === "lamiera") && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder={settingsModal === "coprifilo" ? "es. CP50" : "es. LD250"} value={settingsForm.cod || ""} onChange={e => setSettingsForm(f => ({ ...f, cod: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Descrizione</label><input style={S.input} placeholder={settingsModal === "coprifilo" ? "es. Coprifilo piatto 50mm" : "es. Lamiera davanzale 250mm"} value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Prezzo €/ml</label><input style={S.input} type="number" step="0.5" placeholder="es. 5.50" value={settingsForm.prezzoMl || ""} onChange={e => setSettingsForm(f => ({ ...f, prezzoMl: parseFloat(e.target.value)||0 }))} /></div>
              </>)}

              {settingsModal === "tipologia" && (<>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder="es. F4A" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ width: 60 }}><label style={S.fieldLabel}>Icona</label><input style={S.input} placeholder="🪟" value={settingsForm.icon || ""} onChange={e => setSettingsForm(f => ({ ...f, icon: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Descrizione</label><input style={S.input} placeholder="es. Finestra 4 ante" value={settingsForm.label || ""} onChange={e => setSettingsForm(f => ({ ...f, label: e.target.value }))} /></div>
              </>)}

              <button style={S.btn} onClick={addSettingsItem}>Salva</button>
              <button style={S.btnCancel} onClick={() => setSettingsModal(null)}>Annulla</button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        
      {/* === TUTORIAL INTERATTIVO === */}
      {tutoStep >= 1 && tutoStep <= 7 && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background: tutoStep === 1 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)", display:"flex", alignItems: tutoStep === 1 ? "center" : "flex-end", justifyContent:"center", padding:16, fontFamily:T.font }} onClick={nextTuto}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius: tutoStep === 1 ? 24 : 20, width:"100%", maxWidth: tutoStep === 1 ? 380 : 340, padding: tutoStep === 1 ? "32px 28px" : "20px 22px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", marginBottom: tutoStep === 1 ? 0 : 80, ...(tutoStep >= 2 && tutoStep <= 6 ? { position:"fixed", bottom: 70, left:"50%", transform:"translateX(-50%)" } : {}) }}>

            {/* STEP 1: WELCOME */}
            {tutoStep === 1 && (<div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:16, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#fff", margin:"0 auto 16px" }}>M</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#1A1A1C", marginBottom:6 }}>Benvenuto in MASTRO</div>
              <div style={{ fontSize:13, color:"#6B6B6B", lineHeight:1.6, marginBottom:24 }}>Il gestionale pensato per chi fa serramenti sul campo. Ti faccio vedere come funziona in 30 secondi.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, textAlign:"left", marginBottom:24 }}>
                {[
                  {e:"🏠",t:"Home",d:"Riepilogo della giornata: appuntamenti, allerte, calendario"},
                  {e:"📅",t:"Agenda",d:"Tutti i tuoi impegni in vista giorno, settimana o mese"},
                  {e:"📁",t:"Commesse",d:"Il cuore: ogni lavoro dalla richiesta alla posa"},
                  {e:"📨",t:"Messaggi",d:"Tutte le comunicazioni in un posto"},
                  {e:"⚙️",t:"Impostazioni",d:"Listini, colori, team e dati azienda"},
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ fontSize:18, width:28, textAlign:"center", flexShrink:0 }}>{s.e}</div>
                    <div><div style={{ fontSize:13, fontWeight:700, color:"#1A1A1C" }}>{s.t}</div><div style={{ fontSize:11, color:"#8E8E93" }}>{s.d}</div></div>
                  </div>
                ))}
              </div>
              <div onClick={nextTuto} style={{ padding:"14px 32px", fontSize:15, fontWeight:800, color:"#fff", background:T.acc, borderRadius:14, cursor:"pointer", display:"inline-block" }}>Inizia il tour →</div>
              <div onClick={closeTuto} style={{ fontSize:11, color:"#8E8E93", marginTop:12, cursor:"pointer" }}>Salta, conosco già</div>
            </div>)}

            {/* STEP 2: HOME TAB */}
            {tutoStep === 2 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>🏠</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Home</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>1/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Appena apri MASTRO vedi la <b>dashboard</b>: gli appuntamenti di oggi in alto, le <b>allerte</b> sulle commesse ferme, e il <b>calendario</b> del mese. Tocca qualsiasi elemento per aprirlo.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={closeTuto} style={{ fontSize:11, color:"#8E8E93", cursor:"pointer" }}>Chiudi tour</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:24, width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 3: AGENDA */}
            {tutoStep === 3 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>📅</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Agenda</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>2/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Qui vedi <b>tutti gli impegni</b>: sopralluoghi, pose, consegne. Puoi vedere il <b>giorno singolo</b>, la <b>settimana</b> o il <b>mese</b>. Tocca il + per aggiungere un appuntamento. Ogni evento può essere collegato a una commessa.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>‹ Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:"38%", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 4: COMMESSE */}
            {tutoStep === 4 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>📁</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Commesse</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>3/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:8 }}>Ogni commessa è un <b>lavoro completo</b> con il suo ciclo di vita:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                {["Sopralluogo","Preventivo","Conferma","Misure","Ordini","Produzione","Posa","Chiusura"].map((f,i) => (
                  <div key={i} style={{ fontSize:9, fontWeight:700, padding:"3px 7px", borderRadius:6, background:i===0?"#007aff15":i<4?"#ff950015":"#34c75915", color:i===0?"#007aff":i<4?"#ff9500":"#34c759" }}>{f}</div>
                ))}
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Dentro ogni commessa gestisci <b>vani</b> (finestre, porte), <b>misure</b>, <b>rilievi</b> e generi il <b>preventivo PDF</b>. Tocca + per creare la tua prima commessa!</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>‹ Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 5: MESSAGGI */}
            {tutoStep === 5 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>📨</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Messaggi</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>4/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Tutte le comunicazioni: <b>WhatsApp, email, SMS, Telegram</b>. L’AI Inbox analizza le email in arrivo e suggerisce azioni automatiche: creare commesse, collegare messaggi, avanzare fasi.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>‹ Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, right:"35%", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 6: IMPOSTAZIONI */}
            {tutoStep === 6 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>⚙️</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Impostazioni</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>5/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Configura la tua azienda: <b>ragione sociale, logo, listini prezzi, sistemi</b> (Schüco, Rehau, Finstral...), <b>colori RAL</b>, vetri, coprifili, lamiere. Tutto quello che ti serve per fare preventivi precisi.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>‹ Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, right:24, width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 7: FINAL */}
            {tutoStep === 7 && (<div style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#1A1A1C", marginBottom:6 }}>Tutto pronto!</div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.7, marginBottom:8 }}>Ecco come iniziare:</div>
              <div style={{ textAlign:"left", marginBottom:20 }}>
                {[
                  {n:"1",t:"Vai in Impostazioni",d:"Inserisci ragione sociale, P.IVA, telefono"},
                  {n:"2",t:"Crea la prima commessa",d:"Tocca Commesse → + e inserisci cliente e indirizzo"},
                  {n:"3",t:"Aggiungi i vani",d:"Dentro la commessa, aggiungi finestre e portefinestre"},
                  {n:"4",t:"Fai il sopralluogo",d:"Inserisci le misure vano per vano dal cantiere"},
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:T.acc, color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.n}</div>
                    <div><div style={{ fontSize:12, fontWeight:700, color:"#1A1A1C" }}>{s.t}</div><div style={{ fontSize:11, color:"#8E8E93" }}>{s.d}</div></div>
                  </div>
                ))}
              </div>
              <div onClick={closeTuto} style={{ padding:"14px 32px", fontSize:15, fontWeight:800, color:"#fff", background:T.acc, borderRadius:14, cursor:"pointer", display:"inline-block" }}>Inizia a lavorare! 💪</div>
            </div>)}
          </div>
        </div>
      )}
      {!selectedVano && (
          
      <div style={S.tabBar}>
            {[
              { id: "home", ico: ICO.home, label: "Home" },
              { id: "agenda", ico: ICO.calendar, label: "Agenda" },
              { id: "commesse", ico: ICO.filter, label: "Commesse" },
              { id: "messaggi", ico: ICO.chat, label: "Messaggi" },
              { id: "settings", ico: ICO.settings, label: "Impost." },
            ].map(t => (
              <div key={t.id} style={S.tabItem(tab === t.id)} onClick={() => { setTab(t.id); setSelectedCM(null); setSelectedVano(null); setSelectedMsg(null); }}>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <Ico d={t.ico} s={22} c={tab === t.id ? T.acc : T.sub} />
                  {t.id === "messaggi" && msgs.filter(m => !m.read).length > 0 && (
                    <div style={{ position: "absolute", top: -4, right: -8, width: 16, height: 16, borderRadius: "50%", background: T.red, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {msgs.filter(m => !m.read).length}
                    </div>
                  )}
                </div>
                <div style={S.tabLabel(tab === t.id)}>{t.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {renderModal()}
        {renderPreventivoModal()}
        {renderFirmaModal()}

        {/* SEND COMMESSA MODAL */}
        {showSendModal && selectedCM && (
          <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowSendModal(false)}>
            <div style={S.modalInner}>
              {sendConfirm === "sent" ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.grn }}>Commessa inviata!</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Email inviata con tutti i dati selezionati</div>
                </div>
              ) : (
                <>
                  <div style={S.modalTitle}>📧 Invia Commessa — {selectedCM.code}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>Scegli cosa includere nell'invio:</div>
                  {[
                    { key: "misure", label: "Misure tutti i vani", ico: "📐" },
                    { key: "foto", label: "Foto scattate", ico: "📷" },
                    { key: "disegno", label: "Disegni mano libera", ico: "✏️" },
                    { key: "accessori", label: "Accessori (tapparelle, zanzariere...)", ico: "🪟" },
                    { key: "note", label: "Note e annotazioni", ico: "📝" },
                  ].map(opt => (
                    <div key={opt.key} onClick={() => setSendOpts(o => ({ ...o, [opt.key]: !o[opt.key] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: sendOpts[opt.key] ? T.accLt : T.card, border: `1px solid ${sendOpts[opt.key] ? T.acc : T.bdr}`, borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sendOpts[opt.key] ? T.acc : T.bdr}`, background: sendOpts[opt.key] ? T.acc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                        {sendOpts[opt.key] && "✓"}
                      </div>
                      <span style={{ fontSize: 16 }}>{opt.ico}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{opt.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, marginBottom: 8 }}>
                    <label style={S.fieldLabel}>Invia a (email)</label>
                    <input style={S.input} placeholder="email@destinatario.com" />
                  </div>
                  <button onClick={sendCommessa} style={{ ...S.btn, background: "linear-gradient(135deg, #007aff, #0055cc)", marginTop: 4 }}>
                    📧 Invia commessa completa
                  </button>
                  <button style={S.btnCancel} onClick={() => setShowSendModal(false)}>Annulla</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* NEW EVENT MODAL */}
        {showNewEvent && (
          <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowNewEvent(false)}>
            <div style={S.modalInner}>
              <div style={S.modalTitle}>{newEvent.tipo === "task" ? "Nuovo task" : "Nuovo evento"}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Titolo</label>
                <input style={S.input} placeholder="es. Sopralluogo, consegna materiale..." value={newEvent.text} onChange={e => setNewEvent(ev => ({ ...ev, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Data</label>
                  <input style={S.input} type="date" value={newEvent.date || selDate.toISOString().split("T")[0]} onChange={e => setNewEvent(ev => ({ ...ev, date: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Ora (opz.)</label>
                  <input style={S.input} type="time" value={newEvent.time} onChange={e => setNewEvent(ev => ({ ...ev, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Tipo</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "appuntamento", l: "📅 Appuntamento", c: T.blue }, { id: "task", l: "✅ Task", c: T.orange }, { id: "sopr_riparazione", l: "🔩 Sopr. Riparazione", c: "#FF6B00" }, { id: "riparazione", l: "🛠 Riparazione", c: "#FF3B30" }, { id: "collaudo", l: "✔️ Collaudo", c: "#5856D6" }, { id: "garanzia", l: "🔒 Garanzia", c: "#8E8E93" }].map(t => (
                    <div key={t.id} onClick={() => setNewEvent(ev => ({ ...ev, tipo: t.id }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${newEvent.tipo === t.id ? t.c : T.bdr}`, background: newEvent.tipo === t.id ? t.c + "18" : "transparent", textAlign: "center", fontSize: 12, fontWeight: 600, color: newEvent.tipo === t.id ? t.c : T.sub, cursor: "pointer" }}>
                      {t.l}
                    </div>
                  ))}
                </div>
              </div>
              {/* --- TASK-SPECIFIC FIELDS --- */}
              {newEvent.tipo === "task" && (<>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "alta", l: "🔴 Alta", c: "#FF3B30" }, { id: "media", l: "🟠 Media", c: "#FF9500" }, { id: "bassa", l: "⚪ Bassa", c: "#8E8E93" }].map(p => (
                    <div key={p.id} onClick={() => setNewEvent(ev => ({ ...ev, _taskPriority: p.id } as any))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${((newEvent as any)._taskPriority || "media") === p.id ? p.c : T.bdr}`, background: ((newEvent as any)._taskPriority || "media") === p.id ? p.c + "18" : "transparent", textAlign: "center", fontSize: 12, fontWeight: 600, color: ((newEvent as any)._taskPriority || "media") === p.id ? p.c : T.sub, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa</label>
                <select style={S.select} value={newEvent.cm} onChange={e => setNewEvent(ev => ({ ...ev, cm: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona</label>
                <select style={S.select} value={newEvent.persona} onChange={e => setNewEvent(ev => ({ ...ev, persona: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {[...contatti.filter(ct => ct.tipo === "cliente"), ...team].map(m => <option key={m.id} value={m.nome}>{m.nome}{(m as any).ruolo ? " — " + (m as any).ruolo : ""}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Note (opz.)</label>
                <input style={S.input} placeholder="Dettagli, materiale da portare..." value={(newEvent as any)._taskMeta || ""} onChange={e => setNewEvent(ev => ({ ...ev, _taskMeta: e.target.value } as any))} />
              </div>
              </>)}
              {/* --- EVENT-SPECIFIC FIELDS --- */}
              {newEvent.tipo !== "task" && (<>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Cliente</label>
                <select style={S.select} value={newEvent.persona || ""} onChange={e => {
                  const val = e.target.value;
                  if (val === "__new__") { setNewEvent(ev => ({ ...ev, persona: "", _newCliente: true } as any)); }
                  else { const ct = contatti.find(c => c.nome === val); setNewEvent(ev => ({ ...ev, persona: val, addr: ct?.indirizzo || ev.addr, text: ev.text || ("Appuntamento " + val), _newCliente: false } as any)); }
                }}>
                  <option value="">— Seleziona cliente —</option>
                  {contatti.filter(ct => ct.tipo === "cliente").map(ct => <option key={ct.id || ct.nome} value={ct.nome}>{ct.nome}{ct.cognome ? " " + ct.cognome : ""}</option>)}
                  <option value="__new__">➕ Nuovo cliente...</option>
                </select>
                {(newEvent as any)._newCliente && (
                  <div style={{ background: T.bgSec, borderRadius: 10, padding: 12, marginTop: 8, border: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>👤 Nuovo cliente</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Nome" value={(newEvent as any)._nomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _nomeCliente: e.target.value } as any))} />
                      <input style={{ ...S.input, flex: 1 }} placeholder="Cognome" value={(newEvent as any)._cognomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _cognomeCliente: e.target.value } as any))} />
                    </div>
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder="Telefono" value={(newEvent as any)._telCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _telCliente: e.target.value } as any))} />
                    <input style={S.input} placeholder="Indirizzo" value={(newEvent as any)._addrCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _addrCliente: e.target.value, addr: e.target.value } as any))} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa</label>
                <select style={S.select} value={newEvent.cm} onChange={e => setNewEvent(ev => ({ ...ev, cm: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona</label>
                <select style={S.select} value={newEvent.persona} onChange={e => setNewEvent(ev => ({ ...ev, persona: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {team.map(m => <option key={m.id} value={m.nome}>{m.nome} — {m.ruolo}</option>)}
                </select>
              </div>
              {/* Indirizzo */}
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Indirizzo (opz.)</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza..." value={newEvent.addr||""} onChange={e => setNewEvent(ev => ({ ...ev, addr: e.target.value }))} />
              </div>
              {/* Reminder */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.fieldLabel}>⏰ Reminder al cliente</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "", l: "Nessuno" },
                    { id: "24h", l: "24h prima" },
                    { id: "1h", l: "1h prima" },
                    { id: "giorno", l: "Il giorno" },
                  ].map(r => (
                    <div key={r.id} onClick={() => setNewEvent(ev => ({ ...ev, reminder: r.id }))}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer",
                        border: `1px solid ${newEvent.reminder === r.id ? T.acc : T.bdr}`,
                        background: newEvent.reminder === r.id ? T.accLt : "transparent",
                        color: newEvent.reminder === r.id ? T.acc : T.sub }}>
                      {r.l}
                    </div>
                  ))}
                </div>
                {newEvent.reminder && (
                  <div style={{ marginTop: 6, fontSize: 10, color: T.sub, padding: "5px 8px", background: T.accLt, borderRadius: 6 }}>
                    📧 MASTRO ti avviserà di inviare il reminder — lo farai con 1 click dal banner in agenda
                  </div>
                )}
              </div>
              </>)}
              <button style={S.btn} onClick={addEvent}>{newEvent.tipo === "task" ? "Crea task" : "Crea evento"}</button>
              <button style={S.btnCancel} onClick={() => setShowNewEvent(false)}>Annulla</button>
            </div>
          </div>
        )}

        {/* FASE ADVANCE NOTIFICATION */}
        {faseNotif && (
          <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", maxWidth: 380, width: "90%", padding: "12px 16px", borderRadius: 12, background: T.card, border: `1px solid ${faseNotif.color}40`, boxShadow: `0 4px 20px ${faseNotif.color}30`, zIndex: 300, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: faseNotif.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>📧</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Avanzato a {faseNotif.fase}</div>
              <div style={{ fontSize: 11, color: T.sub }}>Email inviata a <strong>{faseNotif.addetto}</strong></div>
            </div>
            <div style={{ fontSize: 18 }}>✅</div>
          </div>
        )}

        {/* COMPOSE MESSAGE MODAL */}
        {showCompose && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowCompose(false)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 420, padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>✏️ Nuovo messaggio</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Invia via</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { id: "whatsapp", l: "💬 WhatsApp", c: "#25d366" },
                    { id: "email", l: "📧 Email", c: T.blue },
                    { id: "sms", l: "📱 SMS", c: T.orange },
                    { id: "telegram", l: "✈️ Telegram", c: "#0088cc" },
                  ].map(ch => (
                    <div key={ch.id} onClick={() => setComposeMsg(c => ({ ...c, canale: ch.id }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${composeMsg.canale === ch.id ? ch.c : T.bdr}`, background: composeMsg.canale === ch.id ? ch.c + "15" : T.card, textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 600, color: composeMsg.canale === ch.id ? ch.c : T.sub }}>
                      {ch.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Destinatario</label>
                <input style={S.input} placeholder="Nome o numero..." value={composeMsg.to} onChange={e => setComposeMsg(c => ({ ...c, to: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Collega a commessa (opzionale)</label>
                <select style={S.select} value={composeMsg.cm} onChange={e => setComposeMsg(c => ({ ...c, cm: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Messaggio</label>
                <textarea style={{ width: "100%", padding: 12, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg, minHeight: 80, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Scrivi il messaggio..." value={composeMsg.text} onChange={e => setComposeMsg(c => ({ ...c, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[{ ico: "📎", l: "File" }, { ico: "📷", l: "Foto" }, { ico: "🎤", l: "Audio" }, { ico: "📍", l: "Posizione" }].map((b, i) => (
                  <div key={i} style={{ flex: 1, padding: "8px 4px", background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 16 }}>{b.ico}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.sub, marginTop: 1 }}>{b.l}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                if (composeMsg.to.trim() && composeMsg.text.trim()) {
                  const newMsg = {
                    id: Date.now(), from: composeMsg.to, preview: composeMsg.text, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
                    cm: composeMsg.cm, read: true, canale: composeMsg.canale,
                    thread: [{ who: "Tu", text: composeMsg.text, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), canale: composeMsg.canale }]
                  };
                  setMsgs(ms => [newMsg, ...ms]);
                  setShowCompose(false);
                  setComposeMsg({ to: "", text: "", canale: "whatsapp", cm: "" });
                }
              }} style={{ ...S.btn, opacity: composeMsg.to.trim() && composeMsg.text.trim() ? 1 : 0.5 }}>
                Invia messaggio
              </button>
              <button onClick={() => setShowCompose(false)} style={S.btnCancel}>Annulla</button>
            </div>
          </div>
        )}

        {/* ALLEGATI MODAL */}
        {showAllegatiModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowAllegatiModal(null)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20 }}>
              {showAllegatiModal === "nota" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>📝 Nuova nota</div>
                  <textarea style={{ width: "100%", padding: 12, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg, minHeight: 100, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Scrivi la nota..." value={allegatiText} onChange={e => setAllegatiText(e.target.value)} autoFocus />
                  <button onClick={() => { if (allegatiText.trim()) { addAllegato("nota", allegatiText.trim()); setShowAllegatiModal(null); setAllegatiText(""); } }} style={{ ...S.btn, marginTop: 10, opacity: allegatiText.trim() ? 1 : 0.5 }}>Salva nota</button>
                </>
              )}
              {showAllegatiModal === "vocale" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>🎤 Nota vocale</div>
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    {isRecording && (
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: FM, color: T.red, marginBottom: 12 }}>
                        {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                      </div>
                    )}
                    <div onClick={() => {
                      if (!isRecording) {
                        setIsRecording(true); setRecSeconds(0);
                        recInterval.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
                      } else {
                        clearInterval(recInterval.current);
                        setIsRecording(false);
                        addAllegato("vocale", "Nota vocale " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
                        setShowAllegatiModal(null); setRecSeconds(0);
                      }
                    }} style={{ width: 70, height: 70, borderRadius: "50%", background: isRecording ? "linear-gradient(135deg, #ff3b30, #cc0000)" : "linear-gradient(135deg, #ff3b30, #ff6b6b)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", cursor: "pointer", boxShadow: isRecording ? "0 0 24px rgba(255,59,48,0.5)" : "0 4px 16px rgba(255,59,48,0.3)", animation: isRecording ? "pulse 1.5s infinite" : "none" }}>
                      <span style={{ fontSize: 28, color: "#fff" }}>{isRecording ? "⏹" : "🎤"}</span>
                    </div>
                    <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }`}</style>
                    <div style={{ fontSize: 12, color: isRecording ? T.red : T.sub, marginTop: 10, fontWeight: isRecording ? 700 : 400 }}>
                      {isRecording ? "Registrazione... tocca per fermare" : "Tocca per registrare"}
                    </div>
                  </div>
                </>
              )}
              {showAllegatiModal === "video" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>🎬 Video</div>
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    {isRecording && (
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: FM, color: T.red, marginBottom: 12 }}>
                        {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                      </div>
                    )}
                    <div onClick={() => {
                      if (!isRecording) {
                        setIsRecording(true); setRecSeconds(0);
                        recInterval.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
                      } else {
                        clearInterval(recInterval.current);
                        setIsRecording(false);
                        addAllegato("video", "Video " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
                        setShowAllegatiModal(null); setRecSeconds(0);
                      }
                    }} style={{ width: 70, height: 70, borderRadius: "50%", background: isRecording ? "linear-gradient(135deg, #ff3b30, #cc0000)" : "linear-gradient(135deg, #007aff, #5856d6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", cursor: "pointer", boxShadow: isRecording ? "0 0 24px rgba(255,59,48,0.5)" : "0 4px 16px rgba(0,122,255,0.3)", animation: isRecording ? "pulse 1.5s infinite" : "none" }}>
                      <span style={{ fontSize: 28, color: "#fff" }}>{isRecording ? "⏹" : "🎬"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: isRecording ? T.red : T.sub, marginTop: 10, fontWeight: isRecording ? 700 : 400 }}>
                      {isRecording ? "Registrazione... tocca per fermare" : "Tocca per registrare"}
                    </div>
                  </div>
                </>
              )}
              <button onClick={() => { clearInterval(recInterval.current); setIsRecording(false); setRecSeconds(0); setShowAllegatiModal(null); }} style={S.btnCancel}>Annulla</button>
            </div>
          </div>
        )}

        {/* AI PHOTO MODAL */}
        {/* AI PHOTO MODAL */}
        {showAIPhoto && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowAIPhoto(false)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
              {aiPhotoStep === 0 && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #af52de, #007aff)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}>🤖</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#af52de" }}>AI Misure da Foto</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Inquadra il vano "{selectedVano?.nome}" e l'AI analizzerà l'immagine</div>
                  </div>
                  <div style={{ position: "relative", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 20, border: "2px solid #af52de80", borderRadius: 8 }} />
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#af52de30" }} />
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#af52de30" }} />
                    <div style={{ color: "#af52de", fontSize: 12, fontWeight: 600, textAlign: "center", zIndex: 1 }}>📷 Simulazione fotocamera<br /><span style={{ fontSize: 10, color: "#af52de80" }}>Inquadra il serramento</span></div>
                  </div>
                  <button onClick={() => { setAiPhotoStep(1); setTimeout(() => setAiPhotoStep(2), 2000 + Math.random() * 1500); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #af52de, #007aff)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, marginBottom: 8 }}>
                    📸 Scatta e analizza
                  </button>
                  <button onClick={() => setShowAIPhoto(false)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.sub }}>Annulla</button>
                </>
              )}
              {aiPhotoStep === 1 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #af52de20", borderTopColor: "#af52de", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#af52de" }}>Analisi AI in corso...</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Rilevamento bordi · Edge detection · Stima dimensioni</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>Analizzando "{selectedVano?.nome}"...</div>
                </div>
              )}
              {aiPhotoStep === 2 && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.grn }}>Analisi completata!</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Misure suggerite per "{selectedVano?.nome}" (verifica con metro)</div>
                  </div>
                  <div style={{ borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 12 }}>
                    {[["Larghezza stimata", `~${_aiBaseW} mm`, T.acc], ["Altezza stimata", `~${_aiBaseH} mm`, T.blue], ["Tipo rilevato", _aiTip, T.purple]].map(([l, val, col]) => (
                      <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{l}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FM, color: String(col) }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 10, color: "#e65100" }}>
                    ⚠️ Le misure AI sono approssimative. Usa sempre il metro laser per le misure definitive.
                  </div>
                  <button onClick={() => {
                    if (selectedVano) {
                      updateMisura(selectedVano.id, "lAlto", _aiBaseW + Math.floor(Math.random() * 5 - 2));
                      updateMisura(selectedVano.id, "lCentro", _aiBaseW);
                      updateMisura(selectedVano.id, "lBasso", _aiBaseW - Math.floor(Math.random() * 4));
                      updateMisura(selectedVano.id, "hSx", _aiBaseH);
                      updateMisura(selectedVano.id, "hCentro", _aiBaseH + Math.floor(Math.random() * 3 - 1));
                      updateMisura(selectedVano.id, "hDx", _aiBaseH - Math.floor(Math.random() * 4));
                    }
                    setShowAIPhoto(false);
                  }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #af52de, #007aff)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, marginBottom: 8 }}>
                    ✅ Applica misure suggerite
                  </button>
                  <button onClick={() => setShowAIPhoto(false)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.sub }}>Solo anteprima, non applicare</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}


