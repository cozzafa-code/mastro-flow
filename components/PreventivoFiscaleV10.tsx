// ════════════════════════════════════════════════════════════
// PREVENTIVO FISCALE V10 · VERSIONE COMPLETA
// ════════════════════════════════════════════════════════════
// Replica completa del fiscale guidato originale + miglioramenti v10:
// - Step 1: Destinazione immobile (prima/seconda casa)
// - Step 2: Bonus fiscale (50/65/75/nessuna) + checklist contestuale
// - Step 3: Aliquota IVA + checklist contestuale
// - Step 4: Zona climatica + controllo Uw (solo ecobonus)
// - Step 5: Causale bonifico precompilata
// - Step 6: Sconto/maggiorazione + margine reale
// - Step 7: RDP fornitore (se showroom)
// - Step 8: Riepilogo simulatore detrazione

"use client";
import { useState, useMemo } from "react";
import BonusChecklistInline from "./BonusChecklistInline";
import IVAChecklistInline from "./IVAChecklistInline";
import PrezzoFinaleEditor from "./PrezzoFinaleEditor";
import RDPFornitoreInline from "./RDPFornitoreInline";
import { BONUS_META, IVA_META, type BonusKey, type IVAKey } from "@/lib/preventivo-checklist-templates";

type Vano = {
  tipo?: string;
  larghezza_mm?: number;
  altezza_mm?: number;
  sistema?: string;
  uw?: number | string;
  note?: string;
};

type Props = {
  azienda_id: string;
  azienda_nome: string;
  azienda_piva?: string;
  commessa_id: string;
  cliente_nome: string;
  cliente_cf?: string;
  cliente_telefono?: string;
  citta?: string;
  vani: Vano[];
  prezzo_base_eur: number;
  costo_reale_eur?: number;
  is_showroom?: boolean;
  initial_bonus?: BonusKey | null;
  initial_iva?: IVAKey | null;
  initial_destinazione?: "prima" | "seconda" | null;
  initial_zona?: "AB" | "C" | "D" | "E" | "F" | null;
  onBonusChange?: (b: BonusKey) => void;
  onIvaChange?: (i: IVAKey) => void;
  onDestinazioneChange?: (d: "prima" | "seconda") => void;
  onZonaChange?: (z: string) => void;
  onPrezzoFinaleUpdate?: (prezzo: number, marginePct: number) => void;
};

const UW_LIMITE: Record<string, number> = {
  "AB": 3.00, "C": 2.20, "D": 1.80, "E": 1.40, "F": 1.10,
};
const UW_ZONA_LBL: Record<string, string> = {
  "AB": "A/B", "C": "C", "D": "D", "E": "E", "F": "F",
};

