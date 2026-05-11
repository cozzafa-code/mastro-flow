"use client";
// hooks/useClienteAI.ts - AI Memory L1 zero-cost per dossier cliente

import { useMemo } from "react";
import type { ClienteDossier, ClienteEvento } from "./useDossierCliente";
import type { Comunicazione } from "./useComunicazioni";
import type { CommessaCliente, FatturaCliente, PagamentiStats } from "./useDossierExtra";
import type { Immobile, InfissoInstallato } from "./useImmobili";

export interface AIInsight {
  id: string;
  tipo: 'suggerimento' | 'preferenza' | 'upsell' | 'alert' | 'memo';
  priorita: 'alta' | 'media' | 'bassa';
  icona: string;
  titolo: string;
  descrizione: string;
  azione?: string;
  colore: string;
}

interface Input {
  cliente: ClienteDossier | null;
  eventi: ClienteEvento[];
  comunicazioni: Comunicazione[];
  commesse: CommessaCliente[];
  fatture: FatturaCliente[];
  pagamentiStats: PagamentiStats;
  immobili: Immobile[];
  infissi: InfissoInstallato[];
}

const COLORS = {
  RED: '#DC2626', AMBER: '#D97706', TEAL: '#0F6E56', BLUE: '#1E40AF',
  PURPLE: '#7E22CE', GREEN: '#10B981',
};

export function useClienteAI(input: Input) {
  return useMemo(() => analizza(input), [input.cliente?.id, input.eventi.length, input.comunicazioni.length, input.fatture.length, input.commesse.length, input.infissi.length]);
}

