"use client";
import * as React from "react";
import { STORE as INITIAL } from "./mastro-tablet-data";
import {
  MastroTabletStore, FaseCommessa, Vano, AttivitaTimeline,
  Cliente, Commessa, Sopralluogo, Articolo, AvatarPreset,
} from "./mastro-tablet-types";

type Listener = () => void;

class MastroStoreImpl {
  private state: MastroTabletStore;
  private listeners: Set<Listener> = new Set();

  constructor(initial: MastroTabletStore) {
    this.state = JSON.parse(JSON.stringify(initial));
  }

  getState(): MastroTabletStore { return this.state; }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }

  private notify() { this.listeners.forEach((l) => l()); }

  // ---------- COMMESSA ----------
  updateCommessaFase(commessaId: string, nuova: FaseCommessa, motivo?: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    if (c.fase === nuova) return;
    const vecchia = c.fase;
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

  addCommessa(payload: { clienteId: string; posatoreId: string; valore: number; note?: string }): string {
    const numero = this.generaNumeroCommessa();
    const id = `com-${Date.now().toString(36)}`;
    const oggi = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
    const nuova: Commessa = {
      id, numero,
      clienteId: payload.clienteId,
      apertaIl: oggi,
      fase: "rilievo",
      vani: [],
      posatoreId: payload.posatoreId,
      valore: payload.valore,
      note: payload.note,
    };
    this.state.commesse.unshift(nuova);
    this.aggiungiTimeline(id, "rilievo", `Commessa ${numero} aperta`);
    this.notify();
    return id;
  }

  private generaNumeroCommessa(): string {
    const anno = new Date().getFullYear();
    const max = this.state.commesse
      .map((c) => {
        const m = c.numero.match(/C-(\d{4})-(\d+)/);
        return m && parseInt(m[1], 10) === anno ? parseInt(m[2], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);
    return `C-${anno}-${String(max + 1).padStart(3, "0")}`;
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

  // ---------- CLIENTI ----------
  addCliente(payload: Omit<Cliente, "id" | "preset"> & { preset?: AvatarPreset }): string {
    const id = `cli-${Date.now().toString(36)}`;
    const preset: AvatarPreset = payload.preset || (["a","b","c","d","e"][Math.floor(Math.random() * 5)] as AvatarPreset);
    const nuovo: Cliente = { ...payload, id, preset };
    this.state.clienti.push(nuovo);
    this.notify();
    return id;
  }

  // ---------- SOPRALLUOGHI ----------
  addSopralluogo(payload: { clienteId: string; data: string; giorno: string; ora: string; posatoreId: string; note?: string }): string {
    const id = `sop-${Date.now().toString(36)}`;
    const numero = this.generaNumeroSopralluogo();
    const nuovo: Sopralluogo = {
      id, numero,
      clienteId: payload.clienteId,
      data: payload.data,
      giorno: payload.giorno,
      ora: payload.ora,
      posatoreId: payload.posatoreId,
      stato: "confermato",
      note: payload.note,
    };
    this.state.sopralluoghi.unshift(nuovo);
    this.notify();
    return id;
  }

  private generaNumeroSopralluogo(): string {
    const anno = new Date().getFullYear();
    const max = this.state.sopralluoghi
      .map((s) => {
        const m = s.numero.match(/SP-(\d{4})-(\d+)/);
        return m && parseInt(m[1], 10) === anno ? parseInt(m[2], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);
    return `SP-${anno}-${String(max + 1).padStart(3, "0")}`;
  }

  // ---------- ARTICOLI ----------
  addArticolo(payload: Omit<Articolo, "id">): string {
    const id = `ar-${Date.now().toString(36)}`;
    const nuovo: Articolo = { ...payload, id };
    this.state.articoli.push(nuovo);
    this.notify();
    return id;
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

const STORE_INSTANCE = new MastroStoreImpl(INITIAL);

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
    addCommessa: (payload: { clienteId: string; posatoreId: string; valore: number; note?: string }) =>
      STORE_INSTANCE.addCommessa(payload),
    addCliente: (payload: any) => STORE_INSTANCE.addCliente(payload),
    addSopralluogo: (payload: any) => STORE_INSTANCE.addSopralluogo(payload),
    addArticolo: (payload: any) => STORE_INSTANCE.addArticolo(payload),
  }), []);
}
