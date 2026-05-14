"use client";

import { useEffect, useRef, useState } from "react";
import { parseQrUrl } from "./qr-helpers";

interface Props {
  onClose: () => void;
  onScanResult: (token: string, rigaCode?: string) => void;
}

declare global { interface Window { Html5Qrcode?: any; } }

export default function QrScannerSheet({ onClose, onScanResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [torcia, setTorcia] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Carica html5-qrcode da CDN dinamico
    if (typeof window === "undefined") return;
    if (window.Html5Qrcode) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Impossibile caricare il modulo scanner");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    if (typeof window === "undefined" || !window.Html5Qrcode) return;

    try {
      const Html5Qrcode = window.Html5Qrcode;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          // Beep + vibrazione
          if (navigator.vibrate) navigator.vibrate(100);
          const parsed = parseQrUrl(decodedText);
          if (parsed.token) {
            scanner.stop().catch(() => { });
            onScanResult(parsed.token, parsed.rigaCode);
          }
        },
        () => { /* ignora scan errors */ }
      ).catch((err: any) => {
        console.error("[QrScanner] start error", err);
        setError("Impossibile accedere alla fotocamera. Concedi i permessi e riprova.");
      });
    } catch (e: any) {
      console.error("[QrScanner] init error", e);
      setError(e?.message || "Errore inizializzazione scanner");
    }

    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => { }); } catch { }
      }
    };
  }, [loaded, onScanResult]);

  function handleClose() {
    if (scannerRef.current) {
      try { scannerRef.current.stop().catch(() => { }); } catch { }
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
      console.warn("[QrScanner] torcia non supportata", e);
    }
  }

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
        }}>✕</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.5px", color: "#E8B05C", textTransform: "uppercase" }}>
            Scansiona QR Ordine
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>
            Inquadra il codice QR
          </div>
        </div>
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
      </div>

      {/* Camera area */}
      <div id="qr-reader" ref={containerRef} style={{
        flex: 1, width: "100%", height: "100%", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center"
      }} />

      {/* Errore */}
      {error && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 14, padding: 24, textAlign: "center", color: "#fff", zIndex: 20
        }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{error}</div>
          <button onClick={handleClose} style={{
            padding: "12px 24px", background: "#28A0A0", color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 13
          }}>Chiudi</button>
        </div>
      )}

      {/* Hint bottom */}
      <div style={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        textAlign: "center", color: "rgba(255,255,255,0.85)",
        fontSize: 12, padding: "0 32px", zIndex: 10
      }}>
        Il QR e stampato sul DDT o sull'etichetta del pacco.<br />
        Anche il fornitore puo scansionarlo per aggiornare lo stato.
      </div>
    </div>
  );
}
