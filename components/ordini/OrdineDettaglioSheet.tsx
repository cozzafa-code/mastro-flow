"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { OrdineConCommessa, RigaOrdine } from "./ordini-types";
import { aggiornaStatoOrdine, inviaOrdine } from "./ordini-helpers";
import DettaglioHeader from "./dettaglio/DettaglioHeader";
import DettaglioStepper from "./dettaglio/DettaglioStepper";
import DettaglioRighe from "./dettaglio/DettaglioRighe";
import DettaglioAzioniBar from "./dettaglio/DettaglioAzioniBar";

interface Props {
  ordineId: string;
  aziendaId: string;
  onClose: () => void;
  onApriRicezione: (ordineId: string) => void;
  onApriCommessa: (commessaId: string) => void;
}

export default function OrdineDettaglioSheet({
  ordineId, aziendaId, onClose, onApriRicezione, onApriCommessa
}: Props) {
  const [ordine, setOrdine] = useState<OrdineConCommessa | null>(null);
  const [righe, setRighe] = useState<RigaOrdine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ordineId) return;
    (async () => {
      setLoading(true);
      // 1) ordine
      const { data: ord } = await supabase
        .from("ordini_fornitore")
        .select("*")
        .eq("id", ordineId)
        .maybeSingle();
      if (!ord) { setLoading(false); return; }
      // 2) commessa
      let cm: any = null;
      if (ord.commessa_id) {
        const r = await supabase.from("commesse")
          .select("code, cliente, cognome, indirizzo")
          .eq("id", ord.commessa_id).maybeSingle();
        cm = r.data;
      }
      // 3) fornitore
      let forn: any = null;
      if (ord.fornitore_id) {
        const r = await supabase.from("fornitori")
          .select("nome, categoria")
          .eq("id", ord.fornitore_id).maybeSingle();
        forn = r.data;
      }
      const enriched: OrdineConCommessa = {
        ...ord,
        commessa: cm,
        fornitore_nome: forn?.nome,
        fornitore_categoria: forn?.categoria,
      } as any;
      setOrdine(enriched);
      // 4) righe (priorita: array json o tabella separata)
      const righeJson = (ord as any).righe;
      if (Array.isArray(righeJson) && righeJson.length > 0) {
        setRighe(righeJson);
      } else {
        const { data: rs } = await supabase
          .from("ordini_fornitore_righe")
          .select("*")
          .eq("ordine_id", ordineId)
          .order("posizione", { ascending: true });
        setRighe((rs || []) as any);
      }
      setLoading(false);
    })();
  }, [ordineId]);

  async function handleInvia() {
    if (!confirm("Inviare l'ordine al fornitore?")) return;
    const res = await inviaOrdine(ordineId);
    if (res.ok) {
      setOrdine((p) => p ? { ...p, stato: "inviato" } : p);
    } else {
      alert("Errore invio: " + (res.error || "—"));
    }
  }

  async function handleAnnulla() {
    if (!confirm("Annullare questo ordine?")) return;
    const res = await aggiornaStatoOrdine(ordineId, "annullato");
    if (res.ok) {
      setOrdine((p) => p ? { ...p, stato: "annullato" } : p);
    }
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#8B9BB0", zIndex: 110,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontFamily: "-apple-system, sans-serif"
      }}>Caricamento ordine...</div>
    );
  }

  if (!ordine) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#8B9BB0", zIndex: 110,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 12, padding: 24, textAlign: "center",
        color: "#fff", fontFamily: "-apple-system, sans-serif"
      }}>
        <div style={{ fontSize: 14 }}>Ordine non trovato</div>
        <button onClick={onClose} style={{
          padding: "10px 20px", background: "#1A2A47", color: "#fff",
          border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer"
        }}>Chiudi</button>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#8B9BB0",
      zIndex: 110, overflowY: "auto", paddingBottom: 180,
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <DettaglioHeader
        ord={ordine}
        onClose={onClose}
        onMenu={() => { /* TODO menu */ }}
        onApriCommessa={() => { if (ordine.commessa_id) onApriCommessa(ordine.commessa_id); }}
      />
      <DettaglioStepper stato={ordine.stato || "bozza"} />
      <DettaglioRighe righe={righe} />
      <DettaglioAzioniBar
        stato={ordine.stato || "bozza"}
        onModifica={() => { /* TODO edit */ }}
        onInvia={handleInvia}
        onRicevi={() => onApriRicezione(ordineId)}
        onAnnulla={handleAnnulla}
      />
    </div>
  );
}
