"use client";
// hooks/useFinanze.ts - Aggregatore Centro Finanze (KPI, cashflow, alert)

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// =============== TYPES ===============
export interface FinanzeKPI {
  liquidita_totale: number;
  num_conti: number;
  incassi_30gg: number;
  incassi_60gg: number;
  incassi_90gg: number;
  incassi_scaduti: number;
  n_fatture_scadute: number;
  pagamenti_7gg: number;
  pagamenti_30gg: number;
  n_scadenze_aperte: number;
  ricavi_mese: number;
  costi_mese: number;
  utile_mese: number;
  iva_prossima: number;
  iva_giorni: number | null;
  iva_periodo: string | null;
}

export interface FinanzeAlert {
  id: string;
  tipo: string;
  severity: 'info' | 'warning' | 'critical';
  titolo: string;
  descrizione: string | null;
  importo: number | null;
  giorni_a_scadenza: number | null;
  azione_suggerita: string | null;
  generato_at: string;
}

export interface CashflowGiorno {
  data: string;          // YYYY-MM-DD
  in_atteso: number;     // incassi previsti
  out_atteso: number;    // pagamenti previsti
  saldo_previsto: number; // saldo dopo questo giorno
  eventi: { tipo: string; descrizione: string; importo: number; direzione: 'in' | 'out' }[];
}

