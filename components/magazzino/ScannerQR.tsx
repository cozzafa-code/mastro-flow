"use client";
import React, { useState, useRef, useEffect } from "react";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const RED = "#C73E1D";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

type Mode = "carico" | "preleva" | "sposta" | "restit";

interface Props {
  mag: any;
  onBack: () => void;
}

export default function ScannerQR({ mag, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("carico");
  const [scanned, setScanned] = useState<any | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qta, setQta] = useState(1);
  const [destinazione, setDestinazione] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attiva camera (in produzione: usa @zxing/library per parsing QR)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!scanned) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => { /* permesso negato */ });
    }
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [scanned]);

  // Simulazione scan: in produzione, listener su parsing QR
  const simulaScan = () => {
    const first = mag.articoli[0];
    if (first) {
      setScanned(first);
      setStep(2);
    }
  };

  const conferma = async () => {
    if (!scanned) return;
    if (mode === "carico") {
      await mag.carico(scanned.id, qta);
    }
    // Altri mode: scarico, sposta, restit
    setStep(3);
    setTimeout(() => onBack(), 1500);
  };

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: NAVY_DEEP, color: "#fff",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BackIcon />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: TEAL, fontWeight: 800, textTransform: "uppercase" }}>Scanner</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>QR · barcode · seriale</div>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{
          display: "flex", gap: 1, background: "rgba(255,255,255,0.1)",
          borderRadius: 10, padding: 2,
        }}>
          <ModeTab label="Carico" active={mode === "carico"} onClick={() => setMode("carico")} />
          <ModeTab label="Preleva" active={mode === "preleva"} onClick={() => setMode("preleva")} />
          <ModeTab label="Sposta" active={mode === "sposta"} onClick={() => setMode("sposta")} />
          <ModeTab label="Restit." active={mode === "restit"} onClick={() => setMode("restit")} />
        </div>
      </div>

      {/* Camera o articolo */}
      <div style={{ flex: 1, padding: "0 14px", overflowY: "auto" }}>
        {!scanned ? (
          <div style={{
            background: "#000", borderRadius: 12, aspectRatio: "1 / 1",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <video ref={videoRef} autoPlay playsInline muted style={{
              width: "100%", height: "100%", objectFit: "cover",
            }} />
            {/* Cornice mirino */}
            <div style={{
              position: "absolute", inset: "20% 15%",
              border: `3px solid ${TEAL}`, borderRadius: 12,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
            }}>
              <div style={{
                position: "absolute", top: "50%", left: 0, right: 0, height: 2,
                background: TEAL, animation: "scanLine 2s linear infinite",
              }} />
            </div>
            <button onClick={simulaScan} style={{
              position: "absolute", bottom: 20, left: "50%",
              transform: "translateX(-50%)",
              padding: "10px 18px", background: TEAL, color: "#fff",
              borderRadius: 99, fontSize: 11, fontWeight: 800,
              letterSpacing: 0.4, textTransform: "uppercase", border: "none", cursor: "pointer",
            }}>SIMULA SCAN</button>
          </div>
        ) : (
          <div style={{
            background: "#fff", color: NAVY, borderRadius: 12, padding: 14,
          }}>
            <div style={{ fontSize: 9.5, color: "#8794A6", fontFamily: "SF Mono, monospace", fontWeight: 700 }}>
              {scanned.codice}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{scanned.nome}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
              Disp. <b style={{ color: NAVY }}>{scanned.scorta_attuale}</b> {scanned.unita_misura} ·
              {scanned.scaffale_codice ? ` scaff. ${scanned.scaffale_codice}` : " no scaff."}
            </div>

            {/* Stepper qta */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: MUTED, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Quantità
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 9,
                marginTop: 7, background: "#F7F9FB", borderRadius: 9, padding: 5,
              }}>
                <button onClick={() => setQta(Math.max(1, qta - 1))} style={stpBtn}>−</button>
                <div style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: NAVY }}>{qta}</div>
                <button onClick={() => setQta(qta + 1)} style={stpBtn}>+</button>
              </div>
            </div>

            {/* Destinazione */}
            {(mode === "preleva" || mode === "sposta") && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: MUTED, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  {mode === "preleva" ? "Commessa" : "Destinazione"}
                </div>
                <input
                  type="text"
                  value={destinazione}
                  onChange={(e) => setDestinazione(e.target.value)}
                  placeholder={mode === "preleva" ? "S-0062" : "Furgone Doblò"}
                  style={{
                    width: "100%", marginTop: 5, padding: 9,
                    border: "1px solid #D8DEE5", borderRadius: 7,
                    fontSize: 12, color: NAVY, fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>
            )}

            {/* CTA */}
            <button onClick={conferma} style={{
              width: "100%", marginTop: 14, padding: 12,
              background: step === 3 ? GREEN : `linear-gradient(180deg, ${TEAL}, #1a6b6b)`,
              color: "#fff", borderRadius: 9, fontSize: 12, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase", border: "none", cursor: "pointer",
            }}>
              {step === 3 ? "FATTO!" : "CONFERMA"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 800,
      letterSpacing: 0.4, textTransform: "uppercase",
      color: active ? NAVY : "rgba(255,255,255,0.5)",
      background: active ? TEAL : "transparent",
      borderRadius: 8, border: "none", cursor: "pointer",
    }}>{label}</button>
  );
}

const stpBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 7,
  background: NAVY, color: "#fff",
  fontSize: 20, fontWeight: 800,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
};

const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
