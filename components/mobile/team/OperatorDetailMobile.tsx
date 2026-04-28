// components/mobile/team/OperatorDetailMobile.tsx
// FASE 5H - Restyling fliwoX coerente con TeamMobile
"use client";
import React from "react";
import type { Operator, TimelineEvent } from "@/lib/types/team";
import { TOKENS, MiniAppCard, MiniListRow, MiniBadge, MiniLivePulse } from "@/components/widgets/MiniAppCard";
import {
  IconUser, IconPhone, IconPin, IconChat, IconAlert, IconFile,
  IconPause, IconCheck, IconClock, IconArrow, IconPlus,
} from "@/components/widgets/shared/icons";

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
  onAvvia?: () => void;
  onPausa?: () => void;
  onRiprende?: () => void;
  onStop?: () => void;
  onAssegnaTask?: () => void;
  busy?: boolean;
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const PAGE_BG = "#F4F1EA";

// Camera SVG inline (no IcoCamera in widgets/icons)
const IcoCamera = ({ size = 18, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </svg>
);

// Play icon
const IcoPlay = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>
);

// Stop square
const IcoStop = ({ size = 11, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="6" y="6" width="12" height="12" rx="1.5"/></svg>
);

function statusInfo(status: string) {
  switch (status) {
    case "attivo":   return { dot: TOKENS.mintBar,  text: "Attivo ora", bg: TOKENS.mint,  fg: TOKENS.mintInk,  bar: TOKENS.mintBar };
    case "pausa":    return { dot: TOKENS.amberBar, text: "In pausa",   bg: TOKENS.amber, fg: TOKENS.amberInk, bar: TOKENS.amberBar };
    case "problema": return { dot: TOKENS.redBar,   text: "Problema",   bg: TOKENS.red,   fg: TOKENS.redInk,   bar: TOKENS.redBar };
    case "viaggio":  return { dot: TOKENS.skyBar,   text: "In viaggio", bg: TOKENS.sky,   fg: TOKENS.skyInk,   bar: TOKENS.skyBar };
    default:         return { dot: "#9CA3AF",       text: "Offline",    bg: TOKENS.hairlineSoft, fg: TOKENS.muted, bar: "#9CA3AF" };
  }
}

function Avatar({ name, url, size = 44, ring }: { name: string; url?: string; size?: number; ring?: string }) {
  const ringStyle = ring ? { boxShadow: `0 0 0 3px ${ring}` } : {};
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover" as any, flexShrink: 0, background: "#F1F5F9", ...ringStyle }} />;
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: "linear-gradient(135deg,#94A3B8,#64748B)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.34, fontWeight: 700,
      ...ringStyle,
    }}>{init}</div>
  );
}

