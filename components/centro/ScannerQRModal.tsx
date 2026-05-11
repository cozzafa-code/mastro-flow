"use client";
// components/centro/ScannerQRModal.tsx
// Scanner QR/Code128 con camera per check rapido articoli carico

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toggleVerificato, toggleCaricato, type CaricoArticolo } from "../../hooks/useFurgoni";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Props {
  caricoId: string;
  articoli: CaricoArticolo[];
  onClose: () => void;
  defaultAction?: 'verifica' | 'carica';
}

interface ScanResult {
  qr: string;
  articolo?: CaricoArticolo;
  status: 'ok' | 'not_found' | 'already_done';
  message: string;
  timestamp: number;
}

export default function ScannerQRModal({ caricoId, articoli, onClose, defaultAction = 'verifica' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);
  const lastScanRef = useRef<{ qr: string; ts: number }>({ qr: '', ts: 0 });
  const [action, setAction] = useState<'verifica' | 'carica'>(defaultAction);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zxingLoaded, setZxingLoaded] = useState(false);

  // Carica @zxing/browser dinamicamente via CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).ZXingBrowser) {
      setZxingLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@zxing/browser@0.1.4/umd/index.min.js';
    script.async = true;
    script.onload = () => setZxingLoaded(true);
    script.onerror = () => setCameraError('Impossibile caricare libreria scanner');
    document.head.appendChild(script);
  }, []);

  // Avvia camera quando libreria pronta
  useEffect(() => {
    if (!zxingLoaded || !videoRef.current) return;

    const ZXing = (window as any).ZXingBrowser;
    if (!ZXing) return;

    const codeReader = new ZXing.BrowserMultiFormatReader();
    scannerRef.current = codeReader;

    (async () => {
      try {
        // Usa camera posteriore se disponibile
        const devices = await ZXing.BrowserMultiFormatReader.listVideoInputDevices();
        const backCam = devices.find((d: any) => /back|rear|environment/i.test(d.label)) || devices[0];

        await codeReader.decodeFromVideoDevice(
          backCam?.deviceId,
          videoRef.current,
          (result: any, error: any) => {
            if (result) {
              const qr = result.getText();
              handleScan(qr);
            }
          }
        );
        setScanning(true);
      } catch (e: any) {
        console.warn('camera error', e);
        setCameraError(e?.message || 'Camera non accessibile - permessi negati?');
      }
    })();

    return () => {
      try { codeReader.reset(); } catch {}
    };
  }, [zxingLoaded]);

  function vibrate(ms: number | number[] = 100) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
  }

  function beep(freq: number = 880, dur: number = 100) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur / 1000);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur / 1000);
    } catch {}
  }

  async function handleScan(qr: string) {
    // Debounce: ignora stesso QR entro 2 secondi
    const now = Date.now();
    if (lastScanRef.current.qr === qr && (now - lastScanRef.current.ts) < 2000) return;
    lastScanRef.current = { qr, ts: now };

    const art = articoli.find(a => a.qr_code === qr);
    if (!art) {
      vibrate([100, 50, 100]);
      beep(220, 200);
      addResult({ qr, status: 'not_found', message: 'QR sconosciuto nel carico', timestamp: now });
      return;
    }

    // Già fatto?
    const alreadyDone = action === 'verifica' ? art.verificato : art.caricato;
    if (alreadyDone) {
      vibrate(50);
      beep(440, 80);
      addResult({ 
        qr, articolo: art, status: 'already_done',
        message: `Già ${action === 'verifica' ? 'verificato' : 'caricato'}`,
        timestamp: now,
      });
      return;
    }

    // Esegui azione
    if (action === 'verifica') {
      await toggleVerificato(art.id, true);
    } else {
      // Per caricare, deve essere già verificato; se no, verifico anche
      if (!art.verificato) await toggleVerificato(art.id, true);
      await toggleCaricato(art.id, true);
    }

    vibrate(150);
    beep(880, 100);
    addResult({
      qr, articolo: art, status: 'ok',
      message: `${action === 'verifica' ? 'Verificato' : 'Caricato'} ✓`,
      timestamp: now,
    });
  }

  function addResult(r: ScanResult) {
    setResults(prev => [r, ...prev].slice(0, 8));
  }

  const stats = {
    ok: results.filter(r => r.status === 'ok').length,
    duplicati: results.filter(r => r.status === 'already_done').length,
    sconosciuti: results.filter(r => r.status === 'not_found').length,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <div style={{ background: 'rgba(15,27,45,0.95)', color: '#fff', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>📷 SCANNER QR / CODE128</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Scan {action === 'verifica' ? 'VERIFICA' : 'CARICO'}</div>
        </div>
        {/* Toggle azione */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.15)', padding: 3, borderRadius: 8 }}>
          <button onClick={() => setAction('verifica')} style={{
            padding: '6px 10px', fontSize: 10, fontWeight: 800,
            color: action === 'verifica' ? NAVY : '#fff',
            background: action === 'verifica' ? '#fff' : 'transparent',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}>✓ VERIFICA</button>
          <button onClick={() => setAction('carica')} style={{
            padding: '6px 10px', fontSize: 10, fontWeight: 800,
            color: action === 'carica' ? NAVY : '#fff',
            background: action === 'carica' ? '#fff' : 'transparent',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}>🚛 CARICO</button>
        </div>
      </div>

      {/* CAMERA */}
      <div style={{ position: 'relative' as const, flex: 1, background: '#000', overflow: 'hidden' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cameraError ? (
          <div style={{ color: '#fff', textAlign: 'center' as const, padding: 30 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>📷</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Camera non disponibile</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{cameraError}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>
              Verifica permessi browser per camera, oppure usa i pulsanti enormi manualmente
            </div>
          </div>
        ) : !zxingLoaded ? (
          <div style={{ color: '#fff', textAlign: 'center' as const }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 13 }}>Caricamento scanner...</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} playsInline muted autoPlay />
            {/* Box di scan animato */}
            <div style={{
              position: 'absolute' as const, top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '70vw', maxWidth: 280, aspectRatio: '1',
              border: `3px solid ${TEAL}`, borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              pointerEvents: 'none' as const,
            }}>
              {/* Angoli */}
              {[
                { top: -3, left: -3, br: '16px 0 0 0' },
                { top: -3, right: -3, br: '0 16px 0 0' },
                { bottom: -3, left: -3, br: '0 0 0 16px' },
                { bottom: -3, right: -3, br: '0 0 16px 0' },
              ].map((p, i) => (
                <div key={i} style={{
                  position: 'absolute' as const, width: 40, height: 40,
                  borderTop: p.top !== undefined ? `6px solid ${TEAL}` : 'none',
                  borderBottom: p.bottom !== undefined ? `6px solid ${TEAL}` : 'none',
                  borderLeft: p.left !== undefined ? `6px solid ${TEAL}` : 'none',
                  borderRight: p.right !== undefined ? `6px solid ${TEAL}` : 'none',
                  ...p,
                }} />
              ))}
              {/* Linea scan animata */}
              <div style={{
                position: 'absolute' as const, left: 0, right: 0, top: '50%',
                height: 2, background: `linear-gradient(90deg, transparent, ${TEAL}, transparent)`,
                animation: 'scanLine 2s ease-in-out infinite',
              }} />
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scanLine {
                0% { transform: translateY(-120px); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(120px); opacity: 0; }
              }
            `}} />

            {/* Istruzioni */}
            <div style={{
              position: 'absolute' as const, top: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)', color: '#fff',
              padding: '8px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              whiteSpace: 'nowrap' as const,
            }}>
              📐 Inquadra QR articolo
            </div>
          </>
        )}
      </div>

      {/* STATS + RESULTS */}
      <div style={{ background: '#fff', maxHeight: '40vh', overflowY: 'auto' as const }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: 8, gap: 6 }}>
          <StatScan icon="✓" label="OK" val={stats.ok} color={TEAL_DEEP} />
          <StatScan icon="↻" label="GIÀ FATTI" val={stats.duplicati} color={AMBER} />
          <StatScan icon="?" label="SCONOSCIUTI" val={stats.sconosciuti} color={RED} />
        </div>

        {/* Risultati recenti */}
        {results.length > 0 && (
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 5, fontWeight: 700 }}>ULTIMI SCAN</div>
            {results.map(r => {
              const col = r.status === 'ok' ? TEAL_DEEP : r.status === 'already_done' ? AMBER : RED;
              const bg = r.status === 'ok' ? '#E1F5EE' : r.status === 'already_done' ? '#FEF3C7' : '#FEE2E2';
              const icon = r.status === 'ok' ? '✓' : r.status === 'already_done' ? '↻' : '✕';
              return (
                <div key={r.timestamp} style={{ background: bg, borderLeft: `4px solid ${col}`, padding: '7px 10px', borderRadius: 6, marginBottom: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: col, width: 22, textAlign: 'center' as const }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{r.articolo?.articolo_descrizione || r.qr}</div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{r.message} · {new Date(r.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatScan({ icon, label, val, color }: any) {
  return (
    <div style={{ background: '#F8FAFA', padding: '8px 6px', borderRadius: 8, textAlign: 'center' as const }}>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{icon} {val}</div>
      <div style={{ fontSize: 8, color, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
}
