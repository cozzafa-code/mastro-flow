// ════════════════════════════════════════════════════════════
// STEP 6 + 7 + 8 · PAGAMENTO + RDP + INVIA
// ════════════════════════════════════════════════════════════
"use client";
import { useState } from "react";
import RDPFornitoreInline from "./RDPFornitoreInline";
import { type BonusKey, BONUS_META } from "@/lib/preventivo-checklist-templates";

type Vano = {
  tipo?: string;
  larghezza_mm?: number;
  altezza_mm?: number;
  note?: string;
};

type Props = {
  azienda_id: string;
  azienda_nome: string;
  commessa_id: string;
  cliente_nome: string;
  cliente_telefono?: string;
  citta?: string;
  vani: Vano[];
  is_showroom: boolean;
  bonus: BonusKey;
  iva_pct: number;
  prezzo_base_eur: number;
  costo_reale_eur: number;
  imponibile: number;
  ivaEuro: number;
  recupero: number;
  perAnno: number;
  costoNetto: number;
  onBack: () => void;
};

const RATE_OPTIONS = [
  { id: "30_70",     t: "30% + 70%",  d: "Acconto · saldo" },
  { id: "50_50",     t: "50% + 50%",  d: "Acconto · saldo" },
  { id: "30_40_30",  t: "30+40+30",   d: "3 rate" },
  { id: "unico",     t: "Unico",      d: "100% consegna" },
];

const METODO_OPTIONS = ["Bonifico", "Assegno", "POS"];
const TEMPI_OPTIONS = ["30gg", "45gg", "60gg", "90gg"];
const GARANZIA_OPTIONS = ["2 anni", "5 anni", "10 anni"];