function analizza(input: Input) {
  const insights: AIInsight[] = [];
  const { cliente, eventi, comunicazioni, commesse, fatture, pagamentiStats, immobili, infissi } = input;
  if (!cliente) return { insights: [], riassuntoVocale: '', preferenzeRilevate: [], upsellOpportunities: [], alertPreChiamata: null };

  // ============ ALERT PRE-CHIAMATA ============
  // Ultimo evento problema non risolto
  const ultimoProblema = eventi.find(e => e.categoria === 'problema' && e.severity !== 'success');
  if (ultimoProblema) {
    const giorni = Math.floor((Date.now() - new Date(ultimoProblema.data_evento).getTime()) / 86400000);
    insights.push({
      id: 'alert-problema',
      tipo: 'alert',
      priorita: 'alta',
      icona: '⚠️',
      titolo: `Problema aperto da ${giorni}g`,
      descrizione: `${ultimoProblema.titolo}. Risolvere prima di proporre nuovi lavori.`,
      colore: COLORS.RED,
    });
  }

  // Tag emozionali rischiosi
  const tagRischiosi = cliente.tag_emozionali.filter(t => 
    ['ansioso', 'esigente', 'problematico', 'pagamento_lento'].includes(t)
  );
  if (tagRischiosi.length > 0) {
    insights.push({
      id: 'alert-tag',
      tipo: 'alert',
      priorita: 'alta',
      icona: '🎯',
      titolo: 'Profilo da gestire con cura',
      descrizione: `Cliente segnato come: ${tagRischiosi.join(', ').replace(/_/g, ' ')}. Approccio empatico e tempi chiari.`,
      colore: COLORS.AMBER,
    });
  }

  // ============ PREFERENZE CONTATTO RILEVATE ============
  // Conta canali usati
  const canaleCount: Record<string, number> = {};
  comunicazioni.forEach(c => { canaleCount[c.canale] = (canaleCount[c.canale] || 0) + 1; });
  const canalePref = Object.entries(canaleCount).sort((a, b) => b[1] - a[1])[0];
  
  if (canalePref && canalePref[1] >= 2) {
    const canaleLabel: Record<string, string> = {
      whatsapp: '💬 WhatsApp', email: '✉️ Email', chiamata: '📞 chiamata',
      vocale: '🎙️ vocale', sms: '📱 SMS',
    };
    const totCom = comunicazioni.length;
    const pct = Math.round((canalePref[1] / totCom) * 100);
    insights.push({
      id: 'pref-canale',
      tipo: 'preferenza',
      priorita: 'media',
      icona: '💡',
      titolo: `Preferisce ${canaleLabel[canalePref[0]] || canalePref[0]}`,
      descrizione: `${pct}% delle comunicazioni (${canalePref[1]}/${totCom}) avvenute su questo canale.`,
      azione: canalePref[0] === 'whatsapp' ? 'apri-wa' : canalePref[0] === 'email' ? 'apri-email' : canalePref[0] === 'chiamata' ? 'chiama' : undefined,
      colore: COLORS.BLUE,
    });
  }

  // Orari preferiti
  if (cliente.preferenze_contatto?.no_dopo) {
    insights.push({
      id: 'pref-orario',
      tipo: 'preferenza',
      priorita: 'media',
      icona: '⏰',
      titolo: `Non chiamare dopo le ${cliente.preferenze_contatto.no_dopo}`,
      descrizione: 'Preferenza esplicita registrata dal cliente.',
      colore: COLORS.AMBER,
    });
  }

  // ============ SUGGERIMENTI CONTESTUALI ============
  // Comunicazioni da rispondere
  const daRispondere = comunicazioni.filter(c => c.rispondere);
  if (daRispondere.length > 0) {
    const ultimo = daRispondere[0];
    const giorni = Math.floor((Date.now() - new Date(ultimo.data_comunicazione).getTime()) / 86400000);
    insights.push({
      id: 'suggest-rispondi',
      tipo: 'suggerimento',
      priorita: 'alta',
      icona: '🔴',
      titolo: `${daRispondere.length} messaggi attendono risposta`,
      descrizione: `Ultimo da ${giorni}g: "${(ultimo.contenuto || '').slice(0, 80)}${(ultimo.contenuto || '').length > 80 ? '...' : ''}"`,
      colore: COLORS.RED,
    });
  }

  // Fatture in ritardo
  const fattureRitardo = fatture.filter(f => !f.pagata && f.giorni_ritardo > 0);
  if (fattureRitardo.length > 0) {
    const giorniMax = Math.max(...fattureRitardo.map(f => f.giorni_ritardo));
    insights.push({
      id: 'suggest-sollecito',
      tipo: 'suggerimento',
      priorita: 'alta',
      icona: '💸',
      titolo: `${fattureRitardo.length} fatture scadute (+${giorniMax}g max)`,
      descrizione: `Importo: €${Math.round(fattureRitardo.reduce((s, f) => s + f.totale, 0)).toLocaleString('it-IT')}. Considera sollecito.`,
      colore: COLORS.RED,
    });
  }

  // Acconto mancante per produzione bloccata
  const cmAcconto = commesse.find(c => c.fase === 'ordine' && c.importo_pagato === 0 && c.totale > 0);
  if (cmAcconto) {
    insights.push({
      id: 'suggest-acconto',
      tipo: 'suggerimento',
      priorita: 'media',
      icona: '💰',
      titolo: `Commessa ${cmAcconto.code} attende acconto`,
      descrizione: `Totale €${cmAcconto.totale.toLocaleString('it-IT')}. Produzione bloccata fino acconto.`,
      colore: COLORS.AMBER,
    });
  }

  // Ultimo contatto troppo lontano (>30g per attivo)
  if (cliente.stato_cliente === 'attivo' && cliente.ultimo_contatto_at) {
    const giorni = Math.floor((Date.now() - new Date(cliente.ultimo_contatto_at).getTime()) / 86400000);
    if (giorni > 30) {
      insights.push({
        id: 'suggest-ricontatto',
        tipo: 'suggerimento',
        priorita: 'media',
        icona: '📞',
        titolo: `${giorni}g senza contatto`,
        descrizione: 'Cliente attivo silente da oltre un mese. Un saluto rafforza la relazione.',
        colore: COLORS.BLUE,
      });
    }
  }

  // ============ UPSELL OPPORTUNITIES ============
  // Se ha finestre ma NO zanzariere → upsell zanzariere
  const finestre = infissi.filter(i => i.tipo === 'finestra');
  const conZanzariera = infissi.filter(i => i.zanzariera).length;
  if (finestre.length > 0 && conZanzariera < finestre.length) {
    const mancanti = finestre.length - conZanzariera;
    insights.push({
      id: 'upsell-zanzariere',
      tipo: 'upsell',
      priorita: 'bassa',
      icona: '🦟',
      titolo: `Upsell: ${mancanti} zanzariere mancanti`,
      descrizione: `Ha ${finestre.length} finestre installate, solo ${conZanzariera} con zanzariera. Proporre integrazione.`,
      colore: COLORS.GREEN,
    });
  }

  // Se NO persiane → upsell persiane (se cliente alto valore)
  const conPersiana = infissi.filter(i => i.persiana).length;
  if (finestre.length >= 3 && conPersiana === 0 && cliente.livello_priorita === 'premium') {
    insights.push({
      id: 'upsell-persiane',
      tipo: 'upsell',
      priorita: 'bassa',
      icona: '🗂️',
      titolo: 'Upsell: persiane',
      descrizione: 'Cliente premium senza persiane installate. Argomento: privacy + sicurezza + isolamento estivo.',
      colore: COLORS.GREEN,
    });
  }

  // Se NO motorizzazione → upsell automazione
  const conMotore = infissi.filter(i => i.motore_marca).length;
  if (infissi.length >= 5 && conMotore === 0 && cliente.livello_priorita === 'premium') {
    insights.push({
      id: 'upsell-automazione',
      tipo: 'upsell',
      priorita: 'bassa',
      icona: '⚡',
      titolo: 'Upsell: automazione tapparelle',
      descrizione: 'Cliente premium con molti infissi non motorizzati. Domotica Somfy + Tahoma.',
      colore: COLORS.PURPLE,
    });
  }

  // Garanzie in scadenza (ricontatto manutenzione)
  const oggi = new Date();
  const garanzieInScadenza = infissi.filter(i => {
    if (!i.garanzia_fino) return false;
    const fineG = new Date(i.garanzia_fino);
    const giorniRim = (fineG.getTime() - oggi.getTime()) / 86400000;
    return giorniRim > 0 && giorniRim < 90;
  });
  if (garanzieInScadenza.length > 0) {
    insights.push({
      id: 'memo-garanzia',
      tipo: 'memo',
      priorita: 'bassa',
      icona: '🛡️',
      titolo: `${garanzieInScadenza.length} garanzie in scadenza`,
      descrizione: 'Opportunità manutenzione preventiva pagata. Programmare controllo.',
      colore: COLORS.BLUE,
    });
  }

  // Storico acquisti analizzato
  const sistemiUsati = Array.from(new Set(infissi.map(i => i.sistema).filter(Boolean)));
  if (sistemiUsati.length > 0) {
    const ultimoAnno = Math.max(...infissi.map(i => new Date(i.data_installazione).getFullYear()));
    insights.push({
      id: 'memo-storico',
      tipo: 'memo',
      priorita: 'bassa',
      icona: '📊',
      titolo: 'Storico acquisti',
      descrizione: `Ha installato ${infissi.length} infiss${infissi.length === 1 ? 'o' : 'i'} (${sistemiUsati.join(' + ')}), ultimo nel ${ultimoAnno}.`,
      colore: COLORS.TEAL,
    });
  }

  // ============ RIASSUNTO VOCALE (~30 sec lettura) ============
  const nome = `${cliente.nome} ${cliente.cognome}`;
  const ultContattoG = cliente.ultimo_contatto_at ? Math.floor((Date.now() - new Date(cliente.ultimo_contatto_at).getTime()) / 86400000) : null;
  
  let testo = `Dossier ${nome}. `;
  testo += `Cliente ${cliente.stato_cliente}, livello ${cliente.livello_priorita}. `;
  if (cliente.valore_storico_eur > 0) {
    testo += `Valore storico ${Math.round(cliente.valore_storico_eur).toLocaleString('it-IT')} euro. `;
  }
  testo += `Affidabilità ${pagamentiStats.affidabilita_calcolata}%. `;
  if (ultContattoG !== null) {
    testo += `Ultimo contatto ${ultContattoG === 0 ? 'oggi' : ultContattoG === 1 ? 'ieri' : ultContattoG + ' giorni fa'}. `;
  }
  if (commesse.length > 0) {
    const attive = commesse.filter(c => !['completato','annullato','consegnato'].includes(c.fase)).length;
    testo += `Ha ${commesse.length} commess${commesse.length === 1 ? 'a' : 'e'}, ${attive} attiv${attive === 1 ? 'a' : 'e'}. `;
  }
  
  // Top 3 insights prioritari nel riassunto
  const top3 = insights.filter(i => i.priorita === 'alta').slice(0, 3);
  if (top3.length > 0) {
    testo += `Attenzione: `;
    top3.forEach((i, idx) => {
      testo += `${i.titolo}${idx < top3.length - 1 ? '; ' : '. '}`;
    });
  }
  
  // Tag emozionali da ricordare
  if (cliente.tag_emozionali.length > 0) {
    testo += `Note caratteriali: ${cliente.tag_emozionali.slice(0, 3).join(', ').replace(/_/g, ' ')}. `;
  }
  
  // Preferenze
  if (cliente.preferenze_contatto?.no_dopo) {
    testo += `Non chiamare dopo le ${cliente.preferenze_contatto.no_dopo}. `;
  }
  if (cliente.prossima_azione) {
    testo += `Prossima azione: ${cliente.prossima_azione}.`;
  }

  // Ordina insights per priorità
  const order = { alta: 0, media: 1, bassa: 2 };
  insights.sort((a, b) => order[a.priorita] - order[b.priorita]);

  return {
    insights,
    riassuntoVocale: testo,
    preferenzeRilevate: insights.filter(i => i.tipo === 'preferenza'),
    upsellOpportunities: insights.filter(i => i.tipo === 'upsell'),
    alertPreChiamata: insights.find(i => i.tipo === 'alert' && i.priorita === 'alta') || null,
    countByTipo: {
      alert: insights.filter(i => i.tipo === 'alert').length,
      suggerimento: insights.filter(i => i.tipo === 'suggerimento').length,
      preferenza: insights.filter(i => i.tipo === 'preferenza').length,
      upsell: insights.filter(i => i.tipo === 'upsell').length,
      memo: insights.filter(i => i.tipo === 'memo').length,
    },
  };
}

// =========== TTS Italiano ===========
export function parlaTesto(testo: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  
  window.speechSynthesis.cancel();
  
  const utter = new SpeechSynthesisUtterance(testo);
  utter.lang = 'it-IT';
  utter.rate = 1.0;
  utter.pitch = 1.0;
  utter.volume = 1.0;
  
  // Cerca voce italiana
  const voices = window.speechSynthesis.getVoices();
  const itVoice = voices.find(v => v.lang.startsWith('it'));
  if (itVoice) utter.voice = itVoice;
  
  if (onEnd) utter.onend = onEnd;
  
  window.speechSynthesis.speak(utter);
  return true;
}

export function stopParlato() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
