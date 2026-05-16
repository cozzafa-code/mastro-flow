"use client";
import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   GestureNav v2 — sistema navigazione swipe MASTRO (fix back-swipe)
   ═══════════════════════════════════════════════════════════════ */

const TEAL = "#1E3A5F";
const TEAL_DARK = "#0F1B2D";
const DARK = "#0D1F1F";
const WHITE = "#FFFFFF";

const EDGE_ZONE = 32;
const BOTTOM_ZONE = 32;
const ACTIVATION_DIST = 30;
const SELECT_DIST = 70;

type Voice = { id: string; label: string; badge?: number; icon: React.ReactNode; onLongPress?: () => void; hint?: string };

interface Props {
  tab: string;
  setTab: (id: string) => void;
  setSelectedCM: (cm: any) => void;
  msgs?: any[];
  onNuovaCommessa?: () => void;
  onNuovoEvento?: () => void;
  onQuickCommessa?: () => void;
  onQuickEvento?: () => void;
  onQuickSpesa?: () => void;
  onQuickNota?: () => void;
  onNuovaSpesa?: () => void;
  onNuovaNota?: () => void;
}

const IC = {
  home: <><path d="M3 9l11-6 11 6v13l-11 6L3 22V9z"/><path d="M14 3v19M3 9l11 6 11-6"/></>,
  agenda: <><rect x="3" y="4" width="22" height="20" rx="2"/><line x1="3" y1="10" x2="25" y2="10"/><line x1="9" y1="4" x2="9" y2="10"/><line x1="19" y1="4" x2="19" y2="10"/></>,
  ai: <><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>,
  commesse: <><rect x="5" y="3" width="18" height="22" rx="2"/><line x1="9" y1="13" x2="19" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
  talk: <><path d="M4 6h16a2 2 0 012 2v9a2 2 0 01-2 2H4L2 22V8a2 2 0 012-2z"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  altro: <><circle cx="7" cy="14" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="21" cy="14" r="2"/></>,
  folder: <><path d="M3 7a2 2 0 012-2h5l2 2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></>,
  calendar: <><rect x="4" y="5" width="20" height="18" rx="2"/><line x1="4" y1="10" x2="24" y2="10"/></>,
  euro: <><path d="M20 7.5A8 8 0 108 22"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="16" x2="12" y2="16"/></>,
  note: <><path d="M6 3h12a2 2 0 012 2v18l-8-4-8 4V5a2 2 0 012-2z"/></>,
};

const iconSvg = (path: React.ReactNode, size = 22, color = WHITE) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color}
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);


