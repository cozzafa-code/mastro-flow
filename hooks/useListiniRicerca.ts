"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export interface ListinoItem {
  id: string;
  sorgente: string;        // 'accessori' | 'profili' | 'vetri' | 'ferramenta' | 'guarnizioni' | 'pannelli' | 'lavorazioni' | 'tipologie'
  sorgente_label: string;  // 'ACC' | 'PROF' | ...
  codice: string;
  nome: string;
  descrizione: string | null;
  prezzo: number;
  unita: string;
  categoria: string | null;
  meta: any;
  score: number;
}

export type SorgenteFilter = string[]; // array di sorgenti da includere

const SORGENTI_LABELS: Record<string, string> = {
  accessori: "Accessori",
  profili: "Profili",
  vetri: "Vetri",
  ferramenta: "Ferramenta",
  guarnizioni: "Guarnizioni",
  pannelli: "Pannelli",
  lavorazioni: "Lavorazioni",
  tipologie: "Tipologie",
  preventivi: "Preventivi",
  commesse: "Commesse",
};

export const SORGENTI_ALL = Object.keys(SORGENTI_LABELS);

export function useListiniRicerca(query: string, sorgenti: SorgenteFilter | null = null, debounceMs = 250) {
  const [results, setResults] = useState<ListinoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);
  const abortRef = useRef<any>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = (query || "").trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("cerca_listini", { p_query: q, p_limit: 30 });
        if (error) {
          console.warn("[useListiniRicerca] errore:", error);
          setResults([]);
        } else {
          let rows = (data || []) as ListinoItem[];
          if (sorgenti && sorgenti.length > 0) {
            rows = rows.filter((r) => sorgenti.includes(r.sorgente));
          }
          setResults(rows);
        }
      } catch (e) {
        console.warn("[useListiniRicerca] exception:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, JSON.stringify(sorgenti), debounceMs]);

  return { results, loading };
}

// Helper: raggruppa per sorgente
export function groupBySorgente(items: ListinoItem[]): { sorgente: string; label: string; items: ListinoItem[] }[] {
  const map = new Map<string, ListinoItem[]>();
  items.forEach((it) => {
    if (!map.has(it.sorgente)) map.set(it.sorgente, []);
    map.get(it.sorgente)!.push(it);
  });
  return Array.from(map.entries()).map(([sorgente, items]) => ({
    sorgente,
    label: SORGENTI_LABELS[sorgente] || sorgente.toUpperCase(),
    items,
  }));
}

export { SORGENTI_LABELS };
