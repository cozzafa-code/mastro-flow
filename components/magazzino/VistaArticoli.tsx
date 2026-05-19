"use client";
import React, { useMemo, useState } from "react";
import { ArticoloMagazzino, STATO_SCORTA_COLOR, STATO_SCORTA_LABEL, ABC_COLOR } from "../../hooks/useMagazzinoTop";
import { ModalCarico, ModalScarico, ModalRettifica, ModalNuovoArticolo, ModalCreaOrdine, ModalNuovoReso } from "./ModaliMagazzino";
import { ModalImport, ModalEtichette, ModalArchivia, ModalAudit } from "./MagazzinoEstensioni";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

type Filter = "tutti" | "sotto" | "profili" | "vetri" | "ferramenta" | "a" | "b" | "c";

export default function VistaArticoli({ mag }: { mag: any }) {
  const [filter, setFilter] = useState<Filter>("tutti");
  const [query, setQuery] = useState("");
  const [openArt, setOpenArt] = useState<any | null>(null);
  const [actionKind, setActionKind] = useState<"carico"|"scarico"|"rettifica"|"ordina"|null>(null);
  const [showNuovo, setShowNuovo] = useState(false);
  const [showReso, setShowReso] = useState(false);
  const aziendaId = (mag.articoli[0] as any)?.azienda_id || "ccca51c1-656b-4e7c-a501-55753e20da29";

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

  return (
    <div>
      {/* HERO valore + KPI */}
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
          FIFO ponderato · {mag.kpi?.n_articoli || 0} articoli · accuracy {mag.accuracy ? `${mag.accuracy}%` : "—"}
        </div>
      </div>

      {/* KPI box 4 stati */}
      <KpiRow kpi={mag.kpi} />

      {/* Bottoni azione */}
      <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
        <button onClick={() => setShowNuovo(true)} style={{
          flex: 1, padding: "11px 6px",
          background: "linear-gradient(180deg, #0F6E56, #0a4d3c)",
          color: "#fff", borderRadius: 9, fontSize: 11.5, fontWeight: 800,
          letterSpacing: 0.4, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>+ NUOVO ARTICOLO</button>
        <button onClick={() => setShowReso(true)} style={{
          padding: "11px 13px",
          background: "linear-gradient(180deg, #5C2D8C, #3D1E5E)",
          color: "#fff", borderRadius: 9, fontSize: 11, fontWeight: 800,
          letterSpacing: 0.3, textTransform: "uppercase", border: "none", cursor: "pointer",
        }}>RESO</button>
      </div>

      {/* Ricerca */}
      <div style={{ background: "#fff", borderRadius: 10, padding: "8px 10px", marginBottom: 9, display: "flex", alignItems: "center", gap: 8 }}>
        <SearchIcon />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per codice o nome..."
          style={{
            flex: 1, border: "none", outline: "none", fontSize: 12,
            color: NAVY, fontWeight: 600, background: "transparent",
          }}
        />
      </div>

      {/* Filtri pill */}
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

      {/* Sotto minimo (priorità) */}
      {filter === "tutti" && sottoMinimo.length > 0 && (
        <Sez title="Sotto minimo" count={sottoMinimo.length}>
          {sottoMinimo.map(a => <CardArticolo key={a.id} a={a} onClick={() => setOpenArt(a)} />)}
        </Sez>
      )}

      {/* OK */}
      {filter === "tutti" && ok.length > 0 && (
        <Sez title="Disponibili OK" count={ok.length}>
          {ok.slice(0, 20).map(a => <CardArticolo key={a.id} a={a} onClick={() => setOpenArt(a)} />)}
        </Sez>
      )}

      {/* Filtrati */}
      {filter !== "tutti" && (
        <Sez title="Risultati" count={filtered.length}>
          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>
              Nessun articolo trovato
            </div>
          ) : (
            filtered.map(a => <CardArticolo key={a.id} a={a} onClick={() => setOpenArt(a)} />)
          )}
        </Sez>
      )}

      {/* MODALI */}
      {openArt && !actionKind && (
        <MenuAzioniArticolo articolo={openArt} onClose={() => setOpenArt(null)} onPick={(k) => setActionKind(k)} />
      )}
      {openArt && actionKind === "carico" && (
        <ModalCarico mag={mag} articolo={openArt} onClose={() => { setActionKind(null); setOpenArt(null); }} />
      )}
      {openArt && actionKind === "scarico" && (
        <ModalScarico mag={mag} articolo={openArt} onClose={() => { setActionKind(null); setOpenArt(null); }} />
      )}
      {openArt && actionKind === "rettifica" && (
        <ModalRettifica mag={mag} articolo={openArt} onClose={() => { setActionKind(null); setOpenArt(null); }} />
      )}
      {openArt && actionKind === "ordina" && (
        <ModalCreaOrdine mag={mag} aziendaId={aziendaId} articolo={openArt} onClose={() => { setActionKind(null); setOpenArt(null); }} />
      )}
      {showNuovo && (
        <ModalNuovoArticolo mag={mag} aziendaId={aziendaId} onClose={() => setShowNuovo(false)} />
      )}
      {showReso && (
        <ModalNuovoReso mag={mag} aziendaId={aziendaId} onClose={() => setShowReso(false)} />
      )}
    </div>
  );
}

