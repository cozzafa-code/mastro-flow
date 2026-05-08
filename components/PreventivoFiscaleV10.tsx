// ════════════════════════════════════════════════════════════
// PREVENTIVO FISCALE V10 · WRAPPER PERSISTENTE
// ════════════════════════════════════════════════════════════
// Replica mockup approvato + persistenza completa su DB:
// - usePreventivoState carica/salva bonus, IVA, destinazione, pagamento
// - Log automatico timeline_universale
// - Mark inviato chiamato al click "Invia WhatsApp"
// - Uw zona climatica obbligatoria per Ecobonus (DM 6/8/2020)
// - is_showroom letto da aziende.is_showroom

"use client";
import { useMemo, useEffect } from "react";
import Step12_DestinazioneBonus from "./Step12_DestinazioneBonus";
import Step345_IvaCausaleEnea from "./Step345_IvaCausaleEnea";
import Step678_PagamentoRDPInvio from "./Step678_PagamentoRDPInvio";
import { useState } from "react";
import { usePreventivoState } from "@/hooks/usePreventivoState";
import { type BonusKey, type IVAKey } from "@/lib/preventivo-checklist-templates";

type Vano = {
  tipo?: string;
  larghezza_mm?: number;
  altezza_mm?: number;
  uw?: number | string;
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
};

type StepUI = "step12" | "step345" | "step678";

const UW_LIMITE: Record<string, number> = {
  "AB": 3.00, "C": 2.20, "D": 1.80, "E": 1.40, "F": 1.10,
};

export default function PreventivoFiscaleV10({
  azienda_id, azienda_nome, azienda_piva, commessa_id, commessa_codice,
  cliente_nome, cliente_cf, cliente_telefono, citta, vani,
  prezzo_base_eur, costo_reale_eur = 0,
}: Props) {

  const { state, loading, saving, patch, logEvento, markInviato } = usePreventivoState({
    commessa_id,
    azienda_id,
  });

  const [stepUI, setStepUI] = useState<StepUI>("step12");

  // Valori di stato (nullables → default safe per il rendering)
  const bonus: BonusKey = state.bonus_scelto ?? "bonus_casa";
  const iva: IVAKey = state.iva_scelta ?? "iva_10";
  const destinazione = state.destinazione_immobile ?? "prima";
  const zona = state.zona_climatica ?? "E";

  // ─── CALCOLI FISCALI ────────────────────────────────────
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

  // Uw del primo vano (primo numero parsabile)
  const uwProd = useMemo(() => {
    const v0 = vani?.[0];
    const raw = v0?.uw;
    if (typeof raw === "number") return raw;
    const parsed = parseFloat(String(raw ?? "1.1"));
    return isNaN(parsed) ? 1.1 : parsed;
  }, [vani]);

  const uwOk = uwProd <= (UW_LIMITE[zona] ?? 1.4);

  // Aggiorna uw_conforme su DB quando cambia
  useEffect(() => {
    if (loading) return;
    if (bonus === "ecobonus" && state.uw_conforme !== uwOk) {
      patch({ uw_conforme: uwOk });
    }
  }, [bonus, uwOk, loading]); // eslint-disable-line

  // ─── CAUSALE BONIFICO ──────────────────────────────────────
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

  // ─── HANDLERS PERSISTENTI ─────────────────────────────────
  function handleDest(d: "prima" | "seconda") {
    patch({ destinazione_immobile: d });
    logEvento("preventivo_dest_change", `Destinazione: ${d === "prima" ? "Prima casa" : "Seconda casa"}`, undefined, { destinazione: d });
  }
  function handleBonus(b: BonusKey) {
    patch({ bonus_scelto: b });
    logEvento("preventivo_bonus_change", `Bonus selezionato: ${b}`, undefined, { bonus: b });
  }
  function handleIva(i: IVAKey) {
    patch({ iva_scelta: i });
    logEvento("preventivo_iva_change", `IVA: ${i}`, undefined, { iva: i });
  }
  function handleZona(z: string) {
    patch({ zona_climatica: z as any });
    logEvento("preventivo_zona_change", `Zona climatica: ${z}`, undefined, { zona: z });
  }
  function handlePagamento(field: "pagamento_rate" | "pagamento_metodo" | "tempi_consegna" | "garanzia", v: string) {
    patch({ [field]: v } as any);
  }
  async function handleInviaWhatsApp() {
    await markInviato("whatsapp");
  }

  // ─── PROGRESS BAR ───────────────────────────────────────────
  const passoNum = stepUI === "step12" ? 2 : stepUI === "step345" ? 4 : 8;
  const passoLabel = stepUI === "step12" ? "Bonus" : stepUI === "step345" ? "Causale" : "Invio";

  const fmtPrezzo = prezzo_base_eur.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // ─── LOADING SPLASH ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 14, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
        Caricamento preventivo…
      </div>
    );
  }

  // ─── INVIATO BANNER ─────────────────────────────────────────
  const giaInviato = !!state.preventivo_inviato_at;

  return (
    <div style={{ background: "#F7F7F5", padding: 14, borderRadius: 14, minHeight: 600 }}>

      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 11,
        padding: "4px 4px 13px", borderBottom: "1px solid #E2E8F0", marginBottom: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase" }}>
            {commessa_codice || "Commessa"} · Preventivo {saving && <span style={{ color: "#1E3A5F", marginLeft: 6 }}>· salvataggio…</span>}
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

      {/* INVIATO banner */}
      {giaInviato && (
        <div style={{
          background: "#D1FAE5", border: "1px solid #065F46", borderRadius: 10,
          padding: "8px 12px", marginBottom: 12, fontSize: 11, fontWeight: 700, color: "#065F46",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          ✓ Preventivo già inviato {state.preventivo_inviato_canale ? `via ${state.preventivo_inviato_canale}` : ""} · {new Date(state.preventivo_inviato_at!).toLocaleDateString("it-IT")}
        </div>
      )}

      {/* PROGRESS */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13, padding: "0 4px" }}>
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

      {/* SCHERMATE */}
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
          zona={zona}
          uwProd={uwProd}
          uwOk={uwOk}
          onIvaChange={handleIva}
          onZonaChange={handleZona}
          onLogMessaggio={(id, testo) => logEvento("preventivo_messaggio_inviato", `Inviato: ${id}`, testo.slice(0, 100), { tipo: id })}
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
          is_showroom={state.is_showroom}
          bonus={bonus}
          iva_pct={ivaPct}
          prezzo_base_eur={prezzo_base_eur}
          costo_reale_eur={costo_reale_eur}
          imponibile={imponibile}
          ivaEuro={ivaEuro}
          recupero={recupero}
          perAnno={perAnno}
          costoNetto={costoNetto}
          giaInviato={giaInviato}
          rate={state.pagamento_rate}
          metodo={state.pagamento_metodo}
          tempi={state.tempi_consegna}
          garanzia={state.garanzia}
          onSetRate={(v) => handlePagamento("pagamento_rate", v)}
          onSetMetodo={(v) => handlePagamento("pagamento_metodo", v)}
          onSetTempi={(v) => handlePagamento("tempi_consegna", v)}
          onSetGaranzia={(v) => handlePagamento("garanzia", v)}
          onInviaWhatsApp={handleInviaWhatsApp}
          onBack={() => setStepUI("step345")}
        />
      )}

    </div>
  );
}
