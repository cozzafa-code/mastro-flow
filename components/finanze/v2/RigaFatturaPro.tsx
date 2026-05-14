"use client";
import React, { useState } from "react";
import { useListiniRicerca, groupBySorgente, type ListinoItem } from "../../../hooks/useListiniRicerca";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const TEAL_SOFT = "#D6F0F0";
const MUTED = "#5C6B7A";
const TXT_SOFT = "#8794A6";
const BORDER = "#E5EAF0";
const RED = "#C73E1D";

export type RigaTipo = "serramento" | "parte_staccata" | "posa" | "opera_complementare" | "spesa_professionale" | "libera";

export interface RigaFatturaPro {
  id: string;
  tipo: RigaTipo;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  iva_pct: number;
  sconto_pct: number;
  // collegamenti
  vano_id?: string | null;
  preventivo_id?: string | null;
  listino_id?: string | null;
  listino_sorgente?: string | null;
  meta?: any;
}

const TIPI_META: Record<RigaTipo, { label: string; color: string; soft: string; iva: number }> = {
  serramento:          { label: "Serramento · bene sign.",   color: TEAL_DARK,   soft: TEAL_SOFT,    iva: 22 },
  parte_staccata:      { label: "Parte staccata · IVA 10",   color: "#8B6926",   soft: "#FBF0DC",    iva: 10 },
  posa:                { label: "Posa in opera",             color: "#0F6E56",   soft: "#D5EBE0",    iva: 10 },
  opera_complementare: { label: "Opera complementare",       color: "#5C2D8C",   soft: "#EDE3F5",    iva: 10 },
  spesa_professionale: { label: "Spesa professionale",       color: "#2D5A8C",   soft: "#E3EDF9",    iva: 22 },
  libera:              { label: "Voce libera",               color: MUTED,       soft: "#F1F4F7",    iva: 22 },
};

interface Props {
  riga: RigaFatturaPro;
  onChange: (r: RigaFatturaPro) => void;
  onDelete: () => void;
  modalitaCompatta?: boolean;
}

