"use client";

import { useState } from "react";
import { useSettimana, type SettimanaTask } from "@/hooks/useSettimana";

const GIORNI_LBL = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const CATEGORIA_COLORE: Record<string, string> = {
  mastro: "#28A0A0",
  vita: "#1D9E75",
  lidia: "#EF9F27",
  risolto: "#7F77DD",
  deep: "#1E8080",
  pausa: "#5DCAA5",
};

function densitaColor(durata: number): string {
  // verde leggero -> ambra -> rosso
  if (durata === 0) return "rgba(200,228,228,0.5)";
  if (durata < 240) return "rgba(29,158,117,0.30)";
  if (durata < 480) return "rgba(239,159,39,0.40)";
  return "rgba(220,68,68,0.45)";
}

function fmtDM(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

export function SettimanaView() {
  const { loading, lunediISO, giorni, tasksByGiorno, nonAssegnati, weekShift, reset, spostaTask } = useSettimana();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDrop = async (giornoTarget: string | null) => {
    if (!draggingId) return;
    await spostaTask(draggingId, giornoTarget);
    setDraggingId(null);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar settimana */}
      <div style={{
        flexShrink: 0,
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid rgba(200,228,228,0.4)",
        background: "#fff",
      }}>
        <button type="button" onClick={() => weekShift(-1)} aria-label="Settimana precedente"
          style={{
            width: 30, height: 30, borderRadius: 9, border: 0, cursor: "pointer",
            background: "#F4F6F5", color: "#5A7878",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#5A7878", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Settimana
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: -0.2, marginTop: 1 }}>
            {fmtDM(lunediISO)} → {giorni[6] ? fmtDM(giorni[6].giorno) : "..."}
          </div>
        </div>
        <button type="button" onClick={reset} aria-label="Settimana corrente"
          style={{
            padding: "6px 11px", borderRadius: 9, border: 0, cursor: "pointer",
            background: "rgba(127,119,221,0.14)", color: "#7F77DD",
            fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
            fontFamily: "inherit",
          }}>oggi</button>
        <button type="button" onClick={() => weekShift(1)} aria-label="Settimana successiva"
          style={{
            width: 30, height: 30, borderRadius: 9, border: 0, cursor: "pointer",
            background: "#F4F6F5", color: "#5A7878",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>

      {/* Body scroll · 7 colonne + nonAssegnati */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 24px" }}>

        {loading && (
          <div style={{ padding: 20, textAlign: "center", fontSize: 11, fontWeight: 700, color: "#5A7878" }}>
            Caricamento settimana...
          </div>
        )}

        {/* B23 · 7 colonne */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
          {giorni.map((g, idx) => {
            const tasks = tasksByGiorno[g.giorno] ?? [];
            const lbl = GIORNI_LBL[idx];
            const dm = fmtDM(g.giorno);
            const today = g.giorno === new Date().toISOString().slice(0, 10);

            return (
              <div key={g.giorno}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(g.giorno); }}
                style={{
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: today
                    ? "0 4px 12px rgba(40,160,160,0.18), inset 0 0 0 2px rgba(40,160,160,0.4)"
                    : "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.4)",
                  padding: 0,
                  overflow: "hidden",
                }}>
                {/* Header colonna giorno */}
                <div style={{
                  padding: "8px 12px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  // B25 · barra densità
                  background: densitaColor(g.durata_min_totale),
                  borderBottom: "1px solid rgba(200,228,228,0.5)",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: today ? "#1E8080" : "#0F2525", letterSpacing: -0.1 }}>
                      {lbl}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878" }}>
                      {dm}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {g.durata_min_totale > 0 && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 900,
                        color: g.durata_min_totale >= 480 ? "#7F1D1D"
                             : g.durata_min_totale >= 240 ? "#854F0B"
                             : "#04342C",
                        letterSpacing: 0.2,
                      }}>{Math.round(g.durata_min_totale / 60 * 10) / 10}h</span>
                    )}
                    <span style={{
                      padding: "1px 6px", borderRadius: 99,
                      background: today ? "#28A0A0" : "rgba(40,160,160,0.14)",
                      color: today ? "#fff" : "#1E8080",
                      fontSize: 9, fontWeight: 900,
                    }}>{g.totale}</span>
                  </div>
                </div>

                {/* Lista task del giorno */}
                {tasks.length === 0 ? (
                  <div style={{
                    padding: "12px 10px", textAlign: "center",
                    fontSize: 10, fontWeight: 700, color: "#8FA8A8",
                    fontStyle: "italic",
                  }}>
                    libero
                  </div>
                ) : (
                  <div style={{ padding: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {tasks.map((t) => (
                      <TaskMini key={t.id} task={t}
                        dragging={draggingId === t.id}
                        onDragStart={() => setDraggingId(t.id)}
                        onDragEnd={() => setDraggingId(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* B23 · "non assegnati" colonna · drop area */}
        {nonAssegnati.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{
              padding: "0 4px 6px",
              fontSize: 11, fontWeight: 900, color: "#854F0B", letterSpacing: 0.4, textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <div style={{ width: 3, height: 12, borderRadius: 2, background: "#EF9F27" }}/>
              Non assegnati · {nonAssegnati.length}
              <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "#854F0B", textTransform: "none" }}>
                trascina su un giorno
              </span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); }}
              style={{
                background: "#fff", borderRadius: 12,
                boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(239,159,39,0.3)",
                padding: 8, display: "flex", flexDirection: "column", gap: 4,
                borderLeft: "3px solid #EF9F27",
              }}>
              {nonAssegnati.map((t) => (
                <TaskMini key={t.id} task={t}
                  dragging={draggingId === t.id}
                  onDragStart={() => setDraggingId(t.id)}
                  onDragEnd={() => setDraggingId(null)}
                  showGiorno
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TaskMini({ task, dragging, onDragStart, onDragEnd, showGiorno = false }: {
  task: SettimanaTask;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  showGiorno?: boolean;
}) {
  const cat = task.categoria ?? "mastro";
  const accent = CATEGORIA_COLORE[cat] ?? "#28A0A0";
  return (
    <div draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        padding: "6px 8px",
        borderRadius: 8,
        background: dragging ? "rgba(40,160,160,0.12)" : "rgba(244,246,245,0.8)",
        borderLeft: `3px solid ${accent}`,
        cursor: "grab",
        opacity: task.stato === "fatto" ? 0.55 : 1,
        boxShadow: dragging ? "0 4px 12px rgba(40,160,160,0.3)" : undefined,
        transform: dragging ? "scale(0.98)" : undefined,
        transition: "transform 0.1s",
        userSelect: "none",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{
          padding: "1px 5px", borderRadius: 3, fontSize: 7.5, fontWeight: 900,
          letterSpacing: 0.5, textTransform: "uppercase",
          background: `${accent}22`, color: accent,
          flexShrink: 0,
        }}>{cat}</span>
        {task.ora_inizio && (
          <span style={{ fontSize: 9, fontWeight: 800, color: "#5A7878", letterSpacing: 0.2 }}>
            {task.ora_inizio.slice(0, 5)}
          </span>
        )}
        {task.durata_min && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#8FA8A8", marginLeft: "auto" }}>
            {task.durata_min}m
          </span>
        )}
      </div>
      <div style={{
        marginTop: 2, fontSize: 11, fontWeight: 700, color: "#0F2525", letterSpacing: -0.05,
        textDecoration: task.stato === "fatto" ? "line-through" : "none",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{task.titolo}</div>
      {showGiorno && (
        <div style={{ marginTop: 2, fontSize: 9, fontWeight: 700, color: "#854F0B" }}>
          era {task.giorno}
        </div>
      )}
    </div>
  );
}
