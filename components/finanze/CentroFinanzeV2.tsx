"use client";
import React, { useState } from "react";
import { useFinanze } from "../../hooks/useFinanze";
import { useFattureFinanze, type FiltroFatture } from "../../hooks/useFattureFinanze";
import { useSpese, type FiltroFattRic } from "../../hooks/useSpese";
import { useTasse } from "../../hooks/useTasse";
import VistaCashflow from "./v2/VistaCashflow";
import VistaAttive from "./v2/VistaAttive";
import VistaPassive from "./v2/VistaPassive";
import VistaF24Iva from "./v2/VistaF24Iva";
import FabFinanzeV2 from "./v2/FabFinanzeV2";

// Riuso modal del legacy (esportati)
import {
  ModalNuovaFattura,
  ModalRegistraPagamento,
  ModalNuovaSpesa,
  ModalPagamentoFornitore,
  ModalNuovaFatturaRicevuta,
  ModalDettaglioFattura,
  ModalDettaglioFattRic,
} from "../CentroFinanze";

export const NAVY = "#1B3A5C";
export const NAVY_DEEP = "#0F1F33";
export const TEAL = "#28A0A0";
export const BG = "#7A8A9A";
export const MUTED = "#5C6B7A";

type Mode = "cashflow" | "attive" | "passive" | "f24iva";

interface Props {
  aziendaId: string;
  onClose: () => void;
}

