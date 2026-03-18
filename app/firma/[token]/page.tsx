"use client";
import { useEffect, useRef, useState } from "react";

export default function FirmaPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [stato, setStato] = useState<"loading"|"pronto"|"firmato"|"errore">("loading");
  const [dati, setDati] = useState<any>(null);
  const [errore, setErrore] = useState("");
  const [firmando, setFirmando] = useState(false);
  const [firmato, setFirmato] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    fetch(`/api/firma`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "leggi", token }) })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErrore(d.error); setStato("errore"); return; }
        if (d.firmato) { setStato("firmato"); return; }
        setDati(d); setStato("pronto");
      })
      .catch(() => { setErrore("Errore di connessione"); setStato("errore"); });
  }, [token]);

  useEffect(() => {
    if (stato !== "pronto") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const start = (e: any) => { e.preventDefault(); drawingRef.current = true; const p = getPos(e); lastRef.current = p; ctx.beginPath(); ctx.moveTo(p.x, p.y); hasDrawnRef.current = true; };
    const move = (e: any) => { e.preventDefault(); if (!drawingRef.current) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p.x, p.y); lastRef.current = p; };
    const end = (e: any) => { e.preventDefault(); drawingRef.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [stato]);

  const pulisci = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  };

  const invia = async () => {
    if (!hasDrawnRef.current) { alert("Per favore firma prima di confermare"); return; }
    const canvas = canvasRef.current!;
    const firmaData = canvas.toDataURL("image/png");
    setFirmando(true);
    try {
      const res = await fetch("/api/firma", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "firma", token, data: { firmaData } }) });
      const d = await res.json();
      if (d.ok) setFirmato(true);
      else alert("Errore: " + d.error);
    } catch { alert("Errore di connessione"); }
    finally { setFirmando(false); }
  };

  const ACC = "#14B8A6";

  if (stato === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${ACC}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#64748B", fontSize: 14 }}>Caricamento...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (stato === "errore") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Link non valido</div>
        <div style={{ fontSize: 14, color: "#64748B" }}>{errore}</div>
      </div>
    </div>
  );

  if (stato === "firmato" || firmato) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#1A9E7320", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A9E73" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", marginBottom: 8 }}>Preventivo firmato!</div>
        <div style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>La tua firma è stata registrata con successo. Puoi chiudere questa pagina.</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ background: "#0B1F2A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: ACC, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>M</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>MASTRO</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Firma preventivo</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>
        {/* Info commessa */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Commessa</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>{dati?.cmCode}</div>
          <div style={{ fontSize: 14, color: "#475569", marginBottom: 12 }}>{dati?.cliente}</div>
          {dati?.importo > 0 && (
            <div style={{ background: "#F0FDF9", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>Importo preventivo</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: ACC }}>€{dati.importo.toLocaleString("it-IT")}</span>
            </div>
          )}
          {dati?.descrizione && <div style={{ marginTop: 12, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{dati.descrizione}</div>}
        </div>

        {/* Istruzioni */}
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 12, fontWeight: 500 }}>
          Firma nel riquadro qui sotto per accettare il preventivo:
        </div>

        {/* Canvas firma */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 12, border: "2px dashed #E2E8F0", position: "relative" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: 180, borderRadius: 12, touchAction: "none", display: "block" }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", opacity: hasDrawnRef.current ? 0 : 0.3 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </div>
        </div>

        {/* Pulisci */}
        <div onClick={pulisci} style={{ textAlign: "center", marginBottom: 20, fontSize: 12, color: "#94A3B8", cursor: "pointer" }}>
          Cancella e rifai
        </div>

        {/* Disclaimer */}
        <div style={{ background: "#FFF9F0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
          Firmando accetti il preventivo e autorizzi l'esecuzione dei lavori descritti. La firma digitale ha valore legale.
        </div>

        {/* Bottone conferma */}
        <button onClick={invia} disabled={firmando} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: firmando ? "#94A3B8" : ACC, color: "#fff", fontSize: 16, fontWeight: 800, cursor: firmando ? "default" : "pointer", boxShadow: `0 4px 16px ${ACC}40` }}>
          {firmando ? "Invio in corso..." : "Conferma e firma"}
        </button>
      </div>
    </div>
  );
}
