"use client";
import * as React from "react";

type Preset = "titolare" | "posatore" | "segreteria";

interface DashboardCtx {
  navigate: (sezione: string, params?: any) => void;
  expand: (blocco: string) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
}

const DashboardContext = React.createContext<DashboardCtx | null>(null);

export interface DashboardProviderProps {
  children: React.ReactNode;
  onNavigate: (sezione: string, params?: any) => void;
  onExpand: (blocco: string) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
}

export function DashboardProvider({
  children,
  onNavigate,
  onExpand,
  preset,
  setPreset,
}: DashboardProviderProps) {
  return (
    <DashboardContext.Provider
      value={{ navigate: onNavigate, expand: onExpand, preset, setPreset }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardCtx {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    // Fallback no-op per quando il context non e' montato
    return {
      navigate: () => {},
      expand: () => {},
      preset: "titolare",
      setPreset: () => {},
    };
  }
  return ctx;
}

export type { Preset };
