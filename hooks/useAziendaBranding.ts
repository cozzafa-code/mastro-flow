// ════════════════════════════════════════════════════════════
// HOOK · useAziendaBranding · gestione logo, colori, header, footer
// ════════════════════════════════════════════════════════════
"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type AziendaBranding = {
  azienda_id: string;
  logo_url: string | null;
  logo_url_dark: string | null;
  colore_primario: string;
  colore_secondario: string;
  colore_accento: string;
  font_principale: string;
  font_titoli: string;
  intestazione_html: string | null;
  footer_html: string | null;
  firma_grafica_url: string | null;
  iban: string | null;
  banca: string | null;
  pec: string | null;
  codice_destinatario_sdi: string | null;
  formato_carta_default: string;
  margine_top_mm: number;
  margine_bottom_mm: number;
  margine_left_mm: number;
  margine_right_mm: number;
  mostra_logo_su_documenti: boolean;
  mostra_intestazione: boolean;
  mostra_footer: boolean;
  mostra_numero_pagina: boolean;
};

const DEFAULT_BRANDING: Partial<AziendaBranding> = {
  colore_primario: "#1E3A5F",
  colore_secondario: "#10B981",
  colore_accento: "#F59E0B",
  font_principale: "Inter",
  font_titoli: "Inter",
  formato_carta_default: "A4",
  margine_top_mm: 20,
  margine_bottom_mm: 20,
  margine_left_mm: 15,
  margine_right_mm: 15,
  mostra_logo_su_documenti: true,
  mostra_intestazione: true,
  mostra_footer: true,
  mostra_numero_pagina: true,
};

export function useAziendaBranding(azienda_id: string) {
  const [branding, setBranding] = useState<AziendaBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!azienda_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("azienda_branding")
      .select("*")
      .eq("azienda_id", azienda_id)
      .maybeSingle();
    if (data) {
      setBranding(data as AziendaBranding);
    } else {
      // Crea default se non esiste
      const { data: created } = await supabase
        .from("azienda_branding")
        .insert({ azienda_id, ...DEFAULT_BRANDING })
        .select()
        .single();
      setBranding(created as AziendaBranding);
    }
    setLoading(false);
  }, [azienda_id]);

  useEffect(() => { reload(); }, [reload]);

  const patch = useCallback(async (p: Partial<AziendaBranding>) => {
    setSaving(true);
    setBranding(prev => prev ? { ...prev, ...p } : prev);
    try {
      await supabase.from("azienda_branding").update(p).eq("azienda_id", azienda_id);
    } finally {
      setSaving(false);
    }
  }, [azienda_id]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${azienda_id}/logo_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("azienda-branding")
      .upload(path, file, { upsert: true });
    if (error) { console.error("uploadLogo", error); return null; }
    const { data: pub } = supabase.storage.from("azienda-branding").getPublicUrl(data.path);
    await patch({ logo_url: pub.publicUrl });
    return pub.publicUrl;
  }, [azienda_id, patch]);

  const uploadFirma = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${azienda_id}/firma_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("azienda-branding")
      .upload(path, file, { upsert: true });
    if (error) return null;
    const { data: pub } = supabase.storage.from("azienda-branding").getPublicUrl(data.path);
    await patch({ firma_grafica_url: pub.publicUrl });
    return pub.publicUrl;
  }, [azienda_id, patch]);

  return { branding, loading, saving, patch, uploadLogo, uploadFirma, reload };
}
