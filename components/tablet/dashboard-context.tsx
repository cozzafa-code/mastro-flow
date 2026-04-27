"use client";
import * as React from "react";

export type EntityType = "pratica" | "fattura" | "ordine";

interface DashboardContextValue {
  navigate: (sezione: string) => void;
  openCommessa: (commessaId: string) => void;
  openCliente: (clienteId: string) => void;
  openEntity: (tipo: EntityType, id: string) => void;
  expandPanel: (panelId: string | null) => void;
  presetRuolo: "titolare" | "posatore" | "segreteria";
  setPresetRuolo: (p: "titolare" | "posatore" | "segreteria") => void;
}

const Ctx = React.createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("useDashboard must be used inside DashboardProvider");
  return c;
}

export interface DashboardProviderProps {
  children: React.ReactNode;
  navigate: (sezione: string) => void;
  openCommessa: (id: string) => void;
  openCliente: (id: string) => void;
  openEntity: (tipo: EntityType, id: string) => void;
  expandPanel: (id: string | null) => void;
  presetRuolo: "titolare" | "posatore" | "segreteria";
  setPresetRuolo: (p: "titolare" | "posatore" | "segreteria") => void;
}

export function DashboardProvider(props: DashboardProviderProps) {
  return (
    <Ctx.Provider value={{
      navigate: props.navigate,
      openCommessa: props.openCommessa,
      openCliente: props.openCliente,
      openEntity: props.openEntity,
      expandPanel: props.expandPanel,
      presetRuolo: props.presetRuolo,
      setPresetRuolo: props.setPresetRuolo,
    }}>
      {props.children}
    </Ctx.Provider>
  );
}