export default function PreventivoFiscaleV10({
  azienda_id, azienda_nome, azienda_piva, commessa_id,
  cliente_nome, cliente_cf, cliente_telefono, citta,
  vani, prezzo_base_eur, costo_reale_eur = 0, is_showroom = false,
  initial_bonus = "bonus_casa", initial_iva = "iva_10",
  initial_destinazione = "prima", initial_zona = "E",
  onBonusChange, onIvaChange, onDestinazioneChange, onZonaChange, onPrezzoFinaleUpdate,
}: Props) {

  const [bonus, setBonus] = useState<BonusKey>(initial_bonus ?? "bonus_casa");
  const [iva, setIva] = useState<IVAKey>(initial_iva ?? "iva_10");
  const [destinazione, setDestinazione] = useState<"prima" | "seconda">(initial_destinazione ?? "prima");
  const [zona, setZona] = useState<string>(initial_zona ?? "E");
  const [costoForCalc, setCostoForCalc] = useState<number>(costo_reale_eur);

  const aliquota = useMemo(() => {
    if (bonus === "nessuna") return 0;
    if (bonus === "barriere") return 75;
    return destinazione === "prima" ? 50 : 36;
  }, [bonus, destinazione]);

  const ivaPct = iva === "iva_4" ? 4 : iva === "iva_10" ? 10 : 22;

  const imponibile = prezzo_base_eur / (1 + ivaPct / 100);
  const ivaEuro = prezzo_base_eur - imponibile;
  const recupero = imponibile * aliquota / 100;
  const costoReale = prezzo_base_eur - recupero;
  const perAnno = recupero / 10;

  const uwProd = useMemo(() => {
    const v0 = vani?.[0];
    const raw = v0?.uw;
    if (typeof raw === "number") return raw;
    const parsed = parseFloat(String(raw ?? "1.1"));
    return isNaN(parsed) ? 1.1 : parsed;
  }, [vani]);
  const uwOk = uwProd <= UW_LIMITE[zona];

  const causale = useMemo(() => {
    const azNome = (azienda_nome || "DITTA").toUpperCase();
    const azPiva = azienda_piva || "P.IVA";
    const cliNome = (cliente_nome || "CLIENTE").toUpperCase();
    const cliCF = cliente_cf || "CF CLIENTE";
    if (bonus === "ecobonus") return `Intervento di riqualificazione energetica ai sensi dell'art. 1, commi 344-347, Legge 296/2006 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${cliNome} (CF: ${cliCF}) - Beneficiario pagamento: ${azNome} (P.IVA: ${azPiva})`;
    if (bonus === "barriere") return `Intervento superamento barriere architettoniche art. 119-ter DL 34/2020 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${cliNome} (CF: ${cliCF}) - Beneficiario pagamento: ${azNome} (P.IVA: ${azPiva})`;
    if (bonus === "bonus_casa") return `Lavori di ristrutturazione edilizia ai sensi dell'art. 16-bis del DPR 917/1986 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${cliNome} (CF: ${cliCF}) - Beneficiario pagamento: ${azNome} (P.IVA: ${azPiva})`;
    return "";
  }, [bonus, azienda_nome, azienda_piva, cliente_nome, cliente_cf]);

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function copiaCausale() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(causale).then(() => alert("Causale copiata"));
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 90 }}>

      {/* HEADER NAVY */}
      <div style={{
        background: "linear-gradient(135deg, #2D5A87 0%, #1E3A5F 50%, #0F1B2D 100%)",
        color: "#fff", padding: "18px 16px", borderRadius: 14,
        boxShadow: "0 6px 20px rgba(15,27,45,0.25)",
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.75 }}>
          Preventivo · sezione fiscale
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, marginTop: 4 }}>
          Configurazione guidata
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, flexWrap: "wrap" }}>
          <div>📍 {citta || "—"}</div>
          <div>🏠 {destinazione === "prima" ? "Prima casa" : "Seconda casa"}</div>
          <div>📐 {vani?.length || 0} vani</div>
        </div>
      </div>

      {/* STEP 1 DESTINAZIONE */}
      <Section number={1} label="Destinazione immobile">
        <div style={{ display: "flex", gap: 8 }}>
          {(["prima", "seconda"] as const).map(d => {
            const sel = destinazione === d;
            return (
              <button key={d} onClick={() => { setDestinazione(d); onDestinazioneChange?.(d); }} style={{
                flex: 1, padding: "13px 10px", borderRadius: 11,
                background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
                border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: -0.2,
                boxShadow: sel ? "0 4px 12px rgba(30,58,95,0.25)" : "none",
              }}>
                {d === "prima" ? "🏠 Prima casa" : "🏖️ Seconda casa"}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 7, fontWeight: 500 }}>
          {destinazione === "prima" ? "Aliquota detrazione 50% disponibile" : "Aliquota detrazione 36% (seconda casa)"}
        </div>
      </Section>

      {/* STEP 2 BONUS */}
      <Section number={2} label="Bonus fiscale">
        <div style={{
          background: "#fff", border: "1px solid #E2E8F0",
          borderRadius: bonus !== "nessuna" ? "14px 14px 0 0" : 14,
          borderBottom: bonus !== "nessuna" ? "none" : "1px solid #E2E8F0",
          overflow: "hidden",
        }}>
          {(["bonus_casa", "ecobonus", "barriere", "nessuna"] as BonusKey[]).map((b, i, arr) => {
            const meta = BONUS_META[b];
            const sel = bonus === b;
            return (
              <div key={b} onClick={() => { setBonus(b); onBonusChange?.(b); }} style={{
                padding: "13px", display: "flex", alignItems: "center", gap: 11,
                borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                cursor: "pointer", background: sel ? "#F8FAFC" : "#fff",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 9,
                  border: "1.5px solid " + (sel ? "#1E3A5F" : "#CBD5E1"),
                  background: sel ? "#1E3A5F" : "#fff", flexShrink: 0, position: "relative",
                }}>
                  {sel && <div style={{ position: "absolute", inset: 4, borderRadius: 5, background: "#fff" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0F1B2D", display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                    {meta.label}
                    <span style={{ fontSize: 11, fontWeight: 800, color: sel ? "#065F46" : "#94A3B8" }}>{meta.percentuale}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 3, fontWeight: 500, lineHeight: 1.4 }}>
                    {meta.short}
                  </div>
                  {meta.normativa && (
                    <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 500 }}>
                      {meta.normativa}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {bonus && bonus !== "nessuna" && (
          <BonusChecklistInline azienda_id={azienda_id} commessa_id={commessa_id} bonus={bonus} cliente_telefono={cliente_telefono} />
        )}
      </Section>

      {/* STEP 3 IVA */}
      <Section number={3} label="Aliquota IVA">
        <div style={{ display: "flex", gap: 6 }}>
          {(["iva_4", "iva_10", "iva_22"] as IVAKey[]).map(i => {
            const meta = IVA_META[i];
            const sel = iva === i;
            return (
              <button key={i} onClick={() => { setIva(i); onIvaChange?.(i); }} style={{
                flex: 1, padding: "11px 8px", borderRadius: 10,
                background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
                border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              }}>
                <b style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.3 }}>{meta.label.replace("IVA ", "")}</b>
                <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.75 }}>{meta.short}</span>
              </button>
            );
          })}
        </div>
        {iva && <IVAChecklistInline azienda_id={azienda_id} commessa_id={commessa_id} iva={iva} cliente_telefono={cliente_telefono} />}
      </Section>

      {/* STEP 4 ZONA CLIMATICA (solo ecobonus) */}
      {bonus === "ecobonus" && (
        <Section number={4} label="Zona climatica · controllo Uw">
          <div style={{ display: "flex", gap: 5 }}>
            {(["AB", "C", "D", "E", "F"] as const).map(z => {
              const sel = zona === z;
              return (
                <button key={z} onClick={() => { setZona(z); onZonaChange?.(z); }} style={{
                  flex: 1, padding: "9px 4px", borderRadius: 9,
                  background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
                  border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                  fontSize: 11, fontWeight: 800, cursor: "pointer",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 900 }}>{UW_ZONA_LBL[z]}</div>
                  <div style={{ fontSize: 8.5, opacity: 0.75, marginTop: 1 }}>≤{UW_LIMITE[z]}</div>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 10, padding: 11, borderRadius: 10,
            background: uwOk ? "#D1FAE5" : "#FEE2E2",
            border: "1px solid " + (uwOk ? "#065F46" : "#991B1B"),
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: uwOk ? "#065F46" : "#991B1B" }}>
              {uwOk ? "✓" : "⚠"} Uw prodotto: {uwProd.toFixed(2)} W/m²K · Limite zona {UW_ZONA_LBL[zona]}: ≤{UW_LIMITE[zona]}
            </div>
            <div style={{ fontSize: 10, color: uwOk ? "#065F46" : "#991B1B", marginTop: 3, fontWeight: 500 }}>
              {uwOk ? "Conforme · ecobonus accessibile" : "Non conforme · ecobonus NON accessibile per questo prodotto"}
            </div>
          </div>
        </Section>
      )}

      {/* STEP 5 CAUSALE BONIFICO */}
      {bonus !== "nessuna" && (
        <Section number={bonus === "ecobonus" ? 5 : 4} label="Causale bonifico parlante">
          <div style={{
            background: "#0F1B2D", color: "#E2E8F0", padding: 12, borderRadius: 11,
            fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, lineHeight: 1.6,
          }}>
            {causale}
          </div>
          <button onClick={copiaCausale} style={{
            marginTop: 8, width: "100%", padding: "10px 14px", borderRadius: 10,
            background: "#1E3A5F", color: "#fff", border: "none",
            fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
          }}>
            📋 Copia causale
          </button>
        </Section>
      )}

      {/* STEP 6 PREZZO FINALE */}
      <Section number={bonus === "ecobonus" ? 6 : (bonus === "nessuna" ? 4 : 5)} label="Prezzo finale · sconto o maggiorazione">
        <PrezzoFinaleEditor
          commessa_id={commessa_id}
          prezzo_base_eur={prezzo_base_eur}
          costo_reale_eur={costoForCalc}
          onUpdate={onPrezzoFinaleUpdate}
        />
      </Section>

      {/* STEP 7 RDP */}
      {is_showroom && (
        <Section number={bonus === "ecobonus" ? 7 : (bonus === "nessuna" ? 5 : 6)} label="Acquisto fornitore · solo showroom">
          <RDPFornitoreInline
            azienda_id={azienda_id}
            azienda_nome={azienda_nome}
            commessa_id={commessa_id}
            cliente_nome={cliente_nome}
            citta={citta || ""}
            vani={(vani ?? []).map(v => ({
              tipo: v?.tipo ?? "Finestra",
              larghezza_mm: v?.larghezza_mm ?? 0,
              altezza_mm: v?.altezza_mm ?? 0,
              note: v?.note,
            }))}
            prezzo_vendita_eur={prezzo_base_eur}
            onMargineCalcolato={(p, c) => setCostoForCalc(c)}
          />
        </Section>
      )}

      {/* STEP RIEPILOGO */}
      <Section number={99} label="Riepilogo · simulatore detrazione">
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
          <Riga lbl="Totale lavori (IVA inclusa)" val={`€ ${fmt(prezzo_base_eur)}`} />
          <Riga lbl={`Imponibile (IVA ${ivaPct}%)`} val={`€ ${fmt(imponibile)}`} sub />
          <Riga lbl="IVA" val={`€ ${fmt(ivaEuro)}`} sub />
          {aliquota > 0 && <>
            <Riga lbl={`Detrazione ${aliquota}% (10 anni)`} val={`€ ${fmt(recupero)}`} highlight />
            <Riga lbl="Recupero per anno" val={`€ ${fmt(perAnno)} / anno`} sub />
            <Riga lbl="Costo reale netto" val={`€ ${fmt(costoReale)}`} bold />
          </>}
        </div>
        {aliquota > 0 && (
          <div style={{
            marginTop: 10, padding: 12, borderRadius: 11,
            background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
            color: "#fff", textAlign: "center",
          }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, opacity: 0.85, textTransform: "uppercase" }}>
              Risparmio cliente
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.6, marginTop: 2 }}>
              € {fmt(recupero)}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
              spalmato su 10 anni · € {fmt(perAnno)}/anno
            </div>
          </div>
        )}
      </Section>

    </div>
  );
}

