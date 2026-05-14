"use client";

import { useEffect, useRef, useState } from "react";
import { parseQrUrl } from "./qr-helpers";

interface Props {
  onClose: () => void;
  onScanResult: (token: string, rigaCode?: string) => void;
}

declare global { interface Window { Html5Qrcode?: any; } }

type ScannerState = "checking" | "no_camera" | "loading_lib" | "ready" | "scanning" | "error";

export default function QrScannerSheet({ onClose, onScanResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const startedRef = useRef<boolean>(false);
  const [state, setState] = useState<ScannerState>("checking");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [torcia, setTorcia] = useState(false);

  // STEP 1: pre-flight detect camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
          if (!cancelled) {
            setState("no_camera");
            setErrorMsg("Il tuo browser non supporta la fotocamera.");
          }
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === "videoinput");
        if (cameras.length === 0) {
          if (!cancelled) {
            setState("no_camera");
            setErrorMsg("Nessuna fotocamera rilevata.");
          }
          return;
        }
        if (!cancelled) setState("loading_lib");
      } catch (e: any) {
        if (!cancelled) {
          setState("no_camera");
          setErrorMsg(e?.message || "Impossibile rilevare fotocamere disponibili.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // STEP 2: load html5-qrcode CDN (solo se camera disponibile)
  useEffect(() => {
    if (state !== "loading_lib") return;
    if (typeof window === "undefined") return;
    if (window.Html5Qrcode) {
      setState("ready");
      return;
    }
    const existing = document.querySelector("script[data-html5qr]");
    if (existing) {
      // gia in caricamento, aspetta evento load
      existing.addEventListener("load", () => setState("ready"), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.async = true;
    script.setAttribute("data-html5qr", "true");
    script.onload = () => setState("ready");
    script.onerror = () => {
      setState("error");
      setErrorMsg("Impossibile caricare il modulo scanner (rete?). Riprova.");
    };
    document.head.appendChild(script);
  }, [state]);

  // STEP 3: start scanner una sola volta quando ready
  useEffect(() => {
    if (state !== "ready") return;
    if (startedRef.current) return;
    if (typeof window === "undefined" || !window.Html5Qrcode) return;
    if (!containerRef.current) return;

    startedRef.current = true;

    try {
      const Html5Qrcode = window.Html5Qrcode;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          if (navigator.vibrate) navigator.vibrate(100);
          const parsed = parseQrUrl(decodedText);
          if (parsed.token) {
            stopAndClose(scanner, () => onScanResult(parsed.token!, parsed.rigaCode));
          }
        },
        () => { /* ignora scan errors silenziosamente */ }
      ).then(() => {
        setState("scanning");
      }).catch((err: any) => {
        console.warn("[QrScanner] start failed:", err?.name || err?.message || err);
        setState("error");
        setErrorMsg(err?.name === "NotAllowedError"
          ? "Permesso fotocamera negato. Concedi i permessi in browser e riprova."
          : err?.name === "NotFoundError"
            ? "Fotocamera non disponibile."
            : "Errore avvio scanner: " + (err?.message || err?.name || "sconosciuto"));
      });
    } catch (e: any) {
      console.warn("[QrScanner] init error:", e);
      setState("error");
      setErrorMsg(e?.message || "Errore inizializzazione scanner");
    }

    return () => {
      // Cleanup: stop scanner se in esecuzione
      const s = scannerRef.current;
      if (s) {
        try {
          if (typeof s.getState === "function" && s.getState() === 2 /* SCANNING */) {
            s.stop().catch(() => { });
          } else if (typeof s.stop === "function") {
            s.stop().catch(() => { });
          }
        } catch { }
        scannerRef.current = null;
      }
      startedRef.current = false;
    };
  }, [state, onScanResult]);

  function stopAndClose(scanner: any, after: () => void) {
    try {
      scanner.stop().then(() => { after(); }).catch(() => { after(); });
    } catch {
      after();
    }
  }

  function handleClose() {
    const s = scannerRef.current;
    if (s) {
      try { s.stop().catch(() => { }); } catch { }
      scannerRef.current = null;
    }
    onClose();
  }

  async function toggleTorcia() {
    if (!scannerRef.current) return;
    try {
      const next = !torcia;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next }] as any,
      });
      setTorcia(next);
    } catch (e) {
      // torcia non supportata: silenzia
    }
  }

  const showCamera = state === "scanning" || state === "ready";
  const showError = state === "no_camera" || state === "error";
  const showLoading = state === "checking" || state === "loading_lib";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      zIndex: 200, display: "flex", flexDirection: "column",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "44px 16px 16px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0))",
        zIndex: 10, display: "flex", alignItems: "center", gap: 14, color: "#fff"
      }}>
        <div onClick={handleClose} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 18, cursor: "pointer"
        }}>x</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", color: "#E8B05C", textTransform: "uppercase" }}>
            Scansiona QR Ordine
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>
            {state === "scanning" ? "Inquadra il codice QR" :
              state === "checking" ? "Verifica fotocamera..." :
                state === "loading_lib" ? "Caricamento scanner..." :
                  state === "ready" ? "Avvio fotocamera..." :
                    "Scanner non disponibile"}
          </div>
        </div>
        {showCamera && (
          <div onClick={toggleTorcia} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: torcia ? "#E8B05C" : "rgba(255,255,255,0.15)",
            color: torcia ? "#1A2A47" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Container scanner (sempre presente ma vuoto se non scanning) */}
      <div id="qr-reader" ref={containerRef} style={{
        flex: 1, width: "100%", height: "100%", overflow: "hidden",
        display: showCamera ? "flex" : "none",
        alignItems: "center", justifyContent: "center"
      }} />

      {/* Loading */}
      {showLoading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 12,
          color: "rgba(255,255,255,0.85)", padding: 24, textAlign: "center"
        }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {state === "checking" ? "Verifica fotocamera..." : "Caricamento scanner..."}
          </div>
        </div>
      )}

      {/* Errore / no camera */}
      {showError && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 18, padding: 32, textAlign: "center", color: "#fff", zIndex: 20
        }}>
          <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#E8B05C" strokeWidth={1.5}>
            <path d="M23 7l-7 5 7 5V7z" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            <line x1="1" y1="1" x2="23" y2="23" stroke="#C44545" strokeWidth={2} />
          </svg>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.3px" }}>
            {state === "no_camera" ? "Scanner disponibile solo da smartphone" : "Scanner non avviabile"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, maxWidth: 320 }}>
            {errorMsg}
            {state === "no_camera" && (
              <><br /><br />Per scansionare i QR degli ordini, apri MASTRO sul tuo smartphone.</>
            )}
          </div>
          <button onClick={handleClose} style={{
            padding: "12px 28px", background: "#28A0A0", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13,
            letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 8
          }}>Chiudi</button>
        </div>
      )}

      {/* Hint bottom */}
      {showCamera && (
        <div style={{
          position: "absolute", bottom: 40, left: 0, right: 0,
          textAlign: "center", color: "rgba(255,255,255,0.85)",
          fontSize: 12, padding: "0 32px", zIndex: 10
        }}>
          Il QR si trova sul DDT o sull'etichetta del pacco.<br />
          Anche il fornitore puo scansionarlo per aggiornare lo stato.
        </div>
      )}
    </div>
  );
}
