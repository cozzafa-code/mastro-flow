// components/mobile/team/OperatorDetailMobile.tsx
"use client";
import React from "react";
import type { Operator, TimelineEvent } from "@/lib/types/team";
import { PAL, STATUS_INFO } from "@/lib/types/team";
import {
  IcoBack, IcoMore, IcoPhone, IcoMapPin, IcoChat, IcoCamera, IcoTask,
  IcoAlert, IcoFolder, IcoPause, IcoStop, IcoChevronRight, IcoPlus,
} from "./icons";

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

const TL_COLOR: Record<TimelineEvent["type"], string> = {
  partenza: PAL.attivoGreen,
  arrivo: PAL.attivoGreen,
  inizio_lavoro: PAL.attivoGreen,
  pausa: PAL.warningOrange,
  ripresa: PAL.attivoGreen,
  foto: PAL.attivoGreen,
  previsto: '#9CA3AF',
};

export default function OperatorDetailMobile({
  op, timeline, onBack,
  onChiama, onMappa, onChat, onFoto, onTask, onProblema, onVaiCommessa,
  onPausa, onStop, onAssegnaTask,
}: Props) {
  const s = STATUS_INFO[op.status];

  // Per Marco mockup: 2 / 1 / 0
  const completati = op.status === "attivo" ? 2 : 0;
  const inCorso = op.status === "attivo" || op.status === "pausa" ? 1 : 0;
  const problemi = op.status === "problema" ? 1 : 0;

  // Timer titolo
  const timerBig = op.status === "pausa" ? "1h 45m" : (op.timer_label || "—");

  return (
    <div style={{ background: PAL.pageBg, minHeight: "100vh", paddingBottom: 100, fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* HEADER GRADIENT */}
      <div style={{
        background: PAL.headerGrad,
        padding: "14px 16px 18px",
        color: "#FFFFFF",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div onClick={onBack} style={{ cursor: "pointer", padding: 4, color: "#FFFFFF" }}><IcoBack s={22} /></div>
        {/* Avatar 56px nel detail (SPEC) */}
        {op.avatar_url ? (
          <img src={op.avatar_url} alt={op.name} style={{
            width: 44, height: 44, borderRadius: 999,
            background: "#FFFFFF", objectFit: "cover" as any,
            border: "2px solid rgba(255,255,255,0.5)",
          }}/>
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 999,
            background: "linear-gradient(135deg,#28A0A0,#176868)",
            color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
          }}>{op.name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase()}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{op.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: s.dot }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.92)", fontWeight: 500 }}>{s.text}</span>
          </div>
        </div>
        <div style={{ cursor: "pointer", color: "rgba(255,255,255,0.85)", padding: 4 }}><IcoMore s={20} /></div>
      </div>

      {/* AZIONI RAPIDE */}
      <div style={{ background: PAL.card, padding: 16, borderBottom: `1px solid ${PAL.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAL.text, marginBottom: 12 }}>Azioni rapide</div>

        {/* RIGA 1: 5 azioni Chiama / Mappa / Chat / Foto / Task */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4, marginBottom: 12 }}>
          <ActionIcon label="Chiama" color={PAL.gradEnd} onClick={onChiama} icon={<IcoPhone s={20} />} />
          <ActionIcon label="Mappa"  color={PAL.gradEnd} onClick={onMappa}  icon={<IcoMapPin s={20} />} />
          <ActionIcon label="Chat"   color={PAL.gradEnd} onClick={onChat}   icon={<IcoChat s={20} />} />
          <ActionIcon label="Foto"   color={PAL.gradEnd} onClick={onFoto}   icon={<IcoCamera s={20} />} />
          <ActionIcon label="Task"   color={PAL.gradEnd} onClick={onTask}   icon={<IcoTask s={20} />} />
        </div>

        {/* RIGA 2: Problema (rosso/arancio) + Vai a commessa (teal) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <ActionIcon label="Problema" color={PAL.warningOrange} onClick={onProblema} icon={<IcoAlert s={20} />} />
          <ActionIcon label="Vai a commessa" color={PAL.gradEnd} onClick={onVaiCommessa} icon={<IcoFolder s={20} />} />
        </div>
      </div>

      {/* LAVORO ATTUALE */}
      {op.current_job && (
        <div style={{ background: PAL.card, padding: 16, borderBottom: `1px solid ${PAL.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: PAL.textGrey }}>Lavoro attuale</div>
            <span style={{ color: PAL.textGrey, cursor: "pointer" }}><IcoChevronRight s={18} /></span>
          </div>

          {/* Body 14px Bold col verde */}
          <div style={{ fontSize: 16, fontWeight: 600, color: PAL.text, marginBottom: 4 }}>{op.current_job}</div>
          {op.commessa_code && (
            <div style={{ fontSize: 12, color: PAL.textGrey, marginBottom: 12 }}>
              Commessa {op.commessa_code} {op.cliente && `· ${op.cliente}`}
            </div>
          )}

          <div style={{ fontSize: 11, color: PAL.textGrey, fontWeight: 500, marginBottom: 4 }}>Iniziato alle 08:30</div>

          {/* Timer 2h 15m grande + Pausa/Stop A DESTRA INLINE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {/* Timer H1 24px Bold ma più grande mockup ~32px */}
            <div style={{ fontSize: 32, fontWeight: 700, color: PAL.text, letterSpacing: -0.8, lineHeight: 1, whiteSpace: "nowrap" as any }}>
              {timerBig}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {/* Pausa GIALLO */}
              <button onClick={onPausa} style={{
                padding: "10px 16px", borderRadius: 12,
                background: PAL.pausaBg, color: PAL.pausaText, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" as any,
              }}><IcoPause s={12} /> Pausa</button>
              {/* Stop ROSSO */}
              <button onClick={onStop} style={{
                padding: "10px 16px", borderRadius: 12,
                background: PAL.problemaBg, color: PAL.problemaText, border: "none",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" as any,
              }}><IcoStop s={12} /> Stop</button>
            </div>
          </div>

          {/* Progress */}
          {typeof op.progress === "number" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: "#F0F0F0", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${op.progress}%`, height: "100%", background: PAL.attivoGreen }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: PAL.textGrey }}>{op.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <div style={{ background: PAL.card, padding: 16, borderBottom: `1px solid ${PAL.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: PAL.text, marginBottom: 14 }}>Timeline di oggi</div>
          <div style={{ position: "relative", paddingLeft: 26 }}>
            <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, background: PAL.border }} />
            {timeline.map(ev => {
              const c = TL_COLOR[ev.type];
              const isPausa = ev.type === "pausa";
              const isPrev = ev.type === "previsto";
              return (
                <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 14, position: "relative" }}>
                  <span style={{
                    position: "absolute", left: -25, top: 4,
                    width: 12, height: 12, borderRadius: 999,
                    background: isPrev ? "#FFFFFF" : c,
                    border: isPrev ? `2px dashed ${c}` : `2px solid #FFFFFF`,
                    boxShadow: !isPrev ? `0 0 0 1.5px ${c}30` : "none",
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: isPausa ? PAL.pausaText : (isPrev ? PAL.textGrey : PAL.text),
                    minWidth: 38,
                  }}>{ev.time}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isPausa ? PAL.pausaText : (isPrev ? PAL.textGrey : PAL.text) }}>
                      {ev.label}{ev.detail && ` · ${ev.detail}`}
                    </div>
                  </div>
                  {ev.has_photo && (
                    <div style={{
                      width: 38, height: 28, borderRadius: 4,
                      background: "linear-gradient(135deg,#6B7280,#4B5563)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATISTICHE OGGI */}
      <div style={{ background: PAL.card, padding: 16, borderBottom: `1px solid ${PAL.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: PAL.text, marginBottom: 12 }}>Statistiche oggi</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Stat n={completati} lbl="Completati" color={PAL.attivoGreen}   bg={PAL.attivoBg} />
          <Stat n={inCorso}    lbl="In corso"   color={PAL.infoBlue}      bg={PAL.viaggioBg} />
          <Stat n={problemi}   lbl="Problemi"   color={PAL.errorRed}      bg={PAL.problemaBg} />
        </div>
      </div>

      {/* BOTTONE ASSEGNA NUOVO TASK */}
      <div style={{ padding: 16 }}>
        <button onClick={onAssegnaTask} style={{
          width: "100%", padding: "14px 16px",
          background: PAL.gradEnd,
          color: "#FFFFFF", border: "none",
          borderRadius: 12,
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <IcoPlus s={16} /> Assegna nuovo task
        </button>
      </div>
    </div>
  );
}

function ActionIcon({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ padding: "8px 4px", textAlign: "center" as any, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, color }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 500, color: PAL.text }}>{label}</div>
    </div>
  );
}

function Stat({ n, lbl, color, bg }: { n: number; lbl: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "14px 6px", textAlign: "center" as any }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{n}</div>
      <div style={{ fontSize: 12, color: PAL.text, fontWeight: 500, marginTop: 6 }}>{lbl}</div>
    </div>
  );
}
