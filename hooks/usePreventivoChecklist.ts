// ════════════════════════════════════════════════════════════
// HOOK · usePreventivoChecklist
// ════════════════════════════════════════════════════════════
// State manager per le checklist contestuali sotto bonus/IVA.
// Auto-seed al cambio bonus/IVA, real-time refresh dopo update.

import { useEffect, useState, useCallback } from "react";
import {
  listDocRichiesti, listDocInviati,
  seedBonusChecklist, seedIvaChecklist,
  setDocRaccolto, setDocInviato,
  getChecklistProgress,
  type DocRichiestoRow, type DocInviatoRow,
} from "@/lib/preventivo-checklist-supabase";
import type { BonusKey, IVAKey } from "@/lib/preventivo-checklist-templates";

export type ChecklistProgress = {
  in_total: number;
  in_raccolti: number;
  in_obbligatori_mancanti: number;
  out_total: number;
  out_inviati: number;
};

export function usePreventivoChecklist(params: {
  azienda_id: string | null;
  commessa_id: string | null;
  bonus: BonusKey | null;
  iva: IVAKey | null;
}) {
  const { azienda_id, commessa_id, bonus, iva } = params;

  const [docsBonusIn, setDocsBonusIn] = useState<DocRichiestoRow[]>([]);
  const [docsBonusOut, setDocsBonusOut] = useState<DocInviatoRow[]>([]);
  const [docsIvaIn, setDocsIvaIn] = useState<DocRichiestoRow[]>([]);
  const [docsIvaOut, setDocsIvaOut] = useState<DocInviatoRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── refresh BONUS ─────────────────────────────────────
  const refreshBonus = useCallback(async () => {
    if (!commessa_id || !bonus) {
      setDocsBonusIn([]);
      setDocsBonusOut([]);
      return;
    }
    const [docIn, docOut] = await Promise.all([
      listDocRichiesti(commessa_id, "bonus", bonus),
      listDocInviati(commessa_id, "bonus", bonus),
    ]);
    setDocsBonusIn(docIn);
    setDocsBonusOut(docOut);
  }, [commessa_id, bonus]);

  // ─── refresh IVA ──────────────────────────────────────
  const refreshIva = useCallback(async () => {
    if (!commessa_id || !iva) {
      setDocsIvaIn([]);
      setDocsIvaOut([]);
      return;
    }
    const [docIn, docOut] = await Promise.all([
      listDocRichiesti(commessa_id, "iva", iva),
      listDocInviati(commessa_id, "iva", iva),
    ]);
    setDocsIvaIn(docIn);
    setDocsIvaOut(docOut);
  }, [commessa_id, iva]);

  // ─── auto-seed quando cambia bonus ─────────────────────
  useEffect(() => {
    if (!azienda_id || !commessa_id || !bonus) return;
    let alive = true;
    (async () => {
      setLoading(true);
      await seedBonusChecklist({ azienda_id, commessa_id, bonus });
      if (alive) await refreshBonus();
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [azienda_id, commessa_id, bonus, refreshBonus]);

  // ─── auto-seed quando cambia IVA ───────────────────────
  useEffect(() => {
    if (!azienda_id || !commessa_id || !iva) return;
    let alive = true;
    (async () => {
      setLoading(true);
      await seedIvaChecklist({ azienda_id, commessa_id, iva });
      if (alive) await refreshIva();
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [azienda_id, commessa_id, iva, refreshIva]);

  // ─── azioni esposte ───────────────────────────────────
  const toggleRaccolto = useCallback(async (id: string, current: boolean, file_url?: string) => {
    const ok = await setDocRaccolto(id, !current, file_url);
    if (ok) {
      await Promise.all([refreshBonus(), refreshIva()]);
    }
    return ok;
  }, [refreshBonus, refreshIva]);

  const inviaDoc = useCallback(async (id: string, canale: "whatsapp" | "email" | "manuale" | "download") => {
    const ok = await setDocInviato(id, canale);
    if (ok) {
      await Promise.all([refreshBonus(), refreshIva()]);
    }
    return ok;
  }, [refreshBonus, refreshIva]);

  // ─── progress derivati ────────────────────────────────
  const bonusProgress: ChecklistProgress = {
    in_total: docsBonusIn.length,
    in_raccolti: docsBonusIn.filter(d => d.raccolto).length,
    in_obbligatori_mancanti: docsBonusIn.filter(d => d.doc_obbligatorio && !d.raccolto).length,
    out_total: docsBonusOut.length,
    out_inviati: docsBonusOut.filter(d => d.inviato).length,
  };

  const ivaProgress: ChecklistProgress = {
    in_total: docsIvaIn.length,
    in_raccolti: docsIvaIn.filter(d => d.raccolto).length,
    in_obbligatori_mancanti: docsIvaIn.filter(d => d.doc_obbligatorio && !d.raccolto).length,
    out_total: docsIvaOut.length,
    out_inviati: docsIvaOut.filter(d => d.inviato).length,
  };

  return {
    // BONUS
    docsBonusIn, docsBonusOut, bonusProgress,
    // IVA
    docsIvaIn, docsIvaOut, ivaProgress,
    // azioni
    toggleRaccolto, inviaDoc,
    refreshBonus, refreshIva,
    loading,
  };
}
