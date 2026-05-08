// ════════════════════════════════════════════════════════════
// PREVENTIVO FISCALE V10 · WRAPPER ORCHESTRATORE
// ════════════════════════════════════════════════════════════
// Replica il mockup approvato: 3 schermate con progress bar 8/8
// Schermata 1 (passo 2/8): Step 1+2 Destinazione + Bonus + Checklist
// Schermata 2 (passo 4/8): Step 3+4+5 IVA + Causale + Messaggi + ENEA  
// Schermata 3 (passo 8/8): Step 6+7+8 Pagamento + RDP + Totale + Invia
"use client";
import { useState, useMemo } from "react";
import Step12_DestinazioneBonus from "./Step12_DestinazioneBonus";
import Step345_IvaCausaleEnea from "./Step345_IvaCausaleEnea";
import Step678_PagamentoRDPInvio from "./Step678_PagamentoRDPInvio";
import { type BonusKey, type IVAKey } from "@/lib/preventivo-checklist-templates";

type Vano = {
  tipo?: string;
  larghezza_mm?: number;
  altezza_mm?: number;
  note?: string;
};

type Props = {
  azienda_id: string;
  azienda_nome: string;
  azienda_piva?: string;
  commessa_id: string;
  commessa_codice?: string;
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
  onBonusChange?: (b: BonusKey) => void;
  onIvaChange?: (i: IVAKey) => void;
  onDestinazioneChange?: (d: "prima" | "seconda") => void;
  onPrezzoFinaleUpdate?: (prezzo: number, marginePct: number) => void;
};

type StepUI = "step12" | "step345" | "step678";

