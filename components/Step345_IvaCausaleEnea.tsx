// ════════════════════════════════════════════════════════════
// STEP 3 + 4 + 5 · IVA + CAUSALE + MESSAGGI + ENEA + Uw zona
// ════════════════════════════════════════════════════════════
"use client";
import IVAChecklistInline from "./IVAChecklistInline";
import { IVA_META, type IVAKey, type BonusKey, BONUS_META } from "@/lib/preventivo-checklist-templates";

type Props = {
  azienda_id: string;
  commessa_id: string;
  cliente_telefono?: string;
  cliente_nome: string;
  bonus: BonusKey;
  iva: IVAKey;
  destinazione: "prima" | "seconda";
  causale: string;
  recupero: number;
  perAnno: number;
  zona: string;
  uwProd: number;
  uwOk: boolean;
  onIvaChange: (i: IVAKey) => void;
  onZonaChange: (z: string) => void;
  onLogMessaggio?: (id: string, testo: string) => void;
  onBack: () => void;
  onNext: () => void;
};

const UW_LIMITE: Record<string, number> = {
  "AB": 3.00, "C": 2.20, "D": 1.80, "E": 1.40, "F": 1.10,
};
const UW_ZONA_LBL: Record<string, string> = {
  "AB": "A/B", "C": "C", "D": "D", "E": "E", "F": "F",
};

