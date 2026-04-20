"use client";
import React, { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   GestureNav — sistema navigazione swipe MASTRO
   • Swipe dal bordo DESTRO  → sinistra = menu radiale navigazione
   • Swipe dal bordo SINISTRO → destra  = menu radiale navigazione
   • Swipe dal BASSO verso alto         = action sheet contestuale
   • Hint: 3 bordi pulsano in teal per 6 secondi all'apertura
   ═══════════════════════════════════════════════════════════════ */

const TEAL = "#28A0A0";
const TEAL_DARK = "#1A7A7A";
const DARK = "#0D1F1F";
const WHITE = "#FFFFFF";

const EDGE_ZONE = 24;          // larghezza zona di swipe dai bordi (px)
const BOTTOM_ZONE = 28;        // altezza zona swipe dal basso (px)
const ACTIVATION_DIST = 40;    // distanza minima per attivare il menu
const SELECT_DIST = 80;        // distanza dal bordo oltre cui la voce è "selezionata"

type Voice = { id: string; label: string; badge?: number; icon: React.ReactNode };

interface Props {
  tab: string;
  setTab: (id: string) => void;
  setSelectedCM: (cm: any) => void;
  msgs?: any[];
  onNuovaCommessa?: () => void;
  onNuovoEvento?: () => void;
  onNuovaSpesa?: () => void;
  onNuovaNota?: () => void;
}

const IC = {
  home: <><path d="M3 9l11-6 11 6v13l-11 6L3 22V9z"/><path d="M14 3v19M3 9l11 6 11-6"/></>,
  agenda: <><rect x="3" y="4" width="22" height="20" rx="2"/><line x1="3" y1="10" x2="25" y2="10"/><line x1="9" y1="4" x2="9" y2="10"/><line x1="19" y1="4" x2="19" y2="10"/></>,
  commesse: <><rect x="5" y="3" width="18" height="22" rx="2"/><line x1="9" y1="13" x2="19" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></>,
  talk: <><path d="M4 6h16a2 2 0 012 2v9a2 2 0 01-2 2H4L2 22V8a2 2 0 012-2z"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  altro: <><circle cx="7" cy="14" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="21" cy="14" r="2"/></>,
  plus: <><line x1="14" y1="4" x2="14" y2="24"/><line x1="4" y1="14" x2="24" y2="14"/></>,
  folder: <><path d="M3 7a2 2 0 012-2h5l2 2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></>,
  calendar: <><rect x="4" y="5" width="20" height="18" rx="2"/><line x1="4" y1="10" x2="24" y2="10"/></>,
  euro: <><path d="M20 7.5A8 8 0 108 22"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="16" x2="12" y2="16"/></>,
  note: <><path d="M6 3h12a2 2 0 012 2v18l-8-4-8 4V5a2 2 0 012-2z"/></>,
};

const iconSvg = (path: React.ReactNode, size = 22, color = WHITE) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color}
    strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
);