export default function PreventivoFiscaleV10({
  azienda_id, azienda_nome, azienda_piva, commessa_id, commessa_codice,
  cliente_nome, cliente_cf, cliente_telefono, citta, vani,
  prezzo_base_eur, costo_reale_eur = 0, is_showroom = false,
  initial_bonus = "bonus_casa", initial_iva = "iva_10", initial_destinazione = "prima",
  onBonusChange, onIvaChange, onDestinazioneChange,
}: Props) {

  const [stepUI, setStepUI] = useState<StepUI>("step12");
  const [destinazione, setDestinazione] = useState<"prima" | "seconda">(initial_destinazione ?? "prima");
  const [bonus, setBonus] = useState<BonusKey>(initial_bonus ?? "bonus_casa");
  const [iva, setIva] = useState<IVAKey>(initial_iva ?? "iva_10");

  // ─── CALCOLI FISCALI ───────────────────────────────────────
  const ivaPct = iva === "iva_4" ? 4 : iva === "iva_10" ? 10 : 22;

  const aliquota = useMemo(() => {
    if (bonus === "nessuna") return 0;
    if (bonus === "barriere") return 75;
    return destinazione === "prima" ? 50 : 36;
  }, [bonus, destinazione]);

  const imponibile = prezzo_base_eur / (1 + ivaPct / 100);
  const ivaEuro = prezzo_base_eur - imponibile;
  const recupero = imponibile * aliquota / 100;
  const costoNetto = prezzo_base_eur - recupero;
  const perAnno = recupero / 10;

  // ─── CAUSALE ────────────────────────────────────────────────
  const causale = useMemo(() => {
    const azNome = (azienda_nome || "DITTA").toUpperCase();
    const azPiva = azienda_piva || "P.IVA";
    const cliNome = (cliente_nome || "CLIENTE").toUpperCase();
    const cliCF = cliente_cf || "CF CLIENTE";
    const oggi = new Date().toLocaleDateString("it-IT");
    if (bonus === "ecobonus") {
      return `Riqualificazione energetica\nai sensi art. 1 commi 344-347 L.296/2006\nFattura n. [NUMERO] del ${oggi}\nDetrazione: ${cliNome}\nCF: ${cliCF}\nPagamento: ${azNome}\nP.IVA: ${azPiva}`;
    }
    if (bonus === "barriere") {
      return `Superamento barriere architettoniche\nart. 119-ter DL 34/2020\nFattura n. [NUMERO] del ${oggi}\nDetrazione: ${cliNome}\nCF: ${cliCF}\nPagamento: ${azNome}\nP.IVA: ${azPiva}`;
    }
    if (bonus === "bonus_casa") {
      return `Ristrutturazione edilizia\nai sensi art. 16-bis DPR 917/1986\nFattura n. [NUMERO] del ${oggi}\nDetrazione: ${cliNome}\nCF: ${cliCF}\nPagamento: ${azNome}\nP.IVA: ${azPiva}`;
    }
    return "";
  }, [bonus, azienda_nome, azienda_piva, cliente_nome, cliente_cf]);

  // ─── HANDLERS ───────────────────────────────────────────────
  function handleDest(d: "prima" | "seconda") {
    setDestinazione(d);
    onDestinazioneChange?.(d);
  }
  function handleBonus(b: BonusKey) {
    setBonus(b);
    onBonusChange?.(b);
  }
  function handleIva(i: IVAKey) {
    setIva(i);
    onIvaChange?.(i);
  }

  // ─── PROGRESS BAR ───────────────────────────────────────────
  const passoNum = stepUI === "step12" ? 2 : stepUI === "step345" ? 4 : 8;
  const passoLabel = stepUI === "step12" ? "Bonus" : stepUI === "step345" ? "Causale" : "Invio";
  const doneCount = stepUI === "step12" ? 1 : stepUI === "step345" ? 3 : 7;

  const fmtPrezzo = prezzo_base_eur.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ background: "#F7F7F5", padding: 14, borderRadius: 14, minHeight: 600 }}>

      {/* HEADER fisso (codice commessa · cliente · totale) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "4px 4px 13px", borderBottom: "1px solid #E2E8F0", marginBottom: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase" }}>
            {commessa_codice || "Commessa"} · Preventivo
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.4, lineHeight: 1.1, marginTop: 1 }}>
            {cliente_nome || "Cliente"}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <b style={{ fontSize: 17, fontWeight: 900, color: "#0F1B2D", letterSpacing: -0.3, display: "block", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            € {fmtPrezzo}
          </b>
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, fontWeight: 600 }}>
            IVA {ivaPct}% incl.
          </div>
        </div>
      </div>

      {/* PROGRESS bar 8/8 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 13, padding: "0 4px",
      }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Passo {passoNum}/8
        </span>
        <div style={{ display: "flex", gap: 3, flex: 1 }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: n < passoNum ? "#065F46" : (n === passoNum ? "#1E3A5F" : "#E2E8F0"),
            }} />
          ))}
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
          {passoLabel}
        </span>
      </div>

      {/* RENDER SCHERMATA CORRENTE */}
      {stepUI === "step12" && (
        <Step12_DestinazioneBonus
          azienda_id={azienda_id}
          commessa_id={commessa_id}
          cliente_telefono={cliente_telefono}
          destinazione={destinazione}
          bonus={bonus}
          onDestChange={handleDest}
          onBonusChange={handleBonus}
          onNext={() => setStepUI("step345")}
        />
      )}

      {stepUI === "step345" && (
        <Step345_IvaCausaleEnea
          azienda_id={azienda_id}
          commessa_id={commessa_id}
          cliente_telefono={cliente_telefono}
          cliente_nome={cliente_nome}
          bonus={bonus}
          iva={iva}
          destinazione={destinazione}
          causale={causale}
          recupero={recupero}
          perAnno={perAnno}
          onIvaChange={handleIva}
          onBack={() => setStepUI("step12")}
          onNext={() => setStepUI("step678")}
        />
      )}

      {stepUI === "step678" && (
        <Step678_PagamentoRDPInvio
          azienda_id={azienda_id}
          azienda_nome={azienda_nome}
          commessa_id={commessa_id}
          cliente_nome={cliente_nome}
          cliente_telefono={cliente_telefono}
          citta={citta}
          vani={vani}
          is_showroom={is_showroom}
          bonus={bonus}
          iva_pct={ivaPct}
          prezzo_base_eur={prezzo_base_eur}
          costo_reale_eur={costo_reale_eur}
          imponibile={imponibile}
          ivaEuro={ivaEuro}
          recupero={recupero}
          perAnno={perAnno}
          costoNetto={costoNetto}
          onBack={() => setStepUI("step345")}
        />
      )}

    </div>
  );
}
