// components/ImportPannelli.tsx
// MODAL import pannelli con flusso a 3 step:
// 1. Scelta metodo: AI (estrazione automatica) o Manuale (form)
// 2. Scelta categoria: Porte Interne / Blindati / Pannelli
// 3. Upload PDF -> Supabase Storage -> /api/pannelli/process
//
// Schema reale pannelli_imports: filename, file_size_bytes, file_url, metodo, stato, errore_msg.
// Categoria salvata in pre_analisi (jsonb).

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const BUCKET = "pannelli-pdf";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

type Step = "metodo" | "categoria" | "upload" | "working" | "done" | "errore";
type Categoria = "porte_interne" | "blindati" | "pannelli";

const CATEGORIE: { id: Categoria; label: string; icon: string; color: string; desc: string }[] = [
  { id: "porte_interne", label: "Porte Interne", icon: "🚪", color: "#8B5E3C", desc: "Laccate, legno, vetrate" },
  { id: "blindati", label: "Portoncini Blindati", icon: "🛡", color: "#1A1A1C", desc: "Sicurezza, ingressi alluminio" },
  { id: "pannelli", label: "Pannelli", icon: "🪟", color: "#3B7FE0", desc: "PVC, alluminio, garage" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete?: (importId?: string) => void;
  defaultCategoria?: Categoria;
};

export default function ImportPannelli({ open, onClose, onComplete, defaultCategoria }: Props) {
  const [step, setStep] = useState<Step>("metodo");
  const [metodo, setMetodo] = useState<"ai" | "manuale" | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [progress, setProgress] = useState(0);
  const [messaggio, setMessaggio] = useState("");
  const [codiceErrore, setCodiceErrore] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [numeroPannelli, setNumeroPannelli] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep(defaultCategoria ? "metodo" : "metodo");
      setMetodo(null);
      setCategoria(defaultCategoria ?? null);
      setProgress(0);
      setMessaggio("");
      setCodiceErrore(null);
      setImportId(null);
      setNumeroPannelli(null);
    }
  }, [open, defaultCategoria]);

  const handleClose = useCallback(() => {
    if (step === "working") {
      if (!confirm("Annullare l'import in corso?")) return;
    }
    onClose();
  }, [step, onClose]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || !metodo || !categoria) return;
      if (file.type !== "application/pdf") {
        setStep("errore");
        setCodiceErrore("FILE_TYPE_INVALID");
        setMessaggio("Solo PDF supportati");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setStep("errore");
        setCodiceErrore("FILE_TOO_LARGE");
        setMessaggio("PDF supera 50MB");
        return;
      }

      try {
        setStep("working");
        setMessaggio("Creazione import...");
        setProgress(5);

        const { data: importRow, error: importErr } = await supabase
          .from("pannelli_imports")
          .insert({
            azienda_id: AZIENDA_ID,
            filename: file.name,
            file_size_bytes: file.size,
            metodo,
            stato: "uploading",
            pre_analisi: { categoria },
          })
          .select("id")
          .single();

        if (importErr || !importRow) throw new Error(importErr?.message || "Insert fallito");
        setImportId(importRow.id);

        setMessaggio("Upload PDF...");
        setProgress(20);

        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${AZIENDA_ID}/${importRow.id}/${Date.now()}_${safeName}`;

        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: "application/pdf", cacheControl: "3600", upsert: false });

        if (upErr) throw new Error(`Storage: ${upErr.message}`);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const fileUrl = pub.publicUrl;
        if (!fileUrl) throw new Error("URL pubblico non generato");

        setProgress(60);

        await supabase
          .from("pannelli_imports")
          .update({
            file_url: fileUrl,
            stato: "uploaded",
            pre_analisi: { categoria, storage_path: path, file_url: fileUrl },
          })
          .eq("id", importRow.id);

        if (metodo === "manuale") {
          setProgress(100);
          setStep("done");
          setMessaggio("PDF caricato. Procedi con inserimento manuale.");
          onComplete?.(importRow.id);
          return;
        }

        // metodo === "ai"
        setMessaggio("Estrazione AI in corso...");
        setProgress(75);

        const res = await fetch("/api/pannelli/process", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ import_id: importRow.id, pdf_url: fileUrl, categoria }),
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          setStep("errore");
          setCodiceErrore(json.codice_errore || "UNKNOWN_ERROR");
          setMessaggio(json.dettaglio || "Errore processing AI");
          return;
        }

        setProgress(100);
        setNumeroPannelli(json.numero_pannelli ?? 0);
        setStep("done");
        setMessaggio(`Estratti ${json.numero_pannelli} pannelli`);
        onComplete?.(importRow.id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setStep("errore");
        setCodiceErrore("CLIENT_ERROR");
        setMessaggio(msg);
      }
    },
    [metodo, categoria, onComplete]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  if (!open) return null;

  return (
    <div onClick={handleClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 520, background: "#fff", borderRadius: 14,
        padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1C" }}>📥 Importa pannelli</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {step === "metodo" && "Come vuoi procedere?"}
              {step === "categoria" && "In quale sezione?"}
              {step === "upload" && "Carica il PDF"}
              {step === "working" && "Elaborazione..."}
              {step === "done" && "Completato"}
              {step === "errore" && "Errore"}
            </div>
          </div>
          <button onClick={handleClose} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: "#888", lineHeight: 1, padding: 0, marginLeft: 12,
          }} aria-label="Chiudi">×</button>
        </div>

        {step === "metodo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setMetodo("ai"); setStep(categoria ? "upload" : "categoria"); }} style={{
              padding: 16, borderRadius: 12, border: "2px solid #D08008", background: "#D0800815",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 24 }}>🤖</span>
                <span style={{ fontWeight: 800, color: "#D08008", fontSize: 14 }}>Estrazione AI automatica</span>
              </div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>
                Carica un PDF catalogo. L&apos;AI estrae tutti i pannelli (codice, prezzo, dimensioni). Costo ~€0.30 per PDF.
              </div>
            </button>

            <button onClick={() => { setMetodo("manuale"); setStep(categoria ? "upload" : "categoria"); }} style={{
              padding: 16, borderRadius: 12, border: "2px solid #ccc", background: "#fafafa",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 24 }}>✍️</span>
                <span style={{ fontWeight: 800, color: "#1A1A1C", fontSize: 14 }}>Inserimento manuale</span>
              </div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>
                Carica il PDF come riferimento e inserisci i pannelli a mano. Gratuito, nessun consumo budget AI.
              </div>
            </button>
          </div>
        )}

        {step === "categoria" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CATEGORIE.map((c) => (
              <button key={c.id} onClick={() => { setCategoria(c.id); setStep("upload"); }} style={{
                padding: 14, borderRadius: 10, border: `2px solid ${c.color}`, background: `${c.color}10`,
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: c.color, fontSize: 13 }}>{c.label}</div>
                  <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{c.desc}</div>
                </div>
                <span style={{ color: c.color, fontSize: 18 }}>›</span>
              </button>
            ))}
            <button onClick={() => setStep("metodo")} style={{
              marginTop: 6, padding: "8px 12px", background: "transparent", border: "none",
              color: "#888", fontSize: 11, cursor: "pointer", textAlign: "center",
            }}>← Cambia metodo</button>
          </div>
        )}

        {step === "upload" && metodo && categoria && (
          <div>
            <div style={{
              padding: "8px 12px", borderRadius: 8, background: "#fafafa", marginBottom: 12,
              fontSize: 11, color: "#666", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>
                <strong>{metodo === "ai" ? "🤖 AI" : "✍️ Manuale"}</strong>
                {" · "}
                <strong>{CATEGORIE.find(c => c.id === categoria)?.label}</strong>
              </span>
              <button onClick={() => setStep("metodo")} style={{
                background: "none", border: "none", color: "#3B7FE0", fontSize: 11, cursor: "pointer", padding: 0,
              }}>Cambia</button>
            </div>

            <label htmlFor="pannelli-pdf-input" style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "32px 20px", border: "2px dashed #ccc", borderRadius: 12,
              background: "#fafafa", cursor: "pointer",
            }}>
              <span style={{ fontSize: 38 }}>📄</span>
              <span style={{ fontWeight: 700, color: "#1A1A1C", fontSize: 13 }}>Seleziona PDF</span>
              <span style={{ fontSize: 10, color: "#888" }}>Max 50MB · Tap per scegliere</span>
            </label>
            <input id="pannelli-pdf-input" ref={inputRef} type="file" accept="application/pdf"
              style={{ display: "none" }} onChange={onChange} />
          </div>
        )}

        {step === "working" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: "#1A1A1C" }}>{messaggio}</span>
              <span style={{ color: "#888" }}>{progress}%</span>
            </div>
            <div style={{ height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#28A0A0", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 10, textAlign: "center" }}>
              Non chiudere la pagina...
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: 16, background: "#1A9E7315", border: "1.5px solid #1A9E73", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ fontWeight: 800, color: "#1A9E73", fontSize: 13 }}>Completato</span>
            </div>
            <div style={{ fontSize: 11, color: "#1A1A1C", marginBottom: 12 }}>
              {numeroPannelli !== null ? `${numeroPannelli} pannelli estratti.` : messaggio}
            </div>
            <button onClick={() => { onComplete?.(importId ?? undefined); onClose(); }} style={{
              padding: "10px 16px", borderRadius: 8, background: "#1A9E73", color: "#fff",
              fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
            }}>Chiudi</button>
          </div>
        )}

        {step === "errore" && (
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
            <button onClick={() => { setStep("metodo"); setProgress(0); setMessaggio(""); setCodiceErrore(null); }} style={{
              padding: "10px 16px", borderRadius: 8, background: "#DC4444", color: "#fff",
              fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
            }}>Riprova</button>
          </div>
        )}
      </div>
    </div>
  );
}
