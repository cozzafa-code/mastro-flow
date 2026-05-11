"use client";
// hooks/useCentroMontaggi.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface MontaggioRow {
  id: string;
  commessa_id: string;
  commessa_code: string;
  commessa_cliente: string;
  data_montaggio: string | null;
  ora_inizio: string | null;
  ora_fine: string | null;
  squadra: any[];
  squadra_label: string;
  operatore_id: string | null;
  stato: string;
  ore_preventivate: number;
  ore_reali: number | null;
  urgente: boolean;
  note_misuratore: string | null;
  indirizzo: string;
  materiali_status: string;
  materiali_perc: number;
}

export interface SquadraRow {
  key: string;
  label: string;
  operatori: string[];
  ore_settimana: number;
  capacita_settimana: number;
  saturazione: number;
}

export function useCentroMontaggi(aziendaId: string | null, fromDate: string, toDate: string) {
  const [montaggi, setMontaggi] = useState<MontaggioRow[]>([]);
  const [squadre, setSquadre] = useState<SquadraRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: montData } = await supabase
        .from("montaggi")
        .select("*")
        .eq("azienda_id", aziendaId)
        .gte("data_montaggio", fromDate)
        .lte("data_montaggio", toDate)
        .order("data_montaggio", { ascending: true });

      const cmIds = Array.from(new Set((montData || []).map((m: any) => m.commessa_id).filter(Boolean)));
      const { data: cmData } = cmIds.length > 0
        ? await supabase.from("commesse").select("id, code, cliente, cognome, indirizzo, materiali_status, materiali_perc").in("id", cmIds)
        : { data: [] };
      const cmMap: Record<string, any> = {};
      (cmData || []).forEach((c: any) => { cmMap[c.id] = c; });

      const rows: MontaggioRow[] = (montData || []).map((m: any) => {
        const cm = cmMap[m.commessa_id] || {};
        const squadraArr = Array.isArray(m.squadra) ? m.squadra : [];
        return {
          id: m.id,
          commessa_id: m.commessa_id,
          commessa_code: cm.code || "?",
          commessa_cliente: `${cm.cliente || ""} ${cm.cognome || ""}`.trim(),
          data_montaggio: m.data_montaggio,
          ora_inizio: m.ora_inizio,
          ora_fine: m.ora_fine,
          squadra: squadraArr,
          squadra_label: squadraArr.map((s: any) => s.nome || "").filter(Boolean).join(", ") || "Da assegnare",
          operatore_id: m.operatore_id,
          stato: m.stato || "pianificato",
          ore_preventivate: Number(m.ore_preventivate) || 4,
          ore_reali: m.ore_reali,
          urgente: !!m.urgente,
          note_misuratore: m.note_misuratore,
          indirizzo: cm.indirizzo || "",
          materiali_status: cm.materiali_status || 'nessuno',
          materiali_perc: cm.materiali_perc || 0,
        };
      });
      setMontaggi(rows);

      // Aggrega squadre dai montaggi
      const sqMap: Record<string, SquadraRow> = {};
      rows.forEach(m => {
        const key = m.squadra_label || "Da assegnare";
        if (!sqMap[key]) {
          sqMap[key] = {
            key, label: key,
            operatori: m.squadra.map((s: any) => s.nome).filter(Boolean),
            ore_settimana: 0,
            capacita_settimana: 40,
            saturazione: 0,
          };
        }
        sqMap[key].ore_settimana += m.ore_preventivate;
      });
      Object.values(sqMap).forEach(s => { s.saturazione = Math.round((s.ore_settimana / s.capacita_settimana) * 100); });
      setSquadre(Object.values(sqMap));
    } catch (e) {
      console.warn("[useCentroMontaggi]", e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId, fromDate, toDate]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`centro-mont-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "montaggi" }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, reload]);

  return { montaggi, squadre, loading, reload };
}
