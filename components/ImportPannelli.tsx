// components/ImportPannelli.tsx
// MODAL import pannelli - Wallet system.
// Mostra solo prezzo cliente. Nessun riferimento a Anthropic/provider/markup.

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AZIENDA_ID = "ccca51c1-656b-4e7c-a501-55753e20da29";
const BUCKET = "pannelli-pdf";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

type Step = "metodo" | "categoria" | "upload" | "stima" | "estrazione" | "done" | "errore" | "saldo_basso";
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

type Stima = {
  pagine: number | null;
  costo_eur: number;
  costo_max_eur: number;
  saldo_eur: number;
  saldo_sufficiente: boolean;
};

export default function ImportPannelli({ open, onClose, onComplete, defaultCategoria }: Props) {
  const [step, setStep] = useState<Step>("metodo");
  const [metodo, setMetodo] = useState<"ai" | "manuale" | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [progress, setProgress] = useState(0);
  const [messaggio, setMessaggio] = useState("");
  const [codiceErrore, setCodiceErrore] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [stima, setStima] = useState<Stima | null>(null);
  const [promossi, setPromossi] = useState<number | null>(null);
  const [addebito, setAddebito] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep("metodo");
      setMetodo(null);
      setCategoria(defaultCategoria ?? null);
      setProgress(0);
      setMessaggio("");
      setCodiceErrore(null);
      setImportId(null);
      setPdfUrl(null);
      setStima(null);
      setPromossi(null);
      setAddebito(null);
    }
  }, [open, defaultCategoria]);

  const handleClose = useCallback(() => {
    if (step === "estrazione") {
      if (!confirm("Annullare l'import in corso?")) return;
    }
    onClose();
  }, [step, onClose]);

  const handleError = (codice: string, msg: string) => {
    setStep("errore");
    setCodiceErrore(codice);
    setMessaggio(msg);
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || !metodo || !categoria) return;
      if (file.type !== "application/pdf") return handleError("FILE_TYPE_INVALID", "Solo PDF supportati");
      if (file.size > 50 * 1024 * 1024) return handleError("FILE_TOO_LARGE", "PDF supera 50MB");

      try {
        setStep("estrazione");
        setMessaggio("Creazione import...");
        setProgress(5);

        const { data: importRow, error: importErr } = await supabase
          .from("pannelli_imports").insert({
            azienda_id: AZIENDA_ID, filename: file.name, file_size_bytes: file.size,
            metodo, stato: "uploading", pre_analisi: { categoria },
          }).select("id").single();
        if (importErr || !importRow) throw new Error(importErr?.message || "Insert fallito");
        setImportId(importRow.id);

        setMessaggio("Caricamento PDF...");
        setProgress(25);

        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${AZIENDA_ID}/${importRow.id}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET)
          .upload(path, file, { contentType: "application/pdf", cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(`Caricamento fallito`);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const fileUrl = pub.publicUrl;
        if (!fileUrl) throw new Error("URL pubblico non generato");
        setPdfUrl(fileUrl);
        setProgress(60);

        await supabase.from("pannelli_imports").update({
          file_url: fileUrl, stato: "uploaded",
          pre_analisi: { categoria, storage_path: path, file_url: fileUrl },
        }).eq("id", importRow.id);

        if (metodo === "manuale") {
          setProgress(100);
          setStep("done");
          setMessaggio("PDF caricato. Procedi con inserimento manuale.");
          onComplete?.(importRow.id);
          return;
        }

        // AI: stima costo
        setMessaggio("Analisi documento...");
        setProgress(80);
        const stimaRes = await fetch("/api/pannelli/stima", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ import_id: importRow.id, pdf_url: fileUrl }),
        });
        const stimaJson = await stimaRes.json();
        if (!stimaRes.ok || !stimaJson.ok) {
          return handleError(stimaJson.codice_errore || "STIMA_ERROR", "Analisi documento fallita");
        }
        setStima({
          pagine: stimaJson.pagine,
          costo_eur: stimaJson.costo_eur,
          costo_max_eur: stimaJson.costo_max_eur,
          saldo_eur: stimaJson.saldo_eur,
          saldo_sufficiente: stimaJson.saldo_sufficiente,
        });

        if (!stimaJson.saldo_sufficiente) {
          setStep("saldo_basso");
        } else {
          setStep("stima");
        }
        setProgress(0);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        handleError("CLIENT_ERROR", msg);
      }
    }, [metodo, categoria, onComplete]
  );

  const confermaEstrazione = useCallback(async () => {
    if (!importId || !pdfUrl || !categoria) return;
    try {
      setStep("estrazione");
      setMessaggio("Estrazione automatica in corso...");
      setProgress(30);

      const res = await fetch("/api/pannelli/process", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ import_id: importId, pdf_url: pdfUrl, categoria }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        if (json.codice_errore === "WALLET_INSUFFICIENT") {
          return handleError("WALLET_INSUFFICIENT", "Saldo insufficiente. Ricarica il tuo wallet MASTRO.");
        }
        return handleError(json.codice_errore || "EXTRACTION_ERROR", json.dettaglio || "Errore estrazione");
      }

      setAddebito(json.addebito_eur ?? null);

      if ((json.numero_pannelli ?? 0) === 0) {
        setPromossi(0);
        setProgress(100);
        setStep("done");
        setMessaggio(json.warning || "Nessuna variante estratta. Prova con inserimento manuale.");
        onComplete?.(importId);
        return;
      }

      setProgress(70);
      setMessaggio(`Estratte ${json.numero_pannelli} varianti. Salvataggio nel catalogo...`);

      const promRes = await fetch("/api/pannelli/promote", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ import_id: importId }),
      });
      const promJson = await promRes.json();
      if (!promRes.ok || !promJson.ok) {
        return handleError(promJson.codice_errore || "PROMOTE_ERROR", "Errore salvataggio catalogo");
      }

      setPromossi(promJson.promossi ?? 0);
      setProgress(100);
      setStep("done");
      setMessaggio(`${promJson.promossi} pannelli salvati nel catalogo`);
      onComplete?.(importId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      handleError("CLIENT_ERROR", msg);
    }
  }, [importId, pdfUrl, categoria, onComplete]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  if (!open) return null;

  const titoli: Record<Step, string> = {
    metodo: "Come vuoi procedere?",
    categoria: "In quale sezione?",
    upload: "Carica il PDF",
    stima: "Conferma costo",
    saldo_basso: "Saldo insufficiente",
    estrazione: "Elaborazione...",
    done: "Completato",
    errore: "Errore",
  };

  return (
    <div onClick={handleClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 520, background: "#fff", borderRadius: 14,
        padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1C" }}>📥 Importa pannelli</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{titoli[step]}</div>
          </div>
          <button onClick={handleClose} style={{
            background: "none", border: "none", fontSize: 22, cursor: "pointer",
            color: "#888", lineHeight: 1, padding: 0, marginLeft: 12,
          }}>×</button>
        </div>

        {step === "metodo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setMetodo("ai"); setStep(categoria ? "upload" : "categoria"); }} style={{
              padding: 16, borderRadius: 12, border: "2px solid #D08008", background: "#D0800815",
              cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 24 }}>⚡</span>
                <span style={{ fontWeight: 800, color: "#D08008", fontSize: 14 }}>Estrazione automatica</span>
              </div>
              <div style={{ fontSize: 11, color: "#666", lineHeight: 1.4 }}>
                Carica un PDF, MASTRO estrae tutti i pannelli automaticamente. Vedrai il costo prima di confermare.
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
                Carica il PDF come riferimento. Inserisci i pannelli a mano. Gratuito.
              </div>
            </button>
          </div>
        )}

        {step === "categoria" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CATEGORIE.map((c) => (
              <button key={c.id} onClick={() => { setCategoria(c.id); setStep("upload"); }} style={{
                padding: 14, borderRadius: 10, border: `2px solid ${c.color}`, background: `${c.color}10`,
                cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
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
              color: "#888", fontSize: 11, cursor: "pointer",
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
                <strong>{metodo === "ai" ? "⚡ Automatica" : "✍️ Manuale"}</strong> ·{" "}
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
              <span style={{ fontSize: 10, color: "#888" }}>Max 50MB</span>
            </label>
            <input id="pannelli-pdf-input" ref={inputRef} type="file" accept="application/pdf"
              style={{ display: "none" }} onChange={onChange} />
          </div>
        )}

        {step === "stima" && stima && (
          <div>
            <div style={{ padding: 18, background: "#fafafa", borderRadius: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>
                📄 Analisi completata · {stima.pagine ?? "n.d."} pagine rilevate
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid #eee" }}>
                <span style={{ fontSize: 13, color: "#1A1A1C" }}>Costo estrazione</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#D08008" }}>€{stima.costo_eur.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 11, color: "#888", borderTop: "1px solid #eee" }}>
                <span>Saldo Wallet MASTRO</span>
                <span style={{ fontWeight: 700, color: "#1A9E73" }}>€{stima.saldo_eur.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("upload")} style={{
                flex: 1, padding: "12px 16px", borderRadius: 8, background: "#fff",
                border: "1.5px solid #ccc", color: "#666", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Annulla</button>
              <button onClick={confermaEstrazione} style={{
                flex: 2, padding: "12px 16px", borderRadius: 8, background: "#D08008",
                color: "#fff", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
              }}>⚡ Conferma e paga €{stima.costo_eur.toFixed(2)}</button>
            </div>
          </div>
        )}

        {step === "saldo_basso" && stima && (
          <div>
            <div style={{ padding: 16, background: "#DC444415", border: "1.5px solid #DC4444", borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>💰</span>
                <span style={{ fontWeight: 800, color: "#DC4444", fontSize: 13 }}>Saldo insufficiente</span>
              </div>
              <div style={{ fontSize: 12, color: "#1A1A1C", lineHeight: 1.5 }}>
                Costo estrazione: <strong>€{stima.costo_eur.toFixed(2)}</strong><br/>
                Saldo Wallet MASTRO: <strong style={{ color: "#DC4444" }}>€{stima.saldo_eur.toFixed(2)}</strong>
              </div>
            </div>
            <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, fontSize: 11, color: "#666", marginBottom: 12, lineHeight: 1.5 }}>
              Ricarica il tuo Wallet MASTRO per continuare. Una volta ricaricato, potrai estrarre cataloghi finché c&apos;è saldo disponibile.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "12px 16px", borderRadius: 8, background: "#fff",
                border: "1.5px solid #ccc", color: "#666", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>Chiudi</button>
              <button onClick={() => alert("Ricarica Wallet: in arrivo - Stripe in fase di integrazione")} style={{
                flex: 2, padding: "12px 16px", borderRadius: 8, background: "#1A9E73",
                color: "#fff", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
              }}>💳 Ricarica Wallet</button>
            </div>
          </div>
        )}

        {step === "estrazione" && (
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
          <div style={{
            padding: 16,
            background: (promossi ?? 0) > 0 ? "#1A9E7315" : "#D0800815",
            border: `1.5px solid ${(promossi ?? 0) > 0 ? "#1A9E73" : "#D08008"}`,
            borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{(promossi ?? 0) > 0 ? "✅" : "⚠️"}</span>
              <span style={{
                fontWeight: 800, fontSize: 13,
                color: (promossi ?? 0) > 0 ? "#1A9E73" : "#D08008",
              }}>
                {(promossi ?? 0) > 0 ? "Completato" : "Nessun pannello estratto"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#1A1A1C", marginBottom: 8, lineHeight: 1.5 }}>
              {(promossi ?? 0) > 0
                ? `${promossi} pannelli salvati nel catalogo "${CATEGORIE.find(c => c.id === categoria)?.label}".`
                : messaggio || "PDF analizzato ma senza pannelli estraibili."}
            </div>
            {addebito !== null && addebito > 0 && (
              <div style={{ fontSize: 10, color: "#888", marginBottom: 12, fontStyle: "italic" }}>
                Addebitato dal Wallet: €{addebito.toFixed(2)}
              </div>
            )}
            <button onClick={() => { onComplete?.(importId ?? undefined); onClose(); }} style={{
              padding: "10px 16px", borderRadius: 8,
              background: (promossi ?? 0) > 0 ? "#1A9E73" : "#D08008",
              color: "#fff", fontSize: 12, fontWeight: 800, border: "none", cursor: "pointer",
            }}>{(promossi ?? 0) > 0 ? "Vedi catalogo" : "Chiudi"}</button>
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
            <div style={{ fontSize: 11, color: "#1A1A1C", wordBreak: "break-word", marginBottom: 12 }}>{messaggio}</div>
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