export default function CentroFinanzeV2({ aziendaId, onClose }: Props) {
  const fin = useFinanze(aziendaId);
  const fatt = useFattureFinanze(aziendaId);
  const spese = useSpese(aziendaId);
  const tasse = useTasse(aziendaId);

  const [mode, setMode] = useState<Mode>("cashflow");
  const [fabOpen, setFabOpen] = useState(false);
  const [filtroAtt, setFiltroAtt] = useState<FiltroFatture>("tutte");
  const [filtroPass, setFiltroPass] = useState<FiltroFattRic>("tutte");

  // Modal states (riuso legacy)
  const [showNuovaFattura, setShowNuovaFattura] = useState(false);
  const [showPagamento, setShowPagamento] = useState<{ open: boolean; fatturaId?: string }>({ open: false });
  const [showSpesa, setShowSpesa] = useState(false);
  const [showPagFornit, setShowPagFornit] = useState<{ open: boolean; fatturaId?: string }>({ open: false });
  const [showNuovaFatturaRic, setShowNuovaFatturaRic] = useState(false);
  const [dettaglioId, setDettaglioId] = useState<string | null>(null);
  const [dettaglioFattRicId, setDettaglioFattRicId] = useState<string | null>(null);

  const fatturaCorrente = dettaglioId ? fatt.fatture.find((f) => f.id === dettaglioId) : null;
  const fatturaRicCorrente = dettaglioFattRicId ? spese.fattRicevute.find((f) => f.id === dettaglioFattRicId) : null;

  const fatturato = fin.kpi?.incassi_30gg != null ? Math.round(fin.kpi.incassi_30gg) : 0;

  return (
    <div style={{
      position: "fixed", inset: 0, background: BG, zIndex: 9800,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
        color: "#fff", padding: "14px 14px 12px", position: "relative",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: TEAL, textTransform: "uppercase" }}>
              Centro Finanze
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 1, lineHeight: 1.1 }}>
              EUR {fatturato.toLocaleString("it-IT")} incassi 30gg
            </div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(40,160,160,0.25)", color: TEAL,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} title="Statistiche">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1={18} y1={20} x2={18} y2={10} /><line x1={12} y1={20} x2={12} y2={4} /><line x1={6} y1={20} x2={6} y2={14} />
            </svg>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: TEAL, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 6px rgba(40,160,160,0.4)",
          }} title="Export SDI">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: "flex", gap: 1, background: "rgba(255,255,255,0.08)",
          borderRadius: 10, padding: 2, marginTop: 12,
        }}>
          {([
            { v: "cashflow", l: "Cashflow" },
            { v: "attive", l: "Attive", c: fatt.kpi?.n_aperte },
            { v: "passive", l: "Passive", c: spese.kpiFatt?.n_da_pagare },
            { v: "f24iva", l: "F24/IVA", c: tasse.kpi?.n_aperte },
          ] as { v: Mode; l: string; c?: number }[]).map((t) => {
            const act = mode === t.v;
            return (
              <button key={t.v} onClick={() => setMode(t.v)} style={{
                flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 800,
                letterSpacing: 0.4, textTransform: "uppercase",
                color: act ? NAVY : "rgba(255,255,255,0.5)",
                background: act ? TEAL : "transparent",
                border: "none", borderRadius: 8, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <span>{t.l}</span>
                {t.c != null && t.c > 0 && (
                  <span style={{
                    background: act ? NAVY : "rgba(255,255,255,0.15)",
                    color: act ? "#fff" : "rgba(255,255,255,0.8)",
                    fontSize: 8.5, padding: "1px 5px", borderRadius: 99, fontWeight: 800,
                  }}>{t.c}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 160 }}>
        {fin.loading ? (
          <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>
            Caricamento dati finanziari...
          </div>
        ) : (
          <>
            {mode === "cashflow" && (
              <VistaCashflow
                kpi={fin.kpi}
                heroKpi={fin.heroKpi}
                cashflow={fin.cashflow}
                alerts={fin.alerts}
                onDismissAlert={fin.dismissAlert}
              />
            )}
            {mode === "attive" && (
              <VistaAttive
                fatture={fatt.fatture}
                kpi={fatt.kpi}
                filtro={filtroAtt}
                onFiltroChange={setFiltroAtt}
                onPagamento={(id) => setShowPagamento({ open: true, fatturaId: id })}
              />
            )}
            {mode === "passive" && (
              <VistaPassive
                fatture={spese.fattRicevute}
                spese={spese.spese}
                kpi={spese.kpiFatt}
                filtro={filtroPass}
                onFiltroChange={setFiltroPass}
                onPagamento={(id) => setShowPagFornit({ open: true, fatturaId: id })}
              />
            )}
            {mode === "f24iva" && (
              <VistaF24Iva
                liquidazioni={tasse.liquidazioni}
                eventi={tasse.eventiProssimi}
                eventiScaduti={tasse.eventiScaduti}
                kpi={tasse.kpi}
                onMarcaVersata={tasse.marcaVersata}
              />
            )}
          </>
        )}
      </div>

      {/* FAB azioni veloci */}
      <FabFinanzeV2
        open={fabOpen}
        onToggle={() => setFabOpen((v) => !v)}
        onNuovaFattura={() => { setFabOpen(false); setShowNuovaFattura(true); }}
        onPagamentoIn={() => { setFabOpen(false); setShowPagamento({ open: true }); }}
        onNuovaSpesa={() => { setFabOpen(false); setShowSpesa(true); }}
        onPagamentoOut={() => { setFabOpen(false); setShowPagFornit({ open: true }); }}
        onFatturaRic={() => { setFabOpen(false); setShowNuovaFatturaRic(true); }}
        onTasse={() => { setFabOpen(false); setMode("f24iva"); }}
      />

      {/* MODAL legacy collegati */}
      {showNuovaFattura && (
        <ModalNuovaFattura
          onClose={() => setShowNuovaFattura(false)}
          onCrea={async (d: any) => {
            const res = await fatt.creaFattura(d);
            if (res.ok) { setShowNuovaFattura(false); setMode("attive"); }
            else alert("Errore: " + (res.error || "sconosciuto"));
          }}
        />
      )}
      {showPagamento.open && (
        <ModalRegistraPagamento
          fatture={fatt.fatture.filter((f) => ["aperta","parziale","scaduta"].includes(f.stato_calcolato))}
          fatturaIdPreselect={showPagamento.fatturaId}
          onClose={() => setShowPagamento({ open: false })}
          onRegistra={async (fId: string, p: any) => {
            const res = await fatt.registraPagamento(fId, p);
            if (res.ok) setShowPagamento({ open: false });
            else alert("Errore: " + (res.error || "sconosciuto"));
          }}
        />
      )}
      {showSpesa && (
        <ModalNuovaSpesa
          aziendaId={aziendaId}
          onClose={() => setShowSpesa(false)}
          onCrea={async (d: any) => {
            const res = await spese.creaSpesa(d);
            if (res.ok) { setShowSpesa(false); setMode("passive"); }
            else alert("Errore: " + (res.error || "sconosciuto"));
          }}
        />
      )}
      {showPagFornit.open && (
        <ModalPagamentoFornitore
          fatture={spese.fattRicevute.filter((f) => ["da_pagare","scaduta"].includes(f.stato_calcolato))}
          fatturaIdPreselect={showPagFornit.fatturaId}
          onClose={() => setShowPagFornit({ open: false })}
          onRegistra={async (fId: string, p: any) => {
            const res = await spese.registraPagamentoFornitore(fId, p);
            if (res.ok) setShowPagFornit({ open: false });
            else alert("Errore: " + (res.error || "sconosciuto"));
          }}
        />
      )}
      {showNuovaFatturaRic && (
        <ModalNuovaFatturaRicevuta
          onClose={() => setShowNuovaFatturaRic(false)}
          onCrea={async (d: any) => {
            const res = await spese.creaFatturaRicevuta(d);
            if (res.ok) { setShowNuovaFatturaRic(false); setMode("passive"); }
            else alert("Errore: " + (res.error || "sconosciuto"));
          }}
        />
      )}
      {fatturaCorrente && (
        <ModalDettaglioFattura
          fattura={fatturaCorrente}
          getPagamenti={fatt.getPagamentiPerFattura}
          onClose={() => setDettaglioId(null)}
          onRegistraPagamento={(fId: string) => { setDettaglioId(null); setShowPagamento({ open: true, fatturaId: fId }); }}
          onAnnulla={async (fId: string) => { await fatt.annullaFattura(fId); setDettaglioId(null); }}
        />
      )}
      {fatturaRicCorrente && (
        <ModalDettaglioFattRic
          fattura={fatturaRicCorrente}
          getPagamenti={spese.getPagamentiFatturaRicevuta}
          onClose={() => setDettaglioFattRicId(null)}
          onPaga={(fId: string) => { setDettaglioFattRicId(null); setShowPagFornit({ open: true, fatturaId: fId }); }}
          onAnnulla={async (fId: string) => { await spese.annullaFatturaRicevuta(fId); setDettaglioFattRicId(null); }}
        />
      )}
    </div>
  );
}
