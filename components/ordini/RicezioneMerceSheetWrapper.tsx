"use client";

import React, { useState } from "react";
import RicezioneMerceSheet from "./RicezioneMerceSheet";
import AnomaliaRigaSheet from "./AnomaliaRigaSheet";
import type { RigaVerificata } from "./ordini-types";
import { supabase } from "@/lib/supabase";

interface Props {
  ordineId: string;
  onClose: () => void;
  onCompletato: (ordineId: string) => void;
}

interface AnomaliaCtx {
  riga: RigaVerificata;
  qtaRichiesta: number;
  codice: string;
  descrizione: string;
  prezzoUnitario: number;
}

export default function RicezioneMerceSheetWrapper({ ordineId, onClose, onCompletato }: Props) {
  const [anomaliaCtx, setAnomaliaCtx] = useState<AnomaliaCtx | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  async function handleConfermaAnomalia(patch: Partial<RigaVerificata>) {
    if (!anomaliaCtx) return;
    const { data: o } = await supabase
      .from("ordini_fornitore")
      .select("righe_verificate")
      .eq("id", ordineId)
      .single();
    const arr: RigaVerificata[] = ((o?.righe_verificate as any) || []) as RigaVerificata[];
    const idx = arr.findIndex(r => r.id === anomaliaCtx.riga.id);
    let updated: RigaVerificata[];
    if (idx >= 0) {
      updated = arr.map((r, i) => i === idx ? { ...r, ...patch } : r);
    } else {
      updated = [...arr, { ...anomaliaCtx.riga, ...patch }];
    }
    await supabase
      .from("ordini_fornitore")
      .update({ righe_verificate: updated as any, updated_at: new Date().toISOString() })
      .eq("id", ordineId);
    setAnomaliaCtx(null);
    setReloadTick(t => t + 1);
  }

  return (
    <>
      <RicezioneMerceSheet
        key={reloadTick}
        ordineId={ordineId}
        onClose={onClose}
        onCompletato={onCompletato}
        onOpenAnomalia={(riga, qtaRichiesta, codice, descrizione) =>
          setAnomaliaCtx({ riga, qtaRichiesta, codice, descrizione, prezzoUnitario: 0 })
        }
      />
      {anomaliaCtx && (
        <AnomaliaRigaSheet
          riga={anomaliaCtx.riga}
          qtaRichiesta={anomaliaCtx.qtaRichiesta}
          codice={anomaliaCtx.codice}
          descrizione={anomaliaCtx.descrizione}
          prezzoUnitario={anomaliaCtx.prezzoUnitario}
          onClose={() => setAnomaliaCtx(null)}
          onConferma={handleConfermaAnomalia}
        />
      )}
    </>
  );
}