export default function RigaFatturaProRow({ riga, onChange, onDelete, modalitaCompatta }: Props) {
  const [showAc, setShowAc] = useState(false);
  const { results, loading } = useListiniRicerca(riga.descrizione, null);
  const meta = TIPI_META[riga.tipo];

  const totale = +(riga.quantita * riga.prezzo_unitario * (1 - riga.sconto_pct / 100)).toFixed(2);
  const totaleConIva = +(totale * (1 + riga.iva_pct / 100)).toFixed(2);
  const grouped = groupBySorgente(results);

  function selezionaItem(it: ListinoItem) {
    onChange({
      ...riga,
      descrizione: it.nome,
      prezzo_unitario: it.prezzo || riga.prezzo_unitario,
      listino_id: it.id,
      listino_sorgente: it.sorgente,
      meta: { ...riga.meta, ...it.meta, codice: it.codice, unita: it.unita },
    });
    setShowAc(false);
  }

  // VISTA COMPATTA
  if (modalitaCompatta) {
    return (
      <div style={{
        background: "#F7F9FB", border: `1.5px solid ${BORDER}`, borderRadius: 11,
        padding: "7px 9px", marginBottom: 7,
        display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 7, alignItems: "center",
        borderLeft: `3px solid ${meta.color}`,
      }}>
        <span style={{
          fontSize: 8, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase",
          padding: "2px 5px", borderRadius: 99, background: meta.soft, color: meta.color, whiteSpace: "nowrap",
        }}>{meta.label.split(" ")[0]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {riga.descrizione || <i style={{ color: MUTED }}>(senza descrizione)</i>}
        </span>
        <span style={{ fontSize: 10, color: MUTED, fontWeight: 600, minWidth: 34, textAlign: "right" }}>
          ×{riga.quantita}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: NAVY, minWidth: 62, textAlign: "right" }}>
          €{totale.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
        </span>
        <button onClick={onDelete} style={{
          color: RED, fontSize: 16, cursor: "pointer", padding: "0 3px",
          background: "transparent", border: "none",
        }}>×</button>
      </div>
    );
  }

  // VISTA DETTAGLIO
  return (
    <div style={{
      background: "#F7F9FB", border: `1.5px solid ${BORDER}`, borderRadius: 11,
      padding: 10, marginBottom: 7,
      borderLeft: `3px solid ${meta.color}`,
    }}>
      {/* Header tipo + delete */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
          padding: "2px 7px", borderRadius: 99, background: meta.soft, color: meta.color,
        }}>{meta.label}</span>
        <button onClick={onDelete} style={{
          color: RED, fontSize: 14, cursor: "pointer", padding: "2px 6px",
          background: "transparent", border: "none",
        }}>×</button>
      </div>

      {/* Autocomplete descrizione */}
      <div style={{ position: "relative", marginBottom: 6 }}>
        <input
          value={riga.descrizione}
          onChange={(e) => { onChange({ ...riga, descrizione: e.target.value }); setShowAc(true); }}
          onFocus={() => setShowAc(true)}
          onBlur={() => setTimeout(() => setShowAc(false), 200)}
          placeholder="Cerca in tutti i listini... (2+ caratteri)"
          style={{
            width: "100%", padding: "10px 12px",
            border: `2px solid ${TEAL}`, borderRadius: 8,
            fontSize: 13, fontWeight: 700, color: NAVY, background: "#fff",
            fontFamily: "inherit", outline: "none",
          }}
        />
        {showAc && results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#fff", border: `1px solid ${TEAL}`, borderRadius: 10,
            marginTop: 4, boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 30, maxHeight: 280, overflowY: "auto",
          }}>
            <div style={{
              padding: "7px 11px", background: "#F7F9FB",
              fontSize: 9.5, fontWeight: 700, color: MUTED,
              letterSpacing: 0.4, textTransform: "uppercase",
              borderBottom: `1px solid ${BORDER}`,
            }}>
              {results.length} risultati per "{riga.descrizione}" · {grouped.length} listini
            </div>
            {grouped.map((g) => (
              <React.Fragment key={g.sorgente}>
                <div style={{
                  padding: "6px 11px 3px", fontSize: 8.5, fontWeight: 800,
                  color: TEAL, letterSpacing: 0.6, textTransform: "uppercase",
                  background: "#F7F9FB",
                }}>{g.label}</div>
                {g.items.map((it) => (
                  <div
                    key={it.id}
                    onMouseDown={(e) => { e.preventDefault(); selezionaItem(it); }}
                    style={{
                      padding: "8px 11px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      borderBottom: `1px solid #F1F4F7`, gap: 8,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = TEAL_SOFT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {it.nome || it.codice}
                      </div>
                      {(it.codice || it.descrizione) && (
                        <div style={{ fontSize: 9.5, color: TXT_SOFT, marginTop: 2, fontWeight: 600 }}>
                          {it.codice}{it.descrizione && it.codice ? " · " : ""}{it.descrizione || ""}
                        </div>
                      )}
                    </div>
                    {it.prezzo > 0 && (
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#0F6E56", textAlign: "right", flexShrink: 0 }}>
                        €{it.prezzo.toLocaleString("it-IT", { maximumFractionDigits: 2 })}
                        <div style={{ fontSize: 8.5, fontWeight: 700, color: MUTED, marginTop: 1 }}>{it.unita}</div>
                      </div>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
        {showAc && loading && results.length === 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
            marginTop: 4, padding: "12px", textAlign: "center",
            fontSize: 11, color: MUTED,
          }}>Cerco...</div>
        )}
      </div>

      {/* Collegamenti riga (pill) */}
      {(riga.vano_id || riga.preventivo_id || riga.listino_id) && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 7 }}>
          {riga.vano_id && <Pill color={TEAL_DARK} bg={TEAL_SOFT}>Vano</Pill>}
          {riga.listino_sorgente && <Pill color="#8B6926" bg="#FBF0DC">{riga.listino_sorgente}</Pill>}
          {riga.preventivo_id && <Pill color="#2D5A8C" bg="#E3EDF9">Prev.</Pill>}
        </div>
      )}

      {/* Numeri */}
      <div style={{ display: "grid", gridTemplateColumns: "0.7fr 0.8fr 0.6fr 0.8fr", gap: 5, marginBottom: 5 }}>
        <NumInput label="QTÀ" value={riga.quantita} onChange={(v) => onChange({ ...riga, quantita: v })} />
        <NumInput label="PREZZO €" value={riga.prezzo_unitario} onChange={(v) => onChange({ ...riga, prezzo_unitario: v })} step={0.01} />
        <NumInput label="IVA %" value={riga.iva_pct} onChange={(v) => onChange({ ...riga, iva_pct: v })} />
        <NumInput label="SCONTO %" value={riga.sconto_pct} onChange={(v) => onChange({ ...riga, sconto_pct: v })} />
      </div>

      <div style={{
        fontSize: 11, fontWeight: 800, color: NAVY,
        textAlign: "right", paddingTop: 5, borderTop: `1px dashed #D8DEE5`,
      }}>
        Totale riga: € {totale.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        <span style={{ color: MUTED, marginLeft: 6, fontSize: 9.5, fontWeight: 600 }}>
          (con IVA €{totaleConIva.toLocaleString("it-IT", { minimumFractionDigits: 2 })})
        </span>
      </div>
    </div>
  );
}

function Pill({ children, color, bg }: { children: any; color: string; bg: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
      background: bg, color, border: `1px solid ${color}`,
    }}>{children}</span>
  );
}

function NumInput({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div>
      <label style={{ fontSize: 7.5, color: TXT_SOFT, fontWeight: 700, letterSpacing: 0.3, display: "block", marginBottom: 2 }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{
          padding: "6px 7px", fontSize: 11, border: "1px solid #D8DEE5",
          borderRadius: 5, background: "#fff", width: "100%", textAlign: "right",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}

export { TIPI_META };
