"use client";
// MASTRO CODICI - Scanner camera fullscreen
// Usa BarcodeDetector API nativa (Chrome/Edge desktop+mobile, Safari iOS 17+)
// Fallback: input manuale del codice short
import * as React from "react";

const C = {
  ink: "#0A1628",
  red: "#DC2626",
  green: "#10B981",
  amber: "#F59E0B",
};

interface Props {
  onClose: () => void;
  onResult: (short: string) => void;
}

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export default function ScannerOverlay({ onClose, onResult }: Props) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const detectorRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);

  const [status, setStatus] = React.useState<"loading" | "scanning" | "denied" | "unsupported" | "manual">("loading");
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [manualCode, setManualCode] = React.useState("");
  const [lastDetected, setLastDetected] = React.useState<string | null>(null);

  // Estrai short dal valore scansionato
  // Supporta: short diretto (es. "AB12CD"), URL completo (https://.../c/AB12CD), o JSON {short: "..."}
  const extractShort = (raw: string): string | null => {
    const trim = raw.trim();
    if (!trim) return null;
    // Match URL /c/SHORT
    const urlMatch = trim.match(/\/c\/([A-Za-z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    // JSON
    try {
      const j = JSON.parse(trim);
      if (j && typeof j.short === "string") return j.short;
    } catch {}
    // Plain short (alfanumerico 4-12 char)
    if (/^[A-Za-z0-9]{4,16}$/.test(trim)) return trim;
    return null;
  };

  const stopCamera = React.useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!window.BarcodeDetector) {
      setStatus("unsupported");
      return;
    }
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      const wanted = ["qr_code", "code_128", "code_39", "data_matrix", "ean_13"].filter(f => formats.includes(f));
      detectorRef.current = new window.BarcodeDetector({ formats: wanted });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("scanning");
      scanLoop();
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setStatus("unsupported");
      }
      setErrorMsg(e?.message || "Errore avvio scanner");
    }
  }, []);

  const scanLoop = React.useCallback(async () => {
    if (!videoRef.current || !detectorRef.current || !streamRef.current) return;
    try {
      const codes = await detectorRef.current.detect(videoRef.current);
      if (codes && codes.length > 0) {
        const raw = codes[0].rawValue || "";
        const short = extractShort(raw);
        if (short) {
          setLastDetected(short);
          stopCamera();
          // Piccolo delay per feedback visivo
          setTimeout(() => onResult(short), 350);
          return;
        }
      }
    } catch {}
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [stopCamera, onResult]);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleManualSubmit = () => {
    const short = extractShort(manualCode);
    if (!short) {
      setErrorMsg("Codice non valido");
      return;
    }
    onResult(short);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000",
      zIndex: 10000,
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 10,
      }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
          Scanner codici
        </div>
        <button
          onClick={handleClose}
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.15)", border: "none",
            cursor: "pointer", color: "#fff", fontSize: 22, fontWeight: 700,
          }}
        >×</button>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
        {(status === "loading" || status === "scanning") && (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Mirino */}
        {status === "scanning" && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <div style={{
                width: "min(70vw, 320px)", height: "min(70vw, 320px)",
                border: `3px solid ${lastDetected ? C.green : "#fff"}`,
                borderRadius: 18,
                boxShadow: lastDetected
                  ? `0 0 0 9999px rgba(16,185,129,0.3), 0 0 30px ${C.green}`
                  : "0 0 0 9999px rgba(0,0,0,0.5)",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                {/* Scanline animata */}
                {!lastDetected && (
                  <div style={{
                    width: "100%", height: 2,
                    background: "linear-gradient(90deg, transparent, #10B981, transparent)",
                    animation: "scanLine 2s ease-in-out infinite",
                    marginTop: 4,
                  }} />
                )}
              </div>
            </div>
            <style>{`
              @keyframes scanLine {
                0%, 100% { transform: translateY(0); opacity: 0.6; }
                50% { transform: translateY(min(60vw, 280px)); opacity: 1; }
              }
            `}</style>
            <div style={{
              position: "absolute", bottom: 100, left: 0, right: 0,
              textAlign: "center", color: "#fff",
              fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
              textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            }}>
              {lastDetected ? `✓ ${lastDetected}` : "Inquadra un QR o Code128"}
            </div>
          </>
        )}

        {status === "loading" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, fontWeight: 700,
          }}>
            Avvio fotocamera...
          </div>
        )}

        {(status === "denied" || status === "unsupported" || status === "manual") && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 30, background: "#0A1628",
          }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>
              {status === "denied" ? "🚫" : status === "unsupported" ? "📷" : "⌨️"}
            </div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>
              {status === "denied" && "Permesso fotocamera negato"}
              {status === "unsupported" && "Scanner non disponibile"}
              {status === "manual" && "Inserimento manuale"}
            </div>
            <div style={{ color: "#94A3B8", fontSize: 13, fontWeight: 600, textAlign: "center", marginBottom: 20, maxWidth: 320, lineHeight: 1.5 }}>
              {status === "denied" && "Concedi l'accesso alla fotocamera nelle impostazioni del browser, oppure inserisci il codice manualmente."}
              {status === "unsupported" && "Il browser non supporta la scansione automatica. Inserisci il codice manualmente."}
              {status === "manual" && "Digita o incolla il codice short del QR/barcode."}
            </div>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setErrorMsg(""); }}
              placeholder="es. AB12CD"
              autoFocus
              style={{
                width: "100%", maxWidth: 320,
                padding: "12px 16px",
                background: "#1E3A5F", color: "#fff",
                border: "1px solid #2C4A75", borderRadius: 10,
                fontSize: 16, fontWeight: 700, letterSpacing: 1,
                textAlign: "center", outline: "none",
                fontFamily: "monospace",
                marginBottom: 10,
                textTransform: "uppercase",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); }}
            />
            {errorMsg && (
              <div style={{ color: C.red, fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                ⚠ {errorMsg}
              </div>
            )}
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
              style={{
                width: "100%", maxWidth: 320,
                padding: "12px 20px",
                background: manualCode.trim() ? "#10B981" : "#475569",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 800,
                cursor: manualCode.trim() ? "pointer" : "not-allowed",
                letterSpacing: 0.4,
              }}
            >Cerca codice</button>
          </div>
        )}
      </div>

      {/* Footer azioni */}
      {status === "scanning" && (
        <div style={{
          padding: "14px 20px",
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(10px)",
          display: "flex", justifyContent: "center", gap: 10,
        }}>
          <button
            onClick={() => { stopCamera(); setStatus("manual"); }}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.15)", color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              letterSpacing: 0.4,
            }}
          >⌨️ Inserisci manualmente</button>
        </div>
      )}
    </div>
  );
}
