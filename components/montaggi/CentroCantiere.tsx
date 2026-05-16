// components/montaggi/CentroCantiere.tsx
// Centro Cantiere MASTRO — orchestrazione completa dal montaggio alla fattura
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { C, MontaggioRow, formatHour, parseDateISO, DOW_SHORT, MONTH_FULL } from "./montaggi-types";
import { supabase } from "@/lib/supabase";

// ─── Tipi ───────────────────────────────────────────────────────────────────

interface VanoCantiere {
  id: string;
  numero: number;
  tipo: string;
  sistema: string;
  larghezza: number | null;
  altezza: number | null;
  piano: string | null;
  corpo: string | null;
  lato: string | null;
  stanza: string | null;
  coloreInt: string | null;
  coloreEst: string | null;
  note: string | null;
  stato_montaggio: "da_fare" | "in_corso" | "fatto" | "bloccato";
  operatore_assegnato: string | null;
}

interface ZonaLavoro {
  piano: string;
  corpo: string;
  lato: string;
  vani: VanoCantiere[];
}

type Tab = "pianifica" | "vani" | "squadre" | "sal" | "documenti" | "sicurezza" | "diario";

interface Props {
  montaggio: MontaggioRow;
  commesse: any[];
  aziendaId: string;
  onClose: () => void;
  onModifica: () => void;
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function fmtData(iso: string | null): string {
  if (!iso) return "—";
  const d = parseDateISO(iso);
  if (!d) return "—";
  return `${DOW_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_FULL[d.getMonth()].slice(0, 3)}`;
}

function fmtEur(n: number): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + "€";
}

function initials(name: string): string {
  return (name || "?").split(" ").map(p => p[0] || "").slice(0, 2).join("").toUpperCase() || "?";
}

// ─── Componenti interni ──────────────────────────────────────────────────────

function SezHeader({ icon, title, sub, color }: { icon: React.ReactNode; title: string; sub?: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.navyText }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: C.navyDim, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.white, borderRadius: 14, boxShadow: C.shadowSm, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function Bdg({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5, color, background: bg, textTransform: "uppercase", letterSpacing: ".3px", flexShrink: 0 }}>
      {label}
    </span>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", borderTop: `0.5px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function Av({ name, bg, color }: { name: string; bg: string; color: string }) {
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, color, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}

function Alert({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div style={{ background: C.amberSoft, borderRadius: 12, padding: "11px 13px", borderLeft: `3px solid ${C.amber}`, display: "flex", gap: 10 }}>
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.amberDark} strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.amberDeep }}>{title}</div>
        <div style={{ fontSize: 11, color: C.amberDark, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
        {children}
      </div>
    </div>
  );
}

function Btn({ label, icon, variant = "default", onClick }: { label: string; icon: React.ReactNode; variant?: "default" | "navy" | "teal" | "green" | "amber"; onClick?: () => void }) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: C.white, color: C.navyText, border: `0.5px solid ${C.borderStrong}` },
    navy: { background: C.navy, color: C.white, border: `0.5px solid ${C.navy}` },
    teal: { background: "#28A0A0", color: C.white, border: `0.5px solid #28A0A0` },
    green: { background: C.greenBright, color: C.white, border: `0.5px solid ${C.greenBright}` },
    amber: { background: C.amber, color: C.white, border: `0.5px solid ${C.amber}` },
  };
  return (
    <button onClick={onClick} style={{ padding: "11px 8px", borderRadius: 12, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: C.shadowXs, fontFamily: "inherit", ...styles[variant] }}>
      {icon}{label}
    </button>
  );
}

