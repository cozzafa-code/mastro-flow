"use client";
// ============================================================
// MASTRO TABLET WRAPPER - Sprint 2
// Bridge tra ERP context e UI tablet.
//
// Routing per tab attivo (letto dal ctx ERP, NON dallo state mock):
//   - selectedVano settato       -> VanoDetailPanel ERP fullscreen (Sprint 1)
//   - tab === "commesse" + !sel  -> CommessePanel ERP (Sprint 2)
//   - tab === "clienti"          -> ClientiPanel ERP (Sprint 2)
//   - tab === "sopralluoghi"     -> RilieviListPanel ERP (Sprint 2)
//   - altri tab                   -> MastroTablet fliwoX (mock per ora,
//                                     cabling nei prossimi sprint)
//
// REGOLA: mobile/desktop ERP NON SI TOCCANO.
// I pannelli ERP qui sono importati identici, stesso file usato da mobile.
// ============================================================
import * as React from "react";
import { useMastro } from "../MastroContext";
import VanoDetailPanel from "../VanoDetailPanel";
import RilieviListPanel from "../RilieviListPanel";
import CommessePanel from "../CommessePanel";
import ClientiPanel from "../ClientiPanel";
import MastroTablet from "./MastroTablet";

export default function MastroTabletWrapper() {
  const ctx = useMastro();
  const { selectedVano, tab, selectedCM } = ctx;

  // Sprint 1: vano aperto -> VanoDetailPanel fullscreen
  if (selectedVano) {
    return <VanoDetailPanel />;
  }

  // Sprint 2: pannelli ERP per le 3 sezioni cablate
  // selectedCM dentro tab "commesse" = utente ha aperto una commessa
  // -> RilieviListPanel mostra rilievi/sopralluoghi di QUELLA commessa
  if (tab === "commesse" && selectedCM) {
    return <CommessePanelWrapper />;
  }
  
  if (tab === "commesse") {
    return <CommessePanelWrapper />;
  }
  
  if (tab === "clienti") {
    return <ClientiPanelWrapper />;
  }

  if (tab === "sopralluoghi") {
    // Sezione sopralluoghi globale: vista TUTTI i rilievi di TUTTE le commesse
    // Questa e' una funzione che il tablet aggiunge rispetto a ERP mobile.
    // RilieviListPanel oggi mostra rilievi di selectedCM.
    // Per ora rendiamo selectedCM se presente; altrimenti il pannello stesso
    // mostrera' empty state e si tornera' alla lista commesse.
    if (selectedCM) {
      return <RilieviListPanelWrapper />;
    }
    // Fallback: mostra lista commesse (poi user clicca commessa -> rilievi)
    return <CommessePanelWrapper />;
  }

  // Tutte le altre sezioni: mock fliwoX (cabling nei prossimi sprint)
  return <MastroTablet />;
}

// Wrapper minimi per layout consistente (header tablet + back button)
function CommessePanelWrapper() {
  return (
    <div style={{ height: "100vh", overflow: "auto", background: "#F2F1EC" }}>
      <CommessePanel />
    </div>
  );
}

function ClientiPanelWrapper() {
  return (
    <div style={{ height: "100vh", overflow: "auto", background: "#F2F1EC" }}>
      <ClientiPanel />
    </div>
  );
}

function RilieviListPanelWrapper() {
  return (
    <div style={{ height: "100vh", overflow: "auto", background: "#F2F1EC" }}>
      <RilieviListPanel />
    </div>
  );
}
