"use client";
import React, { useState } from "react";
import { useMagazzinoTop } from "../../hooks/useMagazzinoTop";
import VistaArticoli from "./VistaArticoli";
import VistaMovimenti from "./VistaMovimenti";
import VistaRiordini from "./VistaRiordini";
import VistaInventario from "./VistaInventario";
import VistaLabor from "./VistaLabor";
import VistaMappa from "./VistaMappa";
import VistaCycleCount from "./VistaCycleCount";
import OrdineRapido30s from "./OrdineRapido30s";
import { VistaFurgoniContenuto, VistaCantieriContenuto, VistaLocalizzazioneArticoli } from "./ViewsCrossModulo";
import VistaListaSpesa from "./VistaListaSpesa";
import ModalOrdineMultiRiga from "./ModalOrdineMultiRiga";
import ScannerQR from "./ScannerQR";
import { VistaAbcAnalysis, VistaGroupBuying, VistaWavePicking } from "./VisteMagazzinoSet1";
import { VistaQcHold, VistaResi, VistaDockSlots, VistaCrossDock } from "./VisteMagazzinoSet2";

// Design system fliwoX
export const NAVY = "#1B3A5C";
export const NAVY_DEEP = "#0F1F33";
export const TEAL = "#28A0A0";
export const TEAL_DARK = "#1a6b6b";
export const BG = "#7A8A9A";
export const RED = "#C73E1D";
export const AMBER = "#E8B05C";
export const GREEN = "#0F6E56";
export const MUTED = "#5C6B7A";

export type ModuloVista =
  | "articoli" | "movimenti" | "riordini" | "inventario"
  | "abc" | "wave" | "qc" | "resi" | "dock" | "groupbuying"
  | "labor" | "crossdock" | "mappa" | "cyclecount"
  | "ordine30s" | "scanner" | "furgoni" | "cantieri" | "localizzazione" | "lista";

interface Props {
  aziendaId: string;
  onClose: () => void;
  vistaIniziale?: ModuloVista;
}

