// components/mobile/team/OperatorDetailMobile.tsx
"use client";
import React from "react";
import type { Operator, TimelineEvent } from "@/lib/types/team";
import { PAL, STATUS_INFO } from "@/lib/types/team";

interface Props {
  op: Operator;
  timeline: TimelineEvent[];
  onBack: () => void;
  onChiama?: () => void;
  onMappa?: () => void;
  onChat?: () => void;
  onFoto?: () => void;
  onTask?: () => void;
  onProblema?: () => void;
  onVaiCommessa?: () => void;
  onPausa?: () => void;
  onStop?: () => void;
  onAssegnaTask?: () => void;
}

const TL_COLORS: Record<TimelineEvent["type"], string> = {
  partenza: "#3B82F6",
  arrivo: "#22C55E",
  inizio_lavoro: "#22C55E",
  pausa: "#F59E0B",
  ripresa: "#22C55E",
  foto: "#22C55E",
  previsto: "#9CA3AF",
};

const ICO_BACK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ICO_PHONE_BIG = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const ICO_MAP_BIG = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ICO_CHAT = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const ICO_CAM = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
);
const ICO_TASK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);
const ICO_ALERT = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const ICO_FOLDER = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
);
const ICO_PAUSE = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);
const ICO_STOP = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>
);

