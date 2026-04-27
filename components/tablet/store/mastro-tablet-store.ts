"use client";
import * as React from "react";
import { STORE as INITIAL } from "./mastro-tablet-data";
import {
  MastroTabletStore, FaseCommessa, Vano, AttivitaTimeline,
  Cliente, Commessa, Sopralluogo, Articolo, AvatarPreset,
  Preventivo, Produzione, Montaggio, Fattura, Pagamento,
} from "./mastro-tablet-types";

type Listener = () => void;
type SideEffectListener = (effect: SideEffect) => void;

export interface SideEffect {
  tipo: "preventivo" | "produzione" | "montaggio" | "fattura" | "pagamento";
  entityId: string;
  commessaId: string;
  msg: string;
}

class MastroStoreImpl {
  private state: MastroTabletStore;
  private listeners: Set<Listener> = new Set();
  private sideEffectListeners: Set<SideEffectListener> = new Set();

  constructor(initial: MastroTabletStore) {
    this.state = JSON.parse(JSON.stringify(initial));
  }

  getState(): MastroTabletStore { return this.state; }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }

  subscribeSideEffects(l: SideEffectListener): () => void {
    this.sideEffectListeners.add(l);
    return () => { this.sideEffectListeners.delete(l); };
  }

  private notify() { this.listeners.forEach((l) => l()); }
  private notifySideEffect(e: SideEffect) { this.sideEffectListeners.forEach((l) => l(e)); }

  // ============================================================
  // CAMBIO FASE COMMESSA con PROPAGAZIONE
  // ============================================================
  updateCommessaFase(commessaId: string, nuova: FaseCommessa, motivo?: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    if (c.fase === nuova) return;
    const vecchia = c.fase;
    c.fase = nuova;
    this.aggiungiTimeline(commessaId, nuova, motivo || `Avanzamento da ${vecchia} a ${nuova}`);

    // ============ PROPAGAZIONE CROSS-MODULO ============
    // rilievo_confermato -> preventivo: crea Preventivo
    if (vecchia === "rilievo_confermato" && nuova === "preventivo") {
      this.creaPreventivoAutomatico(c);
    }
    // ordine_confermato -> produzione: crea Produzione
    if (vecchia === "ordine_confermato" && nuova === "produzione") {
      this.creaProduzioneAutomatica(c);
    }
    // produzione -> montaggio: crea Montaggio
    if (vecchia === "produzione" && nuova === "montaggio") {
      this.creaMontaggioAutomatico(c);
    }
    // montaggio -> fattura: crea Fattura
    if (vecchia === "montaggio" && nuova === "fattura") {
      this.creaFatturaAutomatica(c);
    }
    // fattura -> pagata: crea Pagamento + aggiorna fattura
    if (vecchia === "fattura" && nuova === "pagata") {
      this.creaPagamentoAutomatico(c);
    }

    this.notify();
  }

  // -------------- HELPERS PROPAGAZIONE --------------

  private creaPreventivoAutomatico(c: Commessa) {
    const id = `prev-${Date.now().toString(36)}`;
    const numero = this.generaNumeroPreventivo();
    const oggi = this.dataOggi();
    const p: Preventivo = {
      id, numero,
      commessaId: c.id,
      data: oggi,
      importo: c.valore,
      stato: "inviato",
    };
    this.state.preventivi.push(p);
    this.aggiungiTimeline(c.id, "preventivo", `Preventivo ${numero} generato automaticamente`);
    this.notifySideEffect({
      tipo: "preventivo", entityId: id, commessaId: c.id,
      msg: `Preventivo ${numero} creato`,
    });
  }

  private creaProduzioneAutomatica(c: Commessa) {
    const id = `prod-${Date.now().toString(36)}`;
    const pezzi = c.vani.reduce((s, v) => s + (v.pezzi || 1), 0);
    const consegna = this.dataPlusGiorni(14);
    const p: Produzione = {
      id,
      commessaId: c.id,
      sistemaProfilo: "Aluplast IDEAL 7000",
      stato: "da_iniziare",
      avanzamentoPct: 0,
      pezzi,
      consegnaPrevista: consegna,
      operatoreProduzioneId: "op-walter",
    };
    this.state.produzioni.push(p);
    this.aggiungiTimeline(c.id, "produzione", `Produzione avviata - ${pezzi} pezzi, consegna ${consegna}`);
    this.notifySideEffect({
      tipo: "produzione", entityId: id, commessaId: c.id,
      msg: `Produzione di ${pezzi} pezzi avviata`,
    });
  }

  private creaMontaggioAutomatico(c: Commessa) {
    const id = `mon-${Date.now().toString(36)}`;
    const pezzi = c.vani.reduce((s, v) => s + (v.pezzi || 1), 0);
    const data = this.dataPlusGiorni(7);
    const m: Montaggio = {
      id,
      commessaId: c.id,
      data,
      ora: "09:00",
      durataOre: 6,
      pezzi,
      squadraIds: [c.posatoreId],
      stato: "pianificato",
    };
    this.state.montaggi.push(m);
    this.aggiungiTimeline(c.id, "montaggio", `Montaggio pianificato per ${data}, ${pezzi} pezzi`);
    this.notifySideEffect({
      tipo: "montaggio", entityId: id, commessaId: c.id,
      msg: `Montaggio ${data} pianificato`,
    });
  }

  private creaFatturaAutomatica(c: Commessa) {
    const id = `fat-${Date.now().toString(36)}`;
    const numero = this.generaNumeroFattura();
    const oggi = this.dataOggi();
    const f: Fattura = {
      id, numero,
      commessaId: c.id,
      data: oggi,
      importo: c.valore,
      stato: "emessa",
      scadenza: this.dataPlusGiorni(30),
    };
    this.state.fatture.push(f);
    this.aggiungiTimeline(c.id, "fattura", `Fattura ${numero} emessa per € ${c.valore.toLocaleString("it-IT")}`);
    this.notifySideEffect({
      tipo: "fattura", entityId: id, commessaId: c.id,
      msg: `Fattura ${numero} emessa`,
    });
  }

  private creaPagamentoAutomatico(c: Commessa) {
    const fattura = this.state.fatture.find((f) => f.commessaId === c.id && f.stato !== "pagata");
    if (!fattura) return;
    fattura.stato = "pagata";

    const id = `pag-${Date.now().toString(36)}`;
    const oggi = this.dataOggi();
    const p: Pagamento = {
      id,
      fatturaId: fattura.id,
      data: oggi,
      importo: fattura.importo,
      metodo: "Bonifico bancario",
    };
    this.state.pagamenti.push(p);
    this.aggiungiTimeline(c.id, "pagata", `Pagamento ricevuto - ${fattura.numero} saldata`);
    this.notifySideEffect({
      tipo: "pagamento", entityId: id, commessaId: c.id,
      msg: `Pagamento € ${fattura.importo.toLocaleString("it-IT")} registrato`,
    });
  }

  // -------------- UTILS --------------

  private dataOggi(): string {
    return new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  private dataPlusGiorni(g: number): string {
    const d = new Date();
    d.setDate(d.getDate() + g);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  private generaNumeroPreventivo(): string {
    const anno = new Date().getFullYear();
    const max = this.state.preventivi
      .map((p) => {
        const m = p.numero.match(/PR-(\d{4})-(\d+)/);
        return m && parseInt(m[1], 10) === anno ? parseInt(m[2], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);
    return `PR-${anno}-${String(max + 1).padStart(3, "0")}`;
  }

  private generaNumeroFattura(): string {
    const anno = new Date().getFullYear();
    const max = this.state.fatture
      .map((f) => {
        const m = f.numero.match(/FT-(\d{4})-(\d+)/);
        return m && parseInt(m[1], 10) === anno ? parseInt(m[2], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);
    return `FT-${anno}-${String(max + 1).padStart(3, "0")}`;
  }

  // ============================================================
  // ALTRI MUTATORS (gia esistenti)
  // ============================================================
  updateNote(commessaId: string, note: string) {
    const c = this.state.commesse.find((x) => x.id === commessaId);
    if (!c) return;
    c.note = note;
    this.notify();
  }

  addCommessa(payload: { clienteId: string; posatoreId: string; valore: number; note?: string }): string {
    const numero = this.generaNumeroCommessa();
    const id = `com-${Date.now().toString(36)}`;
    const oggi = this.dataOggi();
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

  addCliente(payload: Omit<Cliente, "id" | "preset"> & { preset?: AvatarPreset }): string {
    const id = `cli-${Date.now().toString(36)}`;
    const preset: AvatarPreset = payload.preset || (["a","b","c","d","e"][Math.floor(Math.random() * 5)] as AvatarPreset);
    const nuovo: Cliente = { ...payload, id, preset };
    this.state.clienti.push(nuovo);
    this.notify();
    return id;
  }

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

  addArticolo(payload: Omit<Articolo, "id">): string {
    const id = `ar-${Date.now().toString(36)}`;
    const nuovo: Articolo = { ...payload, id };
    this.state.articoli.push(nuovo);
    this.notify();
    return id;
  }

  private aggiungiTimeline(commessaId: string, fase: FaseCommessa, testo: string) {
    const att: AttivitaTimeline = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      commessaId,
      data: this.dataOggi(),
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

// Hook per ricevere notifiche side-effect (usato dal Toast Center)
export function useMastroSideEffects(handler: (e: SideEffect) => void) {
  React.useEffect(() => {
    return STORE_INSTANCE.subscribeSideEffects(handler);
  }, [handler]);
}
