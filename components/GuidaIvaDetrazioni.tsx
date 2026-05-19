"use client";
// @ts-nocheck
// MASTRO ERP — Guida IVA + Detrazioni
// Componente riusabile con requisiti, documenti, note, testo fattura/bonifico
import React, { useState } from "react";

const VOCI = [
  {
    id: "iva4",
    titolo: "IVA 4%",
    tag: "Prima casa / Disabilità",
    tagColor: "#3B7FE0",
    requisiti: [
      "Abitazione principale del cliente (prima casa)",
      "Soggetti con disabilità riconosciuta (L. 104/92)",
      "Acquisto diretto dal costruttore/installatore",
    ],
    documenti: [
      "Dichiarazione sostitutiva prima casa",
      "Certificazione invalidità (se disabilità)",
      "Atto di proprietà immobile",
    ],
    note: "Non si cumula con detrazioni IRPEF. Applicabile su infissi, tapparelle, zanzariere nella stessa fornitura.",
    fattura: "In fattura: 'Fornitura e posa infissi abitazione principale - IVA 4% art. 127-undecies DPR 633/72'",
    limite: null,
  },
  {
    id: "iva10",
    titolo: "IVA 10%",
    tag: "Manutenzione straordinaria",
    tagColor: "#1A9E73",
    requisiti: [
      "Immobile residenziale (non prima casa obbligatorio)",
      "Intervento di manutenzione straordinaria (sostituzione infissi)",
      "NON nuova costruzione",
      "Il cliente deve dichiarare uso residenziale",
    ],
    documenti: [
      "Dichiarazione del cliente uso abitativo",
      "Visura catastale (consigliata)",
    ],
    note: "La sostituzione di infissi è sempre manutenzione straordinaria. Applicabile anche a tapparelle e zanzariere se nella stessa fornitura.",
    fattura: "In fattura: 'Fornitura e posa infissi - manutenzione straordinaria residenziale - IVA 10% n. 127-quaterdecies DPR 633/72'",
    limite: null,
  },
  {
    id: "det50",
    titolo: "Detrazione 50%",
    tag: "Ristrutturazione IRPEF",
    tagColor: "#D08008",
    requisiti: [
      "Immobile residenziale",
      "Pagamento con bonifico parlante bancario/postale",
      "Fattura intestata al beneficiario della detrazione",
      "Il beneficiario deve essere proprietario o familiare convivente",
    ],
    documenti: [
      "Bonifico parlante con causale specifica",
      "Fattura intestata al proprietario",
      "Comunicazione ENEA entro 90 gg fine lavori",
      "Codice fiscale proprietario",
    ],
    note: "Detrazione IRPEF in 10 rate annuali. Tetto spesa €96.000 per unità immobiliare. Cumula con IVA 10%.",
    fattura: "Bonifico causale: 'Bonifico per detrazioni fiscali art.16-bis DPR 917/86 - [P.IVA ditta] - [CF cliente]'",
    limite: "Max €96.000 per unità → detrazione max €48.000 in 10 anni (€4.800/anno)",
  },
  {
    id: "eco65",
    titolo: "Ecobonus 65%",
    tag: "Risparmio energetico",
    tagColor: "#059669",
    requisiti: [
      "Infissi con trasmittanza Uw ≤ 1,4 W/m²K (zona C-F)",
      "Pagamento con bonifico parlante",
      "Asseverazione tecnica (tecnico abilitato)",
      "Scheda tecnica produttore con Uw certificato",
    ],
    documenti: [
      "Bonifico parlante",
      "Fattura intestata beneficiario",
      "Scheda tecnica infisso con Uw",
      "Asseverazione tecnico (geometra/ingegnere/arch)",
      "Trasmissione ENEA entro 90 gg",
    ],
    note: "Tetto spesa €60.000 per intervento. Solo su edifici esistenti. Richiede verifica Uw per zona climatica. Cumula con IVA 10%.",
    fattura: "Bonifico causale: 'Bonifico per detrazioni fiscali art.1 c.344 L.296/2006 - [P.IVA] - [CF]'",
    limite: "Max €60.000 → detrazione max €39.000 in 10 anni",
  },
  {
    id: "bar75",
    titolo: "Barriere 75%",
    tag: "Accessibilità L.13/89",
    tagColor: "#8B5CF6",
    requisiti: [
      "Interventi per abbattimento barriere architettoniche",
      "Infissi con apertura facilitata, maniglioni, porte allargate",
      "Tutti i tipi di immobile (anche non residenziale)",
      "Pagamento con bonifico parlante",
    ],
    documenti: [
      "Bonifico parlante",
      "Fattura con descrizione specifica intervento",
      "Eventuale CILA/SCIA al Comune",
    ],
    note: "Nessuna asseverazione energetica richiesta. Valido anche per condomini. Detrazione in 5 rate (non 10). Tetto €50.000 unifamiliare, €40.000 condominio (per unità).",
    fattura: "In fattura: 'Fornitura e posa infissi per eliminazione barriere architettoniche - art.119-ter DL 34/2020'",
    limite: "Max €50.000 → detrazione max €37.500 in 5 anni",
  },
];

