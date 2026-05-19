// components/BulkEditBar.tsx
// Barra sticky in fondo al workspace preventivo quando >=1 vani sono selezionati.
// Menu azioni per modifiche massive: aspetto, telaio, accessori, prezzi, contesto, bulk.

import React, { useState } from "react";

type Props = {
  selectedIds: number[];
  totalVani: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onApply: (action: string, value: any) => void;
  coloriDB?: any[];
  sistemiDB?: any[];
  vetriDB?: any[];
  coprifiliDB?: any[];
};

const T = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  tealBg: "#E1F5EE",
  tealDark: "#0F6E56",
  lightBg: "#EEF8F8",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  warn: "#ff9500",
  warnBg: "#FAEEDA",
  danger: "#DC2626",
};

type Category = "aspetto" | "telaio" | "accessori" | "prezzi" | "contesto" | "bulk" | null;

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "aspetto", label: "Aspetto", icon: "🎨" },
  { id: "telaio", label: "Telaio", icon: "🪟" },
  { id: "accessori", label: "Accessori", icon: "⚙️" },
  { id: "prezzi", label: "Prezzi", icon: "€" },
  { id: "contesto", label: "Contesto", icon: "📍" },
  { id: "bulk", label: "Azioni", icon: "⚡" },
];

const COLORI_OPTS = ["Bianco", "Marrone", "Antracite", "Nero", "Quercia", "Ciliegio", "Noce"];
const SISTEMI_OPTS = ["Alluminio", "PVC", "Legno", "Legno/Alluminio"];
const VETRI_OPTS = ["Standard 4/16/4", "Triplo 4/12/4/12/4", "Antieffrazione", "Basso emissivo"];
const APERTURA_OPTS = ["Interna", "Esterna", "Scorrevole", "A ribalta", "Fissa"];
const TELAIO_OPTS = ["Nessuno", "In legno", "In alluminio", "In PVC"];
const COPRIFILO_OPTS = ["Bianco", "Marrone", "Antracite", "Rovere", "Noce"];
const CT_OPTS = ["Nessuno", "In legno", "In alluminio", "In PVC", "Monoblocco"];
const STANZA_OPTS = ["Cucina", "Salotto", "Camera", "Camera matrimoniale", "Bagno", "Corridoio", "Ingresso", "Studio", "Balcone"];
const PIANO_OPTS = ["PT", "P1", "P2", "P3", "Mansarda", "Seminterrato"];

