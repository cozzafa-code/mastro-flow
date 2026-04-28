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
    const start = new Date(startedAt).getTime();
    const diff = Math.max(0, now - start);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${String(m).padStart(2,"0")}m`;
    return `${m}m`;
  } catch { return "—"; }
}