function Section({ number, label, children }: { number: number; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: "#94A3B8",
        letterSpacing: 1.1, textTransform: "uppercase",
        margin: "0 4px 8px", display: "flex", alignItems: "center", gap: 7,
      }}>
        {number !== 99 && (
          <span style={{
            background: "#1E3A5F", color: "#fff", padding: "2px 7px",
            borderRadius: 5, fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
          }}>STEP {number}</span>
        )}
        {number === 99 && (
          <span style={{
            background: "#065F46", color: "#fff", padding: "2px 7px",
            borderRadius: 5, fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
          }}>RIEPILOGO</span>
        )}
        {label}
      </div>
      {children}
    </div>
  );
}

function Riga({ lbl, val, sub = false, bold = false, highlight = false }: { lbl: string; val: string; sub?: boolean; bold?: boolean; highlight?: boolean }) {
  return (
    <div style={{
      padding: sub ? "7px 14px" : "11px 14px",
      borderBottom: "1px solid #F1F5F9",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      background: highlight ? "#F0FDF4" : (bold ? "#FAFAF9" : "#fff"),
    }}>
      <span style={{ fontSize: sub ? 10.5 : 12, fontWeight: sub ? 600 : (bold ? 800 : 700), color: sub ? "#64748B" : "#0F1B2D" }}>{lbl}</span>
      <span style={{
        fontSize: sub ? 11 : (bold ? 14 : 13),
        fontWeight: sub ? 700 : (bold ? 900 : 800),
        color: highlight ? "#065F46" : "#0F1B2D",
        fontVariantNumeric: "tabular-nums", letterSpacing: -0.2,
      }}>{val}</span>
    </div>
  );
}
