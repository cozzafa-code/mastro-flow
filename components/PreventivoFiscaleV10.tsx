// ════════════════════════════════════════════════════════════
// PREVENTIVO FISCALE V10 · SINGLE PAGE · MOCKUP FEDELE
// ════════════════════════════════════════════════════════════
// Tutto in una pagina scrollabile come il mockup approvato:
// header > progress > 1.Destinazione > 2.Bonus+Checklist
// > 3.IVA+Checklist > 4.Causale > Messaggi > 5.ENEA
// > 6.Pagamento > Margine > 7.RDP (showroom) > 8.Totale > Invia
// Persistenza silenziosa via usePreventivoState (auto-save background)

"use client";
import React, { useMemo, useRef, useState } from "react";
import BonusChecklistInline from "./BonusChecklistInline";
import IVAChecklistInline from "./IVAChecklistInline";
import RDPFornitoreInline from "./RDPFornitoreInline";
import { usePreventivoState } from "@/hooks/usePreventivoState";
import { BONUS_META, IVA_META, type BonusKey, type IVAKey } from "@/lib/preventivo-checklist-templates";
import { markPreventivoInviato } from "../lib/supabase-sync";

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

const RATE_OPTIONS = [
  { id: "30_70", t: "30% + 70%", d: "Acconto · saldo" },
  { id: "50_50", t: "50% + 50%", d: "Acconto · saldo" },
  { id: "30_40_30", t: "30+40+30", d: "3 rate" },
  { id: "unico", t: "Unico", d: "100% consegna" },
];
const METODI = ["Bonifico", "Assegno", "POS"];
const TEMPI = ["30gg", "45gg", "60gg", "90gg"];
const GARANZIE = ["2 anni", "5 anni", "10 anni"];

