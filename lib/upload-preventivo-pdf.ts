// MASTRO v16 - Upload PDF preventivo su Supabase Storage
// Bucket: "preventivi" (pubblico)
// Ritorna URL pubblico del file caricato.

import { createClient } from "./supabase";

export async function uploadPreventivoPdf(
  blob: Blob,
  token: string,
  cmCode: string
): Promise<string | null> {
  try {
    const sb = createClient();
    const safeCode = (cmCode || "preventivo").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${token}/${safeCode}.pdf`;

    const { error } = await sb.storage
      .from("preventivi")
      .upload(filename, blob, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      console.warn("[upload-pdf] error:", error.message);
      return null;
    }

    const { data } = sb.storage.from("preventivi").getPublicUrl(filename);
    return data?.publicUrl || null;
  } catch (e: any) {
    console.warn("[upload-pdf] crash:", e?.message || e);
    return null;
  }
}