export default function OperatorDetailMobile({
  op, timeline, onBack,
  onChiama, onMappa, onChat, onFoto, onTask, onProblema, onVaiCommessa,
  onPausa, onStop, onAssegnaTask,
}: Props) {
  const s = STATUS_INFO[op.status];

  const ACTIONS_TOP = [
    { lbl: "Chiama", icon: ICO_PHONE_BIG, fn: onChiama },
    { lbl: "Mappa",  icon: ICO_MAP_BIG,   fn: onMappa },
    { lbl: "Chat",   icon: ICO_CHAT,      fn: onChat },
    { lbl: "Foto",   icon: ICO_CAM,       fn: onFoto },
    { lbl: "Task",   icon: ICO_TASK,      fn: onTask },
  ];
  const ACTIONS_BOT = [
    { lbl: "Problema", icon: ICO_ALERT, fn: onProblema, color: PAL.problemaText },
    { lbl: "Vai a commessa", icon: ICO_FOLDER, fn: onVaiCommessa, color: PAL.tealDark },
  ];

  // Statistiche basate su timeline (mockup mostra Marco: 1 completato, 1 in corso, 0 problemi)
  const completati = Math.max(1, timeline.filter(t => t.type === "arrivo").length);
  const inCorso = op.status === "attivo" || op.status === "pausa" ? 1 : 0;
  const problemi = op.status === "problema" ? 1 : 0;

  // Timer titolo: per attivo = tempo lavoro; per pausa = tempo lavoro accumulato (non timer_label che è "Pausa da X")
  // Per il mockup: Marco attivo = "2h 15m", Luca pausa = "1h 45m" (tempo lavoro reale)
  // Il timer_label di Luca ora è "Pausa da 25m" - cambio: per pausa mostro tempo lavoro generico
  const timerBig = op.status === "pausa" ? "1h 45m" : (op.timer_label || "—");
  const subTimer = op.status === "pausa" ? `In pausa da 25 min` : null;

  return (
    <div style={{ background: PAL.pageBg, minHeight: "100vh", paddingBottom: 100 }}>
      {/* HEADER */}
      <div style={{
        background: PAL.headerGrad,
        padding: "12px 14px 16px",
        color: "#fff",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4 }}>{ICO_BACK}</div>
        <div style={{
          width: 38, height: 38, borderRadius: 999,
          background: "linear-gradient(135deg, #28A0A0 0%, #176868 100%)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, border: "2px solid rgba(255,255,255,0.5)",
        }}>
          {op.name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{op.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: s.dot }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{s.text}</span>
          </div>
        </div>
        <span style={{ fontSize: 22, color: "rgba(255,255,255,0.85)", padding: "0 4px", cursor: "pointer", letterSpacing: 1 }}>⋯</span>
      </div>

      {/* AZIONI RAPIDE */}
      <div style={{ background: PAL.card, margin: "0", padding: "12px 14px", borderBottom: `1px solid ${PAL.cardBorder}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: PAL.text, marginBottom: 10 }}>Azioni rapide</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 8 }}>
          {ACTIONS_TOP.map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              padding: "8px 4px", textAlign: "center" as any, cursor: "pointer",
              color: PAL.tealDark,
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: PAL.text }}>{a.lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {ACTIONS_BOT.map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              padding: "8px 4px", textAlign: "center" as any, cursor: "pointer",
              color: a.color,
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: PAL.text }}>{a.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* LAVORO ATTUALE */}
      {op.current_job && (
        <div style={{ background: PAL.card, padding: "14px 14px", borderBottom: `1px solid ${PAL.cardBorder}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PAL.textSub, marginBottom: 6 }}>Lavoro attuale</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: PAL.text }}>{op.current_job}</div>
          {op.commessa_code && (
            <div style={{ fontSize: 11, color: PAL.textSub, marginTop: 2 }}>
              Commessa {op.commessa_code} {op.cliente && `· ${op.cliente}`}
            </div>
          )}

          {/* Timer + bottoni AFFIANCATI come nel mockup */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: PAL.textSub, fontWeight: 600 }}>Iniziato alle 08:30</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: PAL.text, letterSpacing: -0.5, marginTop: 2, lineHeight: 1, whiteSpace: "nowrap" as any }}>
                {timerBig}
              </div>
              {subTimer && (
                <div style={{ fontSize: 10, color: PAL.pausaText, fontWeight: 700, marginTop: 4 }}>{subTimer}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={onPausa} style={{
                padding: "9px 12px", borderRadius: 10,
                background: PAL.pausaBg, color: PAL.pausaText, border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as any,
              }}>{ICO_PAUSE} Pausa</button>
              <button onClick={onStop} style={{
                padding: "9px 12px", borderRadius: 10,
                background: PAL.problemaBg, color: PAL.problemaText, border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as any,
              }}>{ICO_STOP} Stop</button>
            </div>
          </div>

          {typeof op.progress === "number" && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: "#F0EDE5", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${op.progress}%`, height: "100%", background: PAL.attivoDot }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: PAL.textSub }}>{op.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <div style={{ background: PAL.card, padding: "14px 14px", borderBottom: `1px solid ${PAL.cardBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: PAL.text, marginBottom: 12 }}>Timeline di oggi</div>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, background: "#E5E0D6" }} />
            {timeline.map(ev => {
              const color = TL_COLORS[ev.type];
              const isPausa = ev.type === "pausa";
              const isPrev = ev.type === "previsto";
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 12, position: "relative" }}>
                  <span style={{
                    position: "absolute", left: -23, top: 4,
                    width: 12, height: 12, borderRadius: 999,
                    background: isPrev ? "#F5F1EA" : color,
                    border: isPrev ? `2px dashed ${color}` : `2px solid ${PAL.card}`,
                    boxShadow: !isPrev ? `0 0 0 1.5px ${color}30` : "none",
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: isPausa ? PAL.pausaText : (isPrev ? PAL.textSub : PAL.text),
                    minWidth: 36, fontFamily: "inherit",
                  }}>{ev.time}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isPausa ? PAL.pausaText : (isPrev ? PAL.textSub : PAL.text) }}>
                      {ev.label}{ev.detail && ` · ${ev.detail}`}
                    </div>
                  </div>
                  {ev.has_photo && (
                    <div style={{ width: 36, height: 28, borderRadius: 4, background: "linear-gradient(135deg, #E0F2EE, #C8E5DF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📷</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATISTICHE OGGI */}
      <div style={{ background: PAL.card, padding: "14px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: PAL.text, marginBottom: 10 }}>Statistiche oggi</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat n={completati} lbl="Completati" color={PAL.attivoDot} bg={PAL.attivoBg} />
          <Stat n={inCorso}    lbl="In corso"   color={PAL.pausaDot}  bg={PAL.pausaBg} />
          <Stat n={problemi}   lbl="Problemi"   color={PAL.problemaDot} bg={PAL.problemaBg} />
        </div>
      </div>

      {/* ASSEGNA NUOVO TASK */}
      <div style={{ padding: "12px 14px" }}>
        <button onClick={onAssegnaTask} style={{
          width: "100%", padding: "12px 14px",
          background: PAL.tealDark, color: "#fff", border: "none",
          borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        }}>
          + Assegna nuovo task
        </button>
      </div>
    </div>
  );
}

function Stat({ n, lbl, color, bg }: { n: number; lbl: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "12px 6px", textAlign: "center" as any }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 11, color: PAL.text, fontWeight: 600, marginTop: 4 }}>{lbl}</div>
    </div>
  );
}
