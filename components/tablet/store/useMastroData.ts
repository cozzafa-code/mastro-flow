"use client";
import { useMastroStore } from "./mastro-tablet-store";
import * as React from "react";
import {
  Cliente, Commessa, Sopralluogo, Preventivo, OrdineFornitore,
  Produzione, Montaggio, Fattura, Pagamento, PraticaFiscale,
  Articolo, MovimentoMagazzino, Operatore, AttivitaTimeline,
  FaseCommessa,
} from "./mastro-tablet-types";

// =========================================================
// CONTEXT PER RUOLO ATTIVO (letto da MastroTablet)
// =========================================================
type Ruolo = "titolare" | "posatore" | "segreteria";

const RuoloCtx = React.createContext<{
  ruolo: Ruolo;
  currentUserId: string;
}>({
  ruolo: "titolare",
  currentUserId: "op-walter",
});

export function RuoloProvider({ ruolo, currentUserId, children }: { ruolo: Ruolo; currentUserId: string; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ ruolo, currentUserId }), [ruolo, currentUserId]);
  return <RuoloCtx.Provider value={value}>{children}</RuoloCtx.Provider>;
}

export function useRuoloContext() {
  return React.useContext(RuoloCtx);
}

// =========================================================
// HOOK PRINCIPALE - role-aware
// =========================================================
export function useMastroData() {
  const STORE = useMastroStore();
  const { ruolo, currentUserId } = useRuoloContext();

  // ============ FILTRO COMMESSE ============
  // Posatore: solo sue (assegnate come posatoreId)
  // Segreteria: tutte tranne quelle in fase produzione/montaggio (focus admin)
  // Titolare: tutte
  const filterCommesseByRuolo = (commesse: Commessa[]): Commessa[] => {
    if (ruolo === "posatore") {
      return commesse.filter((c) => c.posatoreId === currentUserId);
    }
    return commesse;
  };

  // ============ FILTRO SOPRALLUOGHI ============
  const filterSopralluoghiByRuolo = (s: Sopralluogo[]): Sopralluogo[] => {
    if (ruolo === "posatore") {
      return s.filter((x) => x.posatoreId === currentUserId);
    }
    return s;
  };

  // ============ FILTRO MONTAGGI ============
  const filterMontaggiByRuolo = (m: Montaggio[]): Montaggio[] => {
    if (ruolo === "posatore") {
      return m.filter((x) => x.squadraIds.includes(currentUserId));
    }
    return m;
  };

  // ============ CLIENTI ============
  // Posatore vede solo i clienti delle sue commesse
  const getClienti = (): Cliente[] => {
    if (ruolo === "posatore") {
      const ids = new Set(filterCommesseByRuolo(STORE.commesse).map((c) => c.clienteId));
      return STORE.clienti.filter((c) => ids.has(c.id));
    }
    return STORE.clienti;
  };
  const getCliente = (id: string): Cliente | undefined => STORE.clienti.find((c) => c.id === id);
  const getClienteByName = (nome: string): Cliente | undefined => STORE.clienti.find((c) => c.nome === nome);

  // ============ COMMESSE (filtrate) ============
  const getCommesse = (): Commessa[] => filterCommesseByRuolo(STORE.commesse);
  const getCommessa = (id: string): Commessa | undefined => STORE.commesse.find((c) => c.id === id);
  const getCommessaByNumero = (numero: string): Commessa | undefined => STORE.commesse.find((c) => c.numero === numero);
  const getCommesseByCliente = (clienteId: string): Commessa[] => filterCommesseByRuolo(STORE.commesse.filter((c) => c.clienteId === clienteId));
  const getCommesseByFase = (fase: FaseCommessa): Commessa[] => filterCommesseByRuolo(STORE.commesse).filter((c) => c.fase === fase);

  // ============ SOPRALLUOGHI (filtrati) ============
  const getSopralluoghi = (): Sopralluogo[] => filterSopralluoghiByRuolo(STORE.sopralluoghi);
  const getSopralluogo = (id: string): Sopralluogo | undefined => STORE.sopralluoghi.find((s) => s.id === id);
  const getSopralluoghiByCommessa = (commessaId: string): Sopralluogo[] => STORE.sopralluoghi.filter((s) => s.commessaId === commessaId);

  // ============ PREVENTIVI ============
  const getPreventiviByCommessa = (commessaId: string): Preventivo[] => STORE.preventivi.filter((p) => p.commessaId === commessaId);
  const getPreventivoByCommessa = (commessaId: string): Preventivo | undefined => STORE.preventivi.find((p) => p.commessaId === commessaId);

  // ============ ORDINI ============
  // Posatore non vede ordini fornitori (admin)
  const getOrdini = (): OrdineFornitore[] => {
    if (ruolo === "posatore") return [];
    return STORE.ordini;
  };
  const getOrdiniByCommessa = (commessaId: string): OrdineFornitore[] => STORE.ordini.filter((o) => o.commessaIds.includes(commessaId));

  // ============ PRODUZIONE ============
  // Posatore vede solo produzione delle sue commesse
  const getProduzioni = (): Produzione[] => {
    if (ruolo === "posatore") {
      const mieCommesseIds = new Set(filterCommesseByRuolo(STORE.commesse).map((c) => c.id));
      return STORE.produzioni.filter((p) => mieCommesseIds.has(p.commessaId));
    }
    return STORE.produzioni;
  };
  const getProduzioneByCommessa = (commessaId: string): Produzione | undefined => STORE.produzioni.find((p) => p.commessaId === commessaId);

  // ============ MONTAGGI (filtrati) ============
  const getMontaggi = (): Montaggio[] => filterMontaggiByRuolo(STORE.montaggi);
  const getMontaggiByCommessa = (commessaId: string): Montaggio[] => STORE.montaggi.filter((m) => m.commessaId === commessaId);

  // ============ FATTURE ============
  // Posatore non vede fatture (admin)
  const getFatture = (): Fattura[] => {
    if (ruolo === "posatore") return [];
    return STORE.fatture;
  };
  const getFattureByCommessa = (commessaId: string): Fattura[] => STORE.fatture.filter((f) => f.commessaId === commessaId);

  // ============ PAGAMENTI ============
  const getPagamenti = (): Pagamento[] => {
    if (ruolo === "posatore") return [];
    return STORE.pagamenti;
  };

  // ============ PRATICHE ============
  const getPratiche = (): PraticaFiscale[] => {
    if (ruolo === "posatore") return [];
    return STORE.pratiche;
  };
  const getPraticaByCommessa = (commessaId: string): PraticaFiscale | undefined => STORE.pratiche.find((p) => p.commessaId === commessaId);

  // ============ ARTICOLI ============
  const getArticoli = (): Articolo[] => STORE.articoli;
  const getArticolo = (id: string): Articolo | undefined => STORE.articoli.find((a) => a.id === id);

  // ============ MOVIMENTI ============
  const getMovimenti = (): MovimentoMagazzino[] => STORE.movimenti;

  // ============ OPERATORI ============
  const getOperatori = (): Operatore[] => STORE.operatori;
  const getOperatore = (id: string): Operatore | undefined => STORE.operatori.find((o) => o.id === id);
  const getOperatoreFullName = (id: string): string => {
    const o = getOperatore(id);
    return o ? `${o.nome} ${o.cognome}` : "?";
  };

  // ============ TIMELINE ============
  const getTimelineByCommessa = (commessaId: string): AttivitaTimeline[] => STORE.timeline.filter((t) => t.commessaId === commessaId);

  // ============ KPI Dashboard role-aware ============
  const getKPIDashboard = () => {
    const mieCommesse = getCommesse();
    const commesseAttive = mieCommesse.filter((c) =>
      ["rilievo","rilievo_confermato","preventivo","conferma_ordine","ordine_confermato","produzione","montaggio","fattura"].includes(c.fase)
    ).length;
    const sopralluoghiOggi = getSopralluoghi().filter((s) => s.giorno.startsWith("Mar 28") || s.giorno.startsWith("Lun 27")).length;
    const produzioneInCorso = getProduzioni().filter((p) => ["da_iniziare","in_lavorazione","qa"].includes(p.stato)).length;
    const fatturatoMese = getFatture().filter((f) => f.data.includes("apr 2026")).reduce((s, f) => s + f.importo, 0);
    const totIncassato = getFatture().filter((f) => f.stato === "pagata").reduce((s, f) => s + f.importo, 0);
    const margine = fatturatoMese > 0 ? Math.round((totIncassato / fatturatoMese) * 100) : 0;
    return { commesseAttive, sopralluoghiOggi, produzioneInCorso, fatturatoMese, margine };
  };

  return {
    ruolo, currentUserId,
    getClienti, getCliente, getClienteByName,
    getCommesse, getCommessa, getCommessaByNumero, getCommesseByCliente, getCommesseByFase,
    getSopralluoghi, getSopralluogo, getSopralluoghiByCommessa,
    getPreventiviByCommessa, getPreventivoByCommessa,
    getOrdini, getOrdiniByCommessa,
    getProduzioni, getProduzioneByCommessa,
    getMontaggi, getMontaggiByCommessa,
    getFatture, getFattureByCommessa,
    getPagamenti,
    getPratiche, getPraticaByCommessa,
    getArticoli, getArticolo,
    getMovimenti,
    getOperatori, getOperatore, getOperatoreFullName,
    getTimelineByCommessa,
    getKPIDashboard,
  };
}
