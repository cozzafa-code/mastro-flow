// components/mobile/team/TeamMapMobile.tsx
// FASE 5C - Mappa con GPS reali da gps_snapshots
"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { Operator } from "@/lib/types/team";
import { getUltimePosizioniGPS, type GPSSnapshot } from "@/lib/team-actions";
import { TOKENS, MiniAppCard, MiniListRow, MiniBadge } from "@/components/widgets/MiniAppCard";
import { IconUsers, IconPin, IconNav } from "@/components/widgets/shared/icons";

interface Props {
  operators: Operator[];
  onBack: () => void;
  onOpenOperator?: (op: Operator) => void;
}

const PAGE_BG = "#F4F1EA";

function MiniAvatar({ url, name, size }: { url?: string; name: string; size: number }) {
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, background: "#fff" }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: "linear-gradient(135deg,#94A3B8,#64748B)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700,
    }}>{name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}</div>
  );
}

function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { col: TOKENS.mintBar,  bg: TOKENS.mint,  fg: TOKENS.mintInk,  text: "Attivo" };
    case "pausa":    return { col: TOKENS.amberBar, bg: TOKENS.amber, fg: TOKENS.amberInk, text: "Pausa" };
    case "problema": return { col: TOKENS.redBar,   bg: TOKENS.red,   fg: TOKENS.redInk,   text: "Problema" };
    case "viaggio":  return { col: TOKENS.skyBar,   bg: TOKENS.sky,   fg: TOKENS.skyInk,   text: "Viaggio" };
    default:         return { col: "#9CA3AF",       bg: TOKENS.hairlineSoft, fg: TOKENS.muted, text: "Offline" };
  }
}

