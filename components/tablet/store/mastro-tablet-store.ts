"use client";
import * as React from "react";
import { STORE as INITIAL } from "./mastro-tablet-data";
import {
  MastroTabletStore, FaseCommessa, Vano, AttivitaTimeline,
} from "./mastro-tablet-types";

// =========================================================
// STORE GLOBALE MUTABILE - sub/notify pattern
// =========================================================

type Listener = () => void;

class MastroStoreImpl {
  private state: MastroTabletStore;
  private listeners: Set<Listener> = new Set();

  constructor(initial: MastroTabletStore) {
    // deep clone per non mutare la costante esportata
    this.state = JSON.parse(JSON.stringify(initial));
  }

  getState(): MastroTabletStore {
    return this.state;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ---------- COMMESSA ----------
  updateCommessaFase(commessaId: string, nuova: FaseCommessa, motivo?: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    const vecchia = c.fase;
    if (vecchia === nuova) return;
    c.fase = nuova;
    this.aggiungiTimeline(commessaId, nuova, motivo || `Avanzamento da ${vecchia} a ${nuova}`);
    this.notify();
  }

  updateNote(commessaId: string, note: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    c.note = note;
    this.notify();
  }

  // ---------- VANI ----------
  addVano(commessaId: string, vano: Omit<Vano, "id">) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    const id = `v-${Date.now()}`;
    c.vani.push({ ...vano, id });
    this.aggiungiTimeline(commessaId, c.fase, `Aggiunto vano ${vano.codice} - ${vano.ambiente}`);
    this.notify();
  }

  updateVano(commessaId: string, vanoId: string, patch: Partial<Vano>) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    const v = c.vani.find((vv) => vv.id === vanoId);
    if (!v) return;
    Object.assign(v, patch);
    this.notify();
  }

  deleteVano(commessaId: string, vanoId: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    const v = c.vani.find((vv) => vv.id === vanoId);
    c.vani = c.vani.filter((vv) => vv.id !== vanoId);
    if (v) this.aggiungiTimeline(commessaId, c.fase, `Rimosso vano ${v.codice}`);
    this.notify();
  }

  // ---------- TIMELINE ----------
  private aggiungiTimeline(commessaId: string, fase: FaseCommessa, testo: string) {
    const att: AttivitaTimeline = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      commessaId,
      data: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }),
      fase,
      testo,
      autoreId: "op-walter",
    };
    this.state.timeline.push(att);
  }
}

// Singleton istanza
const STORE_INSTANCE = new MastroStoreImpl(INITIAL);

// =========================================================
// HOOK REATTIVO
// =========================================================
export function useMastroStore(): MastroTabletStore {
  const [, force] = React.useReducer((x) => x + 1, 0);
  React.useEffect(() => {
    const unsub = STORE_INSTANCE.subscribe(force);
    return unsub;
  }, []);
  return STORE_INSTANCE.getState();
}

export function useMastroMutators() {
  return React.useMemo(() => ({
    updateCommessaFase: (id: string, fase: FaseCommessa, motivo?: string) =>
      STORE_INSTANCE.updateCommessaFase(id, fase, motivo),
    addVano: (commessaId: string, vano: Omit<Vano, "id">) =>
      STORE_INSTANCE.addVano(commessaId, vano),
    updateVano: (commessaId: string, vanoId: string, patch: Partial<Vano>) =>
      STORE_INSTANCE.updateVano(commessaId, vanoId, patch),
    deleteVano: (commessaId: string, vanoId: string) =>
      STORE_INSTANCE.deleteVano(commessaId, vanoId),
    updateNote: (commessaId: string, note: string) =>
      STORE_INSTANCE.updateNote(commessaId, note),
  }), []);
}
