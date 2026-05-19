"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  OrdineConCommessa, RigaOrdine, RigaVerificata
} from "./ordini-types";
import {
  buildRigheVerificate, salvaRicezione, computeScostamento, saveAlertScostamento
} from "./ordini-helpers";
import RicezioneHeader from "./ricezione/RicezioneHeader";
import CtaTuttiOk from "./ricezione/CtaTuttiOk";
import RigaCard from "./ricezione/RigaCard";
import DDTFooter from "./ricezione/DDTFooter";

interface Props {
  ordineId: string;
  aziendaId: string;
  onClose: () => void;
  onCompleted: () => void;
}

export default function RicezioneMerceSheet({ ordineId, aziendaId, onClose, onCompleted }: Props) {
  const [ordine, setOrdine] = useState<OrdineConCommessa | null>(null);
  const [righe, setRighe] = useState<RigaOrdine[]>([]);
  const [verifiche, setVerifiche] = useState<RigaVerificata[]>([]);
  const [openRigaId, setOpenRigaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("tutte");

  useEffect(() => {
    if (!ordineId) return;
    (async () => {
      setLoading(true);
      const { data: ord } = await supabase
        .from("ordini_fornitore").select("*")
        .eq("id", ordineId).maybeSingle();
      if (!ord) { setLoading(false); return; }

      let cm: any = null;
      if (ord.commessa_id) {
        const r = await supabase.from("commesse")
          .select("code, cliente, cognome").eq("id", ord.commessa_id).maybeSingle();
        cm = r.data;
      }
      let forn: any = null;
      if (ord.fornitore_id) {
        const r = await supabase.from("fornitori")
          .select("nome").eq("id", ord.fornitore_id).maybeSingle();
        forn = r.data;
      }
      setOrdine({ ...ord, commessa: cm, fornitore_nome: forn?.nome } as any);

      const righeJson = (ord as any).righe;
      const righeArr: RigaOrdine[] = Array.isArray(righeJson) ? righeJson : [];
      setRighe(righeArr);

      const precedenti = (ord as any).righe_verificate as RigaVerificata[] | undefined;
      setVerifiche(buildRigheVerificate(righeArr, precedenti));
      setLoading(false);
    })();
  }, [ordineId]);

  const ricevuti = useMemo(
    () => verifiche.filter((v) => v.stato === "ok" || v.stato === "parziale").length,
    [verifiche]
  );
  const anomalie = useMemo(
    () => verifiche.filter((v) => v.stato === "problema").length,
    [verifiche]
  );

  function handleTuttiOk() {
    if (!confirm(`Confermi che tutte le ${righe.length} righe sono arrivate come ordinate?`)) return;
    const aggiornate = verifiche.map((v, i) => ({
      ...v,
      qta_arrivata: righe[i].qta_ordinata || 0,
      costo_reale_unit: righe[i].costo_unitario || 0,
      stato: "ok" as const,
    }));
    setVerifiche(aggiornate);
  }

  function handleSaveRiga(rv: RigaVerificata) {
    const updated = verifiche.map((v) => v.riga_id === rv.riga_id ? rv : v);
    setVerifiche(updated);
    setOpenRigaId(null);

    // Alert scostamento se >= 5%
    const riga = righe.find((r) => r.id === rv.riga_id);
    if (riga && rv.costo_reale_unit) {
      const scost = computeScostamento(riga.costo_unitario || 0, rv.costo_reale_unit, rv.qta_arrivata || 0);
      if (scost.livello !== "none" && ordine) {
        saveAlertScostamento({
          aziendaId,
          ordineId,
          rigaId: rv.riga_id || "",
          fornitoreId: ordine.fornitore_id || "",
          codiceArticolo: riga.codice_articolo || "",
          descrizione: riga.descrizione || "",
          costoOrdinato: riga.costo_unitario || 0,
          costoReale: rv.costo_reale_unit || 0,
          pct: scost.pct,
          deltaTotale: scost.deltaTotale,
          livello: scost.livello,
        }).catch((e) => console.warn("[alert scostamento]", e));
      }
    }
  }

  async function handleConfermaRicezione(ddt: { numero: string; data: string; fotoUrls?: string[]; fatturaNumero?: string; note?: string }) {
    if (!ordine) return;
    const tuttiOk = verifiche.every((v) => v.stato === "ok");
    const tuttiVerificati = verifiche.every((v) => v.stato);
    if (!tuttiVerificati) {
      if (!confirm("Alcune righe non sono ancora verificate. Continuare comunque?")) return;
    }

    const res = await salvaRicezione(
      ordineId,
      verifiche,
      { numero: ddt.numero, data: ddt.data },
      {
        fatturaNumero: ddt.fatturaNumero || null,
        fotoUrls: ddt.fotoUrls,
        note: ddt.note,
      }
    );
    if (!res.ok) {
      alert("Errore salvataggio: " + (res.error || "—"));
      return;
    }
    alert(`Ricezione confermata: ${ricevuti}/${righe.length} righe`);
    onCompleted();
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#8B9BB0", zIndex: 120,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14
      }}>Caricamento ricezione...</div>
    );
  }
  if (!ordine) return null;

  const righeFiltrate = righe.filter((r, i) => {
    const v = verifiche[i];
    if (filtro === "tutte") return true;
    if (filtro === "da_ricevere") return !v?.stato;
    if (filtro === "ok") return v?.stato === "ok";
    if (filtro === "anomalie") return v?.stato === "problema";
    return true;
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#8B9BB0",
      zIndex: 120, overflowY: "auto", paddingBottom: 280,
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <RicezioneHeader
        ord={ordine}
        ricevuti={ricevuti}
        totRighe={righe.length}
        onClose={onClose}
        onMenu={() => { /* TODO */ }}
        onApriCommessa={() => { /* TODO */ }}
      />
      <CtaTuttiOk totRighe={righe.length} onTuttiOk={handleTuttiOk} />

      <div style={{
        margin: "14px 16px 8px", display: "flex", gap: 6,
        overflowX: "auto", scrollbarWidth: "none" as any, paddingBottom: 4
      }}>
        {[
          { k: "tutte", l: "Tutte", n: righe.length },
          { k: "da_ricevere", l: "Da ricevere", n: righe.length - ricevuti - anomalie },
          { k: "ok", l: "OK", n: ricevuti },
          { k: "anomalie", l: "Anomalie", n: anomalie },
        ].map((f) => (
          <div key={f.k} onClick={() => setFiltro(f.k)} style={{
            padding: "7px 14px",
            background: filtro === f.k ? "#1A2A47" : "#fff",
            color: filtro === f.k ? "#fff" : "#5A6478",
            borderRadius: 99, fontSize: 12, fontWeight: 700,
            whiteSpace: "nowrap", display: "inline-flex",
            alignItems: "center", gap: 6, border: "1.5px solid transparent",
            flexShrink: 0, cursor: "pointer"
          }}>
            {f.l}
            <span style={{
              fontSize: 10,
              background: filtro === f.k ? "rgba(255,255,255,0.2)" : "#E8EAF0",
              color: filtro === f.k ? "#fff" : "#5A6478",
              padding: "1px 6px", borderRadius: 99
            }}>{f.n}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: "0 12px" }}>
        {righeFiltrate.map((r, i) => {
          const idx = righe.findIndex((x) => x.id === r.id);
          const v = verifiche[idx] || { riga_id: r.id, stato: undefined };
          return (
            <RigaCard
              key={r.id}
              riga={r}
              verifica={v}
              index={idx}
              isOpen={openRigaId === r.id}
              onToggle={() => setOpenRigaId(openRigaId === r.id ? null : (r.id || null))}
              onSave={handleSaveRiga}
            />
          );
        })}
      </div>

      <DDTFooter aziendaId={aziendaId} ordineId={ordineId} onConferma={handleConfermaRicezione} />
    </div>
  );
}
