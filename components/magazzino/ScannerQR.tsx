"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const GREEN = "#0F6E56";
const AMBER = "#E8B05C";
const MUTED = "#5C6B7A";

type Mode = "carico" | "preleva" | "sposta" | "restit";

interface Props {
  mag: any;
  onBack: () => void;
}

export default function ScannerQR({ mag, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("carico");
  const [scanned, setScanned] = useState<any | null>(null);
  const [qta, setQta] = useState(1);
  const [destinazione, setDestinazione] = useState<string>("");
  const [commesse, setCommesse] = useState<Array<{ id: string; code: string; cliente: string }>>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [lastCode, setLastCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Carica commesse per preleva
  useEffect(() => {
    supabase.from("commesse").select("id, code, cliente")
      .in("fase", ["confermata", "acconto_pagato", "ordine", "produzione"])
      .order("code", { ascending: false }).limit(30)
      .then(({ data }) => setCommesse((data || []) as any));
  }, []);

  // Avvia scanner reale con zxing
  useEffect(() => {
    if (!scanning || scanned) {
      stopScanner();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Dynamic import per evitare crash SSR
        const ZXing = await import("@zxing/library").catch(() => null);
        if (!ZXing) {
          // Fallback se libreria non disponibile
          setScanError("Libreria scanner non disponibile. Usa ricerca manuale.");
          return;
        }

        const { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } = ZXing;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.DATA_MATRIX,
        ]);

        const reader = new BrowserMultiFormatReader(hints);
        codeReaderRef.current = reader;

        if (cancelled) return;

        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result: any, err: any) => {
            if (result && !cancelled) {
              const code = result.getText();
              setLastCode(code);
              handleCodeScanned(code);
            }
          }
        );
      } catch (e: any) {
        if (!cancelled) {
          setScanError(e.message || "Errore avvio camera");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [scanning, scanned]);

  const stopScanner = useCallback(() => {
    if (codeReaderRef.current) {
      try { codeReaderRef.current.reset(); } catch {}
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleCodeScanned = (code: string) => {
    // Cerca articolo per: ean, qr_code, o codice esatto
    const trovato = mag.articoli.find((a: any) =>
      a.ean === code || a.qr_code === code || a.codice === code
    );
    if (trovato) {
      setScanned(trovato);
      setScanning(false);
      setScanError(null);
    } else {
      setScanError(`Codice "${code.substring(0, 20)}" non trovato in magazzino`);
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const ricercaManuale = (query: string) => {
    if (!query.trim()) return;
    const q = query.toLowerCase();
    const trovato = mag.articoli.find((a: any) =>
      a.codice?.toLowerCase().includes(q) ||
      a.nome?.toLowerCase().includes(q) ||
      a.ean === query
    );
    if (trovato) {
      setScanned(trovato);
      setScanning(false);
    } else {
      setScanError("Nessun articolo trovato");
    }
  };

  const conferma = async () => {
    if (!scanned) return;
    let r: any;
    if (mode === "carico") {
      r = await mag.carico(scanned.id, qta);
    } else if (mode === "preleva") {
      if (!destinazione) { setScanError("Scegli commessa"); return; }
      r = await mag.scaricoCommessa(scanned.id, destinazione, qta);
    } else if (mode === "sposta") {
      // Sposta = update scaffale
      const { error } = await supabase.from("articoli_magazzino")
        .update({ posizione_magazzino: destinazione })
        .eq("id", scanned.id);
      r = { ok: !error, error: error?.message };
    } else if (mode === "restit") {
      r = await mag.carico(scanned.id, qta, undefined, undefined, undefined, "Restituzione da cantiere/operatore");
    }

    if (r?.ok) {
      setDone(true);
      setTimeout(() => onBack(), 1500);
    } else {
      setScanError(r?.error || "Errore operazione");
    }
  };

  const resetScan = () => {
    setScanned(null);
    setQta(1);
    setDestinazione("");
    setDone(false);
    setScanError(null);
    setScanning(true);
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: TEAL, fontWeight: 800, textTransform: "uppercase" }}>Scanner</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>QR · barcode · EAN</div>
        </div>
        {scanned && (
          <button onClick={resetScan} style={{
            padding: "6px 11px", background: "rgba(255,255,255,0.1)", color: "#fff",
            border: "none", borderRadius: 7, fontSize: 10, fontWeight: 800,
            letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
          }}>RISCAN</button>
        )}
      </div>

      {/* Mode tabs */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ display: "flex", gap: 1, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: 2 }}>
          {(["carico", "preleva", "sposta", "restit"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); resetScan(); }} style={{
              flex: 1, padding: "8px 4px", fontSize: 10, fontWeight: 800,
              letterSpacing: 0.4, textTransform: "uppercase",
              color: mode === m ? NAVY : "rgba(255,255,255,0.5)",
              background: mode === m ? TEAL : "transparent",
              borderRadius: 8, border: "none", cursor: "pointer",
            }}>{m === "restit" ? "Restit." : m}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "0 14px", overflowY: "auto" }}>
        {scanError && (
          <div style={{
            background: "#FCE3E3", color: RED, padding: "9px 11px", borderRadius: 8,
            fontSize: 11.5, fontWeight: 700, marginBottom: 10,
            borderLeft: `3px solid ${RED}`,
          }}>{scanError}</div>
        )}

        {!scanned ? (
          <>
            {/* Camera */}
            <div style={{
              background: "#000", borderRadius: 12, aspectRatio: "1 / 1",
              position: "relative", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <video ref={videoRef} autoPlay playsInline muted style={{
                width: "100%", height: "100%", objectFit: "cover",
              }} />
              {/* Mirino */}
              <div style={{
                position: "absolute", inset: "20% 15%",
                border: `3px solid ${TEAL}`, borderRadius: 12,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                pointerEvents: "none",
              }}>
                <div style={{
                  position: "absolute", top: "50%", left: 0, right: 0, height: 2,
                  background: TEAL, animation: "scanLine 2s linear infinite",
                  boxShadow: `0 0 8px ${TEAL}`,
                }} />
              </div>
              {/* Last code */}
              {lastCode && (
                <div style={{
                  position: "absolute", bottom: 16, left: 16, right: 16,
                  background: "rgba(0,0,0,0.7)", color: "#fff",
                  padding: "6px 10px", borderRadius: 6,
                  fontSize: 10, fontFamily: "SF Mono, monospace",
                  textAlign: "center",
                }}>{lastCode.substring(0, 40)}</div>
              )}
            </div>

            {/* Ricerca manuale */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Oppure cerca manualmente
              </div>
              <input
                type="text"
                placeholder="Codice o nome articolo..."
                onKeyDown={(e) => { if (e.key === "Enter") ricercaManuale((e.target as HTMLInputElement).value); }}
                style={{
                  width: "100%", padding: "10px 12px",
                  background: "rgba(255,255,255,0.1)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
                  fontSize: 13, fontWeight: 600, outline: "none",
                }}
              />
            </div>
          </>
        ) : (
          /* Articolo scansionato */
          <div style={{
            background: "#fff", color: NAVY, borderRadius: 12, padding: 14,
          }}>
            <div style={{
              background: GREEN, color: "#fff", padding: "5px 10px",
              borderRadius: 6, fontSize: 10, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase",
              display: "inline-block", marginBottom: 8,
            }}>✓ Articolo riconosciuto</div>

            <div style={{ fontSize: 9.5, color: "#8794A6", fontFamily: "SF Mono, monospace", fontWeight: 700 }}>
              {scanned.codice}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 3 }}>{scanned.nome}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>
              Disp. <b style={{ color: NAVY }}>{scanned.scorta_attuale}</b> {scanned.unita_misura} ·
              {scanned.scaffale_codice ? ` scaff. ${scanned.scaffale_codice}` : " no scaff."}
            </div>

            {/* Stepper qta */}
            {(mode === "carico" || mode === "preleva" || mode === "restit") && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: MUTED, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Quantità
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  marginTop: 7, background: "#F7F9FB", borderRadius: 9, padding: 5,
                }}>
                  <button onClick={() => setQta(Math.max(1, qta - 1))} style={stpBtn}>−</button>
                  <input
                    type="number" value={qta}
                    onChange={(e) => setQta(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: NAVY,
                      border: "none", outline: "none", background: "transparent", padding: "8px 0",
                    }}
                  />
                  <button onClick={() => setQta(qta + 1)} style={stpBtn}>+</button>
                </div>
              </div>
            )}

            {/* Destinazione */}
            {mode === "preleva" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: MUTED, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Commessa destinazione
                </div>
                <select
                  value={destinazione}
                  onChange={(e) => setDestinazione(e.target.value)}
                  style={{
                    width: "100%", marginTop: 5, padding: 9,
                    border: "1px solid #D8DEE5", borderRadius: 7,
                    fontSize: 12, color: NAVY, fontWeight: 600, outline: "none",
                  }}
                >
                  <option value="">-- Scegli --</option>
                  {commesse.map(c => <option key={c.id} value={c.id}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
            )}

            {mode === "sposta" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: MUTED, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Nuova posizione
                </div>
                <input
                  type="text" value={destinazione}
                  onChange={(e) => setDestinazione(e.target.value)}
                  placeholder="es. A-01 o Furgone Doblò"
                  style={{
                    width: "100%", marginTop: 5, padding: 9,
                    border: "1px solid #D8DEE5", borderRadius: 7,
                    fontSize: 12, color: NAVY, fontWeight: 600, outline: "none",
                  }}
                />
              </div>
            )}

            {/* CTA */}
            <button onClick={conferma} disabled={done} style={{
              width: "100%", marginTop: 16, padding: 13,
              background: done ? GREEN : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
              color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 800,
              letterSpacing: 0.5, textTransform: "uppercase", border: "none",
              cursor: done ? "default" : "pointer",
            }}>
              {done ? "FATTO ✓" : `CONFERMA ${mode.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

const stpBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 7,
  background: NAVY, color: "#fff",
  fontSize: 20, fontWeight: 800,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer", flexShrink: 0,
};
