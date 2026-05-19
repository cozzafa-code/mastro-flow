"use client";
import React, { useState } from "react";
import { QcHold, ResoCliente, DockSlot, CrossDockMatch } from "../../hooks/useMagazzinoTop";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// ============================================================
// VISTA QC HOLD (Quality Control)
// ============================================================

export function VistaQcHold({ mag }: { mag: any }) {
  const holds: QcHold[] = mag.qcHolds || [];
  const inAttesa = holds.filter(h => h.stato === "in_attesa");
  const bloccati = holds.filter(h => h.stato === "richiamato");

  return (
    <div>
      <AlertCard kind="warn" title={`${holds.length} articoli in quarantena`} sub="Da ispezionare prima dell'uso" icon="flag" />

      {inAttesa.length > 0 && (
        <Sez title="In quarantena" count={inAttesa.length}>
          {inAttesa.map(h => <QcRow key={h.id} h={h} onDecidi={(d) => mag.qcDecidi(h.id, d)} />)}
        </Sez>
      )}

      {bloccati.length > 0 && (
        <Sez title="Bloccati · richiamo fornitore" count={bloccati.length}>
          {bloccati.map(h => <QcRow key={h.id} h={h} onDecidi={(d) => mag.qcDecidi(h.id, d)} richiamo />)}
        </Sez>
      )}

      {holds.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>
          Nessun articolo in QC hold
        </div>
      )}
    </div>
  );
}

function QcRow({ h, onDecidi, richiamo }: { h: QcHold; onDecidi: (d: string) => void; richiamo?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: richiamo ? "#FCE3E3" : "#FBF0DC",
        color: richiamo ? RED : "#8B6926",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {richiamo ? <AlertIcon size={18} /> : <FrameIcon size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>{h.articolo_nome}</div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
          {h.ddt_numero && `DDT ${h.ddt_numero}`} {h.lotto && `· lotto ${h.lotto}`} · {h.quantita} pz
        </div>
        <div style={{
          fontSize: 9, fontWeight: 800, marginTop: 2,
          textTransform: "uppercase", letterSpacing: 0.3,
          color: richiamo ? RED : AMBER,
        }}>
          {richiamo ? "Bloccato · richiamo" : "Da controllare"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {richiamo ? (
          <button onClick={() => onDecidi("reso_fornitore")} style={btnRichiamo}>RESO</button>
        ) : (
          <>
            <button onClick={() => onDecidi("approvato")} style={{ ...qcBtn, background: GREEN }}>
              <CheckIcon size={11} />
            </button>
            <button onClick={() => onDecidi("respinto")} style={{ ...qcBtn, background: RED }}>
              <XIcon size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VISTA RESI CLIENTE
// ============================================================

export function VistaResi({ mag }: { mag: any }) {
  const resi: ResoCliente[] = mag.resi || [];

  const cnts = {
    arr: resi.filter(r => r.stato === "ritiro_programmato" || r.stato === "segnalato").length,
    qc: resi.filter(r => r.stato === "in_qc").length,
    ok: resi.filter(r => r.stato === "approvato" || r.stato === "nota_credito_emessa").length,
    no: resi.filter(r => r.stato === "respinto").length,
  };

  return (
    <div>
      <div style={sezStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
          <KpiBox label="In arr." value={cnts.arr} color={AMBER} />
          <KpiBox label="QC" value={cnts.qc} color="#2D5A8C" />
          <KpiBox label="OK" value={cnts.ok} color={GREEN} />
          <KpiBox label="Scarti" value={cnts.no} color={RED} />
        </div>
      </div>

      <Sez title="Resi attivi" count={resi.length}>
        {resi.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessun reso attivo
          </div>
        ) : resi.map(r => <ResoRow key={r.id} r={r} />)}
      </Sez>
    </div>
  );
}

function ResoRow({ r }: { r: ResoCliente }) {
  const stMap: Record<string, { bg: string; lbl: string; ico: string }> = {
    segnalato: { bg: AMBER, lbl: "Segnalato", ico: "alert" },
    ritiro_programmato: { bg: AMBER, lbl: "Ritiro prog.", ico: "truck" },
    in_qc: { bg: "#2D5A8C", lbl: "Quality check", ico: "shield" },
    approvato: { bg: GREEN, lbl: "Approvato", ico: "check" },
    respinto: { bg: RED, lbl: "Respinto", ico: "x" },
    nota_credito_emessa: { bg: GREEN, lbl: "Nota credito", ico: "check" },
  };
  const st = stMap[r.stato] || stMap.segnalato;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8,
        background: st.bg, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {st.ico === "truck" && <TruckIcon size={18} />}
        {st.ico === "shield" && <ShieldIcon size={18} />}
        {st.ico === "check" && <CheckIcon size={18} />}
        {st.ico === "x" && <XIcon size={18} />}
        {st.ico === "alert" && <AlertIcon size={18} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>
          {r.cliente_nome || "—"}
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {r.articolo_nome} · {r.motivo}
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, marginTop: 2, color: st.bg, textTransform: "uppercase" }}>
          {st.lbl}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>×{r.quantita}</div>
    </div>
  );
}

// ============================================================
// VISTA DOCK SLOTS
// ============================================================

export function VistaDockSlots({ mag }: { mag: any }) {
  const slots: DockSlot[] = mag.dockSlots || [];
  const conflitti = slots.filter(s => s.in_conflitto);

  return (
    <div>
      {conflitti.length > 0 && (
        <AlertCard kind="warn" title={`Conflitto ${conflitti.length} appuntamenti`} sub="Stesso orario · sposta uno" icon="alert" />
      )}

      <Sez title="Slot oggi">
        {slots.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessun appuntamento programmato
          </div>
        ) : slots.map(s => <DockRow key={s.id} s={s} />)}
      </Sez>
    </div>
  );
}

function DockRow({ s }: { s: DockSlot }) {
  const color = s.in_conflitto ? RED : (s.stato === "libero" ? MUTED : TEAL);
  const bg = s.in_conflitto ? "rgba(199,62,29,0.06)" : (s.stato === "libero" ? "#fff" : "rgba(40,160,160,0.06)");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 10px", background: bg, borderRadius: 7,
      borderLeft: `3px solid ${color}`, marginBottom: 4,
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, minWidth: 50, fontFamily: "SF Mono, monospace" }}>
        {s.ora_inizio?.slice(0, 5)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: NAVY }}>
          {s.fornitore_nome || s.cliente_nome || "Slot libero"} {s.ddt_numero && `· DDT ${s.ddt_numero}`}
        </div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>
          {s.ddt_descrizione || "Disponibile"}
        </div>
      </div>
      <span style={{ fontSize: 9, color, fontWeight: 800, textTransform: "uppercase" }}>
        {s.in_conflitto ? "CONFLITTO" : s.stato.toUpperCase()}
      </span>
    </div>
  );
}