export default function GuidaIvaDetrazioni() {
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const sel = VOCI.find(v => v.id === selected);

  const copyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  if (!selected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {VOCI.map(v => (
          <div key={v.id} onClick={() => setSelected(v.id)}
            style={{
              padding: "12px 14px", borderRadius: 12,
              border: `1.5px solid ${v.tagColor}30`,
              background: v.tagColor + "08",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: `0 3px 0 ${v.tagColor}20`,
            }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: v.tagColor }}>{v.titolo}</div>
              <div style={{ fontSize: 11, color: "#5A7878", marginTop: 2 }}>{v.tag}</div>
            </div>
            <div style={{ fontSize: 18, color: v.tagColor, fontWeight: 800 }}>›</div>
          </div>
        ))}
        <div style={{ fontSize: 10, color: "#8FA8A8", textAlign: "center", padding: "6px 0", fontStyle: "italic" }}>
          Solo orientativo · Verifica sempre con il commercialista
        </div>
      </div>
    );
  }

  if (!sel) return null;

  return (
    <div>
      {/* Back */}
      <div onClick={() => setSelected(null)} style={{ color: sel.tagColor, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}>
        ← Torna alla lista
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: "6px 14px", borderRadius: 20, background: sel.tagColor, color: "#fff", fontSize: 13, fontWeight: 800 }}>{sel.titolo}</div>
        <div style={{ fontSize: 12, color: sel.tagColor, fontWeight: 700 }}>{sel.tag}</div>
      </div>

      {sel.limite && (
        <div style={{ padding: "10px 14px", background: sel.tagColor + "12", borderRadius: 10, border: `1px solid ${sel.tagColor}30`, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: sel.tagColor }}>{sel.limite}</div>
        </div>
      )}

      {/* Requisiti */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#5A7878", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Requisiti</div>
        {sel.requisiti.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #F0F5F5" }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: sel.tagColor + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: sel.tagColor }} />
            </div>
            <div style={{ fontSize: 12, color: "#0D1F1F", lineHeight: 1.5 }}>{r}</div>
          </div>
        ))}
      </div>

      {/* Checklist Documenti */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#5A7878", textTransform: "uppercase", letterSpacing: 0.8 }}>Documenti da allegare</div>
          <div onClick={() => copyText(sel.documenti.join("\n· "), "checklist")} style={{ fontSize: 10, color: sel.tagColor, fontWeight: 700, cursor: "pointer" }}>
            {copied === "checklist" ? "✓ Copiata" : "📋 Copia checklist"}
          </div>
        </div>
        {sel.documenti.map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #F0F5F5" }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${sel.tagColor}`, background: "#fff", flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: "#0D1F1F", lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Testo fattura/bonifico + copia */}
      <div onClick={() => copyText(sel.fattura, "fattura")} style={{ padding: "12px 14px", background: "#FFF8EC", borderRadius: 10, border: "1.5px solid #D0800830", marginBottom: 10, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#D08008" }}>TESTO FATTURA / BONIFICO</div>
          <div style={{ fontSize: 10, color: "#D08008", fontWeight: 700 }}>
            {copied === "fattura" ? "✓ Copiato" : "📋 Tap per copiare"}
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", lineHeight: 1.5 }}>{sel.fattura}</div>
      </div>

      {/* Note */}
      <div style={{ padding: "10px 14px", background: "#F5FBFB", borderRadius: 10, border: "1px solid #E0EFEF", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#5A7878", lineHeight: 1.6 }}>{sel.note}</div>
      </div>

      <div style={{ fontSize: 10, color: "#8FA8A8", textAlign: "center", marginTop: 10, fontStyle: "italic" }}>
        Solo orientativo · Verifica con il commercialista
      </div>
    </div>
  );
}
