// ════════════════════════════════════════════════════════════
// BONUS CHECKLIST INLINE · UI
// ════════════════════════════════════════════════════════════
// Renderizza la checklist contestuale sotto il bonus selezionato.
// Usa hook usePreventivoChecklist per dati live.

"use client";
import { useRef } from "react";
import { usePreventivoChecklist } from "@/hooks/usePreventivoChecklist";
import { BONUS_META, type BonusKey } from "@/lib/preventivo-checklist-templates";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  azienda_id: string;
  commessa_id: string;
  bonus: BonusKey;
  cliente_telefono?: string;
  onPreviewDoc?: (doc_codice: string, doc_nome: string) => void;
};

export default function BonusChecklistInline({
  azienda_id, commessa_id, bonus, cliente_telefono, onPreviewDoc,
}: Props) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    docsBonusIn, docsBonusOut, bonusProgress,
    toggleRaccolto, inviaDoc, loading,
  } = usePreventivoChecklist({
    azienda_id, commessa_id, bonus, iva: null,
  });

  const meta = BONUS_META[bonus];

  // ─── upload file documento IN ──────────────────────────
  async function handleFileUpload(doc_id: string, file: File) {
    const fileName = `bonus/${commessa_id}/${doc_id}_${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("documenti-bonus")
      .upload(fileName, file, { upsert: true });
    if (error) {
      console.error("[BonusChecklist] upload error", error);
      alert("Upload fallito: " + error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("documenti-bonus").getPublicUrl(data.path);
    await toggleRaccolto(doc_id, false, pub.publicUrl);
  }

  // ─── invia su WhatsApp ─────────────────────────────────
  function inviaWhatsApp(doc_id: string, doc_nome: string, pdf_url?: string | null) {
    const tel = cliente_telefono?.replace(/\D/g, "") ?? "";
    const link = pdf_url ?? "";
    const msg = encodeURIComponent(`Buongiorno, le invio "${doc_nome}". ${link ? "\n\nLink: " + link : ""}`);
    const url = tel ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
    inviaDoc(doc_id, "whatsapp");
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>Caricamento checklist...</div>;
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #1E3A5F",
      borderTop: "none",
      borderRadius: "0 0 14px 14px",
      paddingBottom: 4,
    }}>
      {/* HEADER */}
      <div style={{
        padding: "11px 14px 8px",
        background: "#F8FAFC",
        borderTop: "1px dashed #CBD5E1",
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
            Documenti per {meta.label} {meta.percentuale}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F1B2D", letterSpacing: -0.2, marginTop: 1 }}>
            {docsBonusIn.length} da raccogliere · {docsBonusOut.length} prestampati
          </div>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1E3A5F", fontVariantNumeric: "tabular-nums" }}>
          {bonusProgress.in_raccolti + bonusProgress.out_inviati}/{bonusProgress.in_total + bonusProgress.out_total}
        </div>
      </div>

      {/* DOC IN: cliente → te */}
      {docsBonusIn.length > 0 && (
        <>
          <div style={{ padding: "11px 14px 5px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 5, background: "#FEF3C7", color: "#92400E",
            }}>Cliente → te</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0F1B2D", flex: 1 }}>Da raccogliere</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: "#94A3B8" }}>{docsBonusIn.length}</span>
          </div>

          {docsBonusIn.map(doc => (
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
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.1, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {doc.doc_nome}
                  <span style={{
                    fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 3,
                    letterSpacing: 0.4, textTransform: "uppercase",
                    background: doc.doc_obbligatorio ? "#FEE2E2" : "#F1F5F9",
                    color: doc.doc_obbligatorio ? "#991B1B" : "#64748B",
                  }}>
                    {doc.doc_obbligatorio ? "Obbl." : "Cons."}
                  </span>
                </div>
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
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13,
                  }}
                  title="Carica file"
                >📷</button>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: "#065F46", border: "1px solid #065F46", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, textDecoration: "none",
                  }}>✓</a>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* DOC OUT: te → cliente */}
      {docsBonusOut.length > 0 && (
        <>
          <div style={{ padding: "11px 14px 5px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 5, background: "#DBEAFE", color: "#1E40AF",
            }}>Te → cliente</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0F1B2D", flex: 1 }}>Prestampati</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: "#94A3B8" }}>{docsBonusOut.length}</span>
          </div>

          {docsBonusOut.map(doc => (
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
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.1, lineHeight: 1.2 }}>
                  {doc.doc_nome}
                </div>
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
                    fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, cursor: "pointer",
                  }}
                >👁</button>
                <button
                  onClick={() => inviaWhatsApp(doc.id, doc.doc_nome, doc.pdf_url)}
                  style={{
                    padding: "6px 9px", borderRadius: 7,
                    background: "#1E3A5F", color: "#fff", border: "none",
                    fontSize: 9.5, fontWeight: 800, letterSpacing: 0.3, cursor: "pointer",
                  }}
                >Invia</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* FOOTER progress */}
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
        <span><b style={{ color: "#0F1B2D", fontWeight: 800 }}>{bonusProgress.in_raccolti}/{bonusProgress.in_total}</b> raccolti</span>
        <div style={{ flex: 1, height: 5, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#065F46", borderRadius: 3,
            width: `${bonusProgress.in_total > 0 ? (bonusProgress.in_raccolti / bonusProgress.in_total) * 100 : 0}%`,
          }} />
        </div>
        <span><b style={{ color: "#0F1B2D", fontWeight: 800 }}>{bonusProgress.out_inviati}/{bonusProgress.out_total}</b> inviati</span>
      </div>
    </div>
  );
}
