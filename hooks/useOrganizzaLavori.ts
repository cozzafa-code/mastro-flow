"use client";
// hooks/useOrganizzaLavori.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Lavorazione {
  id: string;
  commessa_id: string;
  fase: string;
  ordine: number;
  ore_stimate: number;
  operatore_id: string | null;
  operatore_nome: string | null;
  data_pianificata: string | null;
  stato: string;
  note: string | null;
}

export interface Montaggio {
  id: string;
  commessa_id: string;
  data_installazione: string | null;
  orario_inizio: string | null;
  orario_fine: string | null;
  squadra: any[];
  mezzi: any[];
  note: string | null;
  stato: string;
}

export interface Operatore {
  id: string;
  nome: string;
  ruolo: string | null;
  pin: string | null;
}

export function useOrganizzaLavori(commessaId: string | null, aziendaId: string | null) {
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([]);
  const [montaggio, setMontaggio] = useState<Montaggio | null>(null);
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [materialiStatus, setMaterialiStatus] = useState<{status: string; perc: number}>({status: 'nessuno', perc: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!commessaId || !aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [lavRes, montRes, opRes, cmRes] = await Promise.all([
        supabase.from("lavorazioni_commessa").select("*").eq("commessa_id", commessaId).order("ordine", { ascending: true }),
        supabase.from("montaggi").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("operatori").select("id, nome, ruolo, pin").eq("azienda_id", aziendaId).order("nome"),
        supabase.from("commesse").select("materiali_status, materiali_perc").eq("id", commessaId).maybeSingle(),
      ]);

      setLavorazioni((lavRes.data as Lavorazione[]) || []);
      setMontaggio((montRes.data as Montaggio) || null);
      setOperatori((opRes.data as Operatore[]) || []);
      setMaterialiStatus({
        status: (cmRes.data as any)?.materiali_status || 'nessuno',
        perc: (cmRes.data as any)?.materiali_perc || 0,
      });
      setError(null);
    } catch (e: any) {
      console.error("[useOrganizzaLavori]", e);
      setError(e?.message || "errore");
    } finally {
      setLoading(false);
    }
  }, [commessaId, aziendaId]);

  useEffect(() => { reload(); }, [reload]);

  // Realtime su cambio commessa (materiali_status update)
  useEffect(() => {
    if (!commessaId) return;
    const ch = supabase.channel(`org-lav-${commessaId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "commesse", filter: `id=eq.${commessaId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "lavorazioni_commessa", filter: `commessa_id=eq.${commessaId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "montaggi", filter: `commessa_id=eq.${commessaId}` }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [commessaId, reload]);

  const updateLavorazione = useCallback(async (id: string, patch: Partial<Lavorazione>) => {
    const { error } = await supabase.from("lavorazioni_commessa").update(patch).eq("id", id);
    if (error) console.error("[updateLavorazione]", error);
    return !error;
  }, []);

  const updateMontaggio = useCallback(async (patch: Partial<Montaggio>) => {
    if (!commessaId) return false;
    if (montaggio?.id) {
      const { error } = await supabase.from("montaggi").update(patch).eq("id", montaggio.id);
      return !error;
    } else {
      const { error } = await supabase.from("montaggi").insert({ ...patch, commessa_id: commessaId, azienda_id: aziendaId });
      return !error;
    }
  }, [commessaId, aziendaId, montaggio]);

  return { lavorazioni, montaggio, operatori, materialiStatus, loading, error, reload, updateLavorazione, updateMontaggio };
}