export default function PreventivoFiscaleV10({
  azienda_id, azienda_nome, azienda_piva, commessa_id, commessa_codice,
  cliente_nome, cliente_cf, cliente_telefono, citta, vani,
  prezzo_base_eur, costo_reale_eur = 0,
}: Props) {
  console.log("[PreventivoFiscaleV10] mount props:", { commessa_id, prezzo_base_eur });

  // [v-autosave-preventivo] Salva totale_finale su DB ogni volta che cambia prezzo_base_eur (debounce 1.5s)
  React.useEffect(() => {
    if (!commessa_id || !prezzo_base_eur || prezzo_base_eur <= 0) return;
    const t = setTimeout(() => {
      markPreventivoInviato(commessa_id, prezzo_base_eur).then((ok) => {
        console.log("[PreventivoSave] DB write:", ok, "totale:", prezzo_base_eur, "commessa:", commessa_id);
      }).catch((e) => {
        console.warn("[PreventivoSave] errore:", e);
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [commessa_id, prezzo_base_eur]);


  const { state, loading, patch, logEvento, markInviato } = usePreventivoState({
    commessa_id, azienda_id,
  });

  const bonus: BonusKey = state.bonus_scelto ?? "bonus_casa";
  const iva: IVAKey = state.iva_scelta ?? "iva_10";
  const destinazione = state.destinazione_immobile ?? "prima";
  const ivaPct = iva === "iva_4" ? 4 : iva === "iva_10" ? 10 : 22;

  // ─── CALCOLI ────────────────────────────────────────────────
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

  const [costoRDP, setCostoRDP] = useState(costo_reale_eur);
  const margineEur = prezzo_base_eur - costoRDP;
  const marginePct = costoRDP > 0 ? Math.round((margineEur / prezzo_base_eur) * 100) : 0;
  const margineColor = marginePct >= 25 ? "#065F46" : marginePct >= 15 ? "#92400E" : "#991B1B";
  const margineWidth = Math.min(100, Math.max(0, marginePct * 2));

  // ─── CAUSALE ──────────────────────────────────────────────
  const causaleRich = useMemo(() => {
    const azNome = (azienda_nome || "DITTA").toUpperCase();
    const azPiva = azienda_piva || "P.IVA";
    const cliNome = (cliente_nome || "CLIENTE").toUpperCase();
    const cliCF = cliente_cf || "CF CLIENTE";
    const oggi = new Date().toLocaleDateString("it-IT");
    const numFatt = "[NUMERO]";
    if (bonus === "ecobonus") {
      return { titolo: "Riqualificazione energetica", normativa: "art. 1 commi 344-347 L.296/2006", numero: numFatt, data: oggi, det: cliNome, cf: cliCF, pag: azNome, piva: azPiva };
    }
    if (bonus === "barriere") {
      return { titolo: "Superamento barriere architettoniche", normativa: "art. 119-ter DL 34/2020", numero: numFatt, data: oggi, det: cliNome, cf: cliCF, pag: azNome, piva: azPiva };
    }
    return { titolo: "Ristrutturazione edilizia", normativa: "art. 16-bis DPR 917/1986", numero: numFatt, data: oggi, det: cliNome, cf: cliCF, pag: azNome, piva: azPiva };
  }, [bonus, azienda_nome, azienda_piva, cliente_nome, cliente_cf]);

  const causalePiana = `${causaleRich.titolo}\nai sensi ${causaleRich.normativa}\nFattura n. ${causaleRich.numero} del ${causaleRich.data}\nDetrazione: ${causaleRich.det}\nCF: ${causaleRich.cf}\nPagamento: ${causaleRich.pag}\nP.IVA: ${causaleRich.piva}`;

  // ─── HANDLERS PERSISTENTI (silent) ────────────────────────
  function setBonus(b: BonusKey) {
    patch({ bonus_scelto: b });
    logEvento("preventivo_bonus", `Bonus: ${BONUS_META[b].label}`, undefined, { bonus: b });
  }
  function setIva(i: IVAKey) {
    patch({ iva_scelta: i });
    logEvento("preventivo_iva", `IVA: ${i}`, undefined, { iva: i });
  }
  function setDest(d: "prima" | "seconda") {
    patch({ destinazione_immobile: d });
  }
  function setRate(v: string) { patch({ pagamento_rate: v }); }
  function setMetodo(v: string) { patch({ pagamento_metodo: v }); }
  function setTempi(v: string) { patch({ tempi_consegna: v }); }
  function setGaranzia(v: string) { patch({ garanzia: v }); }

  function copiaCausale() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(causalePiana).then(() => alert("Causale copiata"));
    }
  }

  function inviaWA(testo: string, tipo?: string) {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(testo)}` : `https://wa.me/?text=${encodeURIComponent(testo)}`;
    if (typeof window !== "undefined") window.open(url, "_blank");
    if (tipo) logEvento("preventivo_messaggio", `Inviato: ${tipo}`, undefined, { tipo });
  }

  async function inviaPreventivoFinale() {
    const testo = [
      `Ciao ${cliente_nome}, ecco il riepilogo del preventivo:`,
      ``,
      `• Totale: € ${fmt(prezzo_base_eur)} (IVA ${ivaPct}% incl.)`,
      bonus !== "nessuna" ? `• Detrazione ${BONUS_META[bonus].label} ${BONUS_META[bonus].percentuale}: € ${fmt(recupero)} in 10 anni` : "",
      bonus !== "nessuna" ? `• Costo reale per te: € ${fmt(costoNetto)}` : "",
    ].filter(Boolean).join("\n");
    inviaWA(testo);
    await markInviato("whatsapp");
  }

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtPrezzo = prezzo_base_eur.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div style={{ background: "#F7F7F5", padding: 24, borderRadius: 14, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>
        Caricamento preventivo…
      </div>
    );
  }

  // ─── 6 MESSAGGI PRONTI ─────────────────────────────────────
  const messaggi = [
    { id: "doc",  bg: "#1E3A5F", icon: "✓", t: "Checklist documenti",     d: "Tutto ciò che serve",   text: `Ciao ${cliente_nome}, ecco i documenti che servono per il bonus ${BONUS_META[bonus].label}.` },
    { id: "pay",  bg: "#5B21B6", icon: "€", t: "Istruzioni bonifico",     d: "Causale + home banking", text: causalePiana },
    { id: "rec",  bg: "#92400E", icon: "%", t: "Riepilogo detrazione",    d: `€ ${fmtInt(recupero)} in 10 anni`, text: `Riepilogo: detrazione € ${fmt(recupero)} spalmata su 10 anni (€ ${fmt(perAnno)}/anno).` },
    { id: "info", bg: "#3F6212", icon: "i", t: "Conserva 10 anni",        d: "Agenzia Entrate fino 2036", text: "Importante: conservare tutta la documentazione per 10 anni dalla fine lavori." },
    { id: "cal",  bg: "#0369A1", icon: "📅", t: "Conferma sopralluogo",   d: "Programmazione lavori", text: "Ti scrivo per concordare un sopralluogo per programmare i lavori." },
    { id: "cat",  bg: "#475569", icon: "🏠", t: "Richiesta dati catastali", d: "Foglio · particella · sub", text: "Per la pratica fiscale mi servono i dati catastali dell'immobile (foglio, particella, subalterno)." },
  ];

  const altriBonus = (["bonus_casa", "ecobonus", "barriere", "nessuna"] as BonusKey[]).filter(b => b !== bonus);
  const showEneaAlert = bonus === "ecobonus";

  // ═════════════════════════════════════════════════════════
  // RENDER · single page scrollabile
  // ═════════════════════════════════════════════════════════
  return (
    <div style={{ background: "#F7F7F5", padding: 14, borderRadius: 14 }}>

      {/* HEADER */}
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
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, fontWeight: 600 }}>IVA {ivaPct}% incl.</div>
        </div>
      </div>

      {/* PROGRESS · 8 step tutti attivi (single page) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13, padding: "0 4px" }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase" }}>
          Configurazione
        </span>
        <div style={{ display: "flex", gap: 3, flex: 1 }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: "#1E3A5F" }} />
          ))}
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.4 }}>
          8/8
        </span>
      </div>

      {/* AI chip */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 9, padding: "0 2px" }}>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 700, color: "#1E3A5F", background: "#fff",
          border: "1px solid #CBD5E1", padding: "6px 11px", borderRadius: 999, cursor: "pointer",
        }}>
          ★ Chiedi a fliwoX
        </button>
      </div>

      {/* ═══ STEP 1 · DESTINAZIONE ═══ */}
      <H2 num="1" label="Destinazione" />
      <div style={{ display: "flex", gap: 6, padding: "0 2px", marginBottom: 14 }}>
        {(["prima", "seconda"] as const).map(d => {
          const sel = destinazione === d;
          return (
            <div key={d} onClick={() => setDest(d)} style={{
              padding: "8px 13px", borderRadius: 9, fontSize: 11, fontWeight: 700,
              background: sel ? "#1E3A5F" : "#fff", color: sel ? "#fff" : "#475569",
              border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
              cursor: "pointer",
            }}>
              {d === "prima" ? "Prima casa" : "Seconda casa"}
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 2 · BONUS scelto + CHECKLIST contestuale ═══ */}
      <H2 num="2" label="Bonus fiscale" />
      <BonusRowSelected b={bonus} />
      {bonus !== "nessuna" && (
        <BonusChecklistInline
          azienda_id={azienda_id}
          commessa_id={commessa_id}
          bonus={bonus}
          cliente_telefono={cliente_telefono}
        />
      )}

      {/* Altri bonus collassati */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", marginTop: 8, marginBottom: 14 }}>
        {altriBonus.map((b, i) => {
          const meta = BONUS_META[b];
          return (
            <div key={b} onClick={() => setBonus(b)} style={{
              padding: "12px 13px", display: "flex", alignItems: "center", gap: 11,
              borderBottom: i < altriBonus.length - 1 ? "1px solid #F1F5F9" : "none",
              cursor: "pointer",
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: "1.5px solid #CBD5E1", background: "#fff", flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, lineHeight: 1.2, display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                  {meta.label}
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8" }}>{meta.percentuale}</span>
                </div>
                <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2, lineHeight: 1.4, fontWeight: 500 }}>
                  {meta.short}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ STEP 3 · IVA + CHECKLIST ═══ */}
      <H2 num="3" label="Aliquota IVA" />
      <div style={{ display: "flex", gap: 6, padding: "0 2px", marginBottom: 9 }}>
        {(["iva_4", "iva_10", "iva_22"] as IVAKey[]).map(i => {
          const meta = IVA_META[i];
          const sel = iva === i;
          return (
            <div key={i} onClick={() => setIva(i)} style={{
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
        <div style={{ marginBottom: 14 }}>
          <IVAChecklistInline
            azienda_id={azienda_id}
            commessa_id={commessa_id}
            iva={iva}
            cliente_telefono={cliente_telefono}
          />
        </div>
      )}

      {/* ═══ STEP 4 · CAUSALE BONIFICO ═══ */}
      {bonus !== "nessuna" && (
        <>
          <H2 num="4" label="Causale bonifico" />
          <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, padding: 13, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, background: "#0F1B2D", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontSize: 12, fontWeight: 900,
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
            }}>
              {causaleRich.titolo}<br/>
              ai sensi <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.normativa}</b><br/>
              Fattura n. <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.numero}</b> del <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.data}</b><br/>
              Detrazione: <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.det}</b><br/>
              CF: <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.cf}</b><br/>
              Pagamento: <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.pag}</b><br/>
              P.IVA: <b style={{ color: "#fff", fontWeight: 700 }}>{causaleRich.piva}</b>
            </div>
            <button onClick={copiaCausale} style={{
              width: "100%", padding: 10, background: "#1E3A5F", color: "#fff",
              border: "none", borderRadius: 9, fontSize: 10.5, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase", cursor: "pointer",
            }}>
              📋 Copia causale
            </button>
          </div>
        </>
      )}

      {/* MESSAGGI PRONTI */}
      <div style={{
        fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
        letterSpacing: 1, textTransform: "uppercase",
        margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>Messaggi pronti</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", textTransform: "none" }}>tutti</span>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 13, overflow: "hidden", marginBottom: 14 }}>
        {messaggi.map((m, i) => (
          <div key={m.id} style={{
            padding: "9px 13px", display: "flex", alignItems: "center", gap: 10,
            borderBottom: i < messaggi.length - 1 ? "1px solid #F1F5F9" : "none",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: m.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              color: "#fff", fontSize: 12, fontWeight: 900,
            }}>{m.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2 }}>{m.t}</div>
              <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 1 }}>{m.d}</div>
            </div>
            <button onClick={() => inviaWA(m.text, m.id)} style={{
              padding: "6px 9px", background: "#065F46", color: "#fff", border: "none",
              borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.4, cursor: "pointer",
              flexShrink: 0,
            }}>Invia</button>
          </div>
        ))}
      </div>

      {/* ═══ STEP 5 · ENEA ═══ */}
      <H2 num="5" label="Pratica ENEA" />
      <div style={{
        background: showEneaAlert ? "#7F1D1D" : "#0F1B2D",
        color: "#fff", borderRadius: 13, padding: 12, marginBottom: 14,
      }}>
        <div style={{
          display: "inline-block", fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6,
          textTransform: "uppercase", padding: "3px 7px", borderRadius: 5,
          background: "rgba(255,255,255,0.15)", marginBottom: 7,
        }}>
          {showEneaAlert ? "Ecobonus · Obbligatoria" : "Bonus Casa · Non obbligatoria"}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: -0.2, marginBottom: 4 }}>
          {showEneaAlert ? "ENEA obbligatoria entro 90gg" : "ENEA consigliata, non dovuta"}
        </div>
        <div style={{
          fontSize: 10.5, color: "rgba(255,255,255,0.85)",
          lineHeight: 1.45, marginBottom: 9, fontWeight: 500,
        }}>
          {showEneaAlert
            ? "Per Ecobonus la trasmissione ENEA è obbligatoria entro 90 giorni dalla fine lavori."
            : "Per Bonus Casa è facoltativa. Diventa obbligatoria entro 90gg solo se passi a Ecobonus."}
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

      {/* ═══ STEP 6 · PAGAMENTO ═══ */}
      <H2 num="6" label="Pagamento & Tempi" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 5 }}>
        {RATE_OPTIONS.map(r => {
          const sel = state.pagamento_rate === r.id;
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
      <div onClick={() => alert("Personalizzazione rate · in arrivo")} style={{
        background: "#F8FAFC", border: "1.5px dashed #1E3A5F",
        borderRadius: 10, padding: "9px 11px", cursor: "pointer", marginBottom: 14,
      }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D" }}>
          <span style={{ color: "#1E3A5F" }}>✦ </span>Personalizzato
        </div>
        <div style={{ fontSize: 9, color: "#64748B", marginTop: 2 }}>Crea le tue rate · max 5</div>
      </div>

      <H2 label="Metodo" />
      <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap", marginBottom: 14 }}>
        {METODI.map(m => (
          <Chip key={m} label={m} sel={state.pagamento_metodo === m} onClick={() => setMetodo(m)} />
        ))}
      </div>

      <H2 label="Tempi · Garanzia" />
      <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap", marginBottom: 5 }}>
        {TEMPI.map(t => (
          <Chip key={t} label={t} sel={state.tempi_consegna === t} onClick={() => setTempi(t)} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap", marginBottom: 14 }}>
        {GARANZIE.map(g => (
          <Chip key={g} label={g} sel={state.garanzia === g} onClick={() => setGaranzia(g)} />
        ))}
      </div>

      {/* MARGINE */}
      <H2 label="Margine · solo tu" />
      <div style={{
        background: "#fff", border: "1px solid #E2E8F0", borderRadius: 11,
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 11, marginBottom: 14,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Margine reale
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.3, marginTop: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
            € {fmtInt(margineEur)}
            <span style={{ fontSize: 11, color: margineColor, fontWeight: 900 }}>{marginePct}%</span>
          </div>
        </div>
        <div style={{ width: 55, height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ height: "100%", background: margineColor, borderRadius: 3, width: margineWidth + "%" }} />
        </div>
      </div>

      {/* ═══ STEP 7 · RDP fornitore (solo showroom) ═══ */}
      {state.is_showroom && (
        <>
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
            letterSpacing: 1, textTransform: "uppercase",
            margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>7 · Acquisto fornitore</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1E3A5F", textTransform: "none" }}>solo showroom</span>
          </div>
          <div style={{ marginBottom: 14 }}>
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
        </>
      )}

      {/* ═══ STEP 8 · TOTALE ═══ */}
      <H2 num="8" label="Riepilogo finale" />
      <div style={{ background: "#0F1B2D", color: "#fff", borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <Riga lbl="Imponibile" val={`€ ${fmt(imponibile)}`} />
        <Riga lbl={`+ IVA ${ivaPct}%`} val={`€ ${fmt(ivaEuro)}`} />
        <RigaBig lbl="Totale" val={`€ ${fmt(prezzo_base_eur)}`} />
        {bonus !== "nessuna" && recupero > 0 && (
          <div style={{
            marginTop: 11, padding: "11px 12px",
            background: "rgba(255,255,255,0.08)", borderRadius: 9,
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#86EFAC", letterSpacing: 0.6, textTransform: "uppercase" }}>
              ★ Costo reale per il cliente
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

      {/* INVIA WhatsApp */}
      <button onClick={inviaPreventivoFinale} style={{
        width: "100%", padding: 14, background: "#065F46", color: "#fff",
        border: "none", borderRadius: 13,
        fontSize: 13, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        cursor: "pointer", boxShadow: "0 3px 0 0 #064E3B",
      }}>
        📲 Invia su WhatsApp
      </button>

      <div style={{ height: 30 }} />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────
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
      cursor: "pointer",
    }}>{label}</div>
  );
}

function BonusRowSelected({ b }: { b: BonusKey }) {
  const meta = BONUS_META[b];
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E2E8F0",
      borderRadius: "14px 14px 0 0",
      borderBottom: "none",
      padding: "12px 13px",
      display: "flex", alignItems: "center", gap: 11,
      backgroundColor: "#F8FAFC",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: "1.5px solid #1E3A5F", background: "#1E3A5F",
        flexShrink: 0, position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "#fff" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, lineHeight: 1.2, display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          {meta.label}
          <span style={{ fontSize: 11, fontWeight: 800, color: "#1E3A5F" }}>{meta.percentuale}</span>
        </div>
        <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2, lineHeight: 1.4, fontWeight: 500 }}>
          {meta.short}
        </div>
        {meta.normativa && (
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, fontFamily: "JetBrains Mono, SF Mono, monospace", letterSpacing: -0.2, fontWeight: 500 }}>
            {meta.normativa}
          </div>
        )}
      </div>
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
