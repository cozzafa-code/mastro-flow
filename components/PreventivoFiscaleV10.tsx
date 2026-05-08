// ════════════════════════════════════════════════════════════
// PREVENTIVO FISCALE V10 · WRAPPER COMPLETO
// ════════════════════════════════════════════════════════════
// Drop-in replacement per <TabFiscale>.
// Integra:
//   - Selezione bonus (4 opzioni) + checklist contestuale
//   - Selezione IVA (3 opzioni) + checklist contestuale
//   - Sconto/maggiorazione live con margine reale
//   - RDP fornitore showroom con AI PDF reader
// NON tocca: FirmaPanel, firma_tokens, preventivo_tokens, propaga_firma_a_commessa.

"use client";
import { useState } from "react";
import BonusChecklistInline from "./BonusChecklistInline";
import IVAChecklistInline from "./IVAChecklistInline";
import PrezzoFinaleEditor from "./PrezzoFinaleEditor";
import RDPFornitoreInline from "./RDPFornitoreInline";
import { BONUS_META, IVA_META, type BonusKey, type IVAKey } from "@/lib/preventivo-checklist-templates";

type Props = {
  azienda_id: string;
  azienda_nome: string;
  commessa_id: string;
  cliente_nome: string;
  cliente_telefono?: string;
  citta: string;
  vani: Array<{ tipo: string; larghezza_mm: number; altezza_mm: number; note?: string }>;
  prezzo_base_eur: number;
  costo_reale_eur?: number;
  is_showroom?: boolean;
  initial_bonus?: BonusKey | null;
  initial_iva?: IVAKey | null;
  onBonusChange?: (bonus: BonusKey) => void;
  onIvaChange?: (iva: IVAKey) => void;
  onPrezzoFinaleUpdate?: (prezzo_finale: number, margine_pct: number) => void;
};

export default function PreventivoFiscaleV10({
  azienda_id, azienda_nome, commessa_id, cliente_nome, cliente_telefono, citta, vani,
  prezzo_base_eur, costo_reale_eur = 0, is_showroom = false,
  initial_bonus = null, initial_iva = null,
  onBonusChange, onIvaChange, onPrezzoFinaleUpdate,
}: Props) {

  const [bonus, setBonus] = useState<BonusKey | null>(initial_bonus);
  const [iva, setIva] = useState<IVAKey | null>(initial_iva);
  const [costoForRDP, setCostoForRDP] = useState<number>(costo_reale_eur);

  function handleBonusSelect(b: BonusKey) {
    setBonus(b);
    onBonusChange?.(b);
  }
  function handleIvaSelect(i: IVAKey) {
    setIva(i);
    onIvaChange?.(i);
  }
  function handleMargineRDP(margine_pct: number, costo_totale: number) {
    setCostoForRDP(costo_totale);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ─── BONUS FISCALE ─── */}
      <Section label="1 · Bonus fiscale">
        <div style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          overflow: "hidden",
          ...(bonus ? { borderRadius: "14px 14px 0 0", borderBottom: "none" } : {}),
        }}>
          {(["bonus_casa", "ecobonus", "barriere", "nessuna"] as BonusKey[]).map((b, i, arr) => {
            const meta = BONUS_META[b];
            const sel = bonus === b;
            return (
              <div
                key={b}
                onClick={() => handleBonusSelect(b)}
                style={{
                  padding: "12px 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                  cursor: "pointer",
                  background: sel ? "#F8FAFC" : "#fff",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 9,
                  border: "1.5px solid " + (sel ? "#1E3A5F" : "#CBD5E1"),
                  background: sel ? "#1E3A5F" : "#fff",
                  flexShrink: 0, position: "relative",
                }}>
                  {sel && <div style={{ position: "absolute", inset: 4, borderRadius: 5, background: "#fff" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, lineHeight: 1.2, display: "flex", alignItems: "baseline", gap: 7 }}>
                    {meta.label} <span style={{ fontSize: 11, fontWeight: 800, color: sel ? "#1E3A5F" : "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{meta.percentuale}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 3, fontWeight: 500, lineHeight: 1.4 }}>
                    {meta.short}
                  </div>
                  {meta.normativa && (
                    <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 2, fontFamily: "JetBrains Mono, SF Mono, monospace", fontWeight: 500 }}>
                      {meta.normativa}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checklist contestuale BONUS */}
        {bonus && (
          <BonusChecklistInline
            azienda_id={azienda_id}
            commessa_id={commessa_id}
            bonus={bonus}
            cliente_telefono={cliente_telefono}
          />
        )}
      </Section>

      {/* ─── IVA ─── */}
      <Section label="2 · Aliquota IVA">
        <div style={{ display: "flex", gap: 6 }}>
          {(["iva_4", "iva_10", "iva_22"] as IVAKey[]).map(i => {
            const meta = IVA_META[i];
            const sel = iva === i;
            return (
              <button
                key={i}
                onClick={() => handleIvaSelect(i)}
                style={{
                  flex: 1, padding: "9px 8px", borderRadius: 9,
                  background: sel ? "#1E3A5F" : "#fff",
                  color: sel ? "#fff" : "#475569",
                  border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                }}
              >
                <b style={{ fontSize: 13, fontWeight: 900, letterSpacing: -0.3 }}>{meta.label.replace("IVA ", "")}</b>
                <span style={{ fontSize: 8.5, fontWeight: 700, opacity: 0.75, letterSpacing: 0.3 }}>{meta.short}</span>
              </button>
            );
          })}
        </div>

        {/* Checklist contestuale IVA */}
        {iva && (
          <IVAChecklistInline
            azienda_id={azienda_id}
            commessa_id={commessa_id}
            iva={iva}
            cliente_telefono={cliente_telefono}
          />
        )}
      </Section>

      {/* ─── PREZZO FINALE: sconto/maggiorazione ─── */}
      <Section label="3 · Prezzo finale · sconto o maggiorazione">
        <PrezzoFinaleEditor
          commessa_id={commessa_id}
          prezzo_base_eur={prezzo_base_eur}
          costo_reale_eur={costoForRDP}
          onUpdate={onPrezzoFinaleUpdate}
        />
      </Section>

      {/* ─── RDP FORNITORE (solo showroom) ─── */}
      {is_showroom && (
        <Section label="4 · Acquisto fornitore · solo showroom">
          <RDPFornitoreInline
            azienda_id={azienda_id}
            azienda_nome={azienda_nome}
            commessa_id={commessa_id}
            cliente_nome={cliente_nome}
            citta={citta}
            vani={vani}
            prezzo_vendita_eur={prezzo_base_eur}
            onMargineCalcolato={handleMargineRDP}
          />
        </Section>
      )}

    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 800,
        color: "#94A3B8",
        letterSpacing: 1,
        textTransform: "uppercase",
        margin: "0 4px 9px",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