export default function ModuloMagazzino({ aziendaId, onClose, vistaIniziale = "articoli" }: Props) {
  const [vista, setVista] = useState<ModuloVista>(vistaIniziale);
  const mag = useMagazzinoTop(aziendaId);

  // Vista corrente
  const renderVista = () => {
    switch (vista) {
      case "articoli": return <VistaArticoli mag={mag} />;
      case "movimenti": return <VistaMovimenti mag={mag} />;
      case "riordini": return <VistaRiordini mag={mag} onOrdineRapido={() => setVista("ordine30s")} />;
      case "inventario": return <VistaInventario mag={mag} />;
      case "abc": return <VistaAbcAnalysis mag={mag} />;
      case "wave": return <VistaWavePicking mag={mag} />;
      case "qc": return <VistaQcHold mag={mag} />;
      case "resi": return <VistaResi mag={mag} />;
      case "dock": return <VistaDockSlots mag={mag} />;
      case "groupbuying": return <VistaGroupBuying mag={mag} />;
      case "labor": return <VistaLabor mag={mag} />;
      case "crossdock": return <VistaCrossDock mag={mag} />;
      case "mappa": return <VistaMappa mag={mag} />;
      case "cyclecount": return <VistaCycleCount mag={mag} />;
      case "ordine30s": return <OrdineRapido30s mag={mag} onBack={() => setVista("riordini")} />;
      case "scanner": return <ScannerQR mag={mag} onBack={() => setVista("articoli")} />;
      case "furgoni": return <VistaFurgoniContenuto aziendaId={aziendaId} />;
      case "cantieri": return <VistaCantieriContenuto aziendaId={aziendaId} />;
      case "localizzazione": return <VistaLocalizzazioneArticoli aziendaId={aziendaId} />;
      case "lista": return <VistaListaSpesa aziendaId={aziendaId} mag={mag} />;
      default: return <VistaArticoli mag={mag} />;
    }
  };

  // Tab principale visibile solo nelle 4 viste base
  const showMainTabs = ["articoli","movimenti","riordini","inventario"].includes(vista);

  return (
    <div style={{
      position: "fixed", inset: 0, background: BG, zIndex: 1000,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* HEADER NAVY */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
        color: "#fff", padding: "14px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(40,160,160,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", color: TEAL,
          }}>
            <PkgIcon size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: TEAL, fontWeight: 700, textTransform: "uppercase" }}>
              Magazzino
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>
              {mag.kpi?.n_articoli || 0} art. · € {(mag.kpi?.valore_magazzino || 0).toLocaleString("it-IT")}
            </div>
          </div>
          <button
            onClick={() => setVista("scanner")}
            style={{
              width: 32, height: 32, borderRadius: 8, background: TEAL,
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
            }}
          >
            <QrIcon size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.1)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer",
            }}
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* TAB principali */}
        {showMainTabs && (
          <div style={{
            display: "flex", gap: 1, background: "rgba(255,255,255,0.08)",
            borderRadius: 10, padding: 2, marginTop: 12,
          }}>
            <MainTab label="Articoli" active={vista === "articoli"} onClick={() => setVista("articoli")} />
            <MainTab label="Movim." active={vista === "movimenti"} onClick={() => setVista("movimenti")} />
            <MainTab
              label="Riordini"
              count={mag.kpi?.n_sotto_minimo}
              active={vista === "riordini"}
              onClick={() => setVista("riordini")}
            />
            <MainTab label="Inv." active={vista === "inventario"} onClick={() => setVista("inventario")} />
          </div>
        )}
      </div>

      {/* QUICK ACTION BAR (visibile solo in articoli) */}
      {vista === "articoli" && (
        <div style={{ background: BG, padding: "8px 12px 0", flexShrink: 0 }}>
          <div style={{
            background: "#fff", borderRadius: 10, padding: "8px 6px",
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
          }}>
            <QuickAction icon={<MapIcon size={14} />} label="Mappa" onClick={() => setVista("mappa")} />
            <QuickAction icon={<PieIcon size={14} />} label="ABC" onClick={() => setVista("abc")} />
            <QuickAction icon={<ZapIcon size={14} />} label="Wave" onClick={() => setVista("wave")} color={TEAL} />
            <QuickAction
              icon={<ShieldIcon size={14} />}
              label="QC"
              onClick={() => setVista("qc")}
              count={mag.qcHolds.filter(q => q.stato === "in_attesa").length}
              color={AMBER}
            />
            <QuickAction
              icon={<RotateIcon size={14} />}
              label="Resi"
              onClick={() => setVista("resi")}
              count={mag.resi.length}
              color={"#5C2D8C"}
            />
            <QuickAction icon={<ListIcon size={14} />} label="Lista" onClick={() => setVista("lista")} color={GREEN} />
            <QuickAction icon={<CartIcon size={14} />} label="Nuovo Ord." onClick={() => setShowOrdineMulti(true)} color={TEAL} />
          </div>
          <div style={{
            background: "#fff", borderRadius: 10, padding: "8px 6px", marginTop: 5,
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
          }}>
            <QuickAction icon={<TruckIcon2 size={14} />} label="Furgoni" onClick={() => setVista("furgoni")} color={AMBER} />
            <QuickAction icon={<BuildIcon size={14} />} label="Cantieri" onClick={() => setVista("cantieri")} color={"#5C2D8C"} />
            <QuickAction icon={<MapPinIcon size={14} />} label="Dove" onClick={() => setVista("localizzazione")} color={TEAL} />
            <QuickAction icon={<CalIcon size={14} />} label="Dock" onClick={() => setVista("dock")} />
            <QuickAction icon={<LinkIcon size={14} />} label="X-Dock" onClick={() => setVista("crossdock")} color={TEAL} />
            <QuickAction icon={<TargetIcon size={14} />} label="Conta" onClick={() => setVista("cyclecount")} />
          </div>
          <div style={{
            background: "#fff", borderRadius: 10, padding: "8px 6px", marginTop: 5,
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
          }}>
            <QuickAction icon={<TrendIcon size={14} />} label="Team" onClick={() => setVista("labor")} color={GREEN} />
            <QuickAction icon={<BoltIcon size={14} />} label="30s" onClick={() => setVista("ordine30s")} color={AMBER} />
            <QuickAction icon={<QrIcon size={14} />} label="Scan" onClick={() => setVista("scanner")} color={NAVY} />
            <QuickAction icon={<ListIcon size={14} />} label="Lista" onClick={() => setVista("lista")} color={GREEN} />
            <QuickAction icon={<CartIcon size={14} />} label="Nuovo Ord." onClick={() => setShowOrdineMulti(true)} color={TEAL} />
            <QuickAction icon={<ShieldIcon size={14} />} label="QC" onClick={() => setVista("qc")} count={mag.qcHolds.filter((q: any) => q.stato === "in_attesa").length} color={AMBER} />
            <QuickAction icon={<RotateIcon size={14} />} label="Resi" onClick={() => setVista("resi")} count={mag.resi.length} color={"#5C2D8C"} />
          </div>
        </div>
      )}

      {/* BODY */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {mag.loading ? <Loader /> : renderVista()}
      </div>
    {showOrdineMulti && (
        <ModalOrdineMultiRiga aziendaId={aziendaId} mag={mag} onClose={() => setShowOrdineMulti(false)} />
      )}
    </div>
  );
}

