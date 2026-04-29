// ============================================================================
// MASTRO WIN ENGINE
// ----------------------------------------------------------------------------
// Motore deterministico per la selezione automatica della ferramenta in base a
// dimensioni, peso, tipo di apertura e materiale del telaio.
//
// Agnostico al fornitore: legge ferramenta_articoli + ferramenta_cremonesi e
// applica regole geometriche/peso. Nessun marchio hardcoded.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ============ INPUT ============
export interface MastroWinInput {
  HBB: number;
  LBB: number;
  peso_anta_kg: number;

  tipo_apertura: TipoApertura;
  materiale_telaio: 'PVC' | 'ALLUMINIO' | 'LEGNO';

  fornitore?: string;
  sistema?: string;

  altezza_maniglia_forzata_mm?: number;

  azienda_id: string;
}

export type TipoApertura =
  | 'fissa'
  | 'anta_battente'
  | 'anta_ribalta'
  | 'anta_anta'
  | 'anta_anta_ribalta'
  | 'scorrevole_traslante'
  | 'scorrevole_alzante'
  | 'vasistas'
  | 'bilico';

// ============ OUTPUT ============
export interface MastroWinOutput {
  ok: boolean;
  distinta: ArticoloDistinta[];
  meta: {
    cremonese?: {
      codice: string;
      altezza_maniglia_mm: number;
      n_chiusure_centrali: number;
      passo_chiusure_mm: number;
    };
    cerniere?: {
      codice: string;
      n_pezzi: number;
      portata_singola_kg: number;
      portata_totale_kg: number;
    };
    forbice?: { codice: string; lunghezza_mm: number };
    maniglia?: { codice: string; posizione_mm: number };
  };
  prezzo_totale: number;
  warnings: Warning[];
  errors: ErrorMotore[];
  trace: string[];
}

export interface ArticoloDistinta {
  articolo_id: string;
  codice: string;
  descrizione: string;
  categoria: string;
  ruolo: string;
  quantita: number;
  prezzo_unitario: number;
  prezzo_riga: number;
}

export interface Warning {
  codice:
    | 'PESO_LIMITE'
    | 'HBB_LIMITE'
    | 'CERNIERE_EXTRA'
    | 'SISTEMA_NON_OTTIMALE'
    | 'PRZ_FUORI_RANGE';
  messaggio: string;
  severita: 'info' | 'warning';
}

export interface ErrorMotore {
  codice:
    | 'NESSUNA_CREMONESE'
    | 'NESSUNA_CERNIERA'
    | 'PESO_FUORI_PORTATA'
    | 'DIMENSIONI_FUORI_RANGE'
    | 'TIPO_NON_SUPPORTATO';
  messaggio: string;
  dettaglio?: string;
}

// ============ TIPI INTERNI ============
interface ArticoloRow {
  id: string;
  fornitore: string;
  sistema: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  lunghezza_mm: number | null;
  e_mm: number | null;
  materiale: string | null;
  hbb_min: number | null;
  hbb_max: number | null;
  lbb_min: number | null;
  lbb_max: number | null;
  peso_max_kg: number | null;
  prezzo_netto: number | null;
  prezzo_listino: number | null;
  altezza_maniglia_mm: number | null;
  attivo: boolean | null;
}

interface CremoneseRow {
  id: string;
  fornitore: string;
  sistema: string;
  tipo: string;
  codice: string;
  hbb_da: number;
  hbb_a: number;
  altezza_maniglia: number;
  n_chiusure_centrali: number | null;
  passo_chiusure: number | null;
  con_bilanciere: boolean | null;
  con_scrocco_porta: boolean | null;
}

// ============ HELPER PUBBLICI ============

/**
 * Numero cerniere richiesto in base a HBB, peso, materiale telaio e portata
 * della singola cerniera selezionata.
 *
 * Regola di default:
 *  - PVC: 2 pz fino a HBB 1400 e 80 kg, 3 pz oltre
 *  - ALLUMINIO: 2 pz fino a HBB 2200 e 100 kg, 3 pz oltre
 *  - LEGNO: come PVC
 *  - +1 cerniera sempre se peso > 100 kg
 *  - Se la portata totale (n * portata_singola) e' insufficiente, aggiunge
 *    cerniere finche' copre il peso (max 5).
 */
export function calcolaNumeroCerniere(
  HBB: number,
  peso_anta_kg: number,
  portata_singola_kg: number,
  materiale: 'PVC' | 'ALLUMINIO' | 'LEGNO'
): number {
  let n = 2;

  if (materiale === 'ALLUMINIO') {
    if (HBB > 2200 || peso_anta_kg > 100) n = 3;
  } else {
    // PVC e LEGNO
    if (HBB > 1400 || peso_anta_kg > 80) n = 3;
  }

  if (peso_anta_kg > 100) n = Math.max(n, 3) + 1;

  // Verifica portata: se non basta, aggiunge cerniere fino a copertura
  if (portata_singola_kg > 0) {
    while (n * portata_singola_kg < peso_anta_kg && n < 5) {
      n++;
    }
  }

  return n;
}

