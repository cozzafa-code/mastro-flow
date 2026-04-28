// hooks/useOperatorTimer.ts
"use client";
import { useState, useEffect } from "react";

/**
 * Calcola e aggiorna live un timer di durata da un timestamp di start.
 * Restituisce label tipo "2h 15m" o "45m".
 */
export function useLiveTimer(startedAt: string | null | undefined, isPaused?: boolean): string {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!startedAt || isPaused) return;
    const t = setInterval(() => setNow(Date.now()), 30000); // ogni 30s
    return () => clearInterval(t);
  }, [startedAt, isPaused]);

  if (!startedAt) return "—";
  try {
    const start = new Date(startedAt).getTime();
    const diff = Math.max(0, now - start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
    return `${m}m`;
  } catch { return "—"; }
}

export function useOperatorTimer() {
  // hook esteso per gestione sessioni di lavoro complete
  const [sessions, setSessions] = useState<Record<string, any>>({});

  const start = (operatorId: string, commessaId: string, phase: string) => {
    setSessions(s => ({ ...s, [operatorId]: { operator_id: operatorId, commessa_id: commessaId, phase, started_at: new Date().toISOString(), status: "running" } }));
  };
  const pause = (operatorId: string) => {
    setSessions(s => s[operatorId] ? ({ ...s, [operatorId]: { ...s[operatorId], status: "paused", paused_at: new Date().toISOString() } }) : s);
  };
  const resume = (operatorId: string) => {
    setSessions(s => s[operatorId] ? ({ ...s, [operatorId]: { ...s[operatorId], status: "running", paused_at: null } }) : s);
  };
  const stop = (operatorId: string) => {
    setSessions(s => s[operatorId] ? ({ ...s, [operatorId]: { ...s[operatorId], status: "stopped", ended_at: new Date().toISOString() } }) : s);
  };

  return { sessions, start, pause, resume, stop };
}
