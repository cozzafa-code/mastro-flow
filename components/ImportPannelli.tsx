"use client";
import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
};

type Step = "metodo" | "upload" | "preventivo" | "elaborazione" | "review" | "completato" | "errore";
type Metodo = "ai" | "manuale" | "dxf";

export default function ImportPannelli({ open, onClose, onComplete }: Props) {
  const [step, setStep] = React.useState<Step>("metodo");
  const [metodo, setMetodo] = React.useState<Metodo>("ai");
  const [file, setFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [preventivo, setPreventivo] = React.useState<any | null>(null);
  const [importId, setImportId] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState({ corrente: 0, totale: 0, pannelliEstratti: 0, costoAccumulato: 0, msg: "" });
  const [pannelliReview, setPannelliReview] = React.useState<any[]>([]);
  const [scartati, setScartati] = React.useState<Set<string>>(new Set());
  const [credits, setCredits] = React.useState<any | null>(null);
  const [errore, setErrore] = React.useState("");
  const [erroreDettagli, setErroreDettagli] = React.useState<any | null>(null);
  const [healthOk, setHealthOk] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (open) {
      setStep("metodo");
      setMetodo("ai");
      setFile(null);
      setPageCount(0);
      setPreventivo(null);
      setImportId(null);
      setProgress({ corrente: 0, totale: 0, pannelliEstratti: 0, costoAccumulato: 0, msg: "" });
      setPannelliReview([]);
      setScartati(new Set());
      setErrore("");
      setErroreDettagli(null);
      // Carica crediti + health check
      fetch("/api/ai-credits").then(r => r.json()).then(d => setCredits(d));
      fetch("/api/pannelli/process").then(r => r.json()).then(d => setHealthOk(!!d?.anthropic_key_configured));
    }
  }, [open]);

  if (!open) return null;

  // === HANDLERS ===
  const handleFileSelect = async (f: File) => {
    setFile(f);
    if (metodo === "manuale" || metodo === "dxf") {
      setPageCount(1);
      handlePreventivo(f, 1);
      return;
    }
    // PDF: stima pagine veloce dalla dimensione file
    const stimato = Math.max(1, Math.round(f.size / 60000));
    setPageCount(stimato);
    handlePreventivo(f, stimato);
  };

  const handlePreventivo = async (f: File, pages: number) => {
    setStep("preventivo");
    try {
      const arrayBuffer = await f.arrayBuffer();
      const hashBuf = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      const fileHash = hashArr.map(b => b.toString(16).padStart(2, "0")).join("");

      const res = await fetch("/api/pannelli/preanalyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: f.name,
          fileSize: f.size,
          fileBase64: fileHash,
          metodo,
          pageCount: pages,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrore(data.error || "Errore preventivo"); setStep("errore"); return; }
      setPreventivo({ ...data, fileHash });
    } catch (e: any) {
      setErrore(e.message); setStep("errore");
    }
  };

  const handleAccettaPreventivo = async () => {
    if (!preventivo || !file) return;
    try {
      const startRes = await fetch("/api/pannelli/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          fileHash: preventivo.fileHash,
          fileSize: file.size,
          metodo,
          pageCount: preventivo.pageCount,
          pagineUtili: preventivo.pagineUtili,
          pannelliStimati: preventivo.pannelliStimati,
          costoStimato: preventivo.costoAnthropic,
          prezzoCliente: preventivo.prezzoCliente,
        }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) { setErrore(startData.error || "Errore avvio"); setStep("errore"); return; }
      setImportId(startData.import_id);

      if (metodo === "ai") {
        setStep("elaborazione");
        await processaPDF(startData.import_id, file);
      } else if (metodo === "manuale" || metodo === "dxf") {
        setStep("review");
      }
    } catch (e: any) {
      setErrore(e.message); setStep("errore");
    }
  };

  // Invia il PDF intero come base64 al server (Anthropic supporta PDF nativamente)
  const processaPDF = async (impId: string, f: File) => {
    setProgress({ corrente: 1, totale: 3, pannelliEstratti: 0, costoAccumulato: 0, msg: "Caricamento PDF..." });

    try {
      // Converti file in base64
      const arrayBuffer = await f.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + chunkSize)));
      }
      const pdfBase64 = btoa(binary);

      setProgress({ corrente: 2, totale: 3, pannelliEstratti: 0, costoAccumulato: 0, msg: "MASTRO AI sta analizzando il catalogo..." });

      const res = await fetch("/api/pannelli/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import_id: impId, pdf_base64: pdfBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrore(data.error || "Errore elaborazione AI");
        setErroreDettagli(data);
        setStep("errore");
        return;
      }

      const pannelliCount = data.pannelli_count || 0;
      const costo = (data.costo_reale || 0) * 4; // margine x4

      setProgress({
        corrente: 3, totale: 3,
        pannelliEstratti: pannelliCount,
        costoAccumulato: costo,
        msg: pannelliCount > 0 ? `Trovati ${pannelliCount} pannelli!` : "Nessun pannello trovato nel PDF",
      });

      // Carica pannelli estratti per review
      const reviewRes = await fetch(`/api/pannelli/finalize?import_id=${impId}`);
      const reviewData = await reviewRes.json();
      setPannelliReview(reviewData);

      if (pannelliCount === 0) {
        // Nessun pannello: vai a errore con dettagli
        setErrore("Nessun pannello identificato nel PDF");
        setErroreDettagli({
          tipo: "no_panels",
          raw_response: data.raw_response,
          errore: data.errore,
          suggerimento: "Il PDF caricato potrebbe non contenere pannelli identificabili. Prova con un catalogo che mostri chiaramente i modelli con foto e nomi.",
        });
        setStep("errore");
        return;
      }

      setStep("review");
    } catch (e: any) {
      setErrore(e.message || "Errore generico");
      setStep("errore");
    }
  };

  const handleFinalize = async () => {
    if (!importId) return;
    try {
      const res = await fetch("/api/pannelli/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import_id: importId, ids_da_scartare: Array.from(scartati) }),
      });
      const data = await res.json();
      if (!res.ok) { setErrore(data.error || "Errore"); setStep("errore"); return; }
      setStep("completato");
      onComplete();
    } catch (e: any) {
      setErrore(e.message); setStep("errore");
    }
  };

  // === RENDER ===
  return (
    <div onClick={() => step === "completato" && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, width: "min(96vw, 600px)", maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73" }}>📥 Importa Catalogo Pannelli</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>
              {step === "metodo" && "Scegli il metodo di import"}
              {step === "upload" && "Carica il file"}
              {step === "preventivo" && "Verifica costo e tempi"}
              {step === "elaborazione" && progress.msg}
              {step === "review" && "Verifica i pannelli estratti"}
              {step === "completato" && "Import completato"}
              {step === "errore" && "Errore"}
            </div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

          {/* Health warning */}
          {healthOk === false && step !== "errore" && (
            <div style={{ padding: 10, marginBottom: 12, background: "#DC444415", border: "1.5px solid #DC4444", borderRadius: 8, fontSize: 10, color: "#DC4444", lineHeight: 1.5 }}>
              ⚠️ <strong>ANTHROPIC_API_KEY non configurata su Vercel.</strong> L'import AI non funzionerà finché non viene aggiunta nelle variabili d'ambiente.
            </div>
          )}

          {/* STEP 1: SCELTA METODO */}
          {step === "metodo" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1C", marginBottom: 12 }}>
                Come vuoi importare i pannelli?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div onClick={() => setMetodo("ai")} style={{ padding: 14, borderRadius: 10, border: `2px solid ${metodo === "ai" ? "#1A9E73" : "#ddd"}`, background: metodo === "ai" ? "#1A9E7308" : "#fff", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 20 }}>🤖</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: metodo === "ai" ? "#1A9E73" : "#1A1A1C" }}>AI — MASTRO AI estrae il catalogo</div>
                    <div style={{ fontSize: 8, fontWeight: 800, padding: "2px 6px", background: "#D08008", color: "#fff", borderRadius: 4 }}>★ INNOVATIVO</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", lineHeight: 1.4 }}>
                    Carica un PDF di qualunque produttore (Garofoli, Dierre, Internorm…). MASTRO AI estrae automaticamente nome, foto, misure, colori, prezzi.
                  </div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>
                    💰 Costo trasparente · ⏱ ~30-60s per catalogo · ✅ Preventivo prima di procedere
                  </div>
                </div>

                <div onClick={() => setMetodo("manuale")} style={{ padding: 14, borderRadius: 10, border: `2px solid ${metodo === "manuale" ? "#1A9E73" : "#ddd"}`, background: metodo === "manuale" ? "#1A9E7308" : "#fff", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 20 }}>✏️</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: metodo === "manuale" ? "#1A9E73" : "#1A1A1C" }}>Manuale — Carica foto + dati</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", lineHeight: 1.4 }}>
                    Inserisci a mano un singolo pannello: nome, foto, tipo, misure, prezzo. Per pochi pannelli specifici.
                  </div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>💰 Gratis · ⏱ ~30s a pannello</div>
                </div>

                <div onClick={() => setMetodo("dxf")} style={{ padding: 14, borderRadius: 10, border: `2px solid ${metodo === "dxf" ? "#1A9E73" : "#ddd"}`, background: metodo === "dxf" ? "#1A9E7308" : "#fff", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 20 }}>📐</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: metodo === "dxf" ? "#1A9E73" : "#1A1A1C" }}>DXF/SVG — Disegno tecnico fornitore</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#666", lineHeight: 1.4 }}>
                    Carica un file DXF/SVG fornito dal produttore. Massima fedeltà al disegno tecnico originale.
                  </div>
                  <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>💰 Gratis · ⏱ Istantaneo</div>
                </div>
              </div>

              {credits?.credits && (
                <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: "#fafafa", fontSize: 10, color: "#666" }}>
                  💳 Budget AI corrente: <strong style={{ color: "#1A9E73" }}>€{Number(credits.credits.budget_corrente).toFixed(2)}</strong> · speso questo mese: €{Number(credits.credits.totale_speso_mese).toFixed(2)}
                </div>
              )}

              <div onClick={() => setStep("upload")} style={{ marginTop: 14, padding: "12px 16px", borderRadius: 8, background: "#1A9E73", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                Continua →
              </div>
            </>
          )}

          {/* STEP 2: UPLOAD */}
          {step === "upload" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1C", marginBottom: 8 }}>
                {metodo === "ai" && "Carica il PDF del catalogo"}
                {metodo === "manuale" && "Carica una foto del pannello"}
                {metodo === "dxf" && "Carica il file DXF o SVG"}
              </div>
              <label style={{ display: "block", padding: 30, border: "2px dashed #1A9E73", borderRadius: 10, textAlign: "center", cursor: "pointer", background: "#1A9E7305" }}>
                <input type="file"
                  accept={metodo === "ai" ? "application/pdf" : metodo === "manuale" ? "image/*" : ".dxf,.svg"}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  style={{ display: "none" }} />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A9E73" }}>
                  Tap qui per caricare {metodo === "ai" ? "PDF" : metodo === "manuale" ? "immagine" : "DXF/SVG"}
                </div>
                <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>
                  Max 32MB · {metodo === "ai" ? "PDF cataloghi produttori" : metodo === "manuale" ? "JPG/PNG" : "DXF/SVG vettoriali"}
                </div>
              </label>

              <div onClick={() => setStep("metodo")} style={{ marginTop: 14, padding: 10, fontSize: 11, color: "#888", textAlign: "center", cursor: "pointer" }}>← Cambia metodo</div>
            </>
          )}

          {/* STEP 3: PREVENTIVO */}
          {step === "preventivo" && preventivo && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", marginBottom: 12 }}>📋 Preventivo elaborazione</div>

              {preventivo.deduped ? (
                <div style={{ padding: 16, borderRadius: 10, background: "#1A9E7315", border: "2px solid #1A9E73" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A9E73", marginBottom: 6 }}>🎁 Catalogo già disponibile!</div>
                  <div style={{ fontSize: 11, color: "#1A1A1C", lineHeight: 1.5 }}>
                    Questo catalogo è già stato elaborato in precedenza. <strong>{preventivo.pannelli_disponibili} pannelli</strong> sono già pronti nel sistema MASTRO. Importazione gratuita.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ background: "#fafafa", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 11 }}>
                      <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>FILE</div><div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{preventivo.filename}</div></div>
                      <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>METODO</div><div style={{ fontWeight: 600, color: metodo === "ai" ? "#1A9E73" : "#1A1A1C" }}>{metodo === "ai" ? "🤖 AI MASTRO" : metodo === "manuale" ? "✏️ Manuale" : "📐 DXF/SVG"}</div></div>
                      {metodo === "ai" && (
                        <>
                          <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>PAGINE TOTALI</div><div style={{ fontWeight: 600 }}>{preventivo.pageCount}</div></div>
                          <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>PANNELLI STIMATI</div><div style={{ fontWeight: 600, color: "#1A9E73" }}>~{preventivo.pannelliStimati}</div></div>
                          <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>TEMPO STIMATO</div><div style={{ fontWeight: 600 }}>{preventivo.tempoStimato}</div></div>
                        </>
                      )}
                    </div>
                  </div>

                  {metodo === "ai" && preventivo.prezzoCliente > 0 && (
                    <div style={{ background: "#fff8e8", borderRadius: 10, padding: 14, marginBottom: 12, border: "1.5px solid #D08008" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#D08008", marginBottom: 6 }}>💰 COSTO ELABORAZIONE</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#D08008", lineHeight: 1 }}>€{preventivo.prezzoCliente.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: "#888", marginTop: 6 }}>
                        Verrà scalato dal tuo budget AI
                      </div>
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #D0800820", fontSize: 10 }}>
                        <span style={{ color: "#666" }}>Budget AI attuale: </span>
                        <span style={{ fontWeight: 800, color: preventivo.budgetSufficiente ? "#1A9E73" : "#DC4444" }}>€{Number(preventivo.budgetCorrente).toFixed(2)}</span>
                        {!preventivo.budgetSufficiente && (
                          <div style={{ marginTop: 6, padding: "6px 8px", background: "#DC444415", borderRadius: 6, color: "#DC4444", fontSize: 10, fontWeight: 700 }}>
                            ⚠️ Budget insufficiente. Ricarica almeno €{preventivo.ricaricaConsigliata} per procedere.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8 }}>
                <div onClick={() => setStep("metodo")} style={{ padding: 12, borderRadius: 8, border: "1.5px solid #ddd", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#666" }}>Annulla</div>
                <div onClick={preventivo.deduped || preventivo.budgetSufficiente ? handleAccettaPreventivo : undefined}
                  style={{
                    padding: 12, borderRadius: 8, textAlign: "center",
                    cursor: (preventivo.deduped || preventivo.budgetSufficiente) ? "pointer" : "not-allowed",
                    fontSize: 12, fontWeight: 800, color: "#fff",
                    background: (preventivo.deduped || preventivo.budgetSufficiente) ? "#1A9E73" : "#999",
                  }}>
                  {preventivo.deduped ? "🎁 Importa Gratis" : metodo === "ai" ? `Accetta e procedi (€${preventivo.prezzoCliente.toFixed(2)})` : "Procedi"}
                </div>
              </div>
            </>
          )}

          {/* STEP 4: ELABORAZIONE */}
          {step === "elaborazione" && (
            <>
              <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1A9E73", marginBottom: 6 }}>
                  {progress.msg || "MASTRO AI sta analizzando..."}
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>Step {progress.corrente} di {progress.totale}</div>
              </div>

              <div style={{ height: 14, background: "#f0f0f0", borderRadius: 7, overflow: "hidden", marginBottom: 14 }}>
                <div style={{
                  height: "100%",
                  width: `${progress.totale > 0 ? (progress.corrente / progress.totale) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #1A9E73, #5BC9A0)",
                  transition: "width 0.3s",
                }} />
              </div>

              {progress.pannelliEstratti > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: "#1A9E7308" }}>
                    <div style={{ fontSize: 9, color: "#888", fontWeight: 700, marginBottom: 4 }}>PANNELLI</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1A9E73" }}>{progress.pannelliEstratti}</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: "#D0800808" }}>
                    <div style={{ fontSize: 9, color: "#888", fontWeight: 700, marginBottom: 4 }}>COSTO</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#D08008" }}>€{progress.costoAccumulato.toFixed(2)}</div>
                  </div>
                </div>
              )}

              <div style={{ padding: 10, borderRadius: 8, background: "#3B7FE015", textAlign: "center", fontSize: 10, color: "#3B7FE0" }}>
                💡 Anthropic Claude legge il PDF intero e estrae tutti i pannelli in un'unica chiamata
              </div>
            </>
          )}

          {/* STEP 5: REVIEW */}
          {step === "review" && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1C", marginBottom: 8 }}>
                ✅ {pannelliReview.length} pannelli estratti
              </div>
              <div style={{ fontSize: 10, color: "#666", marginBottom: 12 }}>
                Verifica e deseleziona quelli che non vuoi salvare. Solo i selezionati verranno aggiunti al catalogo.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {pannelliReview.map((p) => {
                  const isScartato = scartati.has(p.id);
                  const d = p.dati || {};
                  return (
                    <div key={p.id} onClick={() => {
                      const next = new Set(scartati);
                      if (isScartato) next.delete(p.id); else next.add(p.id);
                      setScartati(next);
                    }} style={{
                      padding: 10, borderRadius: 8, border: `1.5px solid ${isScartato ? "#ddd" : "#1A9E73"}`,
                      background: isScartato ? "#f5f5f5" : "#1A9E7308", cursor: "pointer",
                      opacity: isScartato ? 0.5 : 1,
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isScartato ? "#999" : "#1A9E73"}`, background: isScartato ? "#fff" : "#1A9E73", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                        {!isScartato && "✓"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1A1A1C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nome || "Senza nome"} {d.codice && <span style={{ color: "#888", fontFamily: "monospace", fontWeight: 500 }}>({d.codice})</span>}</div>
                        <div style={{ fontSize: 9, color: "#666", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {d.tipo && <span style={{ background: "#1A9E7315", color: "#1A9E73", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>{d.tipo}</span>}
                          {d.produttore && <span>{d.produttore}{d.serie ? ` · ${d.serie}` : ""}</span>}
                          {d.prezzo && <span style={{ fontWeight: 700 }}>€{d.prezzo}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div onClick={handleFinalize} style={{ padding: 12, borderRadius: 8, background: "#1A9E73", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                💾 Salva {pannelliReview.length - scartati.size} pannelli nel catalogo
              </div>
            </>
          )}

          {/* STEP 6: COMPLETATO */}
          {step === "completato" && (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1A9E73", marginBottom: 6 }}>Import completato!</div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 18 }}>
                I pannelli sono stati aggiunti al tuo catalogo MASTRO e sono già disponibili nei vani.
              </div>
              <div onClick={onClose} style={{ padding: "12px 20px", borderRadius: 8, background: "#1A9E73", display: "inline-block", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                Chiudi
              </div>
            </div>
          )}

          {/* STEP ERRORE */}
          {step === "errore" && (
            <div style={{ padding: 20 }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#DC4444", marginBottom: 8 }}>Errore</div>
                <div style={{ fontSize: 11, color: "#1A1A1C", marginBottom: 6, fontWeight: 600 }}>{errore}</div>
              </div>

              {erroreDettagli && (
                <div style={{ background: "#FEF2E0", border: "1.5px solid #D08008", borderRadius: 8, padding: 12, marginBottom: 14 }}>
                  {erroreDettagli.codice_errore === "API_KEY_MISSING" && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#D08008", marginBottom: 6 }}>🔑 Chiave API mancante</div>
                      <div style={{ fontSize: 10, color: "#1A1A1C", lineHeight: 1.6 }}>
                        Per usare l'AI MASTRO, è necessario configurare la chiave API Anthropic su Vercel:<br/><br/>
                        <strong>1.</strong> Vai su <a href="https://vercel.com" target="_blank" style={{ color: "#3B7FE0" }}>vercel.com</a> → progetto mastro-erp<br/>
                        <strong>2.</strong> Settings → Environment Variables<br/>
                        <strong>3.</strong> Add new: <code style={{ background: "#fff", padding: "2px 5px", borderRadius: 3 }}>ANTHROPIC_API_KEY</code> = <code style={{ background: "#fff", padding: "2px 5px", borderRadius: 3 }}>sk-ant-...</code><br/>
                        <strong>4.</strong> Redeploy il progetto<br/>
                        <strong>5.</strong> Ottieni la key da <a href="https://console.anthropic.com" target="_blank" style={{ color: "#3B7FE0" }}>console.anthropic.com</a>
                      </div>
                    </>
                  )}
                  {erroreDettagli.tipo === "no_panels" && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#D08008", marginBottom: 6 }}>📭 Nessun pannello identificato</div>
                      <div style={{ fontSize: 10, color: "#1A1A1C", lineHeight: 1.6 }}>
                        {erroreDettagli.suggerimento}
                        {erroreDettagli.raw_response && (
                          <>
                            <br/><br/><strong>Risposta AI ricevuta:</strong>
                            <div style={{ marginTop: 4, padding: 6, background: "#fff", borderRadius: 4, fontFamily: "monospace", fontSize: 9, maxHeight: 100, overflowY: "auto" }}>
                              {erroreDettagli.raw_response}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {erroreDettagli.codice_errore === "ANTHROPIC_ERROR" && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#D08008", marginBottom: 6 }}>🚫 Errore Claude API</div>
                      <div style={{ fontSize: 10, color: "#1A1A1C", lineHeight: 1.6 }}>
                        Anthropic ha rifiutato la richiesta:<br/>
                        <code style={{ background: "#fff", padding: "2px 5px", borderRadius: 3, fontSize: 9 }}>{erroreDettagli.details}</code><br/><br/>
                        Possibili cause: PDF troppo grande (&gt;32MB), key non valida, rate limit raggiunto.
                      </div>
                    </>
                  )}
                </div>
              )}

              <div onClick={() => setStep("metodo")} style={{ padding: 10, borderRadius: 8, background: "#1A1A1C", textAlign: "center", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Riprova</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
