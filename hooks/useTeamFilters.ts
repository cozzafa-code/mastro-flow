// hooks/useTeamFilters.ts
"use client";
import { useState, useMemo } from "react";
import type { Operator } from "@/lib/types/team";

export type TeamTab = "tutti" | "attivi" | "squadre" | "problemi";

export function useTeamFilters(operators: Operator[]) {
  const [tab, setTab] = useState<TeamTab>("tutti");
  const filtered = useMemo(() => tab === "attivi"
    ? operators.filter(o => ["attivo","pausa","viaggio","fermo"].includes(o.status))
    : operators, [operators, tab]);
  return { tab, setTab, filtered };
}
