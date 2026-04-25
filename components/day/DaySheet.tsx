"use client";

import { useEffect, useState } from "react";
import { useDay } from "@/hooks/useDay";
import type { DayProssimoColore, DayTask } from "@/lib/types/day";

interface Props { open: boolean; onClose: () => void; }

const COLOR_GRAD: Record<DayProssimoColore, string> = {
  verde: "linear-gradient(155deg, #6BD9B0 0%, #1D9E75 55%, #0F8060 100%)",
  viola: "linear-gradient(155deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
  teal: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
  ambra: "linear-gradient(155deg, #FAC775 0%, #EF9F27 55%, #C97F0E 100%)",
  blu: "linear-gradient(155deg, #85B7EB 0%, #378ADD 55%, #2369B5 100%)",
};

const COLOR_TEXT: Record<DayProssimoColore, string> = {
  verde: "#04342C", viola: "#3C3489", teal: "#04403B",
  ambra: "#854F0B", blu: "#042C53",
};

function fmtMinutesAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min fa`;
  return `${Math.floor(min / 60)}h fa`;
}

export function DaySheet({ open, onClose }: Props) {
  const { loading, tasks, eventi, strip, prossimoStep, stats, completaTask, skipProssimo } = useDay();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => { setBannerDismissed(false); }, [eventi[0]?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const ultimoEvento = eventi[0];
  const showBanner = ultimoEvento && !bannerDismissed;
  const colore: DayProssimoColore = prossimoStep?.colore ?? "viola";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="MASTRO Day"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        background: "rgba(13,31,31,0.55)", backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, marginTop: 28,
          display: "flex", flexDirection: "column",
          background: "#F4F6F5",
          borderRadius: "28px 28px 0 0",
          overflow: "hidden",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
          animation: "daySheetUp 0.4s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <style>{`
          @keyframes daySheetUp { from { transform: translateY(60px); opacity: 0.5; } to { transform: translateY(0); opacity: 1; } }
          @keyframes dayBlink { 0%,100%{opacity:.5} 50%{opacity:1} }
          @keyframes dayPulse { 0%,100%{opacity:.4; transform:scale(.85)} 50%{opacity:1; transform:scale(1.15)} }
          .day-strip-scroll::-webkit-scrollbar{display:none}
        `}</style>

        {/* HEADER */}
        <div style={{
          flexShrink: 0, position: "relative",
          padding: "12px 18px 18px",
          color: "#fff",
          background: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
          borderRadius: "28px 28px 0 0",
        }}>
          <div style={{
            position: "absolute", top: -50, right: -50,
            width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)",
            pointerEvents: "none",
          }} />

          <div style={{
            margin: "0 auto 12px", height: 5, width: 44,
            background: "rgba(255,255,255,0.5)", borderRadius: 99,
          }} />

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button" onClick={onClose} aria-label="Chiudi Day"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 12, border: 0, cursor: "pointer",
                background: "rgba(255,255,255,0.22)", backdropFilter: "blur(12px)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9 }}>
                Day · {new Date().toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short" })} · {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ marginTop: 2, fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.05, textShadow: "0 2px 5px rgba(0,0,0,0.18)" }}>
                Plancia
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.4, textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
                {stats.task_fatti} / {stats.task_totali}
              </div>
              <div style={{ marginTop: 2, fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", opacity: 0.9 }}>
                fatti oggi
              </div>
            </div>
          </div>

          <div style={{ position: "relative", marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
            {[
              { n: stats.task_totali, l: "Task" },
              { n: stats.task_fatti, l: "Fatti" },
              { n: `${stats.ore_deep}h`, l: "Deep" },
              { n: stats.cm_toccate, l: "CM" },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "7px 5px", textAlign: "center", borderRadius: 11,
                background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
              }}>
                <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.4 }}>{s.n}</div>
                <div style={{ marginTop: 2, fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.9 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {strip.length > 0 && (
            <div style={{ position: "relative", marginTop: 14 }}>
              <div style={{
                marginBottom: 7, paddingLeft: 2,
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 9, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#5DCAA5",
                  boxShadow: "0 0 8px rgba(93,202,165,0.9)",
                  animation: "dayBlink 2s ease-in-out infinite",
                }} />
                Aperti adesso · ultime 2h
              </div>
              <div className="day-strip-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2 }}>
                {strip.map((s) => (
                  <div key={s.ultimo_evento_id} style={{
                    flexShrink: 0, display: "flex", alignItems: "center", gap: 7,
                    padding: "7px 10px",
                    background: s.attivo ? "#fff" : "rgba(255,255,255,0.18)",
                    backdropFilter: s.attivo ? undefined : "blur(10px)",
                    borderRadius: 11,
                    border: s.attivo ? "1px solid transparent" : "1px solid rgba(255,255,255,0.12)",
                    boxShadow: s.attivo ? "0 4px 12px rgba(0,0,0,0.18)" : "inset 0 1px 1px rgba(255,255,255,0.2)",
                    color: s.attivo ? "#0F2525" : "#fff",
                    cursor: "pointer",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: s.attivo ? "linear-gradient(145deg,#3ABDBD,#1E8080)" : "rgba(255,255,255,0.25)",
                      color: "#fff",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0, maxWidth: 105 }}>
                      <div style={{
                        fontSize: 10.5, fontWeight: 900, letterSpacing: -0.1,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        color: s.attivo ? "#0F2525" : "#fff",
                      }}>{s.titolo_breve}</div>
                      <div style={{
                        marginTop: 1, fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        color: s.attivo ? "#1A7A7A" : "rgba(255,255,255,0.75)",
                      }}>{s.contesto ?? fmtMinutesAgo(s.ultimo_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BANNER RIENTRO */}
        {showBanner && (
          <div style={{
            margin: "12px 16px 0",
            display: "flex", alignItems: "center", gap: 11,
            padding: "11px 13px 11px 14px", borderRadius: 14,
            background: "linear-gradient(145deg, #E8F8F3 0%, #C4EAD9 100%)",
            border: "1px solid rgba(29,158,117,0.3)",
            borderLeft: "4px solid #1D9E75",
            boxShadow: "0 3px 12px rgba(29,158,117,0.15)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(145deg, #5DCAA5, #1D9E75)", color: "#fff",
              boxShadow: "0 3px 8px rgba(29,158,117,0.4), inset 0 1px 1px rgba(255,255,255,0.3)",
              flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 900, color: "#0F8060", letterSpacing: 0.7, textTransform: "uppercase" }}>
                ← {ultimoEvento.modulo_origine.toUpperCase()} · {fmtMinutesAgo(ultimoEvento.created_at)}
              </div>
              <div style={{ marginTop: 2, fontSize: 12.5, fontWeight: 900, color: "#04342C", letterSpacing: -0.1 }}>
                {ultimoEvento.titolo_breve}
              </div>
              {ultimoEvento.contesto && (
                <div style={{ marginTop: 2, fontSize: 9.5, fontWeight: 700, color: "#0F8060", letterSpacing: 0.2 }}>
                  {ultimoEvento.contesto}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setBannerDismissed(true)} aria-label="Chiudi banner"
              style={{
                width: 24, height: 24, borderRadius: 8, border: 0, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(29,158,117,0.18)", color: "#1D9E75", flexShrink: 0,
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}

        {/* BODY */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px 16px" }}>
          {prossimoStep && (
            <div style={{
              position: "relative", overflow: "hidden",
              padding: "18px 18px 16px", borderRadius: 22, color: "#fff",
              background: COLOR_GRAD[colore],
              boxShadow: "0 16px 40px rgba(0,0,0,0.20), 0 6px 14px rgba(0,0,0,0.12)",
            }}>
              <div style={{
                position: "absolute", top: -50, right: -50,
                width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.26), transparent 65%)",
                pointerEvents: "none",
              }} />
              <button type="button" onClick={skipProssimo}
                style={{
                  position: "absolute", top: 14, right: 14, zIndex: 2,
                  padding: "4px 9px", fontSize: 9, fontWeight: 900,
                  letterSpacing: 0.4, textTransform: "uppercase", color: "#fff",
                  background: "rgba(0,0,0,0.20)", borderRadius: 50, border: 0, cursor: "pointer",
                }}>non ora ✕</button>
              <span style={{
                position: "relative", display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 50,
                fontSize: 9, fontWeight: 900, letterSpacing: 1.1, textTransform: "uppercase",
                background: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)",
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#fff",
                  animation: "dayPulse 1.6s ease-in-out infinite",
                }} />
                {prossimoStep.urgenza === "alta" ? "AZIONE URGENTE" : "CONTINUA QUI"}
              </span>
              <div style={{
                position: "relative", marginTop: 12,
                fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.15,
                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}>{prossimoStep.titolo}</div>

              <div style={{ position: "relative", marginTop: 14, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 7 }}>
                <button type="button" onClick={onClose}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "13px 8px", borderRadius: 13, border: 0, cursor: "pointer",
                    fontSize: 12.5, fontWeight: 900, letterSpacing: 0.3,
                    background: "#fff", color: COLOR_TEXT[colore],
                    boxShadow: "0 6px 16px rgba(0,0,0,0.20), inset 0 -3px 0 rgba(0,0,0,0.08)",
                  }}>
                  Apri {prossimoStep.modulo ?? "ora"}
                </button>
                <button type="button" onClick={skipProssimo}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "13px 8px", borderRadius: 13, border: 0, cursor: "pointer",
                    fontSize: 12.5, fontWeight: 900, letterSpacing: 0.3, color: "#fff",
                    background: "rgba(255,255,255,0.22)", backdropFilter: "blur(10px)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.22)",
                  }}>+ tardi</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px 0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 900, letterSpacing: -0.1, color: "#0F2525" }}>
              <span style={{ width: 3, height: 13, borderRadius: 2, background: "linear-gradient(180deg,#28A0A0,#1E8080)" }} />
              Timeline · oggi
            </div>
          </div>

          {tasks.length === 0 && !loading && (
            <div style={{
              padding: 24, textAlign: "center", borderRadius: 14,
              background: "rgba(255,255,255,0.6)",
              border: "1px dashed rgba(40,160,160,0.3)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#5A7878" }}>Nessun task pianificato per oggi.</div>
              <div style={{ marginTop: 4, fontSize: 10.5, fontWeight: 700, color: "#8FA8A8" }}>Apri Backlog per pianificare oggi.</div>
            </div>
          )}

          {tasks.map((t) => <TaskRow key={t.id} task={t} onComplete={() => completaTask(t.id)} />)}

          {loading && tasks.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", borderRadius: 14, fontSize: 12, fontWeight: 700, color: "#5A7878", background: "rgba(255,255,255,0.6)" }}>
              Caricamento Day...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: DayTask; onComplete: () => void }) {
  const isDone = task.stato === "fatto" || task.stato === "saltato";
  const isNow = task.stato === "in_corso";

  const catColors: Record<string, { c: string; bg: string }> = {
    mastro: { c: "#04403B", bg: "rgba(40,160,160,0.14)" },
    vita: { c: "#04342C", bg: "rgba(29,158,117,0.14)" },
    lidia: { c: "#854F0B", bg: "rgba(239,159,39,0.14)" },
    risolto: { c: "#3C3489", bg: "rgba(127,119,221,0.12)" },
    deep: { c: "#04403B", bg: "rgba(40,160,160,0.14)" },
    pausa: { c: "#04342C", bg: "rgba(29,158,117,0.14)" },
  };
  const cc = catColors[task.categoria] ?? catColors.mastro;

  return (
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "50px 1fr" }}>
      <div style={{
        position: "relative", textAlign: "right",
        paddingTop: 13, paddingRight: 9,
        fontSize: 10.5, fontWeight: 900, letterSpacing: 0.2,
        color: isNow ? "#1E8080" : "#0F2525",
        borderRight: "1px dashed rgba(40,160,160,0.25)",
      }}>
        {task.ora_inizio?.slice(0, 5) ?? "—"}
        <span style={{
          position: "absolute", right: -5, top: 17,
          width: 9, height: 9, borderRadius: "50%",
          background: isNow ? "linear-gradient(145deg, #3ABDBD, #28A0A0)" : "#fff",
          border: "2px solid " + (isNow ? "#fff" : "rgba(40,160,160,0.4)"),
          boxShadow: isNow ? "0 0 0 3px rgba(40,160,160,0.25), 0 0 12px rgba(40,160,160,0.6)" : undefined,
          zIndex: 2,
        }} />
      </div>
      <div style={{
        position: "relative", margin: "5px 0",
        padding: "10px 12px", borderRadius: 13, cursor: "pointer",
        background: "#fff",
        border: isNow ? "1px solid rgba(40,160,160,0.5)" : "1px solid rgba(200,228,228,0.4)",
        boxShadow: isNow ? "0 0 0 3px rgba(40,160,160,0.12), 0 4px 12px rgba(40,160,160,0.18)" : "0 2px 6px rgba(13,31,31,0.04)",
        opacity: isDone ? 0.55 : 1,
      }}>
        {isNow && (
          <div style={{
            position: "absolute", top: -7, left: 11,
            padding: "2px 7px", fontSize: 8, fontWeight: 900, letterSpacing: 1,
            color: "#fff", borderRadius: 4,
            background: "linear-gradient(135deg, #2FB2A8, #1E8080)",
            boxShadow: "0 3px 8px rgba(40,160,160,0.4)",
          }}>ORA</div>
        )}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "2px 7px", borderRadius: 4,
          fontSize: 8, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase",
          color: cc.c, background: cc.bg,
        }}>{task.categoria}</span>
        <div style={{
          marginTop: 5, fontSize: 12.5, fontWeight: 900, lineHeight: 1.3, letterSpacing: -0.1,
          color: "#0F2525",
          textDecoration: isDone ? "line-through" : "none",
          textDecorationColor: isDone ? "rgba(29,158,117,0.6)" : undefined,
        }}>{task.titolo}</div>
        {task.descrizione && (
          <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 600, lineHeight: 1.35, color: "#5A7878" }}>
            {task.descrizione}
          </div>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onComplete(); }}
          aria-label="Completa task"
          style={{
            position: "absolute", top: 10, right: 10,
            width: 20, height: 20, borderRadius: 6, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isDone ? "linear-gradient(145deg,#5DCAA5,#1D9E75)" : "#fff",
            border: isDone ? "1.5px solid #1D9E75" : "1.5px solid rgba(200,228,228,0.7)",
            boxShadow: isDone ? "0 2px 6px rgba(29,158,117,0.35)" : undefined,
          }}>
          {isDone && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