/**
 * Posizione standard della maniglia (asse) misurata da spigolo inferiore anta.
 *
 * Se la cremonese ha gia' un valore di altezza_maniglia, lo rispetta.
 * Altrimenti: HBB / 2 con limite minimo 950 mm e massimo 1100 mm
 * (range ergonomico standard per finestre residenziali).
 */
export function calcolaPosizioneManiglia(
  HBB: number,
  altezza_maniglia_cremonese?: number
): number {
  if (altezza_maniglia_cremonese && altezza_maniglia_cremonese > 0) {
    return altezza_maniglia_cremonese;
  }
  const proposta = Math.round(HBB / 2);
  if (proposta < 950) return 950;
  if (proposta > 1100) return 1100;
  return proposta;
}

// ============ FUNZIONE PRINCIPALE ============

export async function selezionaFerramenta(
  input: MastroWinInput,
  supabase: SupabaseClient
): Promise<MastroWinOutput> {
  const trace: string[] = [];
  const warnings: Warning[] = [];
  const errors: ErrorMotore[] = [];
  const distinta: ArticoloDistinta[] = [];
  const meta: MastroWinOutput['meta'] = {};

  trace.push(
    `INPUT: HBB=${input.HBB}, LBB=${input.LBB}, peso=${input.peso_anta_kg}kg, ` +
      `tipo=${input.tipo_apertura}, mat=${input.materiale_telaio}, ` +
      `forn=${input.fornitore ?? 'auto'}, sist=${input.sistema ?? 'auto'}`
  );

  // -------- Tipologia non supportata: short-circuit --------
  if (input.tipo_apertura === 'fissa') {
    trace.push('TIPO=fissa: nessuna ferramenta richiesta.');
    return {
      ok: true,
      distinta: [],
      meta: {},
      prezzo_totale: 0,
      warnings: [],
      errors: [],
      trace,
    };
  }

  // -------- Carica articoli compatibili dal DB --------
  let qArticoli = supabase
    .from('ferramenta_articoli')
    .select('*')
    .eq('attivo', true)
    .or(`hbb_min.is.null,hbb_min.lte.${input.HBB}`)
    .or(`hbb_max.is.null,hbb_max.gte.${input.HBB}`)
    .or(`lbb_min.is.null,lbb_min.lte.${input.LBB}`)
    .or(`lbb_max.is.null,lbb_max.gte.${input.LBB}`)
    .or(`peso_max_kg.is.null,peso_max_kg.gte.${input.peso_anta_kg}`);

  if (input.fornitore) qArticoli = qArticoli.eq('fornitore', input.fornitore);
  if (input.sistema) qArticoli = qArticoli.eq('sistema', input.sistema);

  const { data: articoli, error: errA } = await qArticoli;
  if (errA) {
    errors.push({
      codice: 'DIMENSIONI_FUORI_RANGE',
      messaggio: 'Errore nel caricamento articoli ferramenta.',
      dettaglio: errA.message,
    });
    return finalize(false);
  }

  if (!articoli || articoli.length === 0) {
    errors.push({
      codice: 'DIMENSIONI_FUORI_RANGE',
      messaggio: 'Nessun articolo compatibile con dimensioni e peso indicati.',
    });
    return finalize(false);
  }

  trace.push(`Articoli compatibili caricati: ${articoli.length}`);

  // Filtro materiale (best-effort: se il campo non e' valorizzato, lo accetto)
  const articoliMat = (articoli as ArticoloRow[]).filter(
    (a) =>
      !a.materiale ||
      a.materiale.toUpperCase().includes(input.materiale_telaio) ||
      a.materiale.toUpperCase() === 'UNIVERSALE'
  );
  trace.push(`Dopo filtro materiale (${input.materiale_telaio}): ${articoliMat.length}`);

  // Funzione helper: scegli il piu economico per categoria
  const piuEconomico = (cat: string): ArticoloRow | null => {
    const candidati = articoliMat
      .filter((a) => a.categoria === cat)
      .sort((a, b) => (a.prezzo_netto ?? 9999) - (b.prezzo_netto ?? 9999));
    return candidati[0] ?? null;
  };

  // -------- 1. CREMONESE (solo per apertura ad anta) --------
  const richiedeCremonese =
    input.tipo_apertura === 'anta_battente' ||
    input.tipo_apertura === 'anta_ribalta' ||
    input.tipo_apertura === 'anta_anta' ||
    input.tipo_apertura === 'anta_anta_ribalta';

  let altezza_maniglia_mm = 0;

  if (richiedeCremonese) {
    let qCrem = supabase
      .from('ferramenta_cremonesi')
      .select('*')
      .lte('hbb_da', input.HBB)
      .gte('hbb_a', input.HBB);

    if (input.fornitore) qCrem = qCrem.eq('fornitore', input.fornitore);
    if (input.sistema) qCrem = qCrem.eq('sistema', input.sistema);

    const { data: cremoneses, error: errC } = await qCrem;
    if (errC) {
      errors.push({
        codice: 'NESSUNA_CREMONESE',
        messaggio: 'Errore caricamento cremonesi.',
        dettaglio: errC.message,
      });
      return finalize(false);
    }

    // Filtro tipo lato client: agnostico al naming.
    // Anta+ribalta -> tipi che contengono 'ar' o 'anta_ribalta' o 'dk'.
    // Anta semplice -> tutto il resto (escluso 'porta' / 'porte').
    const conRibalta =
      input.tipo_apertura === 'anta_ribalta' ||
      input.tipo_apertura === 'anta_anta_ribalta';

    const matchTipo = (t: string): boolean => {
      const tx = t.toLowerCase();
      const isPorta = tx.includes('porta') || tx.includes('porte');
      if (isPorta) return false;
      if (conRibalta) {
        return (
          tx.startsWith('ar_') ||
          tx.includes('anta_ribalta') ||
          tx.includes('anta-ribalta') ||
          tx === 'dk' ||
          tx === 'universale'
        );
      }
      // Anta semplice: niente AR
      return !tx.startsWith('ar_') && !tx.includes('anta_ribalta') && !tx.includes('anta-ribalta');
    };

    const cremoneseRow =
      ((cremoneses ?? []) as CremoneseRow[])
        .filter((c) => matchTipo(c.tipo))
        .sort((a, b) => a.codice.localeCompare(b.codice))[0] ?? null;

    trace.push(
      `Cremonesi candidate (HBB ok): ${cremoneses?.length ?? 0}, ` +
        `dopo filtro tipo (conRibalta=${conRibalta}): ${cremoneseRow ? '1+' : 0}`
    );

    if (!cremoneseRow) {
      const tipiTrovati = (cremoneses ?? []).map((c: any) => c.tipo).join(', ') || 'nessuno';
      errors.push({
        codice: 'NESSUNA_CREMONESE',
        messaggio: `Nessuna cremonese ${conRibalta ? 'anta-ribalta' : 'anta'} per HBB=${input.HBB}mm.`,
        dettaglio: `Tipi trovati nel range HBB: ${tipiTrovati}`,
      });
      return finalize(false);
    }

    altezza_maniglia_mm =
      input.altezza_maniglia_forzata_mm ??
      calcolaPosizioneManiglia(input.HBB, cremoneseRow.altezza_maniglia);

    meta.cremonese = {
      codice: cremoneseRow.codice,
      altezza_maniglia_mm,
      n_chiusure_centrali: cremoneseRow.n_chiusure_centrali ?? 0,
      passo_chiusure_mm: cremoneseRow.passo_chiusure ?? 0,
    };

    // La cremonese e' anche un articolo a catalogo? Cerco match per codice
    const cremArticolo = articoliMat.find(
      (a) => a.codice === cremoneseRow.codice && a.categoria === 'cremonese'
    );
    if (cremArticolo) {
      addRiga(distinta, cremArticolo, 'cremonese_principale', 1);
    } else {
      // fallback: la cremonese piu economica del catalogo
      const fallback = piuEconomico('cremonese') ?? piuEconomico('asta_cremonese');
      if (fallback) addRiga(distinta, fallback, 'cremonese_principale', 1);
    }

    trace.push(
      `CREMONESE: ${cremoneseRow.codice} (h_man=${altezza_maniglia_mm}, ` +
        `n_chiusure=${cremoneseRow.n_chiusure_centrali ?? 0})`
    );
  }

  // -------- 2. CERNIERE (tutto tranne fissa, vasistas-only e scorrevoli puri) --------
  const richiedeCerniere =
    input.tipo_apertura === 'anta_battente' ||
    input.tipo_apertura === 'anta_ribalta' ||
    input.tipo_apertura === 'anta_anta' ||
    input.tipo_apertura === 'anta_anta_ribalta' ||
    input.tipo_apertura === 'vasistas' ||
    input.tipo_apertura === 'bilico';

  if (richiedeCerniere) {
    const cerniera = piuEconomico('cerniera');

    if (!cerniera) {
      errors.push({
        codice: 'NESSUNA_CERNIERA',
        messaggio: 'Nessuna cerniera compatibile a catalogo.',
      });
      return finalize(false);
    }

    const portataSingola = cerniera.peso_max_kg ?? 0;
    const n = calcolaNumeroCerniere(
      input.HBB,
      input.peso_anta_kg,
      portataSingola,
      input.materiale_telaio
    );

    const portataTot = n * portataSingola;
    if (portataSingola > 0 && portataTot < input.peso_anta_kg) {
      errors.push({
        codice: 'PESO_FUORI_PORTATA',
        messaggio: `Portata cerniere insufficiente: ${portataTot}kg vs peso ${input.peso_anta_kg}kg.`,
      });
      return finalize(false);
    }

    if (n > 3) {
      warnings.push({
        codice: 'CERNIERE_EXTRA',
        messaggio: `Richieste ${n} cerniere per peso elevato (${input.peso_anta_kg}kg).`,
        severita: 'warning',
      });
    }

    meta.cerniere = {
      codice: cerniera.codice,
      n_pezzi: n,
      portata_singola_kg: portataSingola,
      portata_totale_kg: portataTot,
    };
    addRiga(distinta, cerniera, 'cerniera', n);
    trace.push(
      `CERNIERE: ${cerniera.codice} x${n} (portata sing=${portataSingola}kg, tot=${portataTot}kg)`
    );
  }

  // -------- 3. FORBICE (solo apertura con ribalta) --------
  const richiedeForbice =
    input.tipo_apertura === 'anta_ribalta' ||
    input.tipo_apertura === 'anta_anta_ribalta' ||
    input.tipo_apertura === 'vasistas';

  if (richiedeForbice) {
    // Cerco una forbice la cui lunghezza sia compatibile con LBB
    const forbici = articoliMat
      .filter((a) => a.categoria === 'forbice')
      .filter((a) => {
        if (!a.lbb_min && !a.lbb_max) return true;
        if (a.lbb_min && input.LBB < a.lbb_min) return false;
        if (a.lbb_max && input.LBB > a.lbb_max) return false;
        return true;
      })
      .sort((a, b) => (a.prezzo_netto ?? 9999) - (b.prezzo_netto ?? 9999));

    const forbice = forbici[0];
    if (forbice) {
      meta.forbice = {
        codice: forbice.codice,
        lunghezza_mm: forbice.lunghezza_mm ?? 0,
      };
      addRiga(distinta, forbice, 'forbice', 1);
      trace.push(`FORBICE: ${forbice.codice} (L=${forbice.lunghezza_mm}mm)`);
    } else {
      warnings.push({
        codice: 'SISTEMA_NON_OTTIMALE',
        messaggio: `Nessuna forbice compatibile con LBB=${input.LBB}mm.`,
        severita: 'warning',
      });
    }
  }

  // -------- 4. MANIGLIA --------
  if (richiedeCremonese) {
    const maniglia = piuEconomico('maniglia');
    if (maniglia) {
      meta.maniglia = {
        codice: maniglia.codice,
        posizione_mm: altezza_maniglia_mm,
      };
      addRiga(distinta, maniglia, 'maniglia', 1);
      trace.push(`MANIGLIA: ${maniglia.codice} @ ${altezza_maniglia_mm}mm`);
    }
  }

  // -------- 5. WARNINGS DI CONTESTO --------
  if (input.peso_anta_kg > 100) {
    warnings.push({
      codice: 'PESO_LIMITE',
      messaggio: `Anta pesante (${input.peso_anta_kg}kg): verificare rinforzi e portata effettiva.`,
      severita: 'warning',
    });
  }
  if (input.materiale_telaio === 'PVC' && input.HBB > 2400) {
    warnings.push({
      codice: 'HBB_LIMITE',
      messaggio: `HBB ${input.HBB}mm su PVC: vicino al limite strutturale.`,
      severita: 'warning',
    });
  }

  return finalize(true);

  // ============ INNER ============
  function finalize(ok: boolean): MastroWinOutput {
    const prezzo_totale = distinta.reduce((s, r) => s + r.prezzo_riga, 0);
    return {
      ok: ok && errors.length === 0,
      distinta,
      meta,
      prezzo_totale: Math.round(prezzo_totale * 100) / 100,
      warnings,
      errors,
      trace,
    };
  }
}

// ============ HELPER INTERNI ============

function addRiga(
  distinta: ArticoloDistinta[],
  art: ArticoloRow,
  ruolo: string,
  qta: number
): void {
  const prezzo = art.prezzo_netto ?? art.prezzo_listino ?? 0;
  distinta.push({
    articolo_id: art.id,
    codice: art.codice,
    descrizione: art.nome + (art.descrizione ? ` - ${art.descrizione}` : ''),
    categoria: art.categoria,
    ruolo,
    quantita: qta,
    prezzo_unitario: prezzo,
    prezzo_riga: Math.round(prezzo * qta * 100) / 100,
  });
}