export default function Step345_IvaCausaleEnea({
  azienda_id, commessa_id, cliente_telefono, cliente_nome,
  bonus, iva, destinazione, causale, recupero, perAnno,
  zona, uwProd, uwOk,
  onIvaChange, onZonaChange, onLogMessaggio, onBack, onNext,
}: Props) {

  const fmtEur = (n: number) => "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  function copiaCausale() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(causale).then(() => alert("Causale copiata"));
    }
  }

  function inviaWA(id: string, testo: string) {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(testo)}` : `https://wa.me/?text=${encodeURIComponent(testo)}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
    onLogMessaggio?.(id, testo);
  }

  const messaggi = [
    { id: "doc",  bg: "#1E3A5F", t: "Checklist documenti", d: "Tutto ciò che serve", text: `Ciao ${cliente_nome}, ecco i documenti che servono per il bonus ${BONUS_META[bonus].label}.` },
    { id: "pay",  bg: "#5B21B6", t: "Istruzioni bonifico", d: "Causale + home banking", text: causale },
    { id: "rec",  bg: "#92400E", t: "Riepilogo detrazione", d: `${fmtEur(recupero)} in 10 anni`, text: `Riepilogo: detrazione ${fmtEur(recupero)} spalmata su 10 anni (${fmtEur(perAnno)}/anno).` },
    { id: "info", bg: "#3F6212", t: "Conserva 10 anni", d: "Agenzia Entrate fino 2036", text: "Importante: conservare tutta la documentazione per 10 anni dalla fine lavori." },
    { id: "cal",  bg: "#0369A1", t: "Conferma sopralluogo", d: "Programmazione lavori", text: "Ti scrivo per concordare un sopralluogo per programmare i lavori." },
    { id: "cat",  bg: "#475569", t: "Richiesta dati catastali", d: "Foglio · particella · sub", text: "Per la pratica fiscale mi servono i dati catastali dell'immobile (foglio, particella, subalterno)." },
  ];

  // ENEA logica
  const showEneaAlert = bonus === "ecobonus";
  const eneaTag = showEneaAlert ? "Ecobonus · Obbligatoria" : "Bonus Casa · Non obbligatoria";
  const eneaTitle = showEneaAlert ? "ENEA obbligatoria entro 90gg" : "ENEA consigliata, non dovuta";
  const eneaDesc = showEneaAlert
    ? "Per Ecobonus la trasmissione ENEA è obbligatoria entro 90 giorni dalla fine lavori, pena perdita della detrazione."
    : "Per Bonus Casa è facoltativa. Diventa obbligatoria entro 90gg solo se passi a Ecobonus.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Recap step 1-2 */}
      <Recap label="Step 1-2 · Completati" testo={`${destinazione === "prima" ? "Prima casa" : "Seconda casa"} · ${BONUS_META[bonus].label} ${BONUS_META[bonus].percentuale}`} />

      {/* STEP 3 IVA */}
      <div>
        <H2 num="3" label="Aliquota IVA" />
        <div style={{ display: "flex", gap: 6, padding: "0 2px" }}>
          {(["iva_4", "iva_10", "iva_22"] as IVAKey[]).map(i => {
            const meta = IVA_META[i];
            const sel = iva === i;
            return (
              <div key={i} onClick={() => onIvaChange(i)} style={{
                flex: 1, padding: "9px 8px", borderRadius: 9,
                background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
                border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              }}>
                <b style={{ fontSize: 13, fontWeight: 900, letterSpacing: -0.3 }}>{meta.label.replace("IVA ", "")}</b>
                <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.75 }}>{meta.short}</span>
              </div>
            );
          })}
        </div>
        {iva !== "iva_22" && (
          <div style={{ marginTop: 9 }}>
            <IVAChecklistInline
              azienda_id={azienda_id}
              commessa_id={commessa_id}
              iva={iva}
              cliente_telefono={cliente_telefono}
            />
          </div>
        )}
      </div>

      {/* STEP 4 ZONA CLIMATICA · solo Ecobonus */}
      {bonus === "ecobonus" && (
        <div>
          <H2 num="4" label="Zona climatica · controllo Uw" />
          <div style={{ display: "flex", gap: 5, padding: "0 2px" }}>
            {(["AB", "C", "D", "E", "F"] as const).map(z => {
              const sel = zona === z;
              return (
                <div key={z} onClick={() => onZonaChange(z)} style={{
                  flex: 1, padding: "9px 4px", borderRadius: 9,
                  background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
                  border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                  fontSize: 11, fontWeight: 800, cursor: "pointer", textAlign: "center",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{UW_ZONA_LBL[z]}</div>
                  <div style={{ fontSize: 8.5, opacity: 0.75, marginTop: 1 }}>≤{UW_LIMITE[z]}</div>
                </div>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, padding: 11, borderRadius: 10,
            background: uwOk ? "#D1FAE5" : "#FEE2E2",
            border: "1px solid " + (uwOk ? "#065F46" : "#991B1B"),
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: uwOk ? "#065F46" : "#991B1B", display: "flex", alignItems: "center", gap: 6 }}>
              {uwOk ? "✓" : "⚠"} Uw prodotto: {uwProd.toFixed(2)} W/m²K · Limite zona {UW_ZONA_LBL[zona]}: ≤{UW_LIMITE[zona]}
            </div>
            <div style={{ fontSize: 10, color: uwOk ? "#065F46" : "#991B1B", marginTop: 3, fontWeight: 500, lineHeight: 1.4 }}>
              {uwOk
                ? "Conforme · Ecobonus accessibile"
                : "Non conforme · Ecobonus NON detraibile per questo prodotto. Cambia bonus o sistema."}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 CAUSALE BONIFICO */}
      {bonus !== "nessuna" && (
        <div>
          <H2 num={bonus === "ecobonus" ? "5" : "4"} label="Causale bonifico" />
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, padding: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, background: "#0F1B2D",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontSize: 13, fontWeight: 900,
              }}>€</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.2, flex: 1 }}>
                Causale prestampata
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: "#065F46", letterSpacing: 0.4,
                textTransform: "uppercase", background: "#D1FAE5", padding: "2px 7px", borderRadius: 5,
              }}>Pronta</div>
            </div>
            <div style={{
              background: "#0F1B2D", color: "#cbe0f5", borderRadius: 9,
              padding: "11px 12px", fontFamily: "JetBrains Mono, SF Mono, monospace",
              fontSize: 10, lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 8,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {causale}
            </div>
            <button onClick={copiaCausale} style={{
              width: "100%", padding: 10, background: "#1E3A5F", color: "#fff",
              border: "none", borderRadius: 9, fontSize: 10.5, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer",
            }}>
              📋 Copia causale
            </button>
          </div>
        </div>
      )}

      {/* MESSAGGI PRONTI */}
      <div>
        <div style={{
          fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
          letterSpacing: 1, textTransform: "uppercase",
          margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>Messaggi pronti</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", textTransform: "none" }}>tutti</span>
        </div>
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, overflow: "hidden" }}>
          {messaggi.map((m, i) => (
            <div key={m.id} style={{
              padding: "9px 13px", display: "flex", alignItems: "center", gap: 10,
              borderBottom: i < messaggi.length - 1 ? "1px solid #F1F5F9" : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, background: m.bg,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                color: "#fff", fontSize: 11, fontWeight: 900,
              }}>
                {m.id === "doc" ? "✓" : m.id === "pay" ? "€" : m.id === "rec" ? "%" : m.id === "info" ? "i" : m.id === "cal" ? "📅" : "🏠"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2 }}>{m.t}</div>
                <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 1 }}>{m.d}</div>
              </div>
              <button onClick={() => inviaWA(m.id, m.text)} style={{
                padding: "6px 9px", background: "#065F46", color: "#fff", border: "none",
                borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, cursor: "pointer",
                flexShrink: 0,
              }}>
                Invia
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 5/6 ENEA */}
      <div>
        <H2 num={bonus === "ecobonus" ? "6" : "5"} label="Pratica ENEA" />
        <div style={{
          background: showEneaAlert ? "#7F1D1D" : "#0F1B2D",
          color: "#fff", borderRadius: 13, padding: 12,
        }}>
          <div style={{
            display: "inline-block", fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6,
            textTransform: "uppercase", padding: "3px 7px", borderRadius: 5,
            background: "rgba(255,255,255,0.15)", marginBottom: 7,
          }}>
            {eneaTag}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: -0.2, marginBottom: 4 }}>
            {eneaTitle}
          </div>
          <div style={{
            fontSize: 10.5, color: showEneaAlert ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.78)",
            lineHeight: 1.45, marginBottom: 9, fontWeight: 500,
          }}>
            {eneaDesc}
          </div>
          <button onClick={() => alert("Funzione ENEA in arrivo")} style={{
            width: "100%", padding: 9, background: "rgba(255,255,255,0.13)",
            border: "1px solid rgba(255,255,255,0.20)", borderRadius: 9,
            fontSize: 10, fontWeight: 800, color: "#fff", cursor: "pointer",
            letterSpacing: 0.4, textTransform: "uppercase",
          }}>
            Prepara scheda ENEA
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, padding: "8px 2px 4px" }}>
        <button onClick={onBack} style={{
          background: "#fff", border: "1px solid #CBD5E1", color: "#0F1B2D",
          padding: "12px 16px", borderRadius: 11, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
        }}>← Bonus</button>
        <button onClick={onNext} disabled={bonus === "ecobonus" && !uwOk} style={{
          flex: 1,
          background: bonus === "ecobonus" && !uwOk ? "#94A3B8" : "#1E3A5F",
          color: "#fff", border: "none",
          padding: "12px 16px", borderRadius: 11, fontSize: 11.5, fontWeight: 800,
          cursor: bonus === "ecobonus" && !uwOk ? "not-allowed" : "pointer",
          letterSpacing: 0.3,
        }}>
          {bonus === "ecobonus" && !uwOk ? "Risolvi Uw prima" : "Pagamento →"}
        </button>
      </div>
    </div>
  );
}

function H2({ num, label }: { num: string; label: string }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
      letterSpacing: 1, textTransform: "uppercase",
      margin: "0 4px 8px",
    }}>
      {num} · {label}
    </div>
  );
}

function Recap({ label, testo }: { label: string; testo: string }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #065F46", borderRadius: 11,
      padding: "9px 12px", display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", background: "#065F46",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800,
      }}>✓</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 800, color: "#065F46", letterSpacing: 0.6, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", marginTop: 1, lineHeight: 1.25 }}>
          {testo}
        </div>
      </div>
    </div>
  );
}