function Prog({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 5, background: C.white2, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#28A0A0", borderRadius: 3, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 9, color: C.navyDim, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ─── Tab Pianifica ───────────────────────────────────────────────────────────

// ─── Tipi zona pianificazione ────────────────────────────────────────────────

interface ZonaPianificazione {
  id: string;
  // Dove
  corpo: string;
  piano: string;
  lato: string;
  scala: string;
  settore: string;
  note_posizione: string;
  // Chi
  squadra: string;
  operatori: string;
  // Cosa
  cosa_montare: string;
  vani_da: string;
  vani_a: string;
  note_lavoro: string;
  // Quando
  ora_inizio: string;
  ore_stimate: string;
}

function nuovaZona(i: number): ZonaPianificazione {
  return { id: `z${Date.now()}${i}`, corpo: "", piano: "", lato: "", scala: "", settore: "", note_posizione: "", squadra: "", operatori: "", cosa_montare: "", vani_da: "", vani_a: "", note_lavoro: "", ora_inizio: "", ore_stimate: "" };
}

// Opzioni preimpostate per cantieri serramentisti
const OPTS: Record<string, string[]> = {
  corpo: ["Corpo A","Corpo B","Corpo C","Corpo D","Padiglione Nord","Padiglione Sud","Padiglione Est","Padiglione Ovest","Ala Ovest","Ala Est","Torre A","Torre B","Blocco 1","Blocco 2","Blocco 3","Fabbricato principale","Dependance","Annesso"],
  piano: ["Piano Terra","Piano 1","Piano 2","Piano 3","Piano 4","Piano 5","Piano 6","Piano 7","Piano 8","Seminterrato","Interrato","Mansarda","Sottotetto","Copertura","Piano Ammezzato","Piano Rialzato"],
  lato: ["Nord","Sud","Est","Ovest","Nord-Est","Nord-Ovest","Sud-Est","Sud-Ovest","Fronte strada","Cortile interno","Fronte principale","Retro","Lato destro","Lato sinistro","Prospetto A","Prospetto B"],
  scala: ["Scala A","Scala B","Scala C","Scala D","Vano scala 1","Vano scala 2","Scala principale","Scala emergenza","Scala interna","Ascensore A","Montacarichi"],
  settore: ["Uffici","Appartamento","Monolocale","Bilocale","Trilocale","ORL","Pronto Soccorso","Degenza","Reparti","Reception","Laboratori","Magazzino","Bagni","Corridoio","Hall","Aula","Camera","Sala conferenze","Sala operatoria","Cucina","Soggiorno","Camera da letto","Studio","Garage","Box auto"],
  cosa_montare: ["Finestre","Portefinestre","Porte interne","Porte blindate","Porte tagliafuoco","Persiane","Tapparelle","Zanzariere","Portoni","Vetrate fisse","Lucernari","Velux","Scorrevoli","Alzanti","Vasistas","Ribalte","Porte scorrevoli","Controtelai"],
};

function CampoLibero({ label, value, onChange, placeholder, full, optsKey }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; full?: boolean; optsKey?: string }) {
  const opts = optsKey ? OPTS[optsKey] || [] : [];
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 9, color: C.navyDim, textTransform: "uppercase" as const, letterSpacing: ".4px", marginBottom: 4 }}>{label}</div>
      {opts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || "Scrivi o scegli dalla lista..."}
            list={`opts-${optsKey}`}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `0.5px solid ${C.borderStrong}`, background: C.whiteOff, color: C.navyText, fontSize: 12, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
          />
          <datalist id={`opts-${optsKey}`}>
            {opts.map(o => <option key={o} value={o} />)}
          </datalist>
        </div>
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "—"}
          style={{ width: "100%", padding: "8px 10px", borderRadius: 9, border: `0.5px solid ${C.borderStrong}`, background: C.whiteOff, color: C.navyText, fontSize: 12, fontWeight: 700, fontFamily: "inherit", outline: "none" }}
        />
      )}
    </div>
  );
}

