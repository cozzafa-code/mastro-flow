"use client";
// ============================================================
// MASTRO TABLET WRAPPER
// Bridge tra ERP context e MastroTablet fliwoX UI.
// Vive DENTRO <MastroContext.Provider> di MastroERP.
// Quando selectedVano settato -> apre VanoDetailPanel ERP intero.
// Altrimenti -> MastroTablet fliwoX layout.
// ============================================================
import * as React from "react";
import { useMastro } from "../MastroContext";
import VanoDetailPanel from "../VanoDetailPanel";
import MastroTablet from "./MastroTablet";

export default function MastroTabletWrapper() {
  const { selectedVano } = useMastro();

  // Se l'utente ha aperto un vano, fullscreen VanoDetailPanel ERP identico al desktop
  if (selectedVano) {
    return <VanoDetailPanel />;
  }

  // Altrimenti layout fliwoX tablet
  return <MastroTablet />;
}
