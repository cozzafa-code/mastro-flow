// components/ImportPannelli.tsx
// MODAL di import pannelli da PDF.
// Upload diretto a Supabase Storage (bucket "pannelli-pdf") -> bypass body limit Vercel 4.5MB.
// Poi chiama /api/pannelli/process con { import_id, pdf_url }.
// API: <ImportPannelli open onClose onComplete preventivoId? />

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const BUCKET = "pannelli-pdf";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

type Stato = "idle" | "uploading" | "processing" | "review" | "errore";

type ImportPannelliProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: (importId?: string) => void;
  preventivoId?: string;
};

export default function ImportPannelli({ open, onClose, onComplete, preventivoId }: ImportPannelliProps) {
  const [stato, setStato] = useState<Stato>("idle");
  const [progress, setProgress] = useState(0);
  const [messaggio, setMessaggio] = useState<string>("");
  const [codiceErrore, setCodiceErrore] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [numeroPannelli, setNumeroPannelli] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStato("idle");
      setProgress(0);
      setMessaggio("");
      setCodiceErrore(null);
      setImportId(null);
      setNumeroPannelli(null);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (stato === "uploading" || stato === "processing") {
      if (!confirm("Annullare l'import in corso?")) return;
    }
    onClose();
  }, [stato, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (file.type !== "application/pdf") {
        setStato("errore");
        setCodiceErrore("FILE_TYPE_INVALID");
        setMessaggio("Solo file PDF sono supportati");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setStato("errore");
        setCodiceErrore("FILE_TOO_LARGE");
        setMessaggio("Il PDF supera i 50MB");
        return;
      }

      try {
        setStato("uploading");
        setMessaggio("Creazione import...");
        setProgress(5);

        const { data: importRow, error: importErr } = await supabase
          .from("pannelli_imports")
          .insert({
            azienda_id: AZIENDA_ID,
            preventivo_id: preventivoId ?? null,
            nome_file: file.name,
            dimensione_bytes: file.size,
            stato: "uploading",
          })
          .select("id")
          .single();

        if (importErr || !importRow) {
          throw new Error(importErr?.message || "Impossibile creare import");
        }
        setImportId(importRow.id);

        setMessaggio("Upload PDF in corso...");
        setProgress(20);

        const path = `${AZIENDA_ID}/${importRow.id}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: false,
          });

        if (upErr) throw new Error(`Upload Storage fallito: ${upErr.message}`);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const pdfUrl = pub.publicUrl;
        if (!pdfUrl) throw new Error("URL pubblico non generato");

        setProgress(60);

        await supabase
          .from("pannelli_imports")
          .update({ pdf_url: pdfUrl, storage_path: path, stato: "uploaded" })
          .eq("id", importRow.id);

        setStato("processing");
        setMessaggio("Estrazione pannelli con AI...");
        setProgress(75);

        const res = await fetch("/api/pannelli/process", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ import_id: importRow.id, pdf_url: pdfUrl }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setStato("errore");
          setCodiceErrore(json.codice_errore || "UNKNOWN_ERROR");
          setMessaggio(json.dettaglio || "Errore durante il processing AI");
          return;
        }

        setProgress(100);
        setNumeroPannelli(json.numero_pannelli ?? 0);
        setStato("review");
        setMessaggio(`Estratti ${json.numero_pannelli} pannelli.`);
        onComplete?.(importRow.id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStato("errore");
        setCodiceErrore("CLIENT_ERROR");
        setMessaggio(msg);
      }
    },
    [preventivoId, onComplete]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  if (!open) return null;

  const isWorking = stato === "uploading" || stato === "processing";

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, background: "#fff", borderRadius: 14,
          padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1C" }}>📥 Importa pannelli da PDF</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              Carica un PDF tecnico. L&apos;AI estrae i pannelli.
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none", border: "none", fontSize: 22, cursor: "pointer",
              color: "#888", lineHeight: 1, padding: 0, marginLeft: 12,
            }}
            aria-label="Chiudi"
          >×</button>
        </div>

        {stato === "idle" && (
          <div>
            <label
              htmlFor="pannelli-pdf-input"
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "32px 20px", border: "2px dashed #ccc", borderRadius: 12,
                background: "#fafafa", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 38 }}>📄</span>
              <span style={{ fontWeight: 700, color: "#1A1A1C", fontSize: 13 }}>Seleziona PDF</span>
              <span style={{ fontSize: 10, color: "#888" }}>Max 50MB · Tap per scegliere</span>
            </label>
            <input
              id="pannelli-pdf-input"
              ref={inputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={onChange}
            />
          </div>
        )}

        {isWorking && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: "#1A1A1C" }}>{messaggio}</span>
              <span style={{ color: "#888" }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${progress}%`, background: "#28A0A0",
                transition: "width 0.3s",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 10, textAlign: "center" }}>
              Non chiudere la pagina...
            </div>
          </div>
        )}

        {stato === "review" && (
          <div style={{ padding: 16, background: "#1A9E7315", border: "1.5px solid #1A9E73", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontWeight: 800, color: "#1A9E73", fontSize: 13 }}>Estrazione completata</span>
            </div>
            <div style={{ fontSize: 11, color: "#1A1A1C", marginBottom: 12 }}>
              {numeroPannelli} pannelli estratti.
            </div>
            <button
              onClick={() => { onComplete?.(importId ?? undefined); onClose(); }}
              style={{
                padding: "10px 16px", borderRadius: 8, background: "#1A9E73", color: "#fff",
                fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
              }}
            >Chiudi</button>
          </div>
        )}

        {stato === "errore" && (
          <div style={{ padding: 16, background: "#DC444415", border: "1.5px solid #DC4444", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ fontWeight: 800, color: "#DC4444", fontSize: 13 }}>Errore</span>
              {codiceErrore && (
                <span style={{
                  background: "#DC444433", color: "#DC4444", padding: "2px 6px",
                  borderRadius: 4, fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                }}>{codiceErrore}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#1A1A1C", wordBreak: "break-word", marginBottom: 12 }}>
              {messaggio}
            </div>
            <button
              onClick={() => {
                setStato("idle"); setProgress(0); setMessaggio("");
                setCodiceErrore(null); setNumeroPannelli(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              style={{
                padding: "10px 16px", borderRadius: 8, background: "#DC4444", color: "#fff",
                fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
              }}
            >Riprova</button>
          </div>
        )}
      </div>
    </div>
  );
}
