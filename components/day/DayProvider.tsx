"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { DaySheet } from "./DaySheet";
import { DayFocus } from "./DayFocus";

interface DayCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<DayCtx | null>(null);

export function DayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) return;
      if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // D63 · listener "mastro:open_day" (dalla barra Focus)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("mastro:open_day", onOpen);
    return () => window.removeEventListener("mastro:open_day", onOpen);
  }, []);

  return (
    <Ctx.Provider value={{ open, setOpen, toggle }}>
      {children}
      <DayFocus />
      <DaySheet open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export function useDayUI(): DayCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { open: false, setOpen: () => {}, toggle: () => {} };
  return ctx;
}
