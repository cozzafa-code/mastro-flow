"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import StatsHeader from "./stats/StatsHeader";
import StatsKpiBig from "./stats/StatsKpiBig";
import StatsBarChart from "./stats/StatsBarChart";
import StatsTopFornitori from "./stats/StatsTopFornitori";
import StatsTopArticoli from "./stats/StatsTopArticoli";
import StatsAlertInflazione from "./stats/StatsAlertInflazione";
import { exportStatsToPdf, exportStatsToExcel, ExportPayload } from "./stats/stats-export";

interface Props {
  aziendaId: string;
  onClose: () => void;
}

interface StatAnno { anno: number; n_ordini: number; n_fornitori: number; spesa_totale: number; n_righe_totali: number; }
interface StatMese { anno: number; mese: number; spesa: number; }
interface StatFornitore { fornitore_id: string; fornitore_nome: string; n_ordini: number; spesa_totale: number; anno: number; }
interface StatArticolo { codice_articolo: string; descrizione: string; fornitore_id: string; qta_totale: number; prezzo_medio: number; anno: number; }

export default function StatisticheOrdiniSheet({ aziendaId, onClose }: Props) {
  const [annoCorrente, setAnnoCorrente] = useState(new Date().getFullYear());
  const [annoConfronto, setAnnoConfronto] = useState(new Date().getFullYear() - 1);
  const [statsAnno, setStatsAnno] = useState<StatAnno[]>([]);
  const [statsMese, setStatsMese] = useState<StatMese[]>([]);
  const [statsFornitori, setStatsFornitori] = useState<StatFornitore[]>([]);
  const [statsArticoli, setStatsArticoli] = useState<StatArticolo[]>([]);
  const [fornitoriMap, setFornitoriMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aziendaId) return;
    (async () => {
      setLoading(true);
      const [a, m, f, art, forn] = await Promise.all([
        supabase.from("v_stats_ordini_anno").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_stats_ordini_mese").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_stats_ordini_fornitore").select("*").eq("azienda_id", aziendaId),
        supabase.from("v_stats_articoli_prezzo").select("*").eq("azienda_id", aziendaId),
        supabase.from("fornitori").select("id, nome").eq("azienda_id", aziendaId),
      ]);
      setStatsAnno((a.data || []) as any);
      setStatsMese((m.data || []) as any);
      setStatsFornitori((f.data || []) as any);
      setStatsArticoli((art.data || []) as any);
      const map: Record<string, string> = {};
      (forn.data || []).forEach((x: any) => { map[x.id] = x.nome; });
      setFornitoriMap(map);
      setLoading(false);
    })();
  }, [aziendaId]);

  const anniDisponibili = useMemo(() => {
    const set = new Set(statsAnno.map((s) => s.anno));
    set.add(annoCorrente);
    set.add(annoConfronto);
    return Array.from(set).sort((a, b) => b - a);
  }, [statsAnno, annoCorrente, annoConfronto]);

  const annoCorrenteData = useMemo(() => statsAnno.find((s) => s.anno === annoCorrente),
    [statsAnno, annoCorrente]);
  const annoConfrontoData = useMemo(() => statsAnno.find((s) => s.anno === annoConfronto),
    [statsAnno, annoConfronto]);

  const deltaPct = useMemo(() => {
    if (!annoCorrenteData || !annoConfrontoData || annoConfrontoData.spesa_totale === 0) return null;
    return ((annoCorrenteData.spesa_totale - annoConfrontoData.spesa_totale) / annoConfrontoData.spesa_totale) * 100;
  }, [annoCorrenteData, annoConfrontoData]);

  const datiMeseCorr = useMemo(() =>
    statsMese.filter((m) => m.anno === annoCorrente).map((m) => ({ mese: m.mese, spesa: m.spesa })),
    [statsMese, annoCorrente]);
  const datiMeseConf = useMemo(() =>
    statsMese.filter((m) => m.anno === annoConfronto).map((m) => ({ mese: m.mese, spesa: m.spesa })),
    [statsMese, annoConfronto]);

  const topFornitori = useMemo(() => {
    const corrente = statsFornitori.filter((f) => f.anno === annoCorrente);
    const confronto = new Map(statsFornitori.filter((f) => f.anno === annoConfronto).map((f) => [f.fornitore_id, f.spesa_totale]));
    return corrente
      .map((f) => {
        const confSpesa = confronto.get(f.fornitore_id);
        const delta = confSpesa && confSpesa > 0 ? ((f.spesa_totale - confSpesa) / confSpesa) * 100 : null;
        return { ...f, delta_pct: delta };
      })
      .sort((a, b) => b.spesa_totale - a.spesa_totale);
  }, [statsFornitori, annoCorrente, annoConfronto]);

  const topArticoli = useMemo(() => {
    const corrente = statsArticoli.filter((a) => a.anno === annoCorrente);
    const confronto = new Map(statsArticoli.filter((a) => a.anno === annoConfronto).map((a) => [a.codice_articolo, a.prezzo_medio]));
    return corrente
      .map((a) => ({
        codice_articolo: a.codice_articolo,
        descrizione: a.descrizione,
        fornitore_nome: fornitoriMap[a.fornitore_id] || "—",
        qta_totale: a.qta_totale,
        prezzo_medio_corrente: a.prezzo_medio,
        prezzo_medio_confronto: confronto.get(a.codice_articolo) ?? null,
      }))
      .sort((a, b) => b.qta_totale - a.qta_totale);
  }, [statsArticoli, annoCorrente, annoConfronto, fornitoriMap]);

  // Trova top alert inflazione (fornitore con maggior delta positivo)
  const topAlert = useMemo(() => {
    const fornitoriConDelta = topFornitori.filter((f) => f.delta_pct !== null && f.delta_pct > 10);
    if (fornitoriConDelta.length === 0) return null;
    return fornitoriConDelta[0];
  }, [topFornitori]);

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#8B9BB0", zIndex: 130,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontFamily: "-apple-system, sans-serif"
      }}>Caricamento statistiche...</div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#8B9BB0",
      zIndex: 130, overflowY: "auto", paddingBottom: 100,
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <StatsHeader
        annoCorrente={annoCorrente}
        annoConfronto={annoConfronto}
        onChangeAnnoCorrente={setAnnoCorrente}
        onChangeAnnoConfronto={setAnnoConfronto}
        anniDisponibili={anniDisponibili}
        onClose={onClose}
        onExport={(formato: "pdf" | "excel") => {
          const payload: ExportPayload = {
            annoCorrente,
            annoConfronto,
            kpiCorrente: {
              spesa_totale: annoCorrenteData?.spesa_totale || 0,
              n_ordini: annoCorrenteData?.n_ordini || 0,
              n_righe: annoCorrenteData?.n_righe_totali || 0,
              n_fornitori: annoCorrenteData?.n_fornitori || 0,
            },
            kpiConfronto: annoConfrontoData ? {
              spesa_totale: annoConfrontoData.spesa_totale,
              n_ordini: annoConfrontoData.n_ordini,
              n_righe: annoConfrontoData.n_righe_totali,
              n_fornitori: annoConfrontoData.n_fornitori,
            } : null,
            deltaPct,
            topFornitori,
            topArticoli,
            statsMese: statsMese.map((m) => ({ anno: m.anno, mese: m.mese, spesa: m.spesa })),
          };
          if (formato === "pdf") exportStatsToPdf(payload);
          else exportStatsToExcel(payload);
        }}
      />

      <StatsKpiBig
        spesaTotale={annoCorrenteData?.spesa_totale || 0}
        nOrdini={annoCorrenteData?.n_ordini || 0}
        nRighe={annoCorrenteData?.n_righe_totali || 0}
        nFornitori={annoCorrenteData?.n_fornitori || 0}
        deltaPct={deltaPct}
      />

      {topAlert && (
        <StatsAlertInflazione
          fornitoreNome={topAlert.fornitore_nome}
          articolo="articoli principali"
          pctAumento={topAlert.delta_pct!}
        />
      )}

      <StatsBarChart
        annoCorrente={annoCorrente}
        annoConfronto={annoConfronto}
        datiCorrente={datiMeseCorr}
        datiConfronto={datiMeseConf}
      />

      <StatsTopFornitori
        annoCorrente={annoCorrente}
        fornitori={topFornitori}
      />

      <StatsTopArticoli articoli={topArticoli} />

      {statsAnno.length === 0 && (
        <div style={{
          margin: "30px 14px", padding: 24, background: "rgba(255,255,255,0.5)",
          borderRadius: 12, textAlign: "center", color: "#5A6478", fontSize: 12
        }}>
          Nessun dato disponibile ancora. Le statistiche si popolano automaticamente man mano che si effettuano ordini.
        </div>
      )}
    </div>
  );
}