export default function OperatorDetailMobile({
  op, timeline, onBack,
  onChiama, onMappa, onChat, onFoto, onTask, onProblema, onVaiCommessa,
  onAvvia, onPausa, onRiprende, onStop, onAssegnaTask, busy = false,
}: Props) {
  const s = statusInfo(op.status);

  const completati = op.status === "attivo" ? 2 : 0;
  const inCorso = op.status === "attivo" || op.status === "pausa" ? 1 : 0;
  const problemi = op.status === "problema" ? 1 : 0;

  const timerBig = op.timer_label || "—";

  return (
    <div style={{ background: PAGE_BG, minHeight: "100vh", paddingBottom: 100, fontFamily: FONT }}>
      {/* HEADER fliwoX */}
      <div style={{ padding: "12px 10px 0" }}>
        <div style={{
          background: `linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)`,
          padding: "16px 16px 18px",
          borderRadius: 22,
          boxShadow: "0 4px 16px rgba(40,160,160,0.18)",
          color: "#FFFFFF",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div onClick={onBack} style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, fontSize: 18, lineHeight: 1,
            }}>←</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 500, letterSpacing: 0.4, marginBottom: 1 }}>OPERATORE</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{op.name}</div>
            </div>
          </div>
          {/* Riga avatar + chip stato */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" as any }}>
              <Avatar name={op.name} url={op.avatar_url} size={56} ring="rgba(255,255,255,0.45)" />
              {/* Mini badge fotocamera per upload */}
              <div onClick={onFoto} style={{
                position: "absolute" as any, right: -2, bottom: -2,
                width: 22, height: 22, borderRadius: 999,
                background: "#FFF", color: "#1E8080",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                border: "2px solid #1E8080",
              }}><IcoCamera size={12} color="#1E8080" /></div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 999, padding: "4px 10px",
              }}>
                {op.status === "attivo" && <MiniLivePulse color="#FFF" size={6} />}
                <span style={{ width: 7, height: 7, borderRadius: 999, background: s.bar, display: op.status === "attivo" ? "none" : "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>{s.text.toUpperCase()}</span>
              </div>
              {op.position_label && (
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                  {op.position_label}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AZIONI RAPIDE */}
      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column" as any, gap: 12 }}>
        <div style={{
          background: "#FFF", borderRadius: 18,
          padding: 14,
          border: "1px solid rgba(0,0,0,0.04)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TOKENS.muted, letterSpacing: 0.4, marginBottom: 10, paddingLeft: 4 }}>
            AZIONI RAPIDE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
            <ActionTile icon={<IconPhone size={18} color={TOKENS.teal} />} label="Chiama" onClick={onChiama} />
            <ActionTile icon={<IconPin size={18} color={TOKENS.teal} />}    label="Mappa"  onClick={onMappa} />
            <ActionTile icon={<IconChat size={18} color={TOKENS.teal} />}   label="Chat"   onClick={onChat} />
            <ActionTile icon={<IcoCamera size={18} color={TOKENS.teal} />}  label="Foto"   onClick={onFoto} />
            <ActionTile icon={<IconPlus size={18} color={TOKENS.teal} />}   label="Task"   onClick={onTask} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <SecondaryButton
              icon={<IconAlert size={14} color={TOKENS.amberInk} />}
              label="Segnala problema"
              bg={TOKENS.amber} fg={TOKENS.amberInk}
              onClick={onProblema}
            />
            <SecondaryButton
              icon={<IconFile size={14} color="#FFF" />}
              label="Vai a commessa"
              bg={TOKENS.teal} fg="#FFF"
              onClick={onVaiCommessa}
              disabled={!op.commessa_id}
            />
          </div>
        </div>

        {/* CONTROLLO STATO LAVORO */}
        <MiniAppCard
          icon={<IconClock size={14} color={s.fg} />}
          iconBg={s.bg}
          iconColor={s.fg}
          title={
            op.status === "attivo"   ? "Lavoro in corso" :
            op.status === "pausa"    ? "In pausa" :
            op.status === "viaggio"  ? "Programmato oggi" :
            op.status === "problema" ? "Problema attivo" :
                                       "Nessun lavoro attivo"
          }
          subtitle={op.current_job || (op.status === "offline" ? "Nessun montaggio aperto oggi" : undefined)}
          onOpen={op.commessa_id ? onVaiCommessa : undefined}
          openLabel="vai"
          heroVariant={op.status === "attivo" ? "mint" : op.status === "pausa" ? "amber" : op.status === "problema" ? "red" : op.status === "viaggio" ? "sky" : "none"}
          hero={
            op.current_job ? (
              <div>
                {op.commessa_code && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: s.fg, marginBottom: 6, letterSpacing: 0.3 }}>
                    {op.commessa_code.toUpperCase()}{op.cliente ? ` · ${op.cliente.toUpperCase()}` : ""}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: TOKENS.ink, letterSpacing: -0.8, lineHeight: 1, whiteSpace: "nowrap" as any }}>
                    {timerBig}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {op.status === "attivo" && (
                      <>
                        <BtnAction onClick={onPausa} disabled={busy} bg={TOKENS.amber} fg={TOKENS.amberInk} icon={<IconPause size={11} color={TOKENS.amberInk} />} label="Pausa" />
                        <BtnAction onClick={onStop}  disabled={busy} bg={TOKENS.red}   fg={TOKENS.redInk}   icon={<IcoStop size={10} color={TOKENS.redInk} />} label="Stop" />
                      </>
                    )}
                    {op.status === "pausa" && (
                      <>
                        <BtnAction onClick={onRiprende} disabled={busy} bg={TOKENS.mint} fg={TOKENS.mintInk} icon={<IcoPlay size={11} color={TOKENS.mintInk} />} label="Riprendi" />
                        <BtnAction onClick={onStop}     disabled={busy} bg={TOKENS.red}  fg={TOKENS.redInk}  icon={<IcoStop size={10} color={TOKENS.redInk} />} label="Stop" />
                      </>
                    )}
                    {op.status === "viaggio" && (
                      <BtnAction onClick={onAvvia} disabled={busy} bg={TOKENS.mint} fg={TOKENS.mintInk} icon={<IcoPlay size={11} color={TOKENS.mintInk} />} label="Avvia" />
                    )}
                  </div>
                </div>
                {typeof op.progress === "number" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.6)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${op.progress}%`, height: "100%", background: s.bar }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: s.fg, minWidth: 28, textAlign: "right" as any }}>{op.progress}%</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: "8px 0 4px" }}>
                <button onClick={onAvvia} disabled={busy} style={{
                  width: "100%", padding: "12px 16px",
                  background: "#FFF", color: TOKENS.tealInk,
                  border: `1.5px solid ${TOKENS.teal}`, borderRadius: 12,
                  fontSize: 13, fontWeight: 700,
                  cursor: busy ? "default" : "pointer", opacity: busy ? 0.5 : 1,
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <IcoPlay size={14} color={TOKENS.tealInk} /> Avvia lavoro
                </button>
              </div>
            )
          }
        />

        {/* TIMELINE OGGI */}
        {timeline.length > 0 && (
          <MiniAppCard
            icon={<IconClock size={14} color={TOKENS.teal} />}
            title="Timeline di oggi"
            subtitle={`${timeline.length} ${timeline.length === 1 ? "evento" : "eventi"}`}
            heroVariant="none"
          >
            {timeline.map((ev, i) => {
              const isPausa = ev.type === "pausa";
              const isInizio = ev.type === "inizio_lavoro" || ev.type === "ripresa";
              const isPrev = ev.type === "previsto";
              const dotCol = isPausa ? TOKENS.amberBar : isInizio ? TOKENS.mintBar : isPrev ? "#9CA3AF" : TOKENS.tealInk;
              return (
                <MiniListRow
                  key={ev.id}
                  isFirst={i === 0}
                  leading={
                    <div style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: isPausa ? TOKENS.amber : isInizio ? TOKENS.mint : TOKENS.hairlineSoft,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: dotCol }} />
                    </div>
                  }
                  bar={dotCol}
                  title={ev.label}
                  subtitle={ev.time + (ev.detail ? ` · ${ev.detail}` : "")}
                />
              );
            })}
          </MiniAppCard>
        )}

        {/* STATISTICHE OGGI */}
        <MiniAppCard
          icon={<IconCheck size={14} color={TOKENS.teal} />}
          title="Statistiche oggi"
          heroVariant="none"
          hero={
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: 0 }}>
              <Stat n={completati} lbl="Completati" col={TOKENS.mintBar} ink={TOKENS.mintInk} bg={TOKENS.mint} />
              <Stat n={inCorso}    lbl="In corso"   col={TOKENS.skyBar}  ink={TOKENS.skyInk}  bg={TOKENS.sky} />
              <Stat n={problemi}   lbl="Problemi"   col={TOKENS.redBar}  ink={TOKENS.redInk}  bg={TOKENS.red} />
            </div>
          }
        />

        {/* BOTTONE Assegna nuovo task */}
        <button onClick={onAssegnaTask} style={{
          width: "100%", padding: "14px 16px",
          background: TOKENS.teal, color: "#FFF",
          border: "none", borderRadius: 14,
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 2px 8px rgba(40,160,160,0.25)",
        }}>
          <IconPlus size={16} color="#FFF" /> Assegna nuovo task
        </button>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      padding: "10px 4px", borderRadius: 12, cursor: "pointer",
      display: "flex", flexDirection: "column" as any, alignItems: "center", gap: 6,
      background: "transparent",
      transition: "background 0.15s",
    }}
    onMouseDown={e => (e.currentTarget.style.background = TOKENS.tealLight)}
    onMouseUp={e => (e.currentTarget.style.background = "transparent")}
    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: TOKENS.tealLight,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: TOKENS.ink }}>{label}</div>
    </div>
  );
}

function SecondaryButton({ icon, label, bg, fg, onClick, disabled }: {
  icon: React.ReactNode; label: string; bg: string; fg: string; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "11px 14px", borderRadius: 12,
      background: bg, color: fg, border: "none",
      fontSize: 12, fontWeight: 700,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.4 : 1,
      fontFamily: "inherit",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}>{icon} {label}</button>
  );
}

function BtnAction({ onClick, disabled, bg, fg, icon, label }: {
  onClick?: () => void; disabled?: boolean; bg: string; fg: string; icon: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "8px 12px", borderRadius: 10,
      background: bg, color: fg, border: "none",
      fontSize: 11, fontWeight: 700,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1,
      fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as any,
    }}>{icon} {label}</button>
  );
}

function Stat({ n, lbl, col, ink, bg }: { n: number; lbl: string; col: string; ink: string; bg: string }) {
  return (
    <div style={{
      background: bg, borderRadius: 12,
      padding: "12px 6px",
      textAlign: "center" as any,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: col }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: ink, lineHeight: 1, letterSpacing: -0.3 }}>{n}</span>
      </div>
      <div style={{ fontSize: 10, color: ink, fontWeight: 600, marginTop: 5, letterSpacing: 0.2 }}>{lbl}</div>
    </div>
  );
}
