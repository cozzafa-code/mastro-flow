// MASTRO ERP - useStimaProduzione
// Calcola stima tempo produzione per una commessa usando il catalogo tipi_infisso_tempi (Modo 4)
// Fallback: capacita giornaliera da produzione_config se commessa senza vani in DB
import { useEffect, useState } from "react";

export type StimaProduzione = {
  ore_totali: number;
  giorni_stimati: number;
  ore_per_tipo: Record<string, { nome: string; n: number; ore_unit: number; ore_tot: number }>;
  origine: "catalogo" | "fallback_capacita" | "manuale";
  dettaglio_testo: string;
};

const ORE_LAVORO_GIORNO = 8;

function normalizzaTipo(t: string): string {
  if (!t) return "altro";
  const s = t.toLowerCase().replace(/[^a-z]/g, "_");
  if (s.includes("scorrevole") && s.includes("alzante")) return "scorrevole_alzante";
  if (s.includes("scorrevole")) return "finestra_scorrevole";
  if (s.includes("portafinestra") || s.includes("porta_finestra")) return "portafinestra";
  if (s.includes("portoncino") || s.includes("portoni")) return "portoncino";
  if (s.includes("persian")) return "persiana";
  if (s.includes("zanzar")) return "zanzariera";
  if (s.includes("tappa")) return "tapparella";
  if (s.includes("lamiera") || s.includes("lattoneria") || s.includes("scossal")) return "lamiera_lattoneria";
  if (s.includes("battente") || s.includes("finestra")) return "finestra_battente";
  return "altro";
}

export async function calcolaStimaProduzione(
  aziendaId: string,
  commessaId: string,
  capacitaFallbackVani: number = 30
): Promise<StimaProduzione> {
  const { supabase } = await import("@/lib/supabase");
  // 1. Carica catalogo tipi infisso
  const { data: catalogo } = await supabase
    .from("tipi_infisso_tempi")
    .select("tipo_chiave, nome_visibile, ore_per_unita, fattore_difficolta")
    .eq("azienda_id", aziendaId)
    .eq("attivo", true);
  
  const cat = new Map<string, { nome: string; ore: number }>();
  (catalogo || []).forEach((c: any) => {
    cat.set(c.tipo_chiave, { 
      nome: c.nome_visibile, 
      ore: Number(c.ore_per_unita) * Number(c.fattore_difficolta || 1.0) 
    });
  });
  
  // 2. Carica vani della commessa
  const { data: vani } = await supabase
    .from("vani")
    .select("tipo, sistema")
    .eq("commessa_id", commessaId);
  
  if (!vani || vani.length === 0) {
    // Fallback: stima da capacita giornaliera
    return {
      ore_totali: 0,
      giorni_stimati: 1,
      ore_per_tipo: {},
      origine: "fallback_capacita",
      dettaglio_testo: "Nessun vano catalogato - stima default 1 giorno",
    };
  }
  
  // 3. Raggruppa vani per tipo normalizzato
  const orePerTipo: Record<string, { nome: string; n: number; ore_unit: number; ore_tot: number }> = {};
  let oreTotali = 0;
  
  vani.forEach((v: any) => {
    const k = normalizzaTipo(v.tipo || "altro");
    const fromCat = cat.get(k) || cat.get("altro") || { nome: "Generico", ore: 5 };
    if (!orePerTipo[k]) {
      orePerTipo[k] = { nome: fromCat.nome, n: 0, ore_unit: fromCat.ore, ore_tot: 0 };
    }
    orePerTipo[k].n += 1;
    orePerTipo[k].ore_tot += fromCat.ore;
    oreTotali += fromCat.ore;
  });
  
  const giorniStimati = Math.max(0.5, Math.ceil((oreTotali / ORE_LAVORO_GIORNO) * 2) / 2);
  
  const dettaglio = Object.values(orePerTipo)
    .map(t => t.n + " " + t.nome + " x" + t.ore_unit + "h = " + t.ore_tot + "h")
    .join(" + ");
  
  return {
    ore_totali: oreTotali,
    giorni_stimati: giorniStimati,
    ore_per_tipo: orePerTipo,
    origine: "catalogo",
    dettaglio_testo: dettaglio,
  };
}

export function useStimaProduzione(aziendaId: string | null, commessaId: string | null) {
  const [stima, setStima] = useState<StimaProduzione | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!aziendaId || !commessaId) { setStima(null); return; }
    setLoading(true);
    calcolaStimaProduzione(aziendaId, commessaId)
      .then(s => setStima(s))
      .catch(e => { console.error("[useStimaProduzione]", e); setStima(null); })
      .finally(() => setLoading(false));
  }, [aziendaId, commessaId]);
  
  return { stima, loading };
}
