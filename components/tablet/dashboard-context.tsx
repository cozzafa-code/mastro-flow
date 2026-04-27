"use client";
import * as React from "react";

export type Preset = "titolare" | "posatore" | "segreteria";
export type EntityType = "pratica" | "fattura" | "ordine";

interface DashboardContextValue {
  navigate: (sezione: string, params?: any) => void;
  openCommessa: (commessaId: string) => void;
  openCliente: (clienteId: string) => void;
  openEntity: (tipo: EntityType, id: string) => void;
  closeCommessa: () => void;
  expandPanel: (panelId: string | null) => void;
  // Legacy alias
  onExpand: (panelId: string) => void;
  preset: Preset;
  setPreset: (p: Preset) => void;
  presetRuolo: Preset;
  setPresetRuolo: (p: Preset) => void;
  selectedCommessaId: string | null;
}

const NOOP = () => {};
const DEFAULT_VAL: DashboardContextValue = {
  navigate: NOOP,
  openCommessa: NOOP,
  openCliente: NOOP,
  openEntity: NOOP,
  closeCommessa: NOOP,
  expandPanel: NOOP,
  onExpand: NOOP,
  preset: "titolare",
  setPreset: NOOP,
  presetRuolo: "titolare",
  setPresetRuolo: NOOP,
  selectedCommessaId: null,
};

const Ctx = React.createContext<DashboardContextValue>(DEFAULT_VAL);

export function useDashboard(): DashboardContextValue {
  return React.useContext(Ctx);
}

export interface DashboardProviderProps {
  children: React.ReactNode;
  // API NUOVA (preferita)
  navigate?: (sezione: string, params?: any) => void;
  openCommessa?: (id: string) => void;
  openCliente?: (id: string) => void;
  openEntity?: (tipo: EntityType, id: string) => void;
  closeCommessa?: () => void;
  expandPanel?: (id: string | null) => void;
  presetRuolo?: Preset;
  setPresetRuolo?: (p: Preset) => void;
  // API LEGACY (compat)
  onNavigate?: (sezione: string, params?: any) => void;
  onExpand?: (id: string) => void;
  preset?: Preset;
  setPreset?: (p: Preset) => void;
  selectedCommessaId?: string | null;
}

export function DashboardProvider(props: DashboardProviderProps) {
  // Risolvi handlers da entrambi i nomi
  const navigateFn = props.navigate || props.onNavigate || NOOP;
  const expandFn = props.expandPanel || ((id: string | null) => { if (id && props.onExpand) props.onExpand(id); });
  const expandLegacy = props.onExpand || ((id: string) => { if (props.expandPanel) props.expandPanel(id); });
  const presetVal = props.preset || props.presetRuolo || "titolare";
  const setPresetFn = props.setPreset || props.setPresetRuolo || NOOP;

  const value: DashboardContextValue = {
    navigate: navigateFn,
    openCommessa: props.openCommessa || NOOP,
    openCliente: props.openCliente || NOOP,
    openEntity: props.openEntity || NOOP,
    closeCommessa: props.closeCommessa || NOOP,
    expandPanel: expandFn,
    onExpand: expandLegacy,
    preset: presetVal,
    setPreset: setPresetFn,
    presetRuolo: presetVal,
    setPresetRuolo: setPresetFn,
    selectedCommessaId: props.selectedCommessaId ?? null,
  };

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}