// ============================================================
// MENU AZIONI ARTICOLO
// ============================================================
function MenuAzioniArticolo({ articolo, onClose, onPick }: any) {
  const azioni = [
    { k: "carico", label: "CARICO", desc: "Aggiungi al magazzino", color: "#0F6E56" },
    { k: "scarico", label: "SCARICO", desc: "Preleva per commessa", color: "#C73E1D" },
    { k: "rettifica", label: "RETTIFICA", desc: "Correggi scorta", color: "#E8B05C" },
    { k: "ordina", label: "ORDINA", desc: "Crea ordine fornitore", color: "#28A0A0" },
  ];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 480, padding: 14,
      }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9.5, color: "#5C6B7A", fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{articolo.codice}</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1B3A5C" }}>{articolo.nome}</div>
          <div style={{ fontSize: 11, color: "#5C6B7A", marginTop: 2 }}>Scorta: <b style={{ color: "#1B3A5C" }}>{articolo.scorta_attuale}</b> {articolo.unita_misura}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {azioni.map((az) => (
            <button key={az.k} onClick={() => onPick(az.k)} style={{
              padding: "14px 10px", background: az.color, color: "#fff",
              borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5 }}>{az.label}</div>
              <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2, fontWeight: 600 }}>{az.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", marginTop: 10, padding: 11,
          background: "#fff", color: "#5C6B7A", border: "1px solid #D8DEE5",
          borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>Annulla</button>
      </div>
    </div>
  );
}

// ============================================================
// CARD ARTICOLO con cablaggi
// ============================================================

function CardArticolo({ a, onClick }: { a: ArticoloMagazzino; onClick?: () => void }) {
  const _onTapWrapper = onClick || (() => {});
  const cardClick = onClick;
  return (
    <div style={{ padding: "11px 0", borderBottom: "1px solid #E5EAF0" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <ArtImg articolo={a} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {a.abc_class && (
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: ABC_COLOR[a.abc_class], color: "#fff",
                fontSize: 9, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{a.abc_class}</span>
            )}
            <span style={{ fontSize: 9, color: "#8794A6", fontWeight: 700, fontFamily: "SF Mono, monospace", letterSpacing: 0.3 }}>
              {a.codice}
            </span>
          </div>
          <div style={{
            fontSize: 12.5, fontWeight: 700, color: NAVY, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {a.nome}
          </div>
          <div style={{ fontSize: 9.5, color: MUTED, marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Badge stato={a.stato_scorta} />
            <span>Min. <b style={{ color: NAVY }}>{a.scorta_minima}</b></span>
            {a.scaffale_codice && <span>Scaff. <b style={{ color: NAVY }}>{a.scaffale_codice}</b></span>}
            {a.in_qc_hold && (
              <span style={{ color: AMBER, fontWeight: 800, fontSize: 9 }}>QC HOLD</span>
            )}
          </div>
          <Cablaggi a={a} />
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, minWidth: 62 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{a.scorta_attuale}</div>
          <div style={{ fontSize: 9, color: "#8794A6", marginTop: -2 }}>{a.unita_misura}</div>
          <div style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>
            <b style={{ color: GREEN }}>{a.scorta_disponibile}</b> disp.
          </div>
          {a.scorta_riservata > 0 && (
            <div style={{ fontSize: 8.5, marginTop: 1 }}>
              <span style={{ color: "#E8830C" }}>{a.scorta_riservata} risv.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArtImg({ articolo }: { articolo: ArticoloMagazzino }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 8, background: "#F1F4F7",
      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#8794A6", position: "relative", overflow: "hidden",
    }}>
      {articolo.foto_url ? (
        <img src={articolo.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <FrameIcon size={22} />
      )}
      {articolo.qr_code && (
        <div style={{
          position: "absolute", bottom: -2, right: -2, width: 14, height: 14,
          background: NAVY, color: "#fff", borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid #fff",
        }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function Cablaggi({ a }: { a: ArticoloMagazzino }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 7 }}>
      {a.fornitore_nome && (
        <Cabl bg="#FBF0DC" color="#8B6926" border="#E8B05C">
          {a.fornitore_nome} {a.prezzo_acquisto ? `€${a.prezzo_acquisto}` : ""}
        </Cabl>
      )}
      {a.picks_30gg > 0 && (
        <Cabl bg="#E3EDF9" color="#2D5A8C" border="#2D5A8C">
          {a.picks_30gg} picks/m
        </Cabl>
      )}
    </div>
  );
}

function Cabl({ children, bg, color, border }: { children: React.ReactNode; bg: string; color: string; border: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontWeight: 700, padding: "2px 7px",
      borderRadius: 99, background: bg, color, border: `1px solid ${border}`,
    }}>{children}</span>
  );
}

function Badge({ stato }: { stato: string }) {
  const c = STATO_SCORTA_COLOR[stato] || MUTED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 99,
      color: "#fff", background: c, letterSpacing: 0.3, textTransform: "uppercase",
    }}>{STATO_SCORTA_LABEL[stato] || stato}</span>
  );
}

function Sez({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
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
          <span style={{
            background: NAVY, color: "#fff", padding: "1px 7px",
            borderRadius: 99, fontSize: 10, fontWeight: 800,
          }}>{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Pill({ children, active, onClick, count, warn, accent }: { children: React.ReactNode; active?: boolean; onClick: () => void; count?: number; warn?: boolean; accent?: "A" | "B" | "C" }) {
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

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
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
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
);
