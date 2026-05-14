"use client";
import React, { useMemo, useState } from "react";
import { ArticoloMagazzino, STATO_SCORTA_COLOR, STATO_SCORTA_LABEL, ABC_COLOR } from "../../hooks/useMagazzinoTop";
import { ModalCarico, ModalScarico, ModalRettifica, ModalNuovoArticolo, ModalCreaOrdine, ModalNuovoReso } from "./ModaliMagazzino";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

type Filter = "tutti" | "sotto" | "profili" | "vetri" | "ferramenta" | "a" | "b" | "c";
type ModalKind = "carico" | "scarico" | "rettifica" | "ordine" | "reso" | null;

export default function VistaArticoli({ mag }: { mag: any }) {
  const [filter, setFilter] = useState<Filter>("tutti");
  const [query, setQuery] = useState("");
  const [selectedArt, setSelectedArt] = useState<ArticoloMagazzino | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [showNuovo, setShowNuovo] = useState(false);
  const [showResoGen, setShowResoGen] = useState(false);

  const articoli: ArticoloMagazzino[] = mag.articoli || [];

  const filtered = useMemo(() => {
    let arr = articoli;
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(a => a.nome?.toLowerCase().includes(q) || a.codice?.toLowerCase().includes(q));
    }
    switch (filter) {
      case "sotto": arr = arr.filter(a => a.stato_scorta === "sotto_minimo" || a.stato_scorta === "esaurito"); break;
      case "profili": arr = arr.filter(a => a.tipo?.toLowerCase().includes("profilo") || a.codice?.includes("PRF")); break;
      case "vetri": arr = arr.filter(a => a.tipo?.toLowerCase().includes("vetro") || a.codice?.includes("VTR")); break;
      case "ferramenta": arr = arr.filter(a => a.codice?.includes("FER")); break;
      case "a": arr = arr.filter(a => a.abc_class === "A"); break;
      case "b": arr = arr.filter(a => a.abc_class === "B"); break;
      case "c": arr = arr.filter(a => a.abc_class === "C"); break;
    }
    return arr;
  }, [articoli, filter, query]);

  const sottoMinimo = articoli.filter(a => a.stato_scorta === "sotto_minimo" || a.stato_scorta === "esaurito");
  const ok = articoli.filter(a => a.stato_scorta === "ok");

  const openAction = (a: ArticoloMagazzino, kind: ModalKind) => {
    setSelectedArt(a);
    setModal(kind);
  };
  const closeModal = () => { setModal(null); setSelectedArt(null); };

  return (
    <div>
      {/* HERO valore */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
        borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
          Valore magazzino totale
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
          € {(mag.kpi?.valore_magazzino || 0).toLocaleString("it-IT", { minimumFractionDigits: 0 })}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          FIFO · {mag.kpi?.n_articoli || 0} articoli · accuracy {mag.accuracy ? `${mag.accuracy}%` : "—"}
        </div>
      </div>

      {/* KPI box */}
      <KpiRow kpi={mag.kpi} />

      {/* Azioni veloci globali */}
      <div style={{ display: "flex", gap: 7, marginBottom: 9 }}>
        <BtnPrimary onClick={() => setShowNuovo(true)} color={GREEN}>
          <PlusIcon size={13} /> NUOVO
        </BtnPrimary>
        <BtnPrimary onClick={() => setShowResoGen(true)} color={"#5C2D8C"}>
          <RotateIcon size={12} /> RESO
        </BtnPrimary>
      </div>

      {/* Ricerca */}
      <div style={{ background: "#fff", borderRadius: 10, padding: "8px 10px", marginBottom: 9, display: "flex", alignItems: "center", gap: 8 }}>
        <SearchIcon />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca per codice o nome..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 12, color: NAVY, fontWeight: 600, background: "transparent" }} />
      </div>

      {/* Filtri */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
        <Pill active={filter === "tutti"} onClick={() => setFilter("tutti")} count={articoli.length}>Tutti</Pill>
        <Pill warn active={filter === "sotto"} onClick={() => setFilter("sotto")} count={sottoMinimo.length}>Sotto</Pill>
        <Pill active={filter === "a"} onClick={() => setFilter("a")} count={mag.kpi?.n_class_a || 0} accent="A">A</Pill>
        <Pill active={filter === "b"} onClick={() => setFilter("b")} count={mag.kpi?.n_class_b || 0} accent="B">B</Pill>
        <Pill active={filter === "c"} onClick={() => setFilter("c")} count={mag.kpi?.n_class_c || 0} accent="C">C</Pill>
        <Pill active={filter === "profili"} onClick={() => setFilter("profili")}>Profili</Pill>
        <Pill active={filter === "vetri"} onClick={() => setFilter("vetri")}>Vetri</Pill>
        <Pill active={filter === "ferramenta"} onClick={() => setFilter("ferramenta")}>Ferr.</Pill>
      </div>

      {filter === "tutti" && sottoMinimo.length > 0 && (
        <Sez title="Sotto minimo" count={sottoMinimo.length}>
          {sottoMinimo.map(a => <CardArticolo key={a.id} a={a} onAction={openAction} />)}
        </Sez>
      )}

      {filter === "tutti" && ok.length > 0 && (
        <Sez title="Disponibili OK" count={ok.length}>
          {ok.slice(0, 20).map(a => <CardArticolo key={a.id} a={a} onAction={openAction} />)}
        </Sez>
      )}

      {filter !== "tutti" && (
        <Sez title="Risultati" count={filtered.length}>
          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>Nessun articolo trovato</div>
          ) : filtered.map(a => <CardArticolo key={a.id} a={a} onAction={openAction} />)}
        </Sez>
      )}

      {/* MODAL */}
      {modal === "carico" && selectedArt && <ModalCarico mag={mag} articolo={selectedArt} onClose={closeModal} />}
      {modal === "scarico" && selectedArt && <ModalScarico mag={mag} articolo={selectedArt} onClose={closeModal} />}
      {modal === "rettifica" && selectedArt && <ModalRettifica mag={mag} articolo={selectedArt} onClose={closeModal} />}
      {modal === "ordine" && selectedArt && (
        <ModalCreaOrdine
          mag={mag} articolo={selectedArt}
          aziendaId={articoli[0]?.id ? (articoli[0] as any).azienda_id : ""}
          onClose={closeModal}
        />
      )}
      {showNuovo && (
        <ModalNuovoArticolo
          mag={mag}
          aziendaId={(articoli[0] as any)?.azienda_id || "ccca51c1-656b-4e7c-a501-55753e20da29"}
          onClose={() => setShowNuovo(false)}
        />
      )}
      {showResoGen && (
        <ModalNuovoReso
          mag={mag}
          aziendaId={(articoli[0] as any)?.azienda_id || "ccca51c1-656b-4e7c-a501-55753e20da29"}
          onClose={() => setShowResoGen(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// CARD ARTICOLO con azioni tap
// ============================================================

function CardArticolo({ a, onAction }: { a: ArticoloMagazzino; onAction: (a: ArticoloMagazzino, kind: "carico" | "scarico" | "rettifica" | "ordine") => void }) {
  const [expanded, setExpanded] = useState(false);
  const isSotto = a.stato_scorta === "sotto_minimo" || a.stato_scorta === "esaurito";

  return (
    <div style={{
      padding: "10px 0", borderBottom: "1px solid #E5EAF0",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 8, background: "#F1F4F7",
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#8794A6", position: "relative",
        }}>
          {a.foto_url ? <img src={a.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : <FrameIcon size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {a.abc_class && (
              <span style={{
                width: 16, height: 16, borderRadius: 4, background: ABC_COLOR[a.abc_class], color: "#fff",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{a.abc_class}</span>
            )}
            <span style={{ fontSize: 9, color: "#8794A6", fontWeight: 700, fontFamily: "SF Mono, monospace" }}>{a.codice}</span>
          </div>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: NAVY, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{a.nome}</div>
          <div style={{ fontSize: 9.5, color: MUTED, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge stato={a.stato_scorta} />
            <span>Min. <b style={{ color: NAVY }}>{a.scorta_minima}</b></span>
            {a.scaffale_codice && <span>Scaff. <b style={{ color: NAVY }}>{a.scaffale_codice}</b></span>}
            {a.in_qc_hold && <span style={{ color: AMBER, fontWeight: 800, fontSize: 9 }}>QC HOLD</span>}
          </div>
          {a.fornitore_nome && (
            <div style={{ marginTop: 5 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 9, fontWeight: 700, padding: "2px 7px",
                borderRadius: 99, background: "#FBF0DC", color: "#8B6926",
                border: `1px solid ${AMBER}`,
              }}>{a.fornitore_nome} {a.prezzo_acquisto ? `€${a.prezzo_acquisto}` : ""}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 60 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{a.scorta_attuale}</div>
          <div style={{ fontSize: 9, color: "#8794A6", marginTop: -2 }}>{a.unita_misura}</div>
          <div style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>
            <b style={{ color: GREEN }}>{a.scorta_disponibile}</b> disp.
          </div>
        </div>
      </div>

      {/* Pannello azioni espandibile */}
      {expanded && (
        <div style={{
          display: "grid", gridTemplateColumns: isSotto ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          gap: 5, marginTop: 9, paddingTop: 9, borderTop: "1px dashed #D8DEE5",
        }}>
          <ActionBtn icon={<PlusIcon size={13} />} label="CARICO" color={GREEN} onClick={(e) => { e.stopPropagation(); onAction(a, "carico"); }} />
          <ActionBtn icon={<MinusIcon size={13} />} label="SCARICO" color={TEAL} onClick={(e) => { e.stopPropagation(); onAction(a, "scarico"); }} disabled={a.scorta_disponibile <= 0} />
          <ActionBtn icon={<EqualsIcon size={13} />} label="RETTIFICA" color={AMBER} onClick={(e) => { e.stopPropagation(); onAction(a, "rettifica"); }} />
          {isSotto && (
            <ActionBtn icon={<TruckIcon size={13} />} label="ORDINA" color={RED} onClick={(e) => { e.stopPropagation(); onAction(a, "ordine"); }} />
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "9px 4px", background: disabled ? "#E5EAF0" : color, color: "#fff",
      borderRadius: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3,
      textTransform: "uppercase", border: "none", cursor: disabled ? "not-allowed" : "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
      opacity: disabled ? 0.5 : 1,
    }}>{icon}{label}</button>
  );
}

function BtnPrimary({ children, onClick, color }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px", background: color || TEAL, color: "#fff",
      borderRadius: 9, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
      textTransform: "uppercase", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      boxShadow: `0 2px 6px ${color}40`,
    }}>{children}</button>
  );
}

function Badge({ stato }: { stato: string }) {
  const c = STATO_SCORTA_COLOR[stato] || MUTED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", fontSize: 8, fontWeight: 800,
      padding: "2px 6px", borderRadius: 99, color: "#fff", background: c,
      letterSpacing: 0.3, textTransform: "uppercase",
    }}>{STATO_SCORTA_LABEL[stato] || stato}</span>
  );
}

function Sez({ title, count, children }: any) {
  return (
    <div style={{
      background: "#fff", borderRadius: 13, padding: "11px 12px",
      marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    }}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8,
        textTransform: "uppercase", marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{title}</span>
        {count !== undefined && (
          <span style={{ background: NAVY, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 800 }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, active, onClick, count, warn, accent }: any) {
  const baseBg = warn ? (active ? RED : "#FCE3E3") : (active ? TEAL : "#fff");
  const baseCol = warn ? (active ? "#fff" : RED) : (active ? "#fff" : MUTED);
  const baseBorder = warn ? RED : (active ? "#1a6b6b" : "#D8DEE5");
  return (
    <button onClick={onClick} style={{
      padding: "5px 10px", background: baseBg, borderRadius: 99,
      fontSize: 10, fontWeight: 800, color: baseCol,
      border: `1px solid ${baseBorder}`, letterSpacing: 0.3, textTransform: "uppercase",
      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      {accent && (
        <span style={{
          width: 12, height: 12, borderRadius: 3,
          background: ABC_COLOR[accent], color: "#fff", fontSize: 8, fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>{accent}</span>
      )}
      {children}
      {count !== undefined && (
        <span style={{
          background: active ? "rgba(255,255,255,0.3)" : "#E5EAF0",
          color: active ? "#fff" : MUTED, padding: "0 5px",
          borderRadius: 99, fontSize: 9,
        }}>{count}</span>
      )}
    </button>
  );
}

function KpiRow({ kpi }: { kpi: any }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 13, padding: "11px 12px",
      marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
        <KpiBox label="OK" value={kpi?.n_ok || 0} color={GREEN} />
        <KpiBox label="Att." value={kpi?.n_attenzione || 0} color={AMBER} />
        <KpiBox label="Sotto" value={kpi?.n_sotto_minimo || 0} color="#E8830C" />
        <KpiBox label="Out" value={kpi?.n_esauriti || 0} color={RED} />
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

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const FrameIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
);
const PlusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MinusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const EqualsIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/>
  </svg>
);
const TruckIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const RotateIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);
