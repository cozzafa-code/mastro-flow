// components/mobile/team/OperatorDetailMobile.tsx
"use client";
import React from "react";
import type { Operator, TimelineEvent } from "@/lib/types/team";
import { TT, STATUS_COLORS } from "@/lib/types/team";

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
  foto: "#6366F1",
  problema: "#EF4444",
  completamento: "#15803D",
  previsto: "#9CA3AF",
};

export default function OperatorDetailMobile({
  op, timeline, onBack,
  onChiama, onMappa, onChat, onFoto, onTask, onProblema, onVaiCommessa,
  onPausa, onStop, onAssegnaTask,
}: Props) {
  const c = STATUS_COLORS[op.status];

  const ACTIONS = [
    { lbl: "Chiama",   icon: "📞", fn: onChiama,   bg: "#DCFCE7", tx: "#15803D" },
    { lbl: "Mappa",    icon: "📍", fn: onMappa,    bg: "#DBEAFE", tx: "#1D4ED8" },
    { lbl: "Chat",     icon: "💬", fn: onChat,     bg: "#E0F2EE", tx: TT.acc },
    { lbl: "Foto",     icon: "📷", fn: onFoto,     bg: "#FEF3C7", tx: "#B45309" },
    { lbl: "Task",     icon: "📝", fn: onTask,     bg: "#F3E8FF", tx: "#7E22CE" },
    { lbl: "Problema", icon: "⚠",  fn: onProblema, bg: "#FEE2E2", tx: "#B91C1C" },
    { lbl: "Vai a commessa", icon: "📂", fn: onVaiCommessa, bg: "#FFE4E6", tx: "#BE185D", wide: true },
  ];

  const completati = timeline.filter(t => t.type === "completamento" || t.type === "arrivo").length;
  const inCorso = op.status === "attivo" ? 1 : 0;
  const problemi = op.status === "problema" ? 1 : 0;

  return (
    <div style={{ background: TT.bg, minHeight: "100vh", paddingBottom: 90 }}>
      {/* HEADER */}
      <div style={{
        background: TT.headerGrad,
        padding: "16px 16px 22px",
        borderRadius: "0 0 22px 22px",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div onClick={onBack} style={{
            width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 999,
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, border: "2px solid rgba(255,255,255,0.4)",
          }}>
            {op.name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{op.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: c.dot }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
                {c.text}
              </span>
            </div>
          </div>
          <span style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", padding: "0 6px", cursor: "pointer" }}>⋯</span>
        </div>
      </div>

      {/* AZIONI RAPIDE */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {ACTIONS.filter(a => !a.wide).map(a => (
            <div key={a.lbl} onClick={a.fn} style={{
              background: a.bg, color: a.tx, padding: "16px 6px",
              borderRadius: 14, textAlign: "center" as any, cursor: "pointer",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{a.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{a.lbl}</div>
            </div>
          ))}
        </div>
        {ACTIONS.filter(a => a.wide).map(a => (
          <div key={a.lbl} onClick={a.fn} style={{
            background: a.bg, color: a.tx, padding: "12px 6px", marginTop: 8,
            borderRadius: 14, textAlign: "center" as any, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 800 }}>{a.lbl}</span>
          </div>
        ))}
      </div>

      {/* LAVORO ATTUALE */}
      {op.current_job && (
        <div style={{ background: TT.card, margin: "14px 14px 0", borderRadius: 18, padding: 14, border: `1px solid ${TT.bdr}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: TT.sub, letterSpacing: 0.5, marginBottom: 6 }}>LAVORO ATTUALE</div>
          <div style={{ fontSize: 15, fontWeight: 900, color: TT.acc }}>{op.current_job}</div>
          {op.commessa_code && (
            <div style={{ fontSize: 11, color: TT.sub, marginTop: 2, fontWeight: 600 }}>
              Commessa {op.commessa_code} {op.cliente && `· ${op.cliente}`}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 10, color: TT.sub, fontWeight: 700 }}>Iniziato alle 08:30</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: TT.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5, marginTop: 2 }}>
                {op.timer_label || "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={onPausa} style={{
                padding: "10px 14px", borderRadius: 12,
                background: "#FEF3C7", color: "#B45309", border: "none",
                fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
              }}>⏸ Pausa</button>
              <button onClick={onStop} style={{
                padding: "10px 14px", borderRadius: 12,
                background: "#FEE2E2", color: "#B91C1C", border: "none",
                fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
              }}>⏹ Stop</button>
            </div>
          </div>

          {typeof op.progress === "number" && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${op.progress}%`, height: "100%", background: TT.acc }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: TT.sub }}>{op.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <div style={{ background: TT.card, margin: "14px 14px 0", borderRadius: 18, padding: 14, border: `1px solid ${TT.bdr}` }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: TT.text, marginBottom: 12 }}>Timeline di oggi</div>
          <div style={{ position: "relative", paddingLeft: 26 }}>
            {/* linea verticale */}
            <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: TT.bdr }} />
            {timeline.map((ev, i) => (
              <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 14, position: "relative" }}>
                <span style={{
                  position: "absolute", left: -24, top: 4,
                  width: 12, height: 12, borderRadius: 999,
                  background: ev.type === "previsto" ? TT.card : TL_COLORS[ev.type],
                  border: ev.type === "previsto" ? `2px dashed ${TL_COLORS[ev.type]}` : `2px solid ${TT.card}`,
                  boxShadow: ev.type !== "previsto" ? `0 0 0 2px ${TL_COLORS[ev.type]}30` : "none",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: TT.sub, fontFamily: "'JetBrains Mono', monospace", minWidth: 38 }}>
                  {ev.time}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ev.type === "previsto" ? TT.sub : TT.text }}>
                    {ev.label}
                  </div>
                  {ev.detail && <div style={{ fontSize: 10, color: TT.sub, marginTop: 1 }}>{ev.detail}</div>}
                </div>
                {ev.type === "foto" && (
                  <div style={{ width: 40, height: 30, borderRadius: 6, background: "linear-gradient(135deg,#E0F2EE,#C8E5DF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    📷
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATISTICHE OGGI */}
      <div style={{ background: TT.card, margin: "14px 14px 0", borderRadius: 18, padding: 14, border: `1px solid ${TT.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: TT.text, marginBottom: 10 }}>Statistiche oggi</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat n={completati} lbl="Completati" color="#22C55E" />
          <Stat n={inCorso}    lbl="In corso"    color="#F59E0B" />
          <Stat n={problemi}   lbl="Problemi"    color="#EF4444" />
        </div>
      </div>

      {/* ASSEGNA NUOVO TASK */}
      <button onClick={onAssegnaTask} style={{
        margin: "14px 14px 14px", width: "calc(100% - 28px)",
        padding: 14, borderRadius: 14,
        background: TT.acc, color: "#fff", border: "none",
        fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
        boxShadow: "0 4px 12px rgba(40,160,160,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        + Assegna nuovo task
      </button>
    </div>
  );
}

function Stat({ n, lbl, color }: { n: number; lbl: string; color: string }) {
  return (
    <div style={{ background: "#FBF8F3", border: `1px solid ${TT.bdr}`, borderRadius: 12, padding: "10px 6px", textAlign: "center" as any }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace" }}>{n}</div>
      <div style={{ fontSize: 10, color: TT.sub, fontWeight: 700, marginTop: 2 }}>{lbl}</div>
    </div>
  );
}