function ZonaCard({ zona, index, onChange, onDelete, montaggio }: { zona: ZonaPianificazione; index: number; onChange: (z: ZonaPianificazione) => void; onDelete: () => void; montaggio: MontaggioRow }) {
  const [open, setOpen] = useState(true);
  const up = (field: keyof ZonaPianificazione, val: string) => onChange({ ...zona, [field]: val });
  const colori = ["#28A0A0", "#E8B05C", "#2B7A52", "#7F77DD", "#C44545", "#185FA5"];
  const col = colori[index % colori.length];

  return (
    <div style={{ background: C.white, borderRadius: 14, overflow: "hidden", boxShadow: C.shadowSm, borderLeft: `4px solid ${col}` }}>
      {/* Header zona */}
      <div onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", cursor: "pointer" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: col + "22", color: col, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.navyText }}>
            {[zona.corpo, zona.piano, zona.lato, zona.scala].filter(Boolean).join(" · ") || `Zona ${index + 1}`}
          </div>
          {(zona.squadra || zona.cosa_montare) && (
            <div style={{ fontSize: 10, color: C.navyDim, marginTop: 1 }}>
              {[zona.squadra, zona.cosa_montare].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.navyDim} strokeWidth={2.5} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {open && (
        <div style={{ padding: "0 13px 13px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* DOVE */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: ".6px", textTransform: "uppercase" as const, marginBottom: 7 }}>DOVE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CampoLibero label="Corpo / Ala / Padiglione" value={zona.corpo} onChange={v => up("corpo", v)} placeholder="Es: Corpo B, Padiglione 3" optsKey="corpo" />
              <CampoLibero label="Piano" value={zona.piano} onChange={v => up("piano", v)} placeholder="Es: Piano 3, Seminterrato" optsKey="piano" />
              <CampoLibero label="Lato / Fronte" value={zona.lato} onChange={v => up("lato", v)} placeholder="Es: Nord, Fronte strada" optsKey="lato" />
              <CampoLibero label="Scala / Vano scala" value={zona.scala} onChange={v => up("scala", v)} placeholder="Es: Scala B, Vano 2" optsKey="scala" />
              <CampoLibero label="Settore / Zona" value={zona.settore} onChange={v => up("settore", v)} placeholder="Es: Settore A, ORL, Pronto S." full optsKey="settore" />
              <CampoLibero label="Note posizione" value={zona.note_posizione} onChange={v => up("note_posizione", v)} placeholder="Es: Accesso da cortile, usare montacarichi" full />
            </div>
          </div>

          {/* CHI */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: ".6px", textTransform: "uppercase" as const, marginBottom: 7 }}>CHI MONTA</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CampoLibero label="Squadra" value={zona.squadra} onChange={v => up("squadra", v)} placeholder="Es: Squadra Mario, Sq.1" />
              <CampoLibero label="Operatori" value={zona.operatori} onChange={v => up("operatori", v)} placeholder="Es: Mario R., Luigi B." />
            </div>
          </div>

          {/* COSA */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: ".6px", textTransform: "uppercase" as const, marginBottom: 7 }}>COSA MONTANO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CampoLibero label="Tipo lavorazione" value={zona.cosa_montare} onChange={v => up("cosa_montare", v)} placeholder="Es: Finestre CT70, Porte blindate" full optsKey="cosa_montare" />
              <CampoLibero label="Vani da" value={zona.vani_da} onChange={v => up("vani_da", v)} placeholder="Es: Vano 01" />
              <CampoLibero label="Vani a" value={zona.vani_a} onChange={v => up("vani_a", v)} placeholder="Es: Vano 12" />
              <CampoLibero label="Note lavoro" value={zona.note_lavoro} onChange={v => up("note_lavoro", v)} placeholder="Es: Attenzione soglia ribassata vano 4" full />
            </div>
          </div>

          {/* QUANDO */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: col, letterSpacing: ".6px", textTransform: "uppercase" as const, marginBottom: 7 }}>QUANDO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <CampoLibero label="Ora inizio" value={zona.ora_inizio} onChange={v => up("ora_inizio", v)} placeholder="Es: 08:00, 13:30" />
              <CampoLibero label="Ore stimate" value={zona.ore_stimate} onChange={v => up("ore_stimate", v)} placeholder="Es: 4h, 2 giorni" />
            </div>
          </div>

          <button onClick={onDelete} style={{ marginTop: 2, padding: "8px 0", borderRadius: 9, background: C.redSoft, color: C.red, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Elimina zona
          </button>
        </div>
      )}
    </div>
  );
}

function TabPianifica({ montaggio, cm, vani, onCambioZona }: { montaggio: MontaggioRow; cm: any; vani: VanoCantiere[]; onCambioZona: (field: string, val: string) => void }) {
  const [zone, setZone] = useState<ZonaPianificazione[]>([nuovaZona(0)]);

  function addZona() { setZone(z => [...z, nuovaZona(z.length)]); }
  function updateZona(i: number, z: ZonaPianificazione) { setZone(prev => prev.map((p, idx) => idx === i ? z : p)); }
  function deleteZona(i: number) { setZone(prev => prev.filter((_, idx) => idx !== i)); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>

      <Card>
        <SezHeader icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>} title="Orario montaggio" sub="Pre-compilato — modifica se necessario" color="#28A0A0" />
        <div style={{ padding: "0 14px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Data", value: fmtData(montaggio.data_montaggio) },
            { label: "Inizio", value: formatHour(montaggio.ora_inizio) },
            { label: "Ore stimate", value: montaggio.ore_preventivate ? `${montaggio.ore_preventivate}h` : "—" },
          ].map(item => (
            <div key={item.label} style={{ background: C.whiteOff, borderRadius: 9, padding: "9px 10px" }}>
              <div style={{ fontSize: 9, color: C.navyDim, textTransform: "uppercase" as const, letterSpacing: ".4px", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.navyText }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.navyText }}>{zone.length} {zone.length === 1 ? "zona pianificata" : "zone pianificate"}</div>
        <button onClick={addZona} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 9, background: C.navy, color: C.white, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>
          Aggiungi zona
        </button>
      </div>

      {zone.map((z, i) => (
        <ZonaCard key={z.id} zona={z} index={i} onChange={zz => updateZona(i, zz)} onDelete={() => deleteZona(i)} montaggio={montaggio} />
      ))}

    </div>
  );
}

// ─── Tab Vani ────────────────────────────────────────────────────────────────

function TabVani({ vani, commessa_id }: { vani: VanoCantiere[]; commessa_id: string }) {
  const [filter, setFilter] = useState<string>("tutti");

  const grouped = useMemo(() => {
    const map = new Map<string, VanoCantiere[]>();
    vani.forEach(v => {
      const key = [v.piano || "—", v.corpo || "—", v.lato || "—"].join(" · ");
      const arr = map.get(key) || [];
      arr.push(v);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [vani]);

  const filtered = filter === "tutti" ? vani : vani.filter(v => v.stato_montaggio === filter);

  const statoMont = {
    fatto: { bg: C.greenSoft, fg: C.green, label: "Fatto" },
    in_corso: { bg: C.amberSoft, fg: C.amberDark, label: "In corso" },
    da_fare: { bg: C.white2, fg: C.navyDim, label: "Da fare" },
    bloccato: { bg: C.redSoft, fg: C.red, label: "Bloccato" },
  };

  const tots = { fatto: vani.filter(v => v.stato_montaggio === "fatto").length, in_corso: vani.filter(v => v.stato_montaggio === "in_corso").length, da_fare: vani.filter(v => v.stato_montaggio === "da_fare").length, bloccato: vani.filter(v => v.stato_montaggio === "bloccato").length };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {[
          { id: "tutti", label: "Tutti", n: vani.length },
          { id: "da_fare", label: "Da fare", n: tots.da_fare },
          { id: "in_corso", label: "In corso", n: tots.in_corso },
          { id: "fatto", label: "Fatti", n: tots.fatto },
          { id: "bloccato", label: "Bloccati", n: tots.bloccato },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ flex: "0 0 auto", padding: "6px 12px", borderRadius: 9, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit", background: filter === f.id ? C.navy : C.white, color: filter === f.id ? C.white : C.navyDim, boxShadow: C.shadowXs }}>
            {f.label}
            <span style={{ fontSize: 9, background: filter === f.id ? "rgba(255,255,255,.2)" : C.white2, color: filter === f.id ? C.white : C.navyDim, padding: "1px 5px", borderRadius: 5, fontWeight: 800 }}>{f.n}</span>
          </button>
        ))}
      </div>

      {vani.length === 0 ? (
        <Card>
          <div style={{ padding: 24, textAlign: "center", color: C.navyDim, fontSize: 13 }}>
            I vani vengono caricati dalla commessa al momento dell'apertura.<br />
            <span style={{ fontSize: 11, marginTop: 6, display: "block" }}>Apri la commessa e compila i vani nel rilievo per vederli qui.</span>
          </div>
        </Card>
      ) : (
        grouped.map(([zona, zvani]) => {
          const zvFiltered = zvani.filter(v => filter === "tutti" || v.stato_montaggio === filter);
          if (zvFiltered.length === 0) return null;
          const zFatti = zvani.filter(v => v.stato_montaggio === "fatto").length;
          return (
            <Card key={zona}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px 8px" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.navyText, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={2.5}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  {zona}
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: zFatti === zvani.length ? C.greenSoft : C.amberSoft, color: zFatti === zvani.length ? C.green : C.amberDark }}>{zFatti}/{zvani.length} vani</span>
              </div>
              <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 0 }}>
                {zvFiltered.map((v, i) => {
                  const sc = statoMont[v.stato_montaggio];
                  return (
                    <div key={v.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: i > 0 ? `0.5px solid ${C.border}` : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: v.stato_montaggio === "fatto" ? C.greenBright : C.navy, color: C.white, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {v.numero}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.navyText }}>{v.tipo || "Vano"}{v.sistema ? ` · ${v.sistema}` : ""}</div>
                        <div style={{ fontSize: 10, color: C.navyDim, marginTop: 2 }}>
                          {[v.larghezza && v.altezza ? `${v.larghezza}×${v.altezza}` : null, v.coloreInt, v.stanza ? `Stanza ${v.stanza}` : null, v.operatore_assegnato].filter(Boolean).join(" · ")}
                        </div>
                        {v.note && <div style={{ fontSize: 10, color: C.amberDark, marginTop: 2, fontStyle: "italic" }}>⚠ {v.note}</div>}
                      </div>
                      <Bdg label={sc.label} color={sc.fg} bg={sc.bg} />
                    </div>
                  );
                })}
              </div>
              <Prog value={zFatti} max={zvani.length} label={`${zFatti}/${zvani.length} completati`} />
            </Card>
          );
        })
      )}
    </div>
  );
}