export default function GestureNav({ tab, setTab, setSelectedCM, msgs = [], onNuovaCommessa, onNuovoEvento, onNuovaSpesa, onNuovaNota }: Props) {

  const [menuSide, setMenuSide] = useState<"right" | "left" | null>(null);
  const [touchX, setTouchX] = useState(0);
  const [touchY, setTouchY] = useState(0);
  const [actionSheet, setActionSheet] = useState(false);
  const [hintOn, setHintOn] = useState(true);
  const startRef = useRef<{ x: number; y: number; side: "right" | "left" | "bottom" | null }>({ x: 0, y: 0, side: null });

  // Hint 6 secondi all'avvio
  useEffect(() => {
    const t = setTimeout(() => setHintOn(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const unreadMsg = (msgs || []).filter((m: any) => !m.letto).length;

  const voices: Voice[] = [
    { id: "home", label: "Home", icon: iconSvg(IC.home) },
    { id: "commesse", label: "Commesse", icon: iconSvg(IC.commesse) },
    { id: "agenda", label: "Agenda", icon: iconSvg(IC.agenda) },
    { id: "messaggi", label: unreadMsg > 0 ? `Chat · ${unreadMsg}` : "Chat", badge: unreadMsg, icon: iconSvg(IC.talk) },
    { id: "altro", label: "Altro", icon: iconSvg(IC.altro) },
  ];

  // ───── Touch handlers ─────
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (t.clientX > w - EDGE_ZONE) {
      startRef.current = { x: t.clientX, y: t.clientY, side: "right" };
    } else if (t.clientX < EDGE_ZONE) {
      startRef.current = { x: t.clientX, y: t.clientY, side: "left" };
    } else if (t.clientY > h - BOTTOM_ZONE) {
      startRef.current = { x: t.clientX, y: t.clientY, side: "bottom" };
    } else {
      startRef.current = { x: 0, y: 0, side: null };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const s = startRef.current;
    if (!s.side) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;

    if (s.side === "right" && -dx > ACTIVATION_DIST) {
      if (!menuSide) setMenuSide("right");
      setTouchX(t.clientX);
      setTouchY(t.clientY);
      e.preventDefault();
    } else if (s.side === "left" && dx > ACTIVATION_DIST) {
      if (!menuSide) setMenuSide("left");
      setTouchX(t.clientX);
      setTouchY(t.clientY);
      e.preventDefault();
    } else if (s.side === "bottom" && -dy > ACTIVATION_DIST) {
      if (!actionSheet) setActionSheet(true);
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (menuSide) {
      const picked = getNearestVoice();
      if (picked) {
        if (picked.id !== "commesse") setSelectedCM(null);
        setTab(picked.id);
      }
    }
    setMenuSide(null);
    startRef.current = { x: 0, y: 0, side: null };
  };

  // Calcola quale voce è "sotto al pollice"
  const getNearestVoice = (): Voice | null => {
    if (!menuSide) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = menuSide === "right" ? w : 0;
    const cy = h / 2;
    const dx = touchX - cx;
    const dy = touchY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < SELECT_DIST) return null; // troppo vicino al bordo, no selezione

    // angolo del pollice rispetto al centro
    const angle = Math.atan2(dy, dx);
    // voci distribuite ad arco
    const voiceAngles = voices.map((_, i) => {
      const span = Math.PI * 0.75; // 135 gradi
      const start = menuSide === "right" ? Math.PI - span / 2 : -span / 2;
      return start + (span * i) / (voices.length - 1);
    });
    // trova angolo più vicino
    let bestIdx = 0;
    let bestDiff = Infinity;
    voiceAngles.forEach((a, i) => {
      const diff = Math.abs(angleDiff(angle, a));
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    });
    return voices[bestIdx];
  };

  const angleDiff = (a: number, b: number) => {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  };

  const nearest = menuSide ? getNearestVoice() : null;

  // Action sheet contestuale per tab corrente
  const getActions = () => {
    const base = [
      { label: "Nuova commessa", icon: IC.folder, onClick: () => { onNuovaCommessa?.(); setActionSheet(false); } },
      { label: "Nuovo evento", icon: IC.calendar, onClick: () => { onNuovoEvento?.(); setActionSheet(false); } },
      { label: "Nuova spesa", icon: IC.euro, onClick: () => { onNuovaSpesa?.(); setActionSheet(false); } },
      { label: "Nuova nota", icon: IC.note, onClick: () => { onNuovaNota?.(); setActionSheet(false); } },
    ];
    return base;
  };

  return (
    <>
      {/* Layer touch invisibile a tutto schermo */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 50, pointerEvents: "none",
        }}
      >
        {/* Zone attive (invisibili ma ricevono touch) */}
        <div style={{ position: "fixed", top: 0, right: 0, width: EDGE_ZONE, bottom: 0, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", top: 0, left: 0, width: EDGE_ZONE, bottom: 0, pointerEvents: "auto" }} />
        <div style={{ position: "fixed", bottom: 0, left: EDGE_ZONE, right: EDGE_ZONE, height: BOTTOM_ZONE, pointerEvents: "auto" }} />
      </div>

      {/* Hint 6s: pulsazione bordi */}
      {hintOn && (
        <>
          <div style={edgeHintStyle("right")} />
          <div style={edgeHintStyle("left")} />
          <div style={edgeHintStyle("bottom")} />
        </>
      )}

      {/* Menu radiale destro/sinistro */}
      {menuSide && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>
          {/* overlay sfondo blur */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(13,31,31,0.35)",
            backdropFilter: "blur(4px)",
          }} />

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

            return (
              <div key={v.id} style={{
                position: "absolute",
                left: x - 28, top: y - 28,
                width: 56, height: 56, borderRadius: "50%",
                background: isNear ? TEAL : "rgba(13,31,31,0.85)",
                border: `2px solid ${isNear ? WHITE : "rgba(40,160,160,0.5)"}`,
                boxShadow: isNear ? `0 6px 20px ${TEAL}80` : "0 3px 10px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.12s, transform 0.12s, border 0.12s",
                transform: isNear ? "scale(1.15)" : "scale(1)",
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

          {/* Label voce selezionata */}
          {nearest && (
            <div style={{
              position: "absolute",
              left: menuSide === "right" ? undefined : touchX + 40,
              right: menuSide === "right" ? window.innerWidth - touchX + 40 : undefined,
              top: touchY - 16,
              background: DARK, color: WHITE,
              padding: "8px 14px", borderRadius: 20,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}>{nearest.label}</div>
          )}
        </div>
      )}

      {/* Action sheet dal basso */}
      {actionSheet && (
        <div
          onClick={() => setActionSheet(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 250,
            background: "rgba(13,31,31,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 460,
            background: WHITE,
            borderRadius: "24px 24px 0 0",
            padding: "16px 16px 28px",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.2)",
          }}>
            <div style={{
              width: 44, height: 5, borderRadius: 3,
              background: "#C8E4E4", margin: "0 auto 14px",
            }} />
            <div style={{
              fontSize: 12, fontWeight: 900, color: DARK,
              textTransform: "uppercase", letterSpacing: 1,
              textAlign: "center", marginBottom: 14,
              fontFamily: "'Inter', sans-serif",
            }}>Nuovo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {getActions().map((a, i) => (
                <button key={i} onClick={a.onClick} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  padding: "18px 10px", borderRadius: 14,
                  background: "linear-gradient(145deg, #EEF8F8, #DDEFEF)",
                  border: "1px solid #C8E4E4",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `linear-gradient(145deg, ${TEAL}, ${TEAL_DARK})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 10px ${TEAL}40`,
                  }}>{iconSvg(a.icon, 20, WHITE)}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{a.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes edgePulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </>
  );
}

const edgeHintStyle = (side: "right" | "left" | "bottom"): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: "fixed", zIndex: 40,
    background: `linear-gradient(${side === "right" ? "270deg" : side === "left" ? "90deg" : "0deg"}, ${TEAL}, transparent)`,
    animation: "edgePulse 1.8s ease-in-out infinite",
    pointerEvents: "none",
  };
  if (side === "right") return { ...base, top: 0, right: 0, width: 6, bottom: 0 };
  if (side === "left") return { ...base, top: 0, left: 0, width: 6, bottom: 0 };
  return { ...base, bottom: 0, left: 0, right: 0, height: 6 };
};
