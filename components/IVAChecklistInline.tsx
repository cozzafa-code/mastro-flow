// ════════════════════════════════════════════════════════════
// IVA CHECKLIST INLINE · UI
// ════════════════════════════════════════════════════════════
// Renderizza la checklist contestuale sotto l'aliquota IVA selezionata.
// Stesso pattern di BonusChecklistInline ma più piccolo (di solito 1+1 doc).

"use client";
import { useRef } from "react";
import { usePreventivoChecklist } from "@/hooks/usePreventivoChecklist";
import { IVA_META, type IVAKey } from "@/lib/preventivo-checklist-templates";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  azienda_id: string;
  commessa_id: string;
  iva: IVAKey;
  cliente_telefono?: string;
  onPreviewDoc?: (doc_codice: string, doc_nome: string) => void;
};

export default function IVAChecklistInline({
  azienda_id, commessa_id, iva, cliente_telefono, onPreviewDoc,
}: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    docsIvaIn, docsIvaOut, ivaProgress,
    toggleRaccolto, inviaDoc, loading,
  } = usePreventivoChecklist({
    azienda_id, commessa_id, bonus: null, iva,
  });

  const meta = IVA_META[iva];

  if (iva === "iva_22") {
    return null; // IVA ordinaria non richiede dichiarazioni
  }

  async function handleFileUpload(doc_id: string, file: File) {
    const fileName = `iva/${commessa_id}/${doc_id}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("documenti-bonus")
      .upload(fileName, file, { upsert: true });
    if (error) {
      console.error("[IVAChecklist] upload error", error);
      alert("Upload fallito: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("documenti-bonus").getPublicUrl(data.path);
    await toggleRaccolto(doc_id, false, pub.publicUrl);
  }

  function inviaWhatsApp(doc_id: string, doc_nome: string, pdf_url?: string | null) {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const link = pdf_url ?? "";
    const msg = encodeURIComponent(`Buongiorno, le invio "${doc_nome}". ${link ? "\n\nLink: " + link : ""}`);
    const url = tel ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
    inviaDoc(doc_id, "whatsapp");
  }

  if (loading) {
    return <div style={{ padding: 12, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>Caricamento...</div>;
  }

  if (docsIvaIn.length === 0 && docsIvaOut.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #1E3A5F",
      borderRadius: 14,
      paddingBottom: 4,
      marginTop: 9,
    }}>
      {/* HEADER */}
      <div style={{
        padding: "11px 14px 8px",
        background: "#F8FAFC",
        borderRadius: "14px 14px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 7, background: "#1E3A5F",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>i</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8.5, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.7, textTransform: "uppercase" }}>
            Documenti per {meta.label}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#0F1B2D", marginTop: 1 }}>
            {docsIvaIn.length} da raccogliere · {docsIvaOut.length} prestampati
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#1E3A5F", fontVariantNumeric: "tabular-nums" }}>
          {ivaProgress.in_raccolti + ivaProgress.out_inviati}/{ivaProgress.in_total + ivaProgress.out_total}
        </div>
      </div>

      {/* DOC IN */}
      {docsIvaIn.length > 0 && (
        <>
          <div style={{ padding: "10px 14px 5px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 5, background: "#FEF3C7", color: "#92400E",
            }}>Cliente → te</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0F1B2D", flex: 1 }}>Da raccogliere</span>
          </div>

          {docsIvaIn.map(doc => (
            <div key={doc.id} style={{
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 11,
              borderBottom: "1px solid #F1F5F9",
            }}>
              <div
                onClick={() => toggleRaccolto(doc.id, doc.raccolto)}
                style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: "1.5px solid " + (doc.raccolto ? "#065F46" : "#CBD5E1"),
                  background: doc.raccolto ? "#065F46" : "#fff",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 800,
                }}
              >
                {doc.raccolto && "✓"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D" }}>{doc.doc_nome}</div>
                {doc.doc_descrizione && (
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, fontWeight: 500 }}>
                    {doc.doc_descrizione}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                  style={{ display: "none" }}
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(doc.id, f);
                  }}
                />
                <button
                  onClick={() => fileInputRefs.current[doc.id]?.click()}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "#fff", border: "1px solid #CBD5E1", color: "#1E3A5F",
                    cursor: "pointer", fontSize: 13,
                  }}
                >📷</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* DOC OUT */}
      {docsIvaOut.length > 0 && (
        <>
          <div style={{ padding: "10px 14px 5px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 5, background: "#DBEAFE", color: "#1E40AF",
            }}>Te → cliente</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0F1B2D", flex: 1 }}>Prestampati</span>
          </div>

          {docsIvaOut.map(doc => (
            <div key={doc.id} style={{
              padding: "9px 14px", display: "flex", alignItems: "center", gap: 11,
              borderBottom: "1px solid #F1F5F9",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "#DBEAFE", color: "#1E40AF",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 13,
              }}>📄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D" }}>{doc.doc_nome}</div>
                <div style={{ fontSize: 10, color: doc.inviato ? "#065F46" : "#64748B", marginTop: 2, fontWeight: 600 }}>
                  {doc.inviato ? `✓ Inviato ${doc.inviato_canale ?? ""}` : "Non inviato"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => onPreviewDoc?.(doc.doc_codice, doc.doc_nome)}
                  style={{
                    padding: "6px 9px", borderRadius: 7,
                    background: "#fff", color: "#1E3A5F", border: "1px solid #CBD5E1",
                    fontSize: 9.5, fontWeight: 800, cursor: "pointer",
                  }}
                >👁</button>
                <button
                  onClick={() => inviaWhatsApp(doc.id, doc.doc_nome, doc.pdf_url)}
                  style={{
                    padding: "6px 9px", borderRadius: 7,
                    background: "#1E3A5F", color: "#fff", border: "none",
                    fontSize: 9.5, fontWeight: 800, cursor: "pointer",
                  }}
                >Invia</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* FOOTER */}
      <div style={{
        padding: "9px 14px 11px",
        background: "#F8FAFC",
        borderTop: "1px solid #F1F5F9",
        display: "flex",
        gap: 10,
        alignItems: "center",
        fontSize: 10.5,
        color: "#64748B",
        fontWeight: 600,
        borderRadius: "0 0 14px 14px",
      }}>
        <span><b style={{ color: "#0F1B2D" }}>{ivaProgress.in_raccolti}/{ivaProgress.in_total}</b> raccolti</span>
        <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#065F46", borderRadius: 3,
            width: `${ivaProgress.in_total > 0 ? (ivaProgress.in_raccolti / ivaProgress.in_total) * 100 : 0}%`,
          }} />
        </div>
        <span><b style={{ color: "#0F1B2D" }}>{ivaProgress.out_inviati}/{ivaProgress.out_total}</b> inviati</span>
      </div>
    </div>
  );
}
