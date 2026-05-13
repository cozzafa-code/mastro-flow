import { supabase } from "@/lib/supabase";
import type {
  OrdineFornitoreRow,
  OrdineConCommessa,
  OrdineKpi,
  OrdineStato,
  RigaOrdine,
  RigaVerificata,
  TipoOrdine,
} from "./ordini-types";

const STATO_BLOC = ["errore", "da_ordinare"] as const;
const STATO_ATTE = ["inviato", "in_transito", "confermato", "approvazione"] as const;
const STATO_ARRI = ["arrivato", "arrivato_parziale", "verificato"] as const;

export async function fetchOrdiniByAzienda(aziendaId: string): Promise<OrdineConCommessa[]> {
  const { data, error } = await supabase
    .from("ordini_fornitore")
    .select("*, commessa:commesse(code, cliente, cognome)")
    .eq("azienda_id", aziendaId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[fetchOrdiniByAzienda]", error);
    return [];
  }
  return (data || []).map((o: any) => ({
    ...o,
    commessa_code: o.commessa?.code ?? null,
    commessa_cliente: o.commessa?.cliente ?? null,
    commessa_cognome: o.commessa?.cognome ?? null,
  })) as OrdineConCommessa[];
}

export function computeKpi(ordini: OrdineConCommessa[]): OrdineKpi {
  let daOrdinare = 0, inArrivo = 0, arrivati = 0, totApertiEuro = 0;
  for (const o of ordini) {
    const s = o.stato as OrdineStato;
    if (STATO_BLOC.includes(s as any)) daOrdinare++;
    if (STATO_ATTE.includes(s as any)) inArrivo++;
    if (STATO_ARRI.includes(s as any)) arrivati++;
    if (!STATO_ARRI.includes(s as any) && s !== "annullato") {
      totApertiEuro += Number(o.totale_euro || 0);
    }
  }
  return { da_ordinare: daOrdinare, in_arrivo: inArrivo, arrivati, totale_aperti_euro: totApertiEuro };
}

export function gruppoOrdineBy(ordini: OrdineConCommessa[]) {
  const bloccanti = ordini.filter(o => STATO_BLOC.includes(o.stato as any) || o.bloccante);
  const inAttesa = ordini.filter(o => STATO_ATTE.includes(o.stato as any) && !o.bloccante);
  const arrivati = ordini.filter(o => STATO_ARRI.includes(o.stato as any));
  const altri = ordini.filter(o =>
    !STATO_BLOC.includes(o.stato as any) &&
    !STATO_ATTE.includes(o.stato as any) &&
    !STATO_ARRI.includes(o.stato as any) &&
    !o.bloccante
  );
  return { bloccanti, inAttesa, arrivati, altri };
}

export function filtraOrdini(ordini: OrdineConCommessa[], filtro: string, query: string): OrdineConCommessa[] {
  let result = ordini;
  if (filtro === "urgenti") result = result.filter(o => o.urgente);
  if (filtro === "bloccanti") result = result.filter(o => o.bloccante);
  if (filtro === "aperti") result = result.filter(o => !STATO_ARRI.includes(o.stato as any));
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(o =>
      (o.numero || "").toLowerCase().includes(q) ||
      (o.fornitore || "").toLowerCase().includes(q) ||
      (o.commessa_code || "").toLowerCase().includes(q) ||
      (o.commessa_cliente || "").toLowerCase().includes(q)
    );
  }
  return result;
}

export function buildRigheVerificate(righe: RigaOrdine[], precedenti?: RigaVerificata[]): RigaVerificata[] {
  return righe.map((r, idx) => {
    const prec = precedenti?.find(p => p.id === (r.id || String(idx)));
    return {
      id: r.id || String(idx),
      qta_richiesta: r.qta_richiesta,
      qta_arrivata: prec?.qta_arrivata ?? 0,
      qta_pendente: prec?.qta_pendente ?? r.qta_richiesta,
      costo_reale: prec?.costo_reale ?? r.prezzo_unitario,
      arrivato_ok: prec?.arrivato_ok ?? false,
      stato: prec?.stato ?? "ok",
      motivo: prec?.motivo ?? null,
      backorder: prec?.backorder ?? "attendi",
      arrivi: prec?.arrivi ?? [],
      note: prec?.note ?? null,
    };
  });
}

export function calcolaProgressoRicezione(rv: RigaVerificata[]) {
  const totale = rv.length;
  const fatti = rv.filter(r => r.arrivato_ok).length;
  const pendenti = rv.filter(r => r.qta_pendente > 0 && r.backorder === "attendi").length;
  const problemi = rv.filter(r => r.motivo !== null && r.motivo !== undefined).length;
  return { fatti, totale, pct: totale > 0 ? Math.round((fatti / totale) * 100) : 0, pendenti, problemi };
}