// ============================================================
// COMPONENTI INTERNI
// ============================================================

function MainTab({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "8px 4px", fontSize: 9.5, fontWeight: 800,
        letterSpacing: 0.4, textTransform: "uppercase",
        color: active ? NAVY : "rgba(255,255,255,0.5)",
        borderRadius: 8, textAlign: "center",
        background: active ? TEAL : "transparent",
        border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span style={{
          background: active ? NAVY : RED, color: "#fff",
          fontSize: 8, padding: "1px 4px", borderRadius: 99, minWidth: 14, textAlign: "center",
        }}>{count}</span>
      )}
    </button>
  );
}

function QuickAction({ icon, label, onClick, count, color }: { icon: React.ReactNode; label: string; onClick: () => void; count?: number; color?: string }) {
  return (
    <button onClick={onClick} style={{
      position: "relative", background: "transparent", border: "none",
      cursor: "pointer", padding: 0, display: "flex", flexDirection: "column",
      alignItems: "center", gap: 3,
    }}>
      {count !== undefined && count > 0 && (
        <span style={{
          position: "absolute", top: -3, right: -3, background: RED, color: "#fff",
          fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 99,
          minWidth: 14, textAlign: "center", lineHeight: 1.3,
        }}>{count}</span>
      )}
      <div style={{
        width: 30, height: 30, borderRadius: 7, background: color || NAVY,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 8.5, fontWeight: 800, color: NAVY, letterSpacing: 0.2, textTransform: "uppercase" }}>
        {label}
      </div>
    </button>
  );
}

function Loader() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>
      Caricamento magazzino...
    {showOrdineMulti && (
        <ModalOrdineMultiRiga aziendaId={aziendaId} mag={mag} onClose={() => setShowOrdineMulti(false)} />
      )}
    </div>
  );
}

// ============================================================
// SVG ICONS (inline, no lucide)
// ============================================================

const sw = 2;
const ico = (size: number, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const PkgIcon = ({ size = 16 }) => ico(size, <>
  <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
  <line x1="12" y1="22.08" x2="12" y2="12"/>
</>);

const QrIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
    <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/>
    <rect x="19" y="19" width="2" height="2"/>
  </svg>
);

const XIcon = ({ size = 16 }) => ico(size, <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>);
const MapIcon = ({ size = 16 }) => ico(size, <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>);
const PieIcon = ({ size = 16 }) => ico(size, <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>);
const ZapIcon = ({ size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const ShieldIcon = ({ size = 16 }) => ico(size, <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>);
const RotateIcon = ({ size = 16 }) => ico(size, <><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></>);
const UsersIcon = ({ size = 16 }) => ico(size, <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>);
const CalIcon = ({ size = 16 }) => ico(size, <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>);
const LinkIcon = ({ size = 16 }) => ico(size, <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>);
const TargetIcon = ({ size = 16 }) => ico(size, <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>);
const TrendIcon = ({ size = 16 }) => ico(size, <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>);
const ListIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const CartIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const TruckIcon2 = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const BuildIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>
  </svg>
);
const MapPinIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const BoltIcon = ({ size = 16 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
