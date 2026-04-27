"use client";
import { useMastroStore } from "./mastro-tablet-store";
import {
  Cliente, Commessa, Sopralluogo, Preventivo, OrdineFornitore,
  Produzione, Montaggio, Fattura, Pagamento, PraticaFiscale,
  Articolo, MovimentoMagazzino, Operatore, AttivitaTimeline,
  FaseCommessa,
} from "./mastro-tablet-types";

export function useMastroData() {
  const STORE = useMastroStore();

  // CLIENTI
  const getClienti = (): Cliente[] => STORE.clienti;
  const getCliente = (id: string): Cliente | undefined => STORE.clienti.find((c) => c.id === id);
  const getClienteByName = (nome: string): Cliente | undefined => STORE.clienti.find((c) => c.nome === nome);

  // COMMESSE
  const getCommesse = (): Commessa[] => STORE.commesse;
  const getCommessa = (id: string): Commessa | undefined => STORE.commesse.find((c) => c.id === id);
  const getCommessaByNumero = (numero: string): Commessa | undefined => STORE.commesse.find((c) => c.numero === numero);
  const getCommesseByCliente = (clienteId: string): Commessa[] => STORE.commesse.filter((c) => c.clienteId === clienteId);
  const getCommesseByFase = (fase: FaseCommessa): Commessa[] => STORE.commesse.filter((c) => c.fase === fase);

  // SOPRALLUOGHI
  const getSopralluoghi = (): Sopralluogo[] => STORE.sopralluoghi;
  const getSopralluogo = (id: string): Sopralluogo | undefined => STORE.sopralluoghi.find((s) => s.id === id);
  const getSopralluoghiByCommessa = (commessaId: string): Sopralluogo[] => STORE.sopralluoghi.filter((s) => s.commessaId === commessaId);

  // PREVENTIVI
  const getPreventiviByCommessa = (commessaId: string): Preventivo[] => STORE.preventivi.filter((p) => p.commessaId === commessaId);
  const getPreventivoByCommessa = (commessaId: string): Preventivo | undefined => STORE.preventivi.find((p) => p.commessaId === commessaId);

  // ORDINI
  const getOrdini = (): OrdineFornitore[] => STORE.ordini;
  const getOrdiniByCommessa = (commessaId: string): OrdineFornitore[] => STORE.ordini.filter((o) => o.commessaIds.includes(commessaId));

  // PRODUZIONE
  const getProduzioni = (): Produzione[] => STORE.produzioni;
  const getProduzioneByCommessa = (commessaId: string): Produzione | undefined => STORE.produzioni.find((p) => p.commessaId === commessaId);

  // MONTAGGI
  const getMontaggi = (): Montaggio[] => STORE.montaggi;
  const getMontaggiByCommessa = (commessaId: string): Montaggio[] => STORE.montaggi.filter((m) => m.commessaId === commessaId);

  // FATTURE
  const getFatture = (): Fattura[] => STORE.fatture;
  const getFattureByCommessa = (commessaId: string): Fattura[] => STORE.fatture.filter((f) => f.commessaId === commessaId);

  // PAGAMENTI
  const getPagamenti = (): Pagamento[] => STORE.pagamenti;

  // PRATICHE
  const getPratiche = (): PraticaFiscale[] => STORE.pratiche;
  const getPraticaByCommessa = (commessaId: string): PraticaFiscale | undefined => STORE.pratiche.find((p) => p.commessaId === commessaId);

  // ARTICOLI
  const getArticoli = (): Articolo[] => STORE.articoli;
  const getArticolo = (id: string): Articolo | undefined => STORE.articoli.find((a) => a.id === id);

  // MOVIMENTI
  const getMovimenti = (): MovimentoMagazzino[] => STORE.movimenti;

  // OPERATORI
  const getOperatori = (): Operatore[] => STORE.operatori;
  const getOperatore = (id: string): Operatore | undefined => STORE.operatori.find((o) => o.id === id);
  const getOperatoreFullName = (id: string): string => {
    const o = getOperatore(id);
    return o ? `${o.nome} ${o.cognome}` : "?";
  };

  // TIMELINE
  const getTimelineByCommessa = (commessaId: string): AttivitaTimeline[] => STORE.timeline.filter((t) => t.commessaId === commessaId);

  // KPI
  const getKPIDashboard = () => {
    const commesseAttive = STORE.commesse.filter((c) =>
      ["rilievo","rilievo_confermato","preventivo","conferma_ordine","ordine_confermato","produzione","montaggio","fattura"].includes(c.fase)
    ).length;
    const sopralluoghiOggi = STORE.sopralluoghi.filter((s) => s.giorno.startsWith("Mar 28") || s.giorno.startsWith("Lun 27")).length;
    const produzioneInCorso = STORE.produzioni.filter((p) => ["da_iniziare","in_lavorazione","qa"].includes(p.stato)).length;
    const fatturatoMese = STORE.fatture.filter((f) => f.data.includes("apr 2026")).reduce((s, f) => s + f.importo, 0);
    const totIncassato = STORE.fatture.filter((f) => f.stato === "pagata").reduce((s, f) => s + f.importo, 0);
    const margine = fatturatoMese > 0 ? Math.round((totIncassato / fatturatoMese) * 100) : 0;
    return { commesseAttive, sopralluoghiOggi, produzioneInCorso, fatturatoMese, margine };
  };

  return {
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