export function determinaStatoOrdine(rv: RigaVerificata[]): OrdineStato {
  const haPendenti = rv.some(r => r.qta_pendente > 0 && r.backorder === "attendi");
  if (haPendenti) return "arrivato_parziale";
  return "arrivato";
}

export function calcolaScostamento(rv: RigaVerificata[]) {
  let ordinato = 0, ricevuto = 0;
  for (const r of rv) {
    ordinato += r.qta_richiesta * (r.costo_reale || 0);
    ricevuto += r.qta_arrivata * (r.costo_reale || 0);
  }
  return { ordinato, ricevuto, scostamento: ricevuto - ordinato };
}

export async function salvaRicezione(
  ordineId: string,
  rv: RigaVerificata[],
  ddt: { numero: string; data: string },
  opzioni: { fatturaNumero?: string | null; importoFatturato?: number | null; note?: string | null; operatoreId?: string | null }
): Promise<{ ok: boolean; stato: OrdineStato; error?: string }> {
  const stato = determinaStatoOrdine(rv);
  const scost = calcolaScostamento(rv);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ordini_fornitore")
    .update({
      stato,
      arrivato_at: now,
      data_ricezione: now,
      righe_verificate: rv as any,
      ddt_numero: ddt.numero,
      ddt_data: ddt.data,
      fattura_numero: opzioni.fatturaNumero ?? null,
      importo_fatturato: opzioni.importoFatturato ?? null,
      scostamento_costo: scost.scostamento,
      ricezione_note: opzioni.note ?? null,
      ricezione_operatore_id: opzioni.operatoreId ?? null,
      updated_at: now,
    })
    .eq("id", ordineId);
  if (error) return { ok: false, stato, error: error.message };
  return { ok: true, stato };
}

export async function fetchFornitori(aziendaId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("fornitori")
    .select("*")
    .eq("azienda_id", aziendaId)
    .eq("attivo", true)
    .order("is_preferito", { ascending: false })
    .order("ordini_totali", { ascending: false });
  if (error) {
    console.error("[fetchFornitori]", error);
    return [];
  }
  return data || [];
}

async function generaNumeroOrdine(aziendaId: string): Promise<string> {
  const anno = new Date().getFullYear();
  const prefix = "OF-" + anno + "-";
  const { data } = await supabase
    .from("ordini_fornitore")
    .select("numero")
    .eq("azienda_id", aziendaId)
    .like("numero", prefix + "%")
    .order("created_at", { ascending: false })
    .limit(1);
  const last = data?.[0]?.numero || "";
  const m = last.match(/(\d+)$/);
  const next = m ? parseInt(m[1], 10) + 1 : 1;
  return prefix + String(next).padStart(3, "0");
}

export async function creaOrdineBozza(
  aziendaId: string,
  payload: {
    tipo: TipoOrdine;
    commessaId?: string | null;
    fornitore: string;
    fornitoreId?: string | null;
    righe: RigaOrdine[];
    consegnaPrevista?: string | null;
    consegnaIndirizzo?: string | null;
    consegnaTipo?: string;
    note?: string | null;
    canaleInvio?: string;
  }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const totaleEuro = payload.righe.reduce((s, r) => s + (r.totale_riga || 0), 0);
  const categoriaPrincipale = payload.righe[0]?.categoria || "ALTRO";
  const numero = await generaNumeroOrdine(aziendaId);
  const { data, error } = await supabase
    .from("ordini_fornitore")
    .insert({
      azienda_id: aziendaId,
      commessa_id: payload.commessaId || null,
      numero,
      fornitore: payload.fornitore,
      fornitore_id: payload.fornitoreId || null,
      tipo_ordine: payload.tipo,
      righe: payload.righe as any,
      totale_euro: totaleEuro,
      totale_stimato: totaleEuro,
      stato: "bozza",
      bozza: true,
      consegna_prevista: payload.consegnaPrevista || null,
      consegna_indirizzo: payload.consegnaIndirizzo || null,
      consegna_tipo: payload.consegnaTipo || "magazzino",
      canale_invio: payload.canaleInvio || "email",
      categoria_materiale: categoriaPrincipale,
      tipo_acquisto: "componenti",
      note: payload.note || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function inviaOrdine(ordineId: string): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ordini_fornitore")
    .update({ stato: "inviato", inviato_at: now, data_invio: now, bozza: false, updated_at: now })
    .eq("id", ordineId);
  return { ok: !error, error: error?.message };
}

export async function aggiornaStatoOrdine(ordineId: string, stato: OrdineStato): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("ordini_fornitore")
    .update({ stato, updated_at: new Date().toISOString() })
    .eq("id", ordineId);
  return { ok: !error, error: error?.message };
}