// ─── ActionTile: bottone action sheet con long-press ────────────────
function ActionTile({ action, TEAL, TEAL_DARK, DARK, WHITE, iconSvg }: any) {
  const [pressing, setPressing] = React.useState(false);
  const [fired, setFired] = React.useState(false);
  const tmr = React.useRef<any>(null);

  const onStart = () => {
    setPressing(true);
    setFired(false);
    if (tmr.current) clearTimeout(tmr.current);
    tmr.current = setTimeout(() => {
      setFired(true);
      try { if ("vibrate" in navigator) (navigator as any).vibrate([30, 40, 60]); } catch(e) {}
      if (action.onLongPress) action.onLongPress();
      setTimeout(() => { setPressing(false); setFired(false); }, 200);
    }, 350);
  };

  const onCancel = () => {
    setPressing(false);
    if (tmr.current) { clearTimeout(tmr.current); tmr.current = null; }
  };

  const onClick = () => {
    if (fired) { setFired(false); return; }
    if (action.onClick) action.onClick();
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={onStart}
      onTouchEnd={onCancel}
      onTouchMove={onCancel}
      onTouchCancel={onCancel}
      onMouseDown={onStart}
      onMouseUp={onCancel}
      onMouseLeave={onCancel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        padding: "18px 10px", borderRadius: 14,
        background: fired
          ? `linear-gradient(145deg, ${TEAL}, ${TEAL_DARK})`
          : pressing
            ? "linear-gradient(145deg, #DDEFEF, #BDE0E0)"
            : "linear-gradient(145deg, #EEF8F8, #DDEFEF)",
        border: `1px solid ${pressing ? TEAL : "#C8E4E4"}`,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transform: fired ? "scale(0.94)" : pressing ? "scale(1.04)" : "scale(1)",
        boxShadow: pressing ? `0 8px 22px ${TEAL}55` : "none",
        transition: "transform 0.12s, box-shadow 0.12s, background 0.12s",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      } as any}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: fired ? `linear-gradient(145deg, ${WHITE}, ${WHITE})` : `linear-gradient(145deg, ${TEAL}, ${TEAL_DARK})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: pressing ? `0 6px 14px ${TEAL}70` : `0 4px 10px ${TEAL}40`,
        transition: "all 0.15s",
      }}>{iconSvg(action.icon, 20, fired ? TEAL_DARK : WHITE)}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: fired ? WHITE : DARK }}>
        {fired ? "Creato!" : action.label}
      </div>
      {action.hint && !pressing && (
        <div style={{ fontSize: 9, fontWeight: 600, color: "#8FA8A8", letterSpacing: "0.2px", marginTop: -4 }}>
          {action.hint}
        </div>
      )}
    </button>
  );
}

export default function GestureNav({ tab, setTab, setSelectedCM, msgs = [], onNuovaCommessa, onNuovoEvento, onNuovaSpesa, onNuovaNota, onQuickCommessa, onQuickEvento, onQuickSpesa, onQuickNota }: Props) {

  const [menuSide, setMenuSide] = useState<"right" | "left" | null>(null);
  const [touchX, setTouchX] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [actionSheet, setActionSheet] = useState(false);
  const [hintOn, setHintOn] = useState(true);
  const [holdVoice, setHoldVoice] = useState<string | null>(null);
  const [holdFired, setHoldFired] = useState<string | null>(null);
  const holdTimerRef = useRef<any>(null);
  const holdVoiceRef = useRef<string | null>(null);
  const holdFiredRef = useRef<string | null>(null);
  const nearestIdRef = useRef<string | null>(null);

  const startRef = useRef<{ x: number; y: number; side: "right" | "left" | "bottom" | null }>({ x: 0, y: 0, side: null });
  const zoneRightRef = useRef<HTMLDivElement>(null);
  const zoneLeftRef = useRef<HTMLDivElement>(null);
  const zoneBottomRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ menuSide: null as "right"|"left"|null, actionSheet: false, tx: 0, ty: 0, voices: [] as Voice[] });
  const lpTimerRef = useRef<any>(null);
  const lpFiredRef = useRef<boolean>(false);

  useEffect(() => { const t = setTimeout(() => setHintOn(false), 6000); return () => clearTimeout(t); }, []);

  const unreadMsg = (msgs || []).filter((m: any) => !m.letto).length;
  const voices: Voice[] = [
    { id: "ai", label: "MASTRO AI", icon: iconSvg(IC.ai) },
    { id: "home", label: "Home", icon: iconSvg(IC.home) },
    { id: "commesse", label: "Commesse", icon: iconSvg(IC.commesse) },
    { id: "agenda", label: "Agenda", icon: iconSvg(IC.agenda) },
    { id: "messaggi", label: unreadMsg > 0 ? `Chat · ${unreadMsg}` : "Chat", badge: unreadMsg, icon: iconSvg(IC.talk) },
    { id: "montaggi_cal", label: "Montaggi", icon: iconSvg(IC.montaggi) },
    { id: "clienti", label: "Clienti", icon: iconSvg(IC.clienti) },
    { id: "altro", label: "Altro", icon: iconSvg(IC.altro) },
  ];
  stateRef.current.voices = voices;

  // Mappa voice.id → quick handler (crea veloce)
  const quickHandlers: Record<string, (() => void) | undefined> = {
    ai: undefined,
    home: undefined,
    commesse: onQuickCommessa,
    agenda: onQuickEvento,
    messaggi: undefined,
    altro: undefined,
  };


  useEffect(() => { stateRef.current.menuSide = menuSide; }, [menuSide]);
  useEffect(() => { stateRef.current.actionSheet = actionSheet; }, [actionSheet]);
  useEffect(() => { stateRef.current.tx = touchX; stateRef.current.ty = touchY; }, [touchX, touchY]);

  useEffect(() => {
    const zR = zoneRightRef.current;
    const zL = zoneLeftRef.current;
    const zB = zoneBottomRef.current;

    const startR = (e: TouchEvent) => { const t = e.touches[0]; startRef.current = { x: t.clientX, y: t.clientY, side: "right" }; e.preventDefault(); };
    const startL = (e: TouchEvent) => { const t = e.touches[0]; startRef.current = { x: t.clientX, y: t.clientY, side: "left"  }; e.preventDefault(); };
    const startB = (e: TouchEvent) => { const t = e.touches[0]; startRef.current = { x: t.clientX, y: t.clientY, side: "bottom" }; e.preventDefault(); };

    const handleMove = (e: TouchEvent) => {
      const s = startRef.current;
      if (!s.side) return;
      const t = e.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (s.side === "right" && -dx > ACTIVATION_DIST) {
        if (!stateRef.current.menuSide) setMenuSide("right");
        setTouchX(t.clientX); setTouchY(t.clientY);
        // Track hold su nearest
        const ms = stateRef.current.menuSide || "right";
        const near = getNearestVoice(ms as any, t.clientX, t.clientY, stateRef.current.voices);
        const nid = near?.id || null;
        if (nid !== nearestIdRef.current) {
          nearestIdRef.current = nid;
          console.log("[GN] near:", nid, "has quick?", !!quickHandlers[nid]);
          if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
          holdVoiceRef.current = null;
          setHoldVoice(null);
          if (nid && quickHandlers[nid]) {
            holdVoiceRef.current = nid;
            setHoldVoice(nid);
            try { if ("vibrate" in navigator) (navigator as any).vibrate(15); } catch(e) {}
            console.log("[GN] hold started on", nid);
            holdTimerRef.current = setTimeout(() => {
              holdFiredRef.current = nid;
              setHoldFired(nid);
              console.log("[GN] HOLD FIRED", nid);
              try { if ("vibrate" in navigator) (navigator as any).vibrate([50, 40, 80, 40, 100]); } catch(e) {}
            }, 1200);
          }
        }
      } else if (s.side === "left" && dx > ACTIVATION_DIST) {
        if (!stateRef.current.menuSide) setMenuSide("left");
        setTouchX(t.clientX); setTouchY(t.clientY);
        const ms = stateRef.current.menuSide || "left";
        const near = getNearestVoice(ms as any, t.clientX, t.clientY, stateRef.current.voices);
        const nid = near?.id || null;
        if (nid !== nearestIdRef.current) {
          nearestIdRef.current = nid;
          console.log("[GN] near:", nid, "has quick?", !!quickHandlers[nid]);
          if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
          holdVoiceRef.current = null;
          setHoldVoice(null);
          if (nid && quickHandlers[nid]) {
            holdVoiceRef.current = nid;
            setHoldVoice(nid);
            try { if ("vibrate" in navigator) (navigator as any).vibrate(15); } catch(e) {}
            console.log("[GN] hold started on", nid);
            holdTimerRef.current = setTimeout(() => {
              holdFiredRef.current = nid;
              setHoldFired(nid);
              console.log("[GN] HOLD FIRED", nid);
              try { if ("vibrate" in navigator) (navigator as any).vibrate([50, 40, 80, 40, 100]); } catch(e) {}
            }, 1200);
          }
        }
      } else if (s.side === "bottom" && -dy > ACTIVATION_DIST) {
        if (!stateRef.current.actionSheet) setActionSheet(true);
      }
      e.preventDefault();
    };

    const handleEnd = () => {
      const ms = stateRef.current.menuSide;
      const firedId = holdFiredRef.current;
      if (ms) {
        if (firedId && quickHandlers[firedId]) {
          // QUICK mode: pressione prolungata -> crea veloce, no navigazione
          try { quickHandlers[firedId]?.(); } catch(e) {}
        } else {
          const picked = getNearestVoice(ms, stateRef.current.tx, stateRef.current.ty, stateRef.current.voices);
          if (picked) {
            if (picked.id === "ai") {
              try { window.dispatchEvent(new CustomEvent("mastro:open-ai")); (window as any).__mastroOpenAI?.(); } catch {}
              setMenuSide(null); setActionSheet(false);
              return;
            }
            if (picked.id !== "commesse") setSelectedCM(null);
            setTab(picked.id);
          }
        }
      }
      // Cleanup hold
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
      holdVoiceRef.current = null;
      holdFiredRef.current = null;
      nearestIdRef.current = null;
      setHoldVoice(null);
      setHoldFired(null);
      setMenuSide(null);
      startRef.current = { x: 0, y: 0, side: null };
    };

    if (zR) zR.addEventListener("touchstart", startR, { passive: false });
    if (zL) zL.addEventListener("touchstart", startL, { passive: false });
    if (zB) zB.addEventListener("touchstart", startB, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: false });
    window.addEventListener("touchcancel", handleEnd, { passive: false });

    return () => {
      if (zR) zR.removeEventListener("touchstart", startR as any);
      if (zL) zL.removeEventListener("touchstart", startL as any);
      if (zB) zB.removeEventListener("touchstart", startB as any);
      window.removeEventListener("touchmove", handleMove as any);
      window.removeEventListener("touchend", handleEnd as any);
      window.removeEventListener("touchcancel", handleEnd as any);
    };
  }, []);

  const getNearestVoice = (side: "right" | "left", tx: number, ty: number, vv: Voice[]): Voice | null => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = side === "right" ? w : 0;
    const cy = h / 2;
    const dx = tx - cx;
    const dy = ty - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SELECT_DIST) return null;
    const angle = Math.atan2(dy, dx);
    const span = Math.PI * 0.75;
    const start = side === "right" ? Math.PI - span / 2 : -span / 2;
    const voiceAngles = vv.map((_, i) => start + (span * i) / (vv.length - 1));
    let bestIdx = 0, bestDiff = Infinity;
    voiceAngles.forEach((a, i) => {
      let d = angle - a;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) < bestDiff) { bestDiff = Math.abs(d); bestIdx = i; }
    });
    return vv[bestIdx];
  };

  const nearest = menuSide ? getNearestVoice(menuSide, touchX, touchY, voices) : null;

  const getActions = () => [
    { label: "MASTRO AI", hint: "Assistente intelligente", icon: IC.ai,
      onClick: () => {
        try {
          window.dispatchEvent(new CustomEvent("mastro:open-ai"));
          (window as any).__mastroOpenAI?.();
        } catch {}
        setActionSheet(false);
      },
      onLongPress: () => {
        try {
          window.dispatchEvent(new CustomEvent("mastro:open-ai-live"));
          (window as any).__mastroOpenAILive?.();
        } catch {}
        setActionSheet(false);
      } },
    { label: "Nuova commessa", hint: "Tieni premuto: veloce", icon: IC.folder,
      onClick: () => { onNuovaCommessa?.(); setActionSheet(false); },
      onLongPress: () => { onQuickCommessa?.(); setActionSheet(false); } },
    { label: "Nuovo evento", hint: "Tieni premuto: veloce", icon: IC.calendar,
      onClick: () => { onNuovoEvento?.(); setActionSheet(false); },
      onLongPress: () => { onQuickEvento?.(); setActionSheet(false); } },
    { label: "Nuova spesa", hint: "Tieni premuto: veloce", icon: IC.euro,
      onClick: () => { onNuovaSpesa?.(); setActionSheet(false); },
      onLongPress: () => { onQuickSpesa?.(); setActionSheet(false); } },
    { label: "Nuova nota", hint: "Tieni premuto: veloce", icon: IC.note,
      onClick: () => { onNuovaNota?.(); setActionSheet(false); },
      onLongPress: () => { onQuickNota?.(); setActionSheet(false); } },
  ];

  const zoneStyle = (side: "right" | "left" | "bottom"): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed", zIndex: 60, touchAction: "none",
      WebkitUserSelect: "none", userSelect: "none",
    };
    if (side === "right") return { ...base, top: 0, right: 0, width: EDGE_ZONE, bottom: 0 };
    if (side === "left")  return { ...base, top: 0, left: 0,  width: EDGE_ZONE, bottom: 0 };
    return { ...base, bottom: 0, left: EDGE_ZONE, right: EDGE_ZONE, height: BOTTOM_ZONE };
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("mastro-hold-pulse-kf")) return;
    const style = document.createElement("style");
    style.id = "mastro-hold-pulse-kf";
    style.textContent = "@keyframes mastroHoldPulse { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.3) } }";
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <div ref={zoneRightRef} style={zoneStyle("right")} />
      <div ref={zoneLeftRef} style={zoneStyle("left")} />
      <div ref={zoneBottomRef} style={zoneStyle("bottom")} />

      {hintOn && (
        <>
          <div style={edgeHintStyle("right")} />
          <div style={edgeHintStyle("left")} />
          <div style={edgeHintStyle("bottom")} />
        </>
      )}

      {menuSide && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,31,0.35)", backdropFilter: "blur(4px)" }} />
          {voices.map((v, i) => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const cx = menuSide === "right" ? w : 0;
            const cy = h / 2;
            const span = Math.PI * 0.75;
            const start = menuSide === "right" ? Math.PI - span / 2 : -span / 2;
            const a = start + (span * i) / (voices.length - 1);
            const r = 150;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            const isNear = nearest?.id === v.id;
            const isHolding = holdVoice === v.id && !holdFired;
            const isFired = holdFired === v.id;
            const hasQuick = !!quickHandlers[v.id];
            return (
              <div key={v.id} style={{
                position: "absolute", left: x - 28, top: y - 28,
                width: 56, height: 56, borderRadius: "50%",
                background: isFired
                  ? "linear-gradient(145deg, #8BC443, #6A9A26)"
                  : isHolding
                    ? `linear-gradient(145deg, ${TEAL}, ${TEAL_DARK})`
                    : isNear ? TEAL : "rgba(13,31,31,0.85)",
                border: `${isFired ? 3 : 2}px solid ${isFired ? "#FFF" : isHolding ? "#FFF" : isNear ? WHITE : "rgba(40,160,160,0.5)"}`,
                boxShadow: isFired
                  ? "0 0 30px rgba(139,196,67,0.9), 0 0 60px rgba(139,196,67,0.5)"
                  : isHolding
                    ? `0 0 24px ${TEAL}, 0 6px 22px ${TEAL}90`
                    : isNear ? `0 6px 20px ${TEAL}80` : "0 3px 10px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.12s, transform 0.12s, border 0.12s, box-shadow 0.12s",
                transform: isFired ? "scale(1.5)" : isHolding ? "scale(1.3)" : isNear ? "scale(1.15)" : "scale(1)",
                animation: isHolding ? "mastroHoldPulse 0.6s ease-in-out infinite" : undefined,
              }}>
                {v.icon}
                {!!v.badge && v.badge > 0 && (
                  <div style={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 18, height: 18, borderRadius: 9,
                    background: "#F5A030", color: WHITE,
                    fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px", border: `2px solid ${DARK}`,
                  }}>{v.badge}</div>
                )}
              </div>
            );
          })}
          {nearest && (
            <div style={{
              position: "absolute",
              left: menuSide === "right" ? undefined : touchX + 40,
              right: menuSide === "right" ? window.innerWidth - touchX + 40 : undefined,
              top: touchY - 16,
              background: DARK, color: WHITE,
              padding: "8px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}>{nearest.label}</div>
          )}
        </div>
      )}

      {actionSheet && (
        <div onClick={() => setActionSheet(false)} style={{
          position: "fixed", inset: 0, zIndex: 250,
          background: "rgba(13,31,31,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 460, background: WHITE,
            borderRadius: "24px 24px 0 0", padding: "16px 16px 28px",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.2)",
          }}>
            <div style={{ width: 44, height: 5, borderRadius: 3, background: "#C8E4E4", margin: "0 auto 14px" }} />
            <div style={{ fontSize: 12, fontWeight: 900, color: DARK, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>Nuovo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {getActions().map((a, i) => (
                <ActionTile key={i} action={a} TEAL={TEAL} TEAL_DARK={TEAL_DARK} DARK={DARK} WHITE={WHITE} iconSvg={iconSvg} />
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes edgePulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.55; } }
        html, body { overscroll-behavior-x: none !important; overscroll-behavior-y: contain !important; }
      `}</style>
    </>
  );
}

const edgeHintStyle = (side: "right" | "left" | "bottom"): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: "fixed", zIndex: 40,
    background: `linear-gradient(${side === "right" ? "270deg" : side === "left" ? "90deg" : "0deg"}, ${TEAL}, transparent)`,
    animation: "edgePulse 1.8s ease-in-out infinite", pointerEvents: "none",
  };
  if (side === "right") return { ...base, top: 0, right: 0, width: 6, bottom: 0 };
  if (side === "left") return { ...base, top: 0, left: 0, width: 6, bottom: 0 };
  return { ...base, bottom: 0, left: 0, right: 0, height: 6 };
};
