"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface OcrDocumento {
  id: string;
  file_url: string;
  file_tipo: string | null;
  stato: "in_coda" | "elaborazione" | "completato" | "errore" | "manuale";
  caricato_at: string;
  fornitore_nome: string | null;
  fornitore_piva: string | null;
  fornitore_cf: string | null;
  numero_documento: string | null;
  data_documento: string | null;
  imponibile: number | null;
  iva_importo: number | null;
  iva_pct: number | null;
  totale: number | null;
  categoria_suggerita: string | null;
  commessa_id_suggerita: string | null;
  ocr_confidence: number | null;
  raw_ocr_text: string | null;
  fattura_ricevuta_id: string | null;
  spesa_id: string | null;
  errore: string | null;
}

export function useOcr(aziendaId: string) {
  const [documenti, setDocumenti] = useState<OcrDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("fin_ocr_documenti").select("*")
      .eq("azienda_id", aziendaId)
      .order("caricato_at", { ascending: false })
      .limit(50);
    setDocumenti((data || []) as any);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: aggiornamento stato OCR
  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`ocr-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "fin_ocr_documenti", filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  async function caricaFile(file: File) {
    if (uploading) return { ok: false, error: "Upload in corso" };
    setUploading(true);
    try {
      // 1. Upload su storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${aziendaId}/ocr/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("ocr-documenti").upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) return { ok: false, error: upErr.message };

      const { data: urlData } = supabase.storage.from("ocr-documenti").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      // 2. Crea record in_coda
      const fileTipo = file.type.startsWith("image/") ? "foto" : file.type.includes("pdf") ? "pdf" : "scansione";
      const { data, error } = await supabase.from("fin_ocr_documenti").insert({
        azienda_id: aziendaId,
        file_url: fileUrl,
        file_tipo: fileTipo,
        stato: "in_coda",
      }).select("id").single();
      if (error) return { ok: false, error: error.message };

      // 3. Trigger OCR via API
      fetch("/api/ocr/elabora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento_id: data.id }),
      }).catch(() => {});

      await load();
      return { ok: true, id: data.id };
    } catch (e: any) {
      return { ok: false, error: e.message };
    } finally {
      setUploading(false);
    }
  }

  async function rielabora(documentoId: string) {
    await supabase.from("fin_ocr_documenti").update({ stato: "in_coda", errore: null }).eq("id", documentoId);
    fetch("/api/ocr/elabora", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documento_id: documentoId }),
    }).catch(() => {});
    await load();
    return { ok: true };
  }

  async function confermaCreaFatturaRicevuta(documentoId: string) {
    const doc = documenti.find((d) => d.id === documentoId);
    if (!doc) return { ok: false, error: "Documento non trovato" };

    // Inserisci fattura ricevuta
    const { data: fatt, error: fattErr } = await supabase.from("fin_fatture_ricevute").insert({
      azienda_id: aziendaId,
      numero: doc.numero_documento || `OCR-${Date.now()}`,
      data_ricezione: new Date().toISOString().split("T")[0],
      data_documento: doc.data_documento,
      fornitore: doc.fornitore_nome || "Sconosciuto",
      fornitore_piva: doc.fornitore_piva,
      imponibile: doc.imponibile || 0,
      iva: doc.iva_importo || 0,
      iva_percent: doc.iva_pct || 22,
      totale: doc.totale || 0,
      stato: "da_pagare",
      categoria: doc.categoria_suggerita,
    }).select("id").single();
    if (fattErr) return { ok: false, error: fattErr.message };

    await supabase.from("fin_ocr_documenti").update({
      fattura_ricevuta_id: fatt.id, stato: "completato",
    }).eq("id", documentoId);

    await load();
    return { ok: true, fattura_id: fatt.id };
  }

  async function confermaCreaSpesa(documentoId: string, commessaId?: string) {
    const doc = documenti.find((d) => d.id === documentoId);
    if (!doc) return { ok: false, error: "Documento non trovato" };

    const { data: spesa, error: spErr } = await supabase.from("fin_spese").insert({
      azienda_id: aziendaId,
      data: doc.data_documento || new Date().toISOString().split("T")[0],
      fornitore: doc.fornitore_nome,
      descrizione: doc.numero_documento ? `Doc. ${doc.numero_documento}` : "Spesa OCR",
      categoria: doc.categoria_suggerita,
      imponibile: doc.imponibile,
      iva: doc.iva_importo,
      iva_percent: doc.iva_pct,
      importo: doc.totale || 0,
      commessa_id: commessaId || doc.commessa_id_suggerita,
      foto_url: doc.file_url,
    }).select("id").single();
    if (spErr) return { ok: false, error: spErr.message };

    await supabase.from("fin_ocr_documenti").update({
      spesa_id: spesa.id, stato: "completato",
    }).eq("id", documentoId);

    await load();
    return { ok: true, spesa_id: spesa.id };
  }

  async function elimina(documentoId: string) {
    await supabase.from("fin_ocr_documenti").delete().eq("id", documentoId);
    await load();
    return { ok: true };
  }

  // Stats
  const stats = {
    totali: documenti.length,
    in_coda: documenti.filter((d) => d.stato === "in_coda").length,
    elaborazione: documenti.filter((d) => d.stato === "elaborazione").length,
    completati: documenti.filter((d) => d.stato === "completato").length,
    errori: documenti.filter((d) => d.stato === "errore").length,
  };

  return { documenti, loading, uploading, stats, reload: load,
    caricaFile, rielabora, confermaCreaFatturaRicevuta, confermaCreaSpesa, elimina };
}
