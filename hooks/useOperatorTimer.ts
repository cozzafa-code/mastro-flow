// hooks/useOperatorTimer.ts
"use client";
import { useState, useEffect } from "react";
export function useLiveTimer(startedAt: string | null | undefined, isPaused?: boolean): string {
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    if (!startedAt || isPaused) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [startedAt, isPaused]);
  if (!startedAt) return "—";
  try {
    const s = new Date(startedAt).getTime();
    const d = Math.max(0, now - s);
    const h = Math.floor(d / 3600000);
    const m = Math.floor((d % 3600000) / 60000);
    return h > 0 ? `${h}h ${String(m).padStart(2,"0")}m` : `${m}m`;
  } catch { return "—"; }
}
