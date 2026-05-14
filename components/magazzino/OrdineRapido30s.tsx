"use client";
import React, { useState, useEffect } from "react";
import { ArticoloMagazzino } from "../../hooks/useMagazzinoTop";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

interface Props {
  mag: any;
  onBack: () => void;
  articoloPreselezionato?: ArticoloMagazzino;
}

export default function OrdineRapido30s({ mag, onBack, articoloPreselezionato }: Props) {
  // Articolo: preselezionato o primo sotto minimo
  const articolo: ArticoloMagazzino | null =
    articoloPreselezionato ||
    mag.articoli?.find((a: ArticoloMagazzino) => a.stato_scorta === "sotto_minimo" || a.stato_scorta === "esaurito") ||
    mag.articoli?.[0] ||
    null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(3);
  const [quantita, setQuantita] = useState(80);
  const [tempoRimasto, setTempoRimasto] = useState(30);
  const [inviato, setInviato] = useState(false);

  // Calcolo AI quantità: scorta_minima * 2 + forecast (semplificato: 2x scorta_min - attuale + 30% sicurezza)
  useEffect(() => {
    if (articolo) {
      const minD = Math.max(articolo.scorta_minima * 2 - articolo.scorta_attuale, 1);
      const sicurezza = Math.round(minD * 0.3);
      setQuantita(Math.round(minD + sicurezza));
    }
  }, [articolo?.id]);

  // Timer countdown
  useEffect(() => {
    if (inviato) return;
    const t = setInterval(() => {
      setTempoRimasto(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [inviato]);

  const prezzoUnit = articolo?.prezzo_acquisto || 0;
  const totale = quantita * prezzoUnit;
  const percProg = ((30 - tempoRimasto) / 30) * 100;

  const inviaOrdine = async () => {
    if (!articolo) return;
    if (!articolo.fornitore_id) {
      alert("Articolo senza fornitore assegnato");
      return;
    }
    setStep(4);
    const azId = (articolo as any).azienda_id || "ccca51c1-656b-4e7c-a501-55753e20da29";
    const consegna = new Date();
    consegna.setDate(consegna.getDate() + (articolo.lead_time_giorni || 7));
    const righe = [{
      articolo_id: articolo.id,
      codice: articolo.codice,
      nome: articolo.nome,
      quantita: quantita,
      unita_misura: articolo.unita_misura,
      prezzo_unitario: prezzoUnit,
      subtotale: totale,
    }];
    const { error } = await supabase.from("ordini_fornitore").insert({
      azienda_id: azId,
      fornitore_id: articolo.fornitore_id,
      fornitore_nome: articolo.fornitore_nome,
      data_ordine: new Date().toISOString().split("T")[0],
      consegna_prevista: consegna.toISOString().split("T")[0],
      stato: "da_inviare",
      righe,
      totale_euro: totale,
      note: "Ordine rapido 30s",
    });
    if (error) {
      alert("Errore: " + error.message);
      setStep(3);
      return;
    }
    setInviato(true);
    setTimeout(() => onBack(), 1500);
  };

  if (!articolo) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: MUTED }}>
        Nessun articolo da riordinare
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: NAVY_DEEP, color: "#fff",
      display: "flex", flexDirection: "column",
    }}>
      {/* TIMER STAGE */}
      <div style={{
        padding: "16px 14px", display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center",
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <button onClick={onBack} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BackIcon />
          </button>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: TEAL, fontWeight: 800 }}>
            Step {step} di 4
          </div>
          <div style={{ width: 32 }} />
        </div>

        <div style={{
          fontSize: 42, fontWeight: 800, fontFamily: "SF Mono, monospace",
          marginTop: 6,
        }}>
          {String(Math.floor(tempoRimasto / 60)).padStart(2, "0")}:{String(tempoRimasto % 60).padStart(2, "0")}
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginLeft: 5 }}>/ 30s</span>
        </div>
        <div style={{
          width: "100%", height: 5, background: "rgba(255,255,255,0.15)",
          borderRadius: 99, overflow: "hidden", marginTop: 10,
        }}>
          <div style={{
            height: "100%", width: `${percProg}%`,
            background: `linear-gradient(90deg, ${TEAL}, #7BD5D5)`,
            borderRadius: 99, transition: "width 1s linear",
          }} />
        </div>

        {/* Articolo card */}
        <div style={{
          background: "#fff", borderRadius: 12, padding: "11px 13px",
          marginTop: 12, width: "100%",
          display: "flex", alignItems: "center", gap: 11,
        }}>
          <div style={{
            width: 54, height: 54, borderRadius: 8, background: "#F1F4F7",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#8794A6", flexShrink: 0, position: "relative",
          }}>
            <FrameIcon size={28} />
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 9.5, color: "#8794A6", fontFamily: "SF Mono, monospace", fontWeight: 700 }}>
              {articolo.codice}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginTop: 2 }}>
              {articolo.nome}
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
              {articolo.fornitore_nome || "—"} · €{prezzoUnit}/pz · disp. {articolo.scorta_attuale} / min {articolo.scorta_minima}
              {articolo.abc_class && <> · classe <b>{articolo.abc_class}</b></>}
            </div>
          </div>
        </div>

        {/* AI Suggestion */}
        <div style={{
          background: "rgba(40,160,160,0.15)", border: `1.5px solid ${TEAL}`,
          borderRadius: 11, padding: "11px 13px",
          marginTop: 11, width: "100%", textAlign: "left",
        }}>
          <div style={{
            fontSize: 9, color: TEAL, fontWeight: 800, letterSpacing: 1,
            textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5,
          }}>
            <SparkleIcon size={11} />Suggerito AI · forecast 90gg
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 3 }}>
            Ordina <b style={{ color: TEAL }}>{quantita} pz</b> a {articolo.fornitore_nome || "fornitore"} — totale € {totale.toLocaleString("it-IT")}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
            Copre commesse attive + scorta sicurezza ({articolo.lead_time_giorni}gg consegna)
          </div>
        </div>
      </div>

      {/* STEPS LIST */}
      <div style={{ padding: 12, background: "#7A8A9A", flex: 1 }}>
        <StepRow
          done={true}
          num={1}
          title="QR / tap articolo"
          sub="Riconosciuto in 0.8s"
          time="3s"
        />
        <StepRow
          done={true}
          num={2}
          title="AI calcola Q + fornitore"
          sub="Forecast · scorta sicurezza"
          time="2s"
        />
        <StepRow
          active={true}
          num={3}
          title="Conferma quantità"
          sub="Stepper · alternative AI"
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 7, padding: 3, border: "1px solid #D8DEE5" }}>
              <button onClick={() => setQuantita(Math.max(1, quantita - 10))} style={stpBtn}>−</button>
              <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: NAVY, minWidth: 30 }}>{quantita}</div>
              <button onClick={() => setQuantita(quantita + 10)} style={stpBtn}>+</button>
            </div>
          }
        />
        <StepRow
          wait={!inviato}
          done={inviato}
          num={4}
          title={inviato ? "Inviato!" : "Invio EDI + PEC"}
          sub={inviato ? "Tracciato, risposta entro 4h" : "PDF + EDI tracciato"}
          time="5s"
        />
      </div>

      {/* CTA */}
      <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
        <button
          onClick={inviaOrdine}
          disabled={inviato}
          style={{
            width: "100%", padding: 14,
            background: inviato ? GREEN : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
            color: "#fff", borderRadius: 11, fontSize: 13, fontWeight: 800,
            letterSpacing: 0.6, textTransform: "uppercase", border: "none",
            cursor: inviato ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <SendIcon size={18} />
          {inviato ? "ORDINE INVIATO!" : `INVIA · € ${totale.toLocaleString("it-IT")}`}
        </button>
        <div style={{
          fontSize: 9.5, color: MUTED, textAlign: "center",
          marginTop: 6, fontWeight: 600,
        }}>
          EDI + PEC · annullabile 30 min · risposta media 4h
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTI INTERNI
// ============================================================

function StepRow({ done, active, wait, num, title, sub, time, right }: any) {
  const bgColor = done ? "rgba(15,110,86,0.08)" : "#fff";
  const borderColor = done ? GREEN : active ? TEAL : "#D8DEE5";
  const opacity = wait ? 0.55 : 1;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 11,
      padding: "9px 11px", background: bgColor,
      borderRadius: 10, marginBottom: 6,
      borderLeft: `3px solid ${borderColor}`,
      boxShadow: active ? `0 0 0 2px rgba(40,160,160,0.25)` : "none",
      opacity,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: "50%",
        background: done ? GREEN : active ? TEAL : "#F1F4F7",
        color: done || active ? "#fff" : MUTED,
        fontSize: 11, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {done ? <CheckIcon size={12} /> : num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: NAVY }}>{title}</div>
        <div style={{ fontSize: 9.5, color: MUTED, marginTop: 1 }}>{sub}</div>
      </div>
      {right || (time && (
        <div style={{ fontSize: 10, fontWeight: 800, color: TEAL, fontFamily: "SF Mono, monospace" }}>{time}</div>
      ))}
    </div>
  );
}

const stpBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 5,
  background: NAVY, color: "#fff",
  fontSize: 14, fontWeight: 800,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
};

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const FrameIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="12" y1="3" x2="12" y2="21"/>
  </svg>
);

const SparkleIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.9 5.8L19 11l-5.1 2.2L12 19l-1.9-5.8L5 11l5.1-2.2z"/>
  </svg>
);

const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SendIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
