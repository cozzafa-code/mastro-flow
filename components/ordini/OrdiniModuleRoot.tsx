"use client";

import React, { useState } from "react";
import OrdiniGlobaliSheet from "./OrdiniGlobaliSheet";
import OrdineDettaglioSheet from "./OrdineDettaglioSheet";
import RicezioneMerceSheetWrapper from "./RicezioneMerceSheetWrapper";
import NuovoOrdineWizard from "./NuovoOrdineWizard";

type ViewMode = "lista" | "dettaglio" | "ricezione" | "wizard";

interface Props {
  aziendaId: string;
  onClose: () => void;
  onApriCommessa?: (commessaId: string) => void;
  initialOrdineId?: string | null;
  initialCommessaId?: string | null;
}

export default function OrdiniModuleRoot({ aziendaId, onClose, onApriCommessa, initialOrdineId, initialCommessaId }: Props) {
  const [view, setView] = useState<ViewMode>(initialOrdineId ? "dettaglio" : "lista");
  const [ordineId, setOrdineId] = useState<string | null>(initialOrdineId ?? null);

  function aprilDettaglio(id: string) { console.log("[Ordini] apri dettaglio:", id); setOrdineId(id); setView("dettaglio"); }
  function chiudilettaglio() { console.log("[Ordini] chiudi dettaglio"); setOrdineId(null); setView("lista"); }
  function avviaRicezione(id: string) { console.log("[Ordini] avvia ricezione:", id); setOrdineId(id); setView("ricezione"); }
  function ricezioneCompletata(_id: string) { console.log("[Ordini] ricezione completata"); setView("lista"); setOrdineId(null); }
  function apriWizard() { console.log("[Ordini] apri wizard"); setView("wizard"); }
  function wizardCreato(id: string) { console.log("[Ordini] wizard creato:", id); setOrdineId(id); setView("dettaglio"); }

  if (view === "wizard") {
    return (
      <NuovoOrdineWizard
        aziendaId={aziendaId}
        commessaIdSuggerita={initialCommessaId ?? null}
        onClose={() => setView("lista")}
        onCreated={wizardCreato}
      />
    );
  }

  if (view === "ricezione" && ordineId) {
    return (
      <RicezioneMerceSheetWrapper
        ordineId={ordineId}
        onClose={() => { setView("dettaglio"); }}
        onCompletato={ricezioneCompletata}
      />
    );
  }

  if (view === "dettaglio" && ordineId) {
    return (
      <OrdineDettaglioSheet
        ordineId={ordineId}
        onClose={chiudilettaglio}
        onRicevi={avviaRicezione}
        onApriCommessa={onApriCommessa}
      />
    );
  }

  return (
    <OrdiniGlobaliSheet
      aziendaId={aziendaId}
      onClose={onClose}
      onApriOrdine={aprilDettaglio}
      onNuovoOrdine={apriWizard}
    />
  );
}
