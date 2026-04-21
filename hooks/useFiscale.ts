// hooks/useFiscale.ts
// Dati fiscali commessa: template, documenti, comunicazioni
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@supabase/supabase-js";

export type TemplateFiscale = {
  id: string;
  azienda_id: string;
  tipo: string;            // checklist_50 | checklist_65 | checklist_75 | sollecito_docs | istruzioni_bonifico | conferma_ricezione
  canale: string;          // whatsapp | email | sms
  oggetto: string | null;
  testo: string;
  attivo: boolean;
  updated_at: string;
};

export type DocFiscale = {
  id: string;
  commessa_id: string;
  tipo: string;
  categoria: string | null;
  sotto_categoria: string | null;
  detrazione_rif: string | null;
  stato: string;           // atteso | caricato | verificato | rifiutato
  nome: string | null;
  file_url: string | null;
  file_path: string | null;
  file_size: number | null;
  note_interne: string | null;
  created_at: string;
  verificato_at: string | null;
};

export type ComunicazioneFiscale = {
  id: string;
  commessa_id: string;
  template_tipo: string;
  canale: string;
  testo_inviato: string;
  destinatario: string | null;
  inviato_at: string;
  stato: string;
};

export function useFiscale(commessaId: string | null, aziendaId: string | null) {
  const [templates, setTemplates] = useState<TemplateFiscale[]>([]);
  const [docs, setDocs] = useState<DocFiscale[]>([]);
  const [comunicazioni, setComunicazioni] = useState<ComunicazioneFiscale[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!aziendaId) return;
    const { data } = await supabase
      .from("template_fiscale")
      .select("*")
      .eq("azienda_id", aziendaId)
      .eq("attivo", true)
      .order("tipo");
    setTemplates(data || []);
  }, [aziendaId]);

  const loadDocs = useCallback(async () => {
    if (!commessaId) return;
    const { data } = await supabase
      .from("allegati_commessa")
      .select("*")
      .eq("commessa_id", commessaId)
      .eq("categoria", "fiscale")
      .order("created_at", { ascending: false });
    setDocs((data as DocFiscale[]) || []);
  }, [commessaId]);

  const loadComunicazioni = useCallback(async () => {
    if (!commessaId) return;
    const { data } = await supabase
      .from("fiscale_comunicazioni")
      .select("*")
      .eq("commessa_id", commessaId)
      .order("inviato_at", { ascending: false })
      .limit(30);
    setComunicazioni((data as ComunicazioneFiscale[]) || []);
  }, [commessaId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadTemplates(), loadDocs(), loadComunicazioni()]);
      setLoading(false);
    })();
  }, [commessaId, aziendaId, loadTemplates, loadDocs, loadComunicazioni]);

  // --- template ---
  const saveTemplate = async (id: string, patch: Partial<TemplateFiscale>) => {
    const { error } = await supabase
      .from("template_fiscale")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) loadTemplates();
    return !error;
  };

  const getTemplate = (tipo: string, canale = "whatsapp"): TemplateFiscale | undefined => {
    return templates.find(t => t.tipo === tipo && t.canale === canale);
  };

  // --- docs ---
  const uploadDoc = async (file: File, opts: {
    sotto_categoria: string;
    detrazione_rif?: string | null;
    uploaded_by?: string | null;
  }) => {
    if (!commessaId) return null;
    const ext = file.name.split(".").pop() || "bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${commessaId}/${opts.sotto_categoria}_${Date.now()}_${safeName}`;

    const up = await supabase.storage.from("fiscale-docs").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (up.error) { console.error("upload err", up.error); return null; }

    const pub = supabase.storage.from("fiscale-docs").getPublicUrl(path);
    const file_url = pub.data.publicUrl;

    const ins = await supabase.from("allegati_commessa").insert({
      commessa_id: commessaId,
      tipo: ext,
      categoria: "fiscale",
      sotto_categoria: opts.sotto_categoria,
      detrazione_rif: opts.detrazione_rif || null,
      stato: "caricato",
      nome: file.name,
      file_url,
      file_path: path,
      file_size: file.size,
      uploaded_by: opts.uploaded_by || null,
    }).select().single();

    if (!ins.error) loadDocs();
    return ins.data;
  };

  const updateDocStato = async (docId: string, stato: string, note?: string) => {
    const patch: any = { stato };
    if (stato === "verificato") patch.verificato_at = new Date().toISOString();
    if (note !== undefined) patch.note_interne = note;
    const { error } = await supabase.from("allegati_commessa").update(patch).eq("id", docId);
    if (!error) loadDocs();
    return !error;
  };

  const deleteDoc = async (docId: string) => {
    const doc = docs.find(d => d.id === docId);
    if (doc?.file_path) {
      await supabase.storage.from("fiscale-docs").remove([doc.file_path]);
    }
    const { error } = await supabase.from("allegati_commessa").delete().eq("id", docId);
    if (!error) loadDocs();
    return !error;
  };

  // --- comunicazioni ---
  const logComunicazione = async (
    template_tipo: string,
    canale: string,
    testo_inviato: string,
    destinatario: string | null
  ) => {
    if (!commessaId) return;
    await supabase.from("fiscale_comunicazioni").insert({
      commessa_id: commessaId,
      template_tipo, canale, testo_inviato, destinatario,
      stato: "inviato",
    });
    loadComunicazioni();
  };

  // Sostituisce {PLACEHOLDER} nel testo template
  const renderTemplate = (tpl: string, vars: Record<string, string>): string => {
    let out = tpl;
    Object.entries(vars).forEach(([k, v]) => {
      out = out.split(`{${k}}`).join(v || "");
    });
    return out;
  };

  return {
    loading,
    templates, docs, comunicazioni,
    getTemplate, saveTemplate,
    uploadDoc, updateDocStato, deleteDoc,
    logComunicazione, renderTemplate,
    reload: () => { loadTemplates(); loadDocs(); loadComunicazioni(); },
  };
}
