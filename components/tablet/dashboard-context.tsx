"use client";
import * as React from "react";

type Preset = "titolare" | "posatore" | "segreteria";

interface DashboardCtx {
  navigate: (sezione: string, params?: any) => void;
  expand: (blocco: string) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
  // NUOVO: commessa aperta
  selectedCommessaId: string | null;
  openCommessa: (id: string) => void;
  closeCommessa: () => void;
}

const DashboardContext = React.createContext<DashboardCtx | null>(null);

export interface DashboardProviderProps {
  children: React.ReactNode;
  onNavigate: (sezione: string, params?: any) => void;
  onExpand: (blocco: string) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
  selectedCommessaId: string | null;
  openCommessa: (id: string) => void;
  closeCommessa: () => void;
}

export function DashboardProvider({
  children, onNavigate, onExpand, preset, setPreset,
  selectedCommessaId, openCommessa, closeCommessa,
}: DashboardProviderProps) {
  return (
    <DashboardContext.Provider value={{
      navigate: onNavigate, expand: onExpand,
      preset, setPreset,
      selectedCommessaId, openCommessa, closeCommessa,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardCtx {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    return {
      navigate: () => {}, expand: () => {},
      preset: "titolare", setPreset: () => {},
      selectedCommessaId: null,
      openCommessa: () => {}, closeCommessa: () => {},
    };
  }
  return ctx;
}

export type { Preset };
