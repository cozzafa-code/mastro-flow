"use client";

import { useState } from "react";
import { RigaOrdine, RigaVerificata } from "../ordini-types";
import { computeScostamento, soglieScostamento } from "../ordini-helpers";

interface Props {
  riga: RigaOrdine;
  verifica: RigaVerificata;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (rv: RigaVerificata) => void;
}

export default function RigaCard({ riga, verifica, index, isOpen, onToggle, onSave }: Props) {
  const [qtaArr, setQtaArr] = useState<number>(verifica.qta_arrivata ?? riga.qta_ordinata ?? 0);
  const [costoR, setCostoR] = useState<number>(verifica.costo_reale_unit ?? riga.costo_unitario ?? 0);
  const [destinazione, setDest] = useState<string>(verifica.destinazione ?? "magazzino");

  const qtaOrd = riga.qta_ordinata || 0;
  const costoOrd = riga.costo_unitario || 0;
  const scost = computeScostamento(costoOrd, costoR, qtaArr);

  const stripBg = verifica.stato === "ok" ? "#F2FAF5" :
    verifica.stato === "parziale" ? "#FFFAF0" :
      verifica.stato === "problema" ? "#FDF6F6" : "#fff";
  const borderColor = verifica.stato === "ok" ? "#1F5A3F" :
    verifica.stato === "parziale" ? "#E8B05C" :
      verifica.stato === "problema" ? "#C44545" : "transparent";

  return (
    <div style={{
      background: stripBg, borderRadius: 12, marginTop: 10, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      borderLeft: `4px solid ${borderColor}`, transition: "all 0.2s"
    }}>
      <div onClick={onToggle} style={{
        padding: "12px 14px", display: "flex", gap: 12,
        alignItems: "flex-start", cursor: "pointer"
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%",
          background: verifica.stato === "ok" ? "#1F5A3F" :
            verifica.stato === "parziale" ? "#E8B05C" :
              verifica.stato === "problema" ? "#C44545" : "#E8EAF0",
          color: verifica.stato ? "#fff" : "#5A6478",
          fontWeight: 800, fontSize: 11,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          {verifica.stato === "ok" ? "✓" : verifica.stato === "problema" ? "!" : verifica.stato === "parziale" ? "~" : index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: "#1A2A47",
            lineHeight: 1.25, letterSpacing: "0.1px"
          }}>{riga.descrizione || "—"}</div>
          {riga.codice_articolo && (
            <div style={{
              fontSize: 10, color: "#8893A8", marginTop: 2,
              fontFamily: "SF Mono, Menlo, monospace", letterSpacing: "0.3px"
            }}>{riga.codice_articolo}</div>
          )}
          {riga.categoria && (
            <div style={{
              display: "inline-block", marginTop: 6, padding: "2px 7px",
              background: "#EEF2F7", color: "#5A6478",
              borderRadius: 5, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.4px", textTransform: "uppercase"
            }}>{riga.categoria}</div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A2A47", lineHeight: 1 }}>
            {qtaOrd}<span style={{ fontSize: 11, color: "#8893A8", fontWeight: 600, marginLeft: 2 }}>
              {riga.unita_misura || "pz"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#5A6478", marginTop: 3 }}>
            EUR {formatNum(costoOrd)}/{riga.unita_misura || "pz"}
          </div>
        </div>
      </div>

      {isOpen && (
        <div style={{
          background: "#1A2A47", color: "#fff",
          padding: "16px 14px 18px"
        }}>
          {/* Qta arrivata */}
          <Block label="Qta arrivata">
            <StepBtn onClick={() => setQtaArr(Math.max(0, qtaArr - 1))}>-</StepBtn>
            <input type="number" value={qtaArr}
              onChange={(e) => setQtaArr(parseInt(e.target.value) || 0)}
              style={inputStyle} />
            <StepBtn onClick={() => setQtaArr(qtaArr + 1)}>+</StepBtn>
          </Block>

          {/* Costo reale */}
          <Block label="Costo reale">
            <input type="number" step="0.01" value={costoR}
              onChange={(e) => setCostoR(parseFloat(e.target.value) || 0)}
              style={{ ...inputStyle, flex: 2, textAlign: "left" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              vs EUR {formatNum(costoOrd)}
            </span>
          </Block>

          {/* DELTA / ALERT scostamento */}
          {scost.livello !== "none" && (
            <AlertScostamento scost={scost} />
          )}

          {/* Destinazione */}
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>
            Destinazione carico
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["magazzino", "cantiere", "misto"].map((d) => (
              <DestOpt key={d} active={destinazione === d} onClick={() => setDest(d)} label={d} />
            ))}
          </div>

          {/* Action row */}
          <div style={{ display: "flex", gap: 8 }}>
            <ActBtn variant="anom" onClick={() => onSave({
              ...verifica, qta_arrivata: qtaArr, costo_reale_unit: costoR,
              destinazione, stato: "problema"
            })}>⚠ Anomalia</ActBtn>
            <ActBtn variant="conf" onClick={() => {
              if (scost.livello === "block" && !confirm(`SCOSTAMENTO BLOCCANTE +${scost.pct.toFixed(1)}% sul prezzo. Vuoi confermare comunque?`)) return;
              onSave({
                ...verifica, qta_arrivata: qtaArr, costo_reale_unit: costoR,
                destinazione, stato: qtaArr < qtaOrd ? "parziale" : "ok"
              });
            }}>Conferma riga</ActBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ label, children }: any) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
      <div style={{ flex: "0 0 90px", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>{children}</div>
    </div>
  );
}

function AlertScostamento({ scost }: { scost: any }) {
  const isBlock = scost.livello === "block";
  return (
    <div style={{
      padding: "10px 12px",
      background: isBlock ? "rgba(196,69,69,0.2)" : "rgba(31,90,63,0.25)",
      border: `1.5px solid ${isBlock ? "rgba(196,69,69,0.5)" : "rgba(31,90,63,0.5)"}`,
      borderRadius: 8, marginBottom: 12,
      display: "flex", alignItems: "center", justifyContent: "space-between"
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.4px",
        color: "rgba(255,255,255,0.85)", textTransform: "uppercase"
      }}>
        {isBlock ? "⚠ Bloccante - " : ""}{scost.pct > 0 ? "Costo aumento" : "Risparmio"} totale
      </div>
      <div style={{
        fontSize: 14, fontWeight: 800,
        color: scost.pct > 0 ? "#FF9A9A" : "#9FE5B8"
      }}>
        {scost.pct > 0 ? "+" : ""}{formatNum(scost.deltaTotale)} ({scost.pct.toFixed(1)}%)
      </div>
    </div>
  );
}

function StepBtn({ children, onClick }: any) {
  return (
    <div onClick={onClick} style={{
      width: 34, height: 34, borderRadius: 8,
      background: "rgba(255,255,255,0.1)", color: "#fff",
      fontSize: 18, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(255,255,255,0.15)", cursor: "pointer"
    }}>{children}</div>
  );
}

const inputStyle: any = {
  flex: 1, padding: "8px 10px", background: "rgba(255,255,255,0.12)",
  border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 8,
  color: "#fff", fontSize: 14, fontWeight: 700,
  textAlign: "center", fontFamily: "inherit"
};

function DestOpt({ active, onClick, label }: any) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: 10,
      background: active ? "rgba(40,160,160,0.3)" : "rgba(255,255,255,0.06)",
      border: `1.5px solid ${active ? "#28A0A0" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 8, fontSize: 11, fontWeight: 700, textAlign: "center",
      letterSpacing: "0.3px", color: "#fff", textTransform: "uppercase", cursor: "pointer"
    }}>{label}</div>
  );
}

function ActBtn({ children, onClick, variant }: any) {
  const styles: Record<string, any> = {
    anom: { background: "rgba(196,69,69,0.2)", color: "#FF9A9A", border: "1.5px solid rgba(196,69,69,0.4)", flex: 1 },
    conf: { background: "#28A0A0", color: "#fff", border: "1.5px solid #28A0A0", flex: 2 }
  };
  return (
    <div onClick={onClick} style={{
      padding: 11, borderRadius: 8, fontSize: 11, fontWeight: 800,
      letterSpacing: "0.5px", textAlign: "center", textTransform: "uppercase",
      cursor: "pointer", ...styles[variant]
    }}>{children}</div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
