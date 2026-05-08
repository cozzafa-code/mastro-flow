// ════════════════════════════════════════════════════════════
// STEP 3 + 4 + 5 · IVA + CAUSALE + MESSAGGI + ENEA
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
  onIvaChange: (i: IVAKey) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function Step345_IvaCausaleEnea({
  azienda_id, commessa_id, cliente_telefono, cliente_nome,
  bonus, iva, destinazione, causale, recupero, perAnno,
  onIvaChange, onBack, onNext,
}: Props) {

  const fmtEur = (n: number) => "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  function copiaCausale() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(causale).then(() => alert("Causale copiata negli appunti"));
    }
  }

  function inviaWA(testo: string) {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(testo)}` : `https://wa.me/?text=${encodeURIComponent(testo)}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
  }

  const messaggi = [
    { id: "doc",  bg: "#1E3A5F", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, t: "Checklist documenti", d: "Tutto ciò che serve", text: `Ciao ${cliente_nome}, ecco i documenti che servono per il bonus.` },
    { id: "pay",  bg: "#5B21B6", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, t: "Istruzioni bonifico", d: "Causale + home banking", text: `${causale}` },
    { id: "rec",  bg: "#92400E", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, t: "Riepilogo detrazione", d: `${fmtEur(recupero)} in 10 anni`, text: `Riepilogo: detrazione ${fmtEur(recupero)} spalmata su 10 anni (${fmtEur(perAnno)}/anno).` },
    { id: "info", bg: "#3F6212", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>, t: "Conserva 10 anni", d: "Agenzia Entrate fino 2036", text: "Importante: conservare tutta la documentazione per 10 anni dalla fine lavori." },
    { id: "cal",  bg: "#0369A1", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, t: "Conferma sopralluogo", d: "Programmazione lavori", text: "Ti scrivo per concordare un sopralluogo per programmare i lavori." },
    { id: "cat",  bg: "#475569", icon: <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21V12h6v9"/></svg>, t: "Richiesta dati catastali", d: "Foglio · particella · sub", text: `Per la pratica fiscale mi servono i dati catastali dell'immobile (foglio, particella, subalterno).` },
  ];

  // ENEA logica condizionale
  const showEneaAlert = bonus === "ecobonus";
  const eneaTag = showEneaAlert ? "Ecobonus · Obbligatoria" : "Bonus Casa · Non obbligatoria";
  const eneaTitle = showEneaAlert ? "ENEA obbligatoria entro 90gg" : "ENEA consigliata, non dovuta";
  const eneaDesc = showEneaAlert
    ? "Per Ecobonus la trasmissione ENEA è obbligatoria entro 90 giorni dalla fine lavori, pena perdita della detrazione."
    : "Per Bonus Casa è facoltativa. Diventa obbligatoria entro 90gg solo se passi a Ecobonus.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Recap step 1-2 */}
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
            Step 1-2 · Completati
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", marginTop: 1, lineHeight: 1.25 }}>
            {destinazione === "prima" ? "Prima casa" : "Seconda casa"} · {BONUS_META[bonus].label} {BONUS_META[bonus].percentuale}
          </div>
        </div>
      </div>

      {/* STEP 3 · IVA */}
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

        {/* Checklist IVA */}
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

      {/* STEP 4 · CAUSALE */}
      {bonus !== "nessuna" && (
        <div>
          <H2 num="4" label="Causale bonifico" />
          <div style={{
            background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, padding: 13,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, background: "#0F1B2D",
                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.2, flex: 1 }}>
                Causale prestampata
              </div>
              <div style={{
                fontSize: 9, fontWeight: 800, color: "#065F46", letterSpacing: 0.4,
                textTransform: "uppercase", background: "#D1FAE5", padding: "2px 7px", borderRadius: 5,
              }}>
                Pronta
              </div>
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
              letterSpacing: 0.5, textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "pointer",
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copia causale
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
              }}>
                <span style={{ width: 13, height: 13, display: "block" }}>{m.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2 }}>{m.t}</div>
                <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 1 }}>{m.d}</div>
              </div>
              <button onClick={() => inviaWA(m.text)} style={{
                padding: "6px 9px", background: "#065F46", color: "#fff", border: "none",
                borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
              }}>
                Invia
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 5 · ENEA */}
      <div>
        <H2 num="5" label="Pratica ENEA" />
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
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
        }}>←</button>
        <button onClick={onNext} style={{
          flex: 1, background: "#1E3A5F", color: "#fff", border: "none",
          padding: "12px 16px", borderRadius: 11, fontSize: 11.5, fontWeight: 800,
          cursor: "pointer", letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          Pagamento
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
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