// ─── Tab SAL ─────────────────────────────────────────────────────────────────

function TabSAL({ cm }: { cm: any }) {
  const totale = Number(cm?.totale_finale || cm?.totale_preventivo || 0);
  const acconto = totale * 0.3;
  const sal1 = totale * 0.4;
  const saldo = totale - acconto - sal1;
  const accontoPagato = !!(cm?.fattura_acconto_pagata_at);
  const sal1Raggiunto = false; // da collegare a avanzamento reale

  const voci = [
    { label: "Acconto 30%", sub: accontoPagato ? `Pagato ${cm?.fattura_acconto_pagata_at?.slice(0, 10) || ""}` : "Da emettere", val: acconto, stato: accontoPagato ? "incassata" : "da_emettere" },
    { label: "SAL 60% avanzamento", sub: sal1Raggiunto ? "Soglia raggiunta — emetti ora" : "In attesa avanzamento", val: sal1, stato: sal1Raggiunto ? "da_emettere" : "attesa" },
    { label: "Saldo finale", sub: "Dopo collaudo e verbale consegna", val: saldo, stato: "attesa" },
  ];

  const stati: Record<string, { bg: string; fg: string; label: string }> = {
    incassata: { bg: C.greenSoft, fg: C.green, label: "Incassata" },
    da_emettere: { bg: C.amberSoft, fg: C.amberDark, label: "Emetti ora" },
    attesa: { bg: C.white2, fg: C.navyDim, label: "In attesa" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <Card>
        <SezHeader icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><rect x={2} y={5} width={20} height={14} rx={2}/><line x1={2} y1={10} x2={22} y2={10}/></svg>} title="Stato avanzamento lavori" sub={`Valore commessa: ${fmtEur(totale)}`} color={C.amber} />
        <div style={{ padding: "0 14px 12px" }}>
          {voci.map((v, i) => {
            const s = stati[v.stato];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderTop: i > 0 ? `0.5px solid ${C.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.navyText }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: C.navyDim, marginTop: 1 }}>{v.sub}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: v.stato === "incassata" ? C.greenBright : C.navyText, marginBottom: 3 }}>{fmtEur(v.val)}</div>
                  <Bdg label={s.label} color={s.fg} bg={s.bg} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SezHeader icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1={16} y1={13} x2={8} y2={13}/><line x1={16} y1={17} x2={8} y2={17}/></svg>} title="Contabilità cantiere" sub="Costi, ore e materiali" color={C.navy} />
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { label: "Manodopera", val: Math.round(totale * 0.35), note: "Ore lavorate × tariffa" },
            { label: "Materiali", val: Math.round(totale * 0.45), note: "Da ordini fornitore" },
            { label: "Trasferta e mezzi", val: Math.round(totale * 0.05), note: "Km + noleggi" },
            { label: "Margine stimato", val: Math.round(totale * 0.15), note: "15% su valore commessa", green: true },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.whiteOff, borderRadius: 9, padding: "8px 11px" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.green ? C.greenBright : C.navyText }}>{item.label}</div>
                <div style={{ fontSize: 10, color: C.navyDim, marginTop: 1 }}>{item.note}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: item.green ? C.greenBright : C.navyText }}>{fmtEur(item.val)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab Sicurezza ───────────────────────────────────────────────────────────

function TabSicurezza({ montaggio, cm }: { montaggio: MontaggioRow; cm: any }) {
  const docs = [
    { label: "POS — Piano Operativo di Sicurezza", sub: "D.Lgs 81/08 · Obbligatorio per ogni cantiere", ok: true },
    { label: "EQF3/EQF4 certificazione posa", sub: "Obbligo dal 2026 per tutti i posatori", ok: true },
    { label: "Badge digitale operatori", sub: "D.L. 159/2025 · Codice univoco anticontraffazione", ok: true },
    { label: "DPI assegnati e verificati", sub: "Elmetto, guanti, cintura, scarpe antinfortunistiche", ok: true },
    { label: "Visita medica idoneità", sub: "Valida per tutti gli operatori", ok: true },
    { label: "Verbale consegna lavori", sub: "Da firmare a completamento con cliente", ok: false },
    { label: "Certificato garanzia EQF", sub: "Manuale cantiere + firma caposquadra", ok: false },
    { label: "Notifica preliminare ASL", sub: "Se cantiere > 200 uomini-giorno", ok: null },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <Card>
        <SezHeader icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} title="Documenti sicurezza" sub="D.Lgs 81/08 · Aggiornato 2026" color={C.red} />
        <div style={{ padding: "0 14px 12px" }}>
          {docs.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderTop: i > 0 ? `0.5px solid ${C.border}` : "none" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", background: d.ok === true ? C.greenSoft : d.ok === false ? C.redSoft : C.amberSoft }}>
                {d.ok === true ? (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
                ) : d.ok === false ? (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth={3}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
                ) : (
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.amberDark} strokeWidth={3}><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12} y2={16}/></svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.navyText }}>{d.label}</div>
                <div style={{ fontSize: 10, color: C.navyDim, marginTop: 1 }}>{d.sub}</div>
              </div>
              <Bdg
                label={d.ok === true ? "OK" : d.ok === false ? "Manca" : "Verifica"}
                color={d.ok === true ? C.green : d.ok === false ? C.red : C.amberDark}
                bg={d.ok === true ? C.greenSoft : d.ok === false ? C.redSoft : C.amberSoft}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab Diario ──────────────────────────────────────────────────────────────

function TabDiario({ montaggio }: { montaggio: MontaggioRow }) {
  const [nota, setNota] = useState("");
  const [note, setNote] = useState<{ testo: string; data: string; autore: string }[]>([
    { testo: "Iniziato lato SUD come concordato. Piano 3 Corpo B. Vano 01 completato.", data: "20 mag 08:45", autore: "Mario Rossi" },
    { testo: "Vano 02 bloccato — soglia ribassata non arrivata dal fornitore. Avvisato ufficio.", data: "20 mag 10:15", autore: "Luigi Bianchi" },
  ]);

  function addNota() {
    if (!nota.trim()) return;
    setNote(prev => [{ testo: nota, data: new Date().toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), autore: "Titolare" }, ...prev]);
    setNota("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <Card>
        <SezHeader icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>} title="Diario cantiere" sub="Note operative giornaliere" color="#7F77DD" />
        <div style={{ padding: "0 14px 12px" }}>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Scrivi una nota operativa, problema, aggiornamento..."
            style={{ width: "100%", minHeight: 72, padding: "10px 12px", borderRadius: 10, border: `0.5px solid ${C.borderStrong}`, background: C.whiteOff, color: C.navyText, fontSize: 12, fontFamily: "inherit", resize: "none" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={addNota} style={{ flex: 1, padding: "9px 0", borderRadius: 10, background: C.navy, color: C.white, fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Aggiungi nota
            </button>
            <button style={{ padding: "9px 14px", borderRadius: 10, background: C.whiteOff, color: C.navyDim, fontSize: 11, fontWeight: 800, border: `0.5px solid ${C.borderStrong}`, cursor: "pointer", fontFamily: "inherit" }}>
              📷 Foto
            </button>
            <button style={{ padding: "9px 14px", borderRadius: 10, background: C.whiteOff, color: C.navyDim, fontSize: 11, fontWeight: 800, border: `0.5px solid ${C.borderStrong}`, cursor: "pointer", fontFamily: "inherit" }}>
              🎤 Audio
            </button>
          </div>
        </div>
      </Card>

      {note.map((n, i) => (
        <Card key={i}>
          <div style={{ padding: "11px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.navyText }}>{n.autore}</div>
              <div style={{ fontSize: 10, color: C.navyDim }}>{n.data}</div>
            </div>
            <div style={{ fontSize: 12, color: C.navyText, lineHeight: 1.5 }}>{n.testo}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Componente principale ───────────────────────────────────────────────────

export default function CentroCantiere({ montaggio, commesse, aziendaId, onClose, onModifica }: Props) {
  const [tab, setTab] = useState<Tab>("pianifica");
  const [vani, setVani] = useState<VanoCantiere[]>([]);
  const [loadingVani, setLoadingVani] = useState(false);

  const cm = useMemo(() => commesse.find((c: any) => c.id === montaggio.commessa_id) || {} as any, [commesse, montaggio.commessa_id]);

  const nomeCliente = [cm.cliente || "", cm.cognome || ""].join(" ").trim() || "Cliente";
  const totale = Number(cm.totale_finale || cm.totale_preventivo || 0);
  const fmtOra = formatHour(montaggio.ora_inizio);
  const dataLabel = fmtData(montaggio.data_montaggio);

  // Carica vani da Supabase
  useEffect(() => {
    if (!montaggio.commessa_id || !aziendaId) return;
    setLoadingVani(true);
    supabase
      .from("vani")
      .select("*")
      .eq("commessa_id", montaggio.commessa_id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVani(data.map((v: any, i: number) => ({
            id: v.id,
            numero: i + 1,
            tipo: v.tipo || v.tipologia || "Vano",
            sistema: v.sistema || "",
            larghezza: v.larghezza || v.larghezza_mm || null,
            altezza: v.altezza || v.altezza_mm || null,
            piano: v.piano || null,
            corpo: v.corpo || v.ala || null,
            lato: v.lato || null,
            stanza: v.stanza || v.ambiente || null,
            coloreInt: v.coloreInt || v.colore_interno || null,
            coloreEst: v.coloreEst || v.colore_esterno || null,
            note: v.note || null,
            stato_montaggio: v.stato_montaggio || "da_fare",
            operatore_assegnato: v.operatore_assegnato || null,
          })));
        }
        setLoadingVani(false);
      })
      .catch(() => setLoadingVani(false));
  }, [montaggio.commessa_id, aziendaId]);

  const vaniCount = cm.commessa_vani_count || vani.length || 0;
  const vaniFatti = vani.filter(v => v.stato_montaggio === "fatto").length;
  const avanzPerc = vaniCount > 0 ? Math.round((vaniFatti / vaniCount) * 100) : 0;

  const TABS: { id: Tab; label: string }[] = [
    { id: "pianifica", label: "Pianifica" },
    { id: "vani", label: "Vani" },
    { id: "sal", label: "SAL" },
    { id: "sicurezza", label: "Sicurezza" },
    { id: "diario", label: "Diario" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bgApp, zIndex: 100, display: "flex", flexDirection: "column", maxWidth: 420, margin: "0 auto", height: "100vh" }}>

      {/* Header */}
      <div style={{ background: C.navy, flexShrink: 0 }}>
        <div style={{ padding: "env(safe-area-inset-top, 12px) 14px 10px", paddingTop: "max(env(safe-area-inset-top), 12px)", display: "flex", alignItems: "flex-start", gap: 10 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,.12)", border: "none", color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 2 }}>Centro Cantiere · da Commessa</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.white, letterSpacing: "-.4px", lineHeight: 1.1 }}>{nomeCliente}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.48)", marginTop: 2 }}>{montaggio.commessa_code || cm.code || ""} · {cm.indirizzo || "—"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: "#28A0A0", color: C.white, fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 6, marginBottom: 4 }}>
              {montaggio.stato === "in_corso" ? "In opera" : montaggio.stato === "programmato" ? "Programmato" : montaggio.stato === "completato" ? "Completato" : "Da pianif."}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)" }}>{dataLabel} · {fmtOra}</div>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5, padding: "0 14px 10px" }}>
          {[
            { n: avanzPerc + "%", l: "Avanzam.", t: true },
            { n: (montaggio.squadra?.filter(s => !/^[0-9a-f]{8}/i.test(s))?.length || 0).toString(), l: "Operatori" },
            { n: vaniCount > 0 ? `${vaniFatti}/${vaniCount}` : "—", l: "Vani", a: true },
            { n: totale > 0 ? (totale >= 1000 ? Math.round(totale / 1000) + "k€" : fmtEur(totale)) : "—", l: "Valore" },
          ].map((k, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "7px 5px", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: k.t ? "#5DCAA5" : k.a ? "#FAC775" : C.white, lineHeight: 1 }}>{k.n}</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,.43)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".3px" }}>{k.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", background: "rgba(0,0,0,.16)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: "0 0 auto", padding: "9px 14px", fontSize: 10, fontWeight: 800, color: tab === t.id ? C.white : "rgba(255,255,255,.37)", border: "none", background: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: ".4px", whiteSpace: "nowrap", borderBottom: tab === t.id ? "2px solid #28A0A0" : "2px solid transparent", fontFamily: "inherit" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 100px", display: "flex", flexDirection: "column", gap: 9 }}>

        {tab === "pianifica" && (
          <TabPianifica montaggio={montaggio} cm={cm} vani={vani} onCambioZona={() => {}} />
        )}
        {tab === "vani" && (
          <TabVani vani={vani} commessa_id={montaggio.commessa_id} />
        )}
        {tab === "sal" && <TabSAL cm={cm} />}
        {tab === "sicurezza" && <TabSicurezza montaggio={montaggio} cm={cm} />}
        {tab === "diario" && <TabDiario montaggio={montaggio} />}

      </div>

      {/* Footer azioni */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.white, borderTop: `1px solid ${C.border}`, padding: "10px 12px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, boxShadow: "0 -4px 16px rgba(26,42,71,.1)" }}>
        {cm.telefono && (
          <a href={`tel:${cm.telefono}`} style={{ textDecoration: "none" }}>
            <div style={{ padding: "10px 8px", borderRadius: 11, fontSize: 11, fontWeight: 800, border: `0.5px solid ${C.borderStrong}`, background: C.white, color: C.navyText, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Chiama
            </div>
          </a>
        )}
        <button onClick={() => { if (cm.indirizzo) window.open(`https://maps.google.com/?q=${encodeURIComponent(cm.indirizzo)}`, "_blank"); }} style={{ padding: "10px 8px", borderRadius: 11, fontSize: 11, fontWeight: 800, border: `0.5px solid ${C.borderStrong}`, background: C.white, color: C.navyText, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx={12} cy={10} r={3}/></svg>
          Naviga
        </button>
        <button onClick={onModifica} style={{ padding: "10px 8px", borderRadius: 11, fontSize: 11, fontWeight: 800, border: "none", background: C.navy, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Modifica
        </button>
      </div>

    </div>
  );
}
