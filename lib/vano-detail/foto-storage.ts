// ======================================================================
// MASTRO ERP - Vano Detail / Foto Storage helpers
// Estratto da components/VanoDetailPanel.tsx (refactor S4)
// ======================================================================

import { supabase } from "@/lib/supabase";

// ── Upload foto su Supabase Storage ──
export async function uploadFotoVano(userId, cmId, vanoId, file, nome) {
  try {
    const ext = nome.split(".").pop() || "jpg";
    const path = `${userId}/${cmId}/${vanoId}/${Date.now()}_${nome}`;
    const { error } = await supabase.storage
      .from("foto-vani")
      .upload(path, file, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("foto-vani").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[FOTO] Upload fallito, uso base64:", e);
    return null;
  }
}
export async function deleteFotoVano(url) {
  try {
    const parts = url.split("/foto-vani/");
    if (parts.length < 2) return;
    await supabase.storage.from("foto-vani").remove([parts[1]]);
  } catch {}
}