// ============================================================
// VISTA CROSS-DOCK
// ============================================================

export function VistaCrossDock({ mag }: { mag: any }) {
  const xdocks: CrossDockMatch[] = mag.crossDock || [];

  return (
    <div>
      <AlertCard
        kind="good"
        title={`${xdocks.length} match cross-dock attivi`}
        sub="Risparmio stimato −4.2h/mese picking · −€85"
        icon="link"
      />

      <Sez title="Match automatico AI" count={xdocks.length}>
        {xdocks.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
            Nessun cross-dock pianificato
          </div>
        ) : xdocks.map(x => (
          <div key={x.id} style={{ padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: NAVY }}>{x.articolo_nome}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: TEAL }}>×{x.quantita}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, fontSize: 9.5, color: MUTED }}>
              <ArrIcon /> Match: {x.commessa_code} {x.commessa_cliente}
            </div>
            <div style={{ fontSize: 9, color: GREEN, fontWeight: 800, marginTop: 2 }}>
              → {x.furgone_nome || "Furgone"} · salta scaffale · risparmio {x.risparmio_min || 0} min
            </div>
          </div>
        ))}
      </Sez>
    </div>
  );
}

// ============================================================
// SHARED HELPERS
// ============================================================

const sezStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 13, padding: "11px 12px",
  marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
};

function Sez({ title, count, children }: any) {
  return (
    <div style={sezStyle}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: NAVY,
        letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{title}</span>
        {count !== undefined && (
          <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function AlertCard({ kind, title, sub, icon }: { kind: string; title: string; sub: string; icon: string }) {
  const cfg: any = {
    urg: { bg: "#FCE3E3", col: RED },
    warn: { bg: "#FBF0DC", col: "#8B6926" },
    info: { bg: "#E3EDF9", col: "#2D5A8C" },
    good: { bg: "#D5EBE0", col: GREEN },
  };
  const c = cfg[kind] || cfg.info;
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 9, fontSize: 11, marginBottom: 8,
      display: "flex", alignItems: "center", gap: 9,
      background: c.bg, color: c.col, borderLeft: `3px solid ${c.col}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 9.5, marginTop: 2, opacity: 0.9 }}>{sub}</div>
      </div>
    </div>
  );
}

function KpiBox({ label, value, color }: any) {
  return (
    <div style={{
      background: "#F7F9FB", padding: "7px 5px", borderRadius: 7,
      textAlign: "center", borderTop: `2px solid ${color}`,
    }}>
      <div style={{ fontSize: 8.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color }}>{value}</div>
    </div>
  );
}

const qcBtn: React.CSSProperties = {
  padding: "5px 9px", fontSize: 9, fontWeight: 800, borderRadius: 5,
  letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
};

const btnRichiamo: React.CSSProperties = {
  padding: "5px 9px", fontSize: 9, fontWeight: 800, borderRadius: 5,
  background: NAVY, color: "#fff", letterSpacing: 0.3, textTransform: "uppercase",
  border: "none", cursor: "pointer",
};

const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const AlertIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
  </svg>
);
const FrameIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
);
const TruckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ShieldIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const ArrIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
