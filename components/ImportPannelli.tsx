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
  const [progress, setProgress] = React.useState({ corrente: 0, totale: 0, pannelliEstratti: 0, costoAccumulato: 0 });
  const [pannelliReview, setPannelliReview] = React.useState<any[]>([]);
  const [scartati, setScartati] = React.useState<Set<string>>(new Set());
  const [credits, setCredits] = React.useState<any | null>(null);
  const [errore, setErrore] = React.useState("");
  const [stopRequested, setStopRequested] = React.useState(false);
  const stopRef = React.useRef(false);

  React.useEffect(() => {
    if (open) {
      setStep("metodo");
      setMetodo("ai");
      setFile(null);
      setPageCount(0);
      setPreventivo(null);
      setImportId(null);
      setProgress({ corrente: 0, totale: 0, pannelliEstratti: 0, costoAccumulato: 0 });
      setPannelliReview([]);
      setScartati(new Set());
      setErrore("");
      setStopRequested(false);
      stopRef.current = false;
      // Carica crediti
      fetch("/api/ai-credits").then(r => r.json()).then(d => setCredits(d));
    }
  }, [open]);

  if (!open) return null;

  // === HANDLERS ===
  const handleFileSelect = async (f: File) => {
    setFile(f);
    if (metodo === "manuale" || metodo === "dxf") {
      // Salta pre-analisi PDF
      setPageCount(1);
      handlePreventivo(f, 1);
      return;
    }
    // PDF: estrai numero pagine con pdfjs lato client
    try {
      const arrayBuffer = await f.arrayBuffer();
      // Stima rapida: count "/Type /Page" nel PDF (no library serve)
      const text = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 5_000_000)));
      const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
      const pages = pageMatches ? pageMatches.length : Math.max(1, Math.floor(f.size / 50000));
      setPageCount(pages);
      handlePreventivo(f, pages);
    } catch (e) {
      // Fallback: stima da dimensione file
      const stimato = Math.max(1, Math.floor(f.size / 80000));
      setPageCount(stimato);
      handlePreventivo(f, stimato);
    }
  };

  const handlePreventivo = async (f: File, pages: number) => {
    setStep("preventivo");
    try {
      // Hash del file per dedup
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
        await processaPDF(startData.import_id, file, preventivo.pageCount);
      } else if (metodo === "manuale" || metodo === "dxf") {
        setStep("review");
      }
    } catch (e: any) {
      setErrore(e.message); setStep("errore");
    }
  };

  // Renderizza ogni pagina PDF su canvas → invia a Claude Vision
  const processaPDF = async (impId: string, f: File, totale: number) => {
    setProgress({ corrente: 0, totale, pannelliEstratti: 0, costoAccumulato: 0 });

    // Carica pdfjs dinamicamente
    let pdfjs: any;
    try {
      // @ts-ignore
      pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs").catch(() => import("pdfjs-dist"));
      const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch (e: any) {
      setErrore("pdfjs-dist non installato. Esegui: npm i pdfjs-dist"); setStep("errore"); return;
    }

    const arrayBuffer = await f.arrayBuffer();
    const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const realTotale = pdfDoc.numPages;

    let totalePannelliEstratti = 0;
    let costoAccum = 0;

    for (let i = 1; i <= realTotale; i++) {
      if (stopRef.current) break;

      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

      try {
        const res = await fetch("/api/pannelli/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ import_id: impId, pagina: i, image_base64: base64 }),
        });
        const data = await res.json();
        if (data.pannelli && data.pannelli.length > 0) {
          totalePannelliEstratti += data.pannelli.length;
        }
        const costoPagina = ((data.tokens_in || 0) / 1_000_000) * 3 + ((data.tokens_out || 0) / 1_000_000) * 15;
        costoAccum += costoPagina * 4; // margine x4
      } catch (e) {}

      setProgress({ corrente: i, totale: realTotale, pannelliEstratti: totalePannelliEstratti, costoAccumulato: costoAccum });
    }

    // Carica pannelli estratti per review
    const reviewRes = await fetch(`/api/pannelli/finalize?import_id=${impId}`);
    const reviewData = await reviewRes.json();
    setPannelliReview(reviewData);
    setStep("review");
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

  const handleStopElaborazione = () => {
    setStopRequested(true);
    stopRef.current = true;
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
              {step === "elaborazione" && "Elaborazione AI in corso..."}
              {step === "review" && "Verifica i pannelli estratti"}
              {step === "completato" && "Import completato"}
            </div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#666" }}>✕</div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

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
                    💰 Costo: ~€0.05/pannello · ⏱ ~10s/pagina · ✅ Preventivo prima di procedere
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
                  Max 50MB · {metodo === "ai" ? "PDF cataloghi produttori" : metodo === "manuale" ? "JPG/PNG" : "DXF/SVG vettoriali"}
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
                      <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>FILE</div><div style={{ fontWeight: 600 }}>{preventivo.filename}</div></div>
                      <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>METODO</div><div style={{ fontWeight: 600, color: metodo === "ai" ? "#1A9E73" : "#1A1A1C" }}>{metodo === "ai" ? "🤖 AI MASTRO" : metodo === "manuale" ? "✏️ Manuale" : "📐 DXF/SVG"}</div></div>
                      {metodo === "ai" && (
                        <>
                          <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>PAGINE TOTALI</div><div style={{ fontWeight: 600 }}>{preventivo.pageCount}</div></div>
                          <div><div style={{ color: "#888", fontSize: 9, fontWeight: 700, marginBottom: 2 }}>PAGINE PRODOTTO</div><div style={{ fontWeight: 600, color: "#1A9E73" }}>~{preventivo.pagineUtili}</div></div>
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
                        Costo per pannello: ~€{(preventivo.prezzoCliente / Math.max(1, preventivo.pannelliStimati)).toFixed(3)} · Verrà scalato dal tuo budget AI
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

                  <div style={{ background: "#3B7FE015", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 10, color: "#3B7FE0", lineHeight: 1.5 }}>
                    💡 Durante l'elaborazione potrai fermare quando vuoi. Ti verrà addebitato solo il costo reale delle pagine effettivamente elaborate.
                  </div>
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
                  MASTRO AI sta analizzando il catalogo...
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>Pagina {progress.corrente} di {progress.totale}</div>
              </div>

              <div style={{ height: 14, background: "#f0f0f0", borderRadius: 7, overflow: "hidden", marginBottom: 14 }}>
                <div style={{
                  height: "100%",
                  width: `${progress.totale > 0 ? (progress.corrente / progress.totale) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #1A9E73, #5BC9A0)",
                  transition: "width 0.3s",
                }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ padding: 12, borderRadius: 8, background: "#1A9E7308" }}>
                  <div style={{ fontSize: 9, color: "#888", fontWeight: 700, marginBottom: 4 }}>PANNELLI ESTRATTI</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#1A9E73" }}>{progress.pannelliEstratti}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: "#D0800808" }}>
                  <div style={{ fontSize: 9, color: "#888", fontWeight: 700, marginBottom: 4 }}>COSTO ACCUMULATO</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#D08008" }}>€{progress.costoAccumulato.toFixed(2)}</div>
                </div>
              </div>

              {!stopRequested ? (
                <div onClick={handleStopElaborazione} style={{ padding: 10, borderRadius: 8, border: "1.5px solid #DC4444", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#DC4444" }}>
                  ⏸ Stop - paga solo quanto elaborato finora
                </div>
              ) : (
                <div style={{ padding: 10, borderRadius: 8, background: "#DC444415", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#DC4444" }}>
                  Stop richiesto - termino la pagina corrente...
                </div>
              )}
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
                          <span style={{ color: "#aaa" }}>· pag {p.pagina}</span>
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
                I pannelli sono stati aggiunti al tuo catalogo MASTRO e sono già disponibili nei disegni.
              </div>
              <div onClick={onClose} style={{ padding: "12px 20px", borderRadius: 8, background: "#1A9E73", display: "inline-block", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                Chiudi
              </div>
            </div>
          )}

          {/* STEP ERRORE */}
          {step === "errore" && (
            <div style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#DC4444", marginBottom: 8 }}>Errore</div>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 14 }}>{errore}</div>
              <div onClick={() => setStep("metodo")} style={{ padding: 10, borderRadius: 8, background: "#1A1A1C", display: "inline-block", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Riprova</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
