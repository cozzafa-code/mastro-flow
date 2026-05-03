// components/ImportPannelli.tsx
// Upload PDF direttamente a Supabase Storage (bucket "pannelli-pdf"),
// poi chiama /api/pannelli/process con { import_id, pdf_url }.
// Bypass del limite 4.5MB di Vercel.

"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const BUCKET = "pannelli-pdf";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

type Stato = "idle" | "uploading" | "processing" | "review" | "errore";

type ImportPannelliProps = {
  preventivoId?: string;
  onReviewReady?: (importId: string) => void;
};

export default function ImportPannelli({ preventivoId, onReviewReady }: ImportPannelliProps) {
  const [stato, setStato] = useState<Stato>("idle");
  const [progress, setProgress] = useState(0);
  const [messaggio, setMessaggio] = useState<string>("");
  const [codiceErrore, setCodiceErrore] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [numeroPannelli, setNumeroPannelli] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStato("idle");
    setProgress(0);
    setMessaggio("");
    setCodiceErrore(null);
    setImportId(null);
    setNumeroPannelli(null);
    if (inputRef.current) inputRef.current.value = "";
  };

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
        // 1. Crea record import
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

        // 2. Upload a Supabase Storage
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

        // 3. Aggiorna import con URL e stato uploaded
        await supabase
          .from("pannelli_imports")
          .update({
            pdf_url: pdfUrl,
            storage_path: path,
            stato: "uploaded",
          })
          .eq("id", importRow.id);

        // 4. Triggera processing AI
        setStato("processing");
        setMessaggio("Estrazione pannelli con AI in corso...");
        setProgress(75);

        const res = await fetch("/api/pannelli/process", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            import_id: importRow.id,
            pdf_url: pdfUrl,
          }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setStato("errore");
          setCodiceErrore(json.codice_errore || "UNKNOWN_ERROR");
          setMessaggio(json.dettaglio || "Errore durante il processing AI");
          return;
        }

        // 5. Successo
        setProgress(100);
        setNumeroPannelli(json.numero_pannelli ?? 0);
        setStato("review");
        setMessaggio(`Estratti ${json.numero_pannelli} pannelli. Procedi con la review.`);
        onReviewReady?.(importRow.id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStato("errore");
        setCodiceErrore("CLIENT_ERROR");
        setMessaggio(msg);
      }
    },
    [preventivoId, onReviewReady]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const isWorking = stato === "uploading" || stato === "processing";

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Importa pannelli da PDF</h3>
        <p className="text-sm text-slate-500">
          Carica un PDF tecnico. L'AI estrae automaticamente i pannelli.
        </p>
      </div>

      {stato === "idle" && (
        <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition">
          <span className="text-3xl">📄</span>
          <span className="font-medium text-slate-700">Seleziona PDF (max 50MB)</span>
          <span className="text-xs text-slate-500">Tap per scegliere il file</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onChange}
          />
        </label>
      )}

      {isWorking && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{messaggio}</span>
            <span className="text-slate-500">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {stato === "review" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">✅</span>
            <span className="font-semibold text-emerald-900">Estrazione completata</span>
          </div>
          <p className="text-sm text-emerald-800">
            {numeroPannelli} pannelli estratti. Procedi con la review per validarli.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => importId && onReviewReady?.(importId)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Vai alla review
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Nuovo import
            </button>
          </div>
        </div>
      )}

      {stato === "errore" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold text-rose-900">Errore</span>
            {codiceErrore && (
              <span className="rounded bg-rose-200 px-2 py-0.5 text-xs font-mono text-rose-900">
                {codiceErrore}
              </span>
            )}
          </div>
          <p className="text-sm text-rose-800 break-words">{messaggio}</p>
          <button
            onClick={reset}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Riprova
          </button>
        </div>
      )}
    </div>
  );
}
