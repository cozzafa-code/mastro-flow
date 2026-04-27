"use client";
// ============================================================
// MASTRO TABLET WRAPPER - Sprint 3
// Bridge tra ERP context e UI tablet.
//
// Routing per tab attivo (letto dal ctx ERP, NON dallo state mock):
//   - selectedVano settato       -> VanoDetailPanel ERP fullscreen (Sprint 1)
//   - tab === "commesse"          -> CommessePanel ERP (Sprint 2)
//   - tab === "clienti"           -> ClientiPanel ERP (Sprint 2)
//   - tab === "sopralluoghi"      -> RilieviListPanel ERP (Sprint 2)
//   - tab === "agenda"            -> AgendaCalendarioPanel ERP (Sprint 3)
//   - altri tab                    -> MastroTablet fliwoX (mock per ora)
//
// REGOLA: mobile/desktop ERP NON SI TOCCANO.
// Pannelli ERP importati identici. Stesso file usato da tutte le pelli.
// ============================================================
import * as React from "react";
import { useMastro } from "../MastroContext";
import VanoDetailPanel from "../VanoDetailPanel";
import RilieviListPanel from "../RilieviListPanel";
import CommessePanel from "../CommessePanel";
import ClientiPanel from "../ClientiPanel";
import AgendaCalendarioPanel from "../agenda/AgendaCalendarioPanel";
import MastroTablet from "./MastroTablet";

export default function MastroTabletWrapper() {
  const ctx = useMastro();
  const { selectedVano, tab, selectedCM } = ctx;

  // Sprint 1: vano aperto -> VanoDetailPanel fullscreen
  if (selectedVano) {
    return <VanoDetailPanel />;
  }

  // Sprint 2 + 3: pannelli ERP per le sezioni cablate
  if (tab === "commesse") {
    return <FullscreenPanel><CommessePanel /></FullscreenPanel>;
  }
  
  if (tab === "clienti") {
    return <FullscreenPanel><ClientiPanel /></FullscreenPanel>;
  }

  if (tab === "sopralluoghi") {
    if (selectedCM) {
      return <FullscreenPanel><RilieviListPanel /></FullscreenPanel>;
    }
    return <FullscreenPanel><CommessePanel /></FullscreenPanel>;
  }

  if (tab === "agenda") {
    // Background dark fliwoX gia' nel pannello stesso (#0D1F1F)
    // AgendaCalendarioPanel usa position:absolute inset:0, quindi
    // serve un container relative
    return (
      <div style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <AgendaCalendarioPanel />
      </div>
    );
  }

  // Tutte le altre sezioni: mock fliwoX (cabling nei prossimi sprint)
  return <MastroTablet />;
}

// Container fullscreen per pannelli ERP che NON usano position:absolute
function FullscreenPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "100vh", overflow: "auto", background: "#F2F1EC" }}>
      {children}
    </div>
  );
}