export default function BulkEditBar({
  selectedIds,
  totalVani,
  onClearSelection,
  onSelectAll,
  onApply,
}: Props) {
  const [activeCat, setActiveCat] = useState<Category>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState<any>("");

  const n = selectedIds.length;
  if (n === 0) return null;

  const cardBtn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#fff",
    border: `1px solid ${T.border}`,
    color: T.textDark,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
  };

  const chipBtn = (sel: boolean): React.CSSProperties => ({
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    background: sel ? T.teal : T.lightBg,
    color: sel ? "#fff" : T.textDark,
    border: `1px solid ${sel ? T.teal : T.border}`,
    userSelect: "none" as const,
  });

  const doApply = (action: string, value: any) => {
    onApply(action, value);
    setShowModal(null);
    setActiveCat(null);
    setModalValue("");
  };

  // === MODAL CONTENUTO ===
  const renderModal = () => {
    if (!showModal) return null;

    const modalTitles: Record<string, string> = {
      colore: "Cambia colore profilo",
      sistema: "Cambia sistema",
      vetro: "Cambia vetro",
      apertura: "Cambia apertura",
      telaio: "Cambia telaio",
      coprifilo: "Cambia coprifilo",
      controtelaio: "Cambia controtelaio",
      davanzale: "Imposta davanzale",
      soglia: "Imposta soglia",
      tapparella: "Tapparelle",
      persiana: "Persiane",
      zanzariera: "Zanzariere",
      pezzi: "Imposta pezzi",
      prezzo_manuale: "Imposta prezzo unitario",
      sconto_perc: "Applica sconto/maggiorazione %",
      stanza: "Cambia stanza",
      piano: "Cambia piano",
      note_append: "Aggiungi nota (a tutti)",
      duplica: "Duplica selezionati",
      elimina: "Elimina selezionati",
      stato_misure: "Stato misure",
    };

    const options: Record<string, string[]> = {
      colore: COLORI_OPTS,
      sistema: SISTEMI_OPTS,
      vetro: VETRI_OPTS,
      apertura: APERTURA_OPTS,
      telaio: TELAIO_OPTS,
      coprifilo: COPRIFILO_OPTS,
      controtelaio: CT_OPTS,
      stanza: STANZA_OPTS,
      piano: PIANO_OPTS,
    };

    return (
      <div onClick={() => setShowModal(null)} style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(13,31,31,0.6)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: "#fff", borderRadius: "16px 16px 0 0",
          padding: 20, width: "100%", maxWidth: 560,
          maxHeight: "80vh", overflow: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.textDark }}>
              {modalTitles[showModal]}
            </div>
            <button onClick={() => setShowModal(null)} style={{
              background: "transparent", border: "none",
              fontSize: 20, cursor: "pointer", color: T.textSub,
            }}>×</button>
          </div>

          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 14 }}>
            Applico a {n} vano{n > 1 ? "i" : ""} selezionato{n > 1 ? "i" : ""}.
          </div>

          {/* Chips semplici */}
          {options[showModal] && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {options[showModal].map(o => (
                <div key={o}
                  onClick={() => doApply(showModal, o)}
                  style={chipBtn(false)}>
                  {o}
                </div>
              ))}
            </div>
          )}

          {/* Davanzale, soglia (input testo) */}
          {(showModal === "davanzale" || showModal === "soglia") && (
            <div>
              <input
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                placeholder="es. Marmo travertino 30 cm"
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box" as const, marginBottom: 12,
                }}
              />
              <button onClick={() => doApply(showModal, modalValue)} style={{
                width: "100%", padding: 12, borderRadius: 8,
                background: T.teal, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Applica</button>
            </div>
          )}

          {/* Accessori: toggle + tipo */}
          {(showModal === "tapparella" || showModal === "persiana" || showModal === "zanzariera") && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6, textTransform: "uppercase" }}>Azione</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div onClick={() => doApply(showModal, { attivo: true, tipo: "" })} style={chipBtn(false)}>✓ Attiva</div>
                  <div onClick={() => doApply(showModal, { attivo: false })} style={chipBtn(false)}>✗ Disattiva</div>
                </div>
              </div>
              {showModal === "tapparella" && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6, textTransform: "uppercase" }}>Tipo tapparella</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Alluminio coibentato", "PVC", "Legno", "Elettrica"].map(t => (
                      <div key={t} onClick={() => doApply(showModal, { attivo: true, tipo: t })} style={chipBtn(false)}>{t}</div>
                    ))}
                  </div>
                </div>
              )}
              {showModal === "persiana" && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, marginBottom: 6, textTransform: "uppercase" }}>Tipo persiana</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Alluminio", "Legno", "Blindata"].map(t => (
                      <div key={t} onClick={() => doApply(showModal, { attivo: true, tipo: t })} style={chipBtn(false)}>{t}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pezzi / Prezzo / Sconto (numerico) */}
          {(showModal === "pezzi" || showModal === "prezzo_manuale" || showModal === "sconto_perc") && (
            <div>
              <input
                type="number"
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                placeholder={
                  showModal === "pezzi" ? "1, 2, 3..." :
                  showModal === "prezzo_manuale" ? "0.00" :
                  "es. -10 (sconto) o 15 (maggiorazione)"
                }
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box" as const, marginBottom: 12,
                }}
              />
              <button onClick={() => doApply(showModal, parseFloat(modalValue) || 0)} style={{
                width: "100%", padding: 12, borderRadius: 8,
                background: T.teal, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Applica</button>
            </div>
          )}

          {/* Note append */}
          {showModal === "note_append" && (
            <div>
              <textarea
                value={modalValue}
                onChange={e => setModalValue(e.target.value)}
                rows={3}
                placeholder="Testo da aggiungere alle note esistenti..."
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 8, border: `1px solid ${T.border}`,
                  fontSize: 13, fontFamily: "inherit",
                  boxSizing: "border-box" as const, marginBottom: 12,
                  resize: "vertical" as const,
                }}
              />
              <button onClick={() => doApply(showModal, modalValue)} style={{
                width: "100%", padding: 12, borderRadius: 8,
                background: T.teal, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Aggiungi nota</button>
            </div>
          )}

          {/* Duplica */}
          {showModal === "duplica" && (
            <div>
              <div style={{ fontSize: 13, color: T.textSub, marginBottom: 14 }}>
                Quante copie per ciascun vano?
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 5, 10].map(n => (
                  <div key={n} onClick={() => doApply("duplica", n)} style={{ ...chipBtn(false), flex: 1, textAlign: "center" as const }}>×{n}</div>
                ))}
              </div>
            </div>
          )}

          {/* Elimina conferma */}
          {showModal === "elimina" && (
            <div>
              <div style={{ padding: 14, background: `${T.danger}10`, borderRadius: 8, marginBottom: 14, color: T.danger, fontSize: 13, fontWeight: 600 }}>
                ⚠ Stai per eliminare {n} vani. L'azione è irreversibile.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowModal(null)} style={{
                  flex: 1, padding: 12, borderRadius: 8,
                  background: "#fff", color: T.textSub, border: `1px solid ${T.border}`,
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Annulla</button>
                <button onClick={() => doApply("elimina", true)} style={{
                  flex: 1, padding: 12, borderRadius: 8,
                  background: T.danger, color: "#fff", border: "none",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>Elimina {n} vani</button>
              </div>
            </div>
          )}

          {/* Stato misure */}
          {showModal === "stato_misure" && (
            <div style={{ display: "flex", gap: 6 }}>
              <div onClick={() => doApply("stato_misure", "provvisorie")} style={chipBtn(false)}>Provvisorie</div>
              <div onClick={() => doApply("stato_misure", "confermate")} style={chipBtn(false)}>✓ Confermate</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // === RENDER MENU CATEGORIA ATTIVA ===
  const renderCategoryMenu = () => {
    if (!activeCat) return null;

    const menuItems: Record<Exclude<Category, null>, { label: string; action: string }[]> = {
      aspetto: [
        { label: "Colore profilo", action: "colore" },
        { label: "Sistema", action: "sistema" },
        { label: "Vetro", action: "vetro" },
        { label: "Apertura", action: "apertura" },
      ],
      telaio: [
        { label: "Telaio/Rifilato", action: "telaio" },
        { label: "Coprifilo", action: "coprifilo" },
        { label: "Controtelaio", action: "controtelaio" },
        { label: "Davanzale", action: "davanzale" },
        { label: "Soglia", action: "soglia" },
      ],
      accessori: [
        { label: "Tapparella", action: "tapparella" },
        { label: "Persiana", action: "persiana" },
        { label: "Zanzariera", action: "zanzariera" },
      ],
      prezzi: [
        { label: "Imposta pezzi", action: "pezzi" },
        { label: "Prezzo unitario", action: "prezzo_manuale" },
        { label: "Sconto / Maggior. %", action: "sconto_perc" },
      ],
      contesto: [
        { label: "Stanza", action: "stanza" },
        { label: "Piano", action: "piano" },
        { label: "Aggiungi nota", action: "note_append" },
      ],
      bulk: [
        { label: "Duplica", action: "duplica" },
        { label: "Stato misure", action: "stato_misure" },
        { label: "Elimina", action: "elimina" },
      ],
    };

    return (
      <div style={{
        position: "absolute", bottom: "100%", left: 0, right: 0,
        background: "#fff", borderTop: `1px solid ${T.border}`,
        padding: 10, display: "flex", gap: 6, overflowX: "auto" as const,
      }}>
        {menuItems[activeCat].map(item => (
          <div key={item.action}
            onClick={() => { setShowModal(item.action); setModalValue(""); }}
            style={{
              padding: "8px 12px", borderRadius: 8,
              background: T.lightBg, border: `1px solid ${T.border}`,
              fontSize: 12, fontWeight: 600, color: T.textDark,
              cursor: "pointer", whiteSpace: "nowrap" as const,
            }}>
            {item.label}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderModal()}
      <div style={{
        position: "sticky", bottom: 0, left: 0, right: 0, zIndex: 50,
        background: T.darkBg, color: "#fff",
        borderRadius: "12px 12px 0 0",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
      }}>
        {renderCategoryMenu()}

        {/* Barra superiore: info selezione */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px",
          borderBottom: `1px solid rgba(255,255,255,0.1)`,
        }}>
          <div style={{
            background: T.teal, color: "#fff",
            padding: "4px 10px", borderRadius: 6,
            fontSize: 12, fontWeight: 700,
          }}>{n} di {totalVani}</div>
          <span style={{ fontSize: 12, color: "#9FE1CB" }}>selezionati</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {n < totalVani && (
              <button onClick={onSelectAll} style={{
                padding: "4px 10px", borderRadius: 6,
                background: "transparent", border: `1px solid ${T.teal}`,
                color: T.teal, fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Tutti</button>
            )}
            <button onClick={onClearSelection} style={{
              padding: "4px 10px", borderRadius: 6,
              background: "transparent", border: `1px solid rgba(255,255,255,0.2)`,
              color: "#fff", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>Annulla</button>
          </div>
        </div>

        {/* Barra categorie */}
        <div style={{ display: "flex", overflowX: "auto" as const, padding: "8px 10px", gap: 4 }}>
          {CATEGORIES.map(c => (
            <div key={c.id}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              style={{
                padding: "8px 12px", borderRadius: 8,
                background: activeCat === c.id ? T.teal : "rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap" as const,
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <span>{c.icon}</span> {c.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