function tempoTrascorso(fromIso: string | null): string {
  if (!fromIso) return "";
  const ms = Date.now() - new Date(fromIso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m}m fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

export default function TeamMapMobile({ operators, onBack, onOpenOperator }: Props) {
  const [posizioni, setPosizioni] = useState<Record<string, GPSSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGps = useCallback(async () => {
    try {
      setError(null);
      const map = await getUltimePosizioniGPS();
      setPosizioni(map);
    } catch (e: any) {
      setError(e?.message || "errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGps();
    const t = setInterval(fetchGps, 60000);
    return () => clearInterval(t);
  }, [fetchGps]);

  const { minLat, maxLat, minLng, maxLng, hasData } = useMemo(() => {
    const points = Object.values(posizioni);
    if (points.length === 0) {
      return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0, hasData: false };
    }
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const padLat = Math.max(0.005, (Math.max(...lats) - Math.min(...lats)) * 0.15);
    const padLng = Math.max(0.005, (Math.max(...lngs) - Math.min(...lngs)) * 0.15);
    return {
      minLat: Math.min(...lats) - padLat,
      maxLat: Math.max(...lats) + padLat,
      minLng: Math.min(...lngs) - padLng,
      maxLng: Math.max(...lngs) + padLng,
      hasData: true,
    };
  }, [posizioni]);

  function project(lat: number, lng: number): { x: number; y: number } {
    if (!hasData) return { x: 50, y: 50 };
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  }

  const tracked = operators.filter(op => posizioni[op.id]);
  const untracked = operators.filter(op => !posizioni[op.id]);
  const onlineCount = tracked.filter(op => op.status === "attivo" || op.status === "pausa" || op.status === "viaggio").length;

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", paddingBottom: 100, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{
        background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)",
        padding: "14px 16px 18px", color: "#FFF",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4, fontSize: 22, lineHeight: 1 }}>←</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Mappa team</div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
            {tracked.length}/{operators.length} tracciati · {onlineCount} attivi
          </div>
        </div>
        <div onClick={fetchGps} style={{
          width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
      </div>

      <div style={{
        position: "relative", margin: "12px 14px 0",
        height: 280,
        background: hasData ? "#E8F0E8" : "#F1F5F9",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: TOKENS.muted, fontSize: 13 }}>
            Caricamento posizioni...
          </div>
        )}

        {!loading && !hasData && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" as any, alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" as any }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: TOKENS.tealLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <IconPin size={26} color={TOKENS.teal} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TOKENS.ink, marginBottom: 6 }}>Nessun GPS attivo</div>
            <div style={{ fontSize: 12, color: TOKENS.muted, lineHeight: 1.4, maxWidth: 280 }}>
              Le posizioni appaiono qui quando gli operatori condividono il GPS dall'app mobile pronto-vendita.
            </div>
          </div>
        )}

        {!loading && hasData && (
          <>
            <svg viewBox="0 0 400 280" width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern id="teamMapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4E7DC" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="400" height="280" fill="url(#teamMapGrid)"/>
              <path d="M0 100 L400 110" stroke="#FFFFFF" strokeWidth="14" opacity="0.6"/>
              <path d="M0 180 L400 170" stroke="#FFFFFF" strokeWidth="10" opacity="0.6"/>
              <path d="M120 0 L100 280" stroke="#FFFFFF" strokeWidth="12" opacity="0.6"/>
            </svg>

            {tracked.map(op => {
              const gps = posizioni[op.id];
              const { x, y } = project(gps.lat, gps.lng);
              const s = statusInfo(op.status);
              return (
                <div
                  key={op.id}
                  onClick={() => onOpenOperator?.(op)}
                  style={{
                    position: "absolute",
                    left: `${x}%`, top: `${y}%`,
                    transform: "translate(-50%, -100%)",
                    cursor: "pointer", zIndex: 2,
                  }}
                >
                  {op.status === "attivo" && (
                    <div style={{
                      position: "absolute", left: "50%", top: "100%",
                      transform: "translate(-50%, -50%)",
                      width: 38, height: 38, borderRadius: 999,
                      background: s.col, opacity: 0.25,
                      animation: "teamMapPulse 2s ease-in-out infinite",
                    }} />
                  )}
                  <div style={{
                    background: "#FFF",
                    padding: 3,
                    borderRadius: 999,
                    border: `3px solid ${s.col}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    position: "relative" as any,
                  }}>
                    <MiniAvatar url={op.avatar_url} name={op.name} size={28} />
                  </div>
                  <div style={{
                    position: "absolute", left: "50%", top: "100%",
                    transform: "translate(-50%, -3px)",
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `8px solid ${s.col}`,
                  }} />
                </div>
              );
            })}

            <style>{`
              @keyframes teamMapPulse {
                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.25; }
                50% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
              }
            `}</style>
          </>
        )}
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column" as any, gap: 12 }}>
        {error && (
          <div style={{ background: TOKENS.red, color: TOKENS.redInk, padding: 12, borderRadius: 12, fontSize: 12 }}>
            Errore caricamento GPS: {error}
          </div>
        )}

        {tracked.length > 0 && (
          <MiniAppCard
            icon={<IconNav size={14} color={TOKENS.teal} />}
            title="Posizioni attive"
            subtitle={`${tracked.length} operatori tracciati`}
            heroVariant="none"
          >
            {tracked.map((op, i) => {
              const gps = posizioni[op.id];
              const s = statusInfo(op.status);
              return (
                <MiniListRow
                  key={op.id}
                  isFirst={i === 0}
                  leading={<MiniAvatar url={op.avatar_url} name={op.name} size={32} />}
                  bar={s.col}
                  title={op.name}
                  subtitle={`${s.text}${op.current_job ? ` · ${op.current_job}` : ""} · GPS ${tempoTrascorso(gps.pingato_at)}${gps.batteria_percent != null ? ` · ${gps.batteria_percent}%` : ""}`}
                  trailing={<MiniBadge label={s.text.toUpperCase()} bg={s.bg} fg={s.fg} />}
                  onClick={() => onOpenOperator?.(op)}
                />
              );
            })}
          </MiniAppCard>
        )}

        {untracked.length > 0 && (
          <MiniAppCard
            icon={<IconUsers size={14} color={TOKENS.muted} />}
            iconBg={TOKENS.hairlineSoft}
            iconColor={TOKENS.muted}
            title="Senza GPS"
            subtitle={`${untracked.length} operatori non condividono la posizione`}
            heroVariant="none"
          >
            {untracked.map((op, i) => {
              const s = statusInfo(op.status);
              return (
                <MiniListRow
                  key={op.id}
                  isFirst={i === 0}
                  leading={<MiniAvatar url={op.avatar_url} name={op.name} size={32} />}
                  bar="#9CA3AF"
                  title={op.name}
                  subtitle={`${s.text}${op.current_job ? ` · ${op.current_job}` : ""}`}
                  trailing={<MiniBadge label="NO GPS" bg={TOKENS.hairlineSoft} fg={TOKENS.muted} />}
                  onClick={() => onOpenOperator?.(op)}
                />
              );
            })}
          </MiniAppCard>
        )}
      </div>
    </div>
  );
}