export default function Step678_PagamentoRDPInvio({
  azienda_id, azienda_nome, commessa_id,
  cliente_nome, cliente_telefono, citta, vani, is_showroom,
  bonus, iva_pct, prezzo_base_eur, costo_reale_eur,
  imponibile, ivaEuro, recupero, perAnno, costoNetto, onBack,
}: Props) {

  const [rate, setRate] = useState("30_40_30");
  const [metodo, setMetodo] = useState("Bonifico");
  const [tempi, setTempi] = useState("45gg");
  const [garanzia, setGaranzia] = useState("5 anni");
  const [costoRDP, setCostoRDP] = useState<number>(costo_reale_eur);

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // margine reale
  const margineEur = prezzo_base_eur - costoRDP;
  const marginePct = costoRDP > 0 ? Math.round((margineEur / prezzo_base_eur) * 100) : 0;
  const margineColor = marginePct >= 25 ? "#065F46" : marginePct >= 15 ? "#92400E" : "#991B1B";
  const margineWidth = Math.min(100, Math.max(0, marginePct * 2));

  function inviaWhatsApp() {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const testo = [
      `Ciao ${cliente_nome}, ecco il riepilogo del preventivo:`,
      ``,
      `• Totale: € ${fmt(prezzo_base_eur)} (IVA ${iva_pct}% incl.)`,
      bonus !== "nessuna" ? `• Detrazione ${BONUS_META[bonus].label} ${BONUS_META[bonus].percentuale}: € ${fmt(recupero)} in 10 anni` : "",
      bonus !== "nessuna" ? `• Costo reale per te: € ${fmt(costoNetto)}` : "",
      ``,
      `Pagamento: ${RATE_OPTIONS.find(r => r.id === rate)?.t} · ${metodo}`,
      `Tempi: ${tempi} · Garanzia: ${garanzia}`,
    ].filter(Boolean).join("\n");
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(testo)}` : `https://wa.me/?text=${encodeURIComponent(testo)}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Recap step 1-5 */}
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
            Step 1-5 · Completati
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", marginTop: 1, lineHeight: 1.25 }}>
            {BONUS_META[bonus].label} {BONUS_META[bonus].percentuale} · IVA {iva_pct}% · 6 msg pronti
          </div>
        </div>
      </div>

      {/* STEP 6 · PAGAMENTO */}
      <div>
        <H2 num="6" label="Pagamento & Tempi" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {RATE_OPTIONS.map(r => {
            const sel = rate === r.id;
            return (
              <div key={r.id} onClick={() => setRate(r.id)} style={{
                background: "#fff", border: sel ? "1.5px solid #1E3A5F" : "1.5px solid #E2E8F0",
                borderRadius: 10, padding: "9px 11px", cursor: "pointer",
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2 }}>{r.t}</div>
                <div style={{ fontSize: 9, color: "#64748B", marginTop: 2, lineHeight: 1.3 }}>{r.d}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 5 }}>
          <div onClick={() => alert("Personalizzazione rate - in arrivo")} style={{
            background: "#F8FAFC", border: "1.5px dashed #1E3A5F",
            borderRadius: 10, padding: "9px 11px", cursor: "pointer",
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D" }}>
              <span style={{ color: "#1E3A5F" }}>✦ </span>Personalizzato
            </div>
            <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Crea le tue rate · max 5</div>
          </div>
        </div>
      </div>

      {/* METODO */}
      <div>
        <H2 label="Metodo" />
        <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap" }}>
          {METODO_OPTIONS.map(m => (
            <Chip key={m} label={m} sel={metodo === m} onClick={() => setMetodo(m)} />
          ))}
        </div>
      </div>

      {/* TEMPI / GARANZIA */}
      <div>
        <H2 label="Tempi · Garanzia" />
        <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap" }}>
          {TEMPI_OPTIONS.map(t => (
            <Chip key={t} label={t} sel={tempi === t} onClick={() => setTempi(t)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap", marginTop: 5 }}>
          {GARANZIA_OPTIONS.map(g => (
            <Chip key={g} label={g} sel={garanzia === g} onClick={() => setGaranzia(g)} />
          ))}
        </div>
      </div>

      {/* MARGINE */}
      <div>
        <H2 label="Margine · solo tu" />
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 11,
          padding: "10px 12px", display: "flex", alignItems: "center", gap: 11,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase" }}>
              Margine reale
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.3, marginTop: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
              € {fmtInt(margineEur)}
              <span style={{ fontSize: 11, color: margineColor, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{marginePct}%</span>
            </div>
          </div>
          <div style={{ width: 55, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ height: "100%", background: margineColor, borderRadius: 3, width: margineWidth + "%" }} />
          </div>
        </div>
      </div>

      {/* STEP 7 · RDP FORNITORE (showroom) */}
      {is_showroom && (
        <div>
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
            letterSpacing: 1, textTransform: "uppercase",
            margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>7 · Acquisto fornitore</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", textTransform: "none" }}>solo showroom</span>
          </div>
          <RDPFornitoreInline
            azienda_id={azienda_id}
            azienda_nome={azienda_nome}
            commessa_id={commessa_id}
            cliente_nome={cliente_nome}
            citta={citta || ""}
            vani={vani.map(v => ({
              tipo: v?.tipo ?? "Finestra",
              larghezza_mm: v?.larghezza_mm ?? 0,
              altezza_mm: v?.altezza_mm ?? 0,
              note: v?.note,
            }))}
            prezzo_vendita_eur={prezzo_base_eur}
            onMargineCalcolato={(p, c) => setCostoRDP(c)}
          />
        </div>
      )}

      {/* STEP 8 · TOTALE */}
      <div>
        <H2 num="8" label="Riepilogo finale" />
        <div style={{
          background: "#0F1B2D", color: "#fff", borderRadius: 14, padding: 14,
        }}>
          <Riga lbl="Imponibile" val={`€ ${fmt(imponibile)}`} />
          <Riga lbl={`+ IVA ${iva_pct}%`} val={`€ ${fmt(ivaEuro)}`} />
          <RigaBig lbl="Totale" val={`€ ${fmt(prezzo_base_eur)}`} />
          {bonus !== "nessuna" && recupero > 0 && (
            <div style={{
              marginTop: 11, padding: "11px 12px",
              background: "rgba(255,255,255,0.08)", borderRadius: 9,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 800, color: "#86EFAC",
                letterSpacing: 0.6, textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Costo reale per il cliente
              </div>
              <div style={{
                fontSize: 20, fontWeight: 900, color: "#fff",
                fontVariantNumeric: "tabular-nums", letterSpacing: -0.5,
                marginTop: 3, lineHeight: 1.05,
              }}>
                € {fmt(costoNetto)}
              </div>
              <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", marginTop: 2, fontWeight: 600 }}>
                dopo {BONUS_META[bonus].label} {BONUS_META[bonus].percentuale} in 10 anni · € {fmtInt(perAnno)}/anno
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INVIA WhatsApp */}
      <button onClick={inviaWhatsApp} style={{
        width: "100%", padding: 14, background: "#065F46", color: "#fff",
        border: "none", borderRadius: 13,
        fontSize: 13, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer", marginTop: 6,
        boxShadow: "0 3px 0 0 #064E3B",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Invia su WhatsApp
      </button>

      {/* Back */}
      <div style={{ display: "flex", gap: 8, padding: "0 2px 4px" }}>
        <button onClick={onBack} style={{
          background: "#fff", border: "1px solid #CBD5E1", color: "#0F1B2D",
          padding: "12px 16px", borderRadius: 11, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
        }}>← Causale</button>
      </div>
    </div>
  );
}

function H2({ num, label }: { num?: string; label: string }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
      letterSpacing: 1, textTransform: "uppercase",
      margin: "0 4px 8px",
    }}>
      {num ? `${num} · ${label}` : label}
    </div>
  );
}

function Chip({ label, sel, onClick }: { label: string; sel: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "8px 13px", borderRadius: 9, fontSize: 11, fontWeight: 700,
      background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
      border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
      cursor: "pointer", fontVariantNumeric: "tabular-nums",
    }}>
      {label}
    </div>
  );
}

function Riga({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "4px 0", fontSize: 11.5, color: "rgba(255,255,255,0.65)",
      fontVariantNumeric: "tabular-nums", fontWeight: 600,
    }}>
      <span>{lbl}</span>
      <b style={{ color: "#fff", fontWeight: 700 }}>{val}</b>
    </div>
  );
}

function RigaBig({ lbl, val }: { lbl: string; val: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: "11px 0 0", fontSize: 14, fontWeight: 900, letterSpacing: -0.4,
      borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 6, color: "#fff",
      fontVariantNumeric: "tabular-nums",
    }}>
      <span>{lbl}</span>
      <b style={{ fontSize: 22, letterSpacing: -0.5 }}>{val}</b>
    </div>
  );
}
