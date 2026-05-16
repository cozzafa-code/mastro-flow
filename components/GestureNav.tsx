"use client";
import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   GestureNav v2 — sistema navigazione swipe MASTRO (fix back-swipe)
   ═══════════════════════════════════════════════════════════════ */

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
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
    { id: "home", label: "Home", icon: iconSvg(IC.home) },
    { id: "commesse", label: "Commesse", icon: iconSvg(IC.commesse) },
    { id: "agenda", label: "Agenda", icon: iconSvg(IC.agenda) },
    { id: "messaggi", label: unreadMsg > 0 ? `Chat · ${unreadMsg}` : "Chat", badge: unreadMsg, icon: iconSvg(IC.talk) },
    { id: "altro", label: "Altro", icon: iconSvg(IC.altro) },
  ];
  stateRef.current.voices = voices;

  // Mappa voice.id → quick handler (crea veloce)
  const quickHandlers: Record<string, (() => void) | undefined> = {
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
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200 }}
          onClick={() => setMenuSide(null)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(13,31,31,0.45)", backdropFilter: "blur(3px)" }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0, bottom: 0,
              right: menuSide === "right" ? 0 : undefined,
              left: menuSide === "left" ? 0 : undefined,
              width: 220,
              background: DARK,
              display: "flex", flexDirection: "column",
              overflowY: "auto",
              paddingTop: 60, paddingBottom: 40,
            }}
          >
            <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 16, fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>NAVIGAZIONE</div>
            {voices.map((v) => (
              <div
                key={v.id}
                onClick={() => { setMenuSide(null); if (v.id !== "commesse") setSelectedCM(null); setTab(v.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 20px",
                  background: nearest?.id === v.id ? "rgba(40,160,160,0.18)" : "transparent",
                  borderLeft: nearest?.id === v.id ? `3px solid ${TEAL}` : "3px solid transparent",
                  cursor: "pointer", minHeight: 56,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: nearest?.id === v.id ? TEAL : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  {v.icon}
                  {!!v.badge && v.badge > 0 && (
                    <div style={{ position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, background: "#F5A030", color: WHITE, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{v.badge}</div>
                  )}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: nearest?.id === v.id ? WHITE : "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif" }}>{v.label}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 20px" }} />
            <div onClick={() => setMenuSide(null)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", cursor: "pointer", minHeight: 56 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.4)", fontFamily: "'Inter', sans-serif" }}>Chiudi</span>
            </div>
          </div>
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