// =============== HOOK PRINCIPALE ===============
export function useFinanze(aziendaId: string | null) {
  const [kpi, setKpi] = useState<FinanzeKPI | null>(null);
  const [alerts, setAlerts] = useState<FinanzeAlert[]>([]);
  const [cashflow, setCashflow] = useState<CashflowGiorno[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }

    try {
      const [
        liqRes, incRes, pagRes, utileRes, ivaRes, alertsRes,
        scadenzeRes, fattureRes, contiRes,
      ] = await Promise.all([
        supabase.from('v_fin_liquidita').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_incassi_previsti').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_pagamenti_scadenza').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_utile_mese').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_iva_prossima').select('*').eq('azienda_id', aziendaId).order('data_versamento', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('fin_alert_ai').select('*').eq('azienda_id', aziendaId).eq('attivo', true).eq('dismisso', false).order('severity', { ascending: false }).order('generato_at', { ascending: false }),
        supabase.from('fin_scadenze').select('data_scadenza, importo, tipo, descrizione, controparte').eq('azienda_id', aziendaId).in('stato', ['aperta','parziale','open','pending']).gte('data_scadenza', new Date(Date.now()).toISOString().split('T')[0]).lte('data_scadenza', new Date(Date.now() + 90*86400000).toISOString().split('T')[0]),
        supabase.from('fin_fatture_emesse').select('data_scadenza, residuo, totale, cliente, cliente_nome, cliente_ragione_sociale').eq('azienda_id', aziendaId).gt('residuo', 0).gte('data_scadenza', new Date(Date.now()).toISOString().split('T')[0]).lte('data_scadenza', new Date(Date.now() + 90*86400000).toISOString().split('T')[0]),
        supabase.from('fin_conti').select('saldo').eq('azienda_id', aziendaId).eq('attivo', true),
      ]);

      // KPI aggregati
      setKpi({
        liquidita_totale:    Number(liqRes.data?.liquidita_totale || 0),
        num_conti:           Number(liqRes.data?.num_conti || 0),
        incassi_30gg:        Number(incRes.data?.incassi_30gg || 0),
        incassi_60gg:        Number(incRes.data?.incassi_60gg || 0),
        incassi_90gg:        Number(incRes.data?.incassi_90gg || 0),
        incassi_scaduti:     Number(incRes.data?.incassi_scaduti || 0),
        n_fatture_scadute:   Number(incRes.data?.n_fatture_scadute || 0),
        pagamenti_7gg:       Number(pagRes.data?.pagamenti_7gg || 0),
        pagamenti_30gg:      Number(pagRes.data?.pagamenti_30gg || 0),
        n_scadenze_aperte:   Number(pagRes.data?.n_scadenze_aperte || 0),
        ricavi_mese:         Number(utileRes.data?.ricavi_mese || 0),
        costi_mese:          Number(utileRes.data?.costi_mese || 0),
        utile_mese:          Number(utileRes.data?.utile_mese || 0),
        iva_prossima:        Number(ivaRes.data?.debito_versare || 0),
        iva_giorni:          ivaRes.data?.giorni_a_scadenza ?? null,
        iva_periodo:         ivaRes.data?.periodo ?? null,
      });

      setAlerts((alertsRes.data || []) as FinanzeAlert[]);

      // CASHFLOW 90gg
      const saldoIniziale = (contiRes.data || []).reduce((s, c: any) => s + Number(c.saldo || 0), 0);
      const giorni: CashflowGiorno[] = [];
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      let saldoCum = saldoIniziale;

      for (let i = 0; i <= 90; i++) {
        const d = new Date(oggi.getTime() + i * 86400000);
        const dStr = d.toISOString().split('T')[0];
        const eventi: CashflowGiorno['eventi'] = [];
        let inAtteso = 0;
        let outAtteso = 0;

        (fattureRes.data || []).forEach((f: any) => {
          if (f.data_scadenza === dStr) {
            const imp = Number(f.residuo || 0);
            inAtteso += imp;
            eventi.push({
              tipo: 'fattura_in',
              descrizione: `Incasso ${f.cliente_ragione_sociale || f.cliente_nome || f.cliente || 'cliente'}`,
              importo: imp, direzione: 'in',
            });
          }
        });

        (scadenzeRes.data || []).forEach((s: any) => {
          if (s.data_scadenza === dStr) {
            const imp = Number(s.importo || 0);
            outAtteso += imp;
            eventi.push({
              tipo: s.tipo,
              descrizione: s.descrizione || s.controparte || 'Pagamento',
              importo: imp, direzione: 'out',
            });
          }
        });

        saldoCum = saldoCum + inAtteso - outAtteso;
        giorni.push({ data: dStr, in_atteso: inAtteso, out_atteso: outAtteso, saldo_previsto: saldoCum, eventi });
      }
      setCashflow(giorni);
    } catch (e) {
      console.warn('[useFinanze]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Realtime
  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`fin-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_movimenti', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_scadenze', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_spese', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_alert_ai', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  // Funzioni accessorie
  async function dismissAlert(id: string) {
    await supabase.from('fin_alert_ai').update({ dismisso: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  // KPI derivati per Hero (7 card)
  const heroKpi = kpi ? buildHeroKPI(kpi) : null;

  return { kpi, heroKpi, alerts, cashflow, loading, reload: load, dismissAlert };
}

// =============== BUILD HERO KPI ===============
export interface HeroKPI {
  liquidita:        { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  incassi:          { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  pagamenti:        { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  utile:            { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  scoperti:         { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  iva:              { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
  costi:            { val: number; status: 'ok' | 'warn' | 'bad'; label: string; sub: string };
}

function buildHeroKPI(k: FinanzeKPI): HeroKPI {
  // Liquidità
  const liqStatus: 'ok' | 'warn' | 'bad' =
    k.liquidita_totale >= 20000 ? 'ok' :
    k.liquidita_totale >= 5000 ? 'warn' : 'bad';

  // Incassi
  const incStatus: 'ok' | 'warn' | 'bad' =
    k.incassi_30gg > k.pagamenti_30gg ? 'ok' :
    k.incassi_30gg > 0 ? 'warn' : 'bad';

  // Pagamenti scadenza
  const pagStatus: 'ok' | 'warn' | 'bad' =
    k.pagamenti_7gg > k.liquidita_totale ? 'bad' :
    k.pagamenti_7gg > k.liquidita_totale * 0.5 ? 'warn' : 'ok';

  // Utile mese
  const utileStatus: 'ok' | 'warn' | 'bad' =
    k.utile_mese > 0 ? 'ok' :
    k.utile_mese > -1000 ? 'warn' : 'bad';

  // Clienti scoperti
  const scopStatus: 'ok' | 'warn' | 'bad' =
    k.n_fatture_scadute === 0 ? 'ok' :
    k.n_fatture_scadute <= 2 ? 'warn' : 'bad';

  // IVA
  const ivaStatus: 'ok' | 'warn' | 'bad' =
    k.iva_giorni === null || k.iva_giorni > 15 ? 'ok' :
    k.iva_giorni > 5 ? 'warn' : 'bad';

  // Costi mese
  const costStatus: 'ok' | 'warn' | 'bad' =
    k.costi_mese < k.ricavi_mese * 0.7 ? 'ok' :
    k.costi_mese < k.ricavi_mese ? 'warn' : 'bad';

  return {
    liquidita: { val: k.liquidita_totale, status: liqStatus, label: 'LIQUIDITÀ', sub: `${k.num_conti} cont${k.num_conti === 1 ? 'o' : 'i'}` },
    incassi:   { val: k.incassi_30gg,     status: incStatus, label: 'INCASSI 30GG', sub: k.incassi_scaduti > 0 ? `${formatEuro(k.incassi_scaduti)} scaduti` : 'in arrivo' },
    pagamenti: { val: k.pagamenti_30gg,   status: pagStatus, label: 'DA PAGARE 30GG', sub: `${k.n_scadenze_aperte} scadenze` },
    utile:     { val: k.utile_mese,       status: utileStatus, label: 'UTILE MESE', sub: `ricavi ${formatEuro(k.ricavi_mese)}` },
    scoperti:  { val: k.incassi_scaduti,  status: scopStatus, label: 'CLIENTI SCOPERTI', sub: `${k.n_fatture_scadute} fatt. scadute` },
    iva:       { val: k.iva_prossima,     status: ivaStatus, label: 'IVA PROSSIMA', sub: k.iva_giorni !== null ? `tra ${k.iva_giorni}gg` : 'nessuna scadenza' },
    costi:     { val: k.costi_mese,       status: costStatus, label: 'COSTI MESE', sub: k.ricavi_mese > 0 ? `${Math.round((k.costi_mese / k.ricavi_mese) * 100)}% ricavi` : 'no ricavi' },
  };
}

// =============== UTILS ===============
export function formatEuro(n: number, decimali = 0): string {
  return '€' + (n || 0).toLocaleString('it-IT', { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
}

export function formatEuroShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '€' + (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000)     return '€' + (n / 1_000).toFixed(1) + 'k';
  return '€' + Math.round(n);
}