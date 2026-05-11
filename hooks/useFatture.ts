"use client";
// hooks/useFatture.ts - Fatture elettroniche + SDI

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Fattura {
  id: string;
  numero: string;
  data_emissione: string;
  tipo_documento: string;
  commessa_id: string | null;
  commessa_code?: string | null;
  cliente_denominazione: string;
  cliente_cf: string | null;
  cliente_piva: string | null;
  cliente_indirizzo: string | null;
  cliente_cap: string | null;
  cliente_comune: string | null;
  cliente_provincia: string | null;
  cliente_codice_destinatario: string | null;
  cliente_pec: string | null;
  imponibile: number;
  iva_pct: number;
  iva_importo: number;
  totale: number;
  righe: any[];
  modalita_pagamento: string;
  data_scadenza: string | null;
  pagata: boolean;
  pagata_at: string | null;
  stato: string;
  sdi_identificativo: string | null;
  sdi_messaggio: string | null;
  sdi_data_invio: string | null;
  sdi_data_consegna: string | null;
  note: string | null;
  created_at: string;
}

export interface FattureStats {
  bozze: number;
  pronte: number;
  inviate: number;
  consegnate: number;
  scartate: number;
  totale_fatturato_mese: number;
  totale_non_pagato: number;
}

export function useFatture(aziendaId: string | null) {
  const [fatture, setFatture] = useState<Fattura[]>([]);
  const [stats, setStats] = useState<FattureStats>({
    bozze: 0, pronte: 0, inviate: 0, consegnate: 0, scartate: 0,
    totale_fatturato_mese: 0, totale_non_pagato: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('fatture')
        .select('*')
        .eq('azienda_id', aziendaId)
        .order('data_emissione', { ascending: false });

      // Enrich con commessa code
      const cmIds = Array.from(new Set((data || []).map((f: any) => f.commessa_id).filter(Boolean)));
      const { data: cm } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, string> = {};
      (cm || []).forEach((c: any) => { cmMap[c.id] = c.code; });

      const enriched: Fattura[] = (data || []).map((f: any) => ({
        ...f,
        commessa_code: f.commessa_id ? cmMap[f.commessa_id] || null : null,
      }));

      setFatture(enriched);

      // Stats
      const now = new Date();
      const meseInizio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const consegnate = enriched.filter(f => ['consegnata','accettata'].includes(f.stato));
      const fatturoMese = enriched.filter(f => f.data_emissione >= meseInizio && ['consegnata','accettata','inviata'].includes(f.stato))
        .reduce((s, f) => s + Number(f.totale), 0);
      const nonPagato = consegnate.filter(f => !f.pagata).reduce((s, f) => s + Number(f.totale), 0);

      setStats({
        bozze: enriched.filter(f => f.stato === 'bozza').length,
        pronte: enriched.filter(f => f.stato === 'pronta').length,
        inviate: enriched.filter(f => f.stato === 'inviata').length,
        consegnate: consegnate.length,
        scartate: enriched.filter(f => f.stato === 'scartata').length,
        totale_fatturato_mese: fatturoMese,
        totale_non_pagato: nonPagato,
      });
    } catch (e) {
      console.warn('[useFatture]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`fatture-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fatture' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  return { fatture, stats, loading, reload: load };
}

// Simulazione invio SDI (sostituire con fattura-elettronica-api.it)
export async function inviaSDI(fatturaId: string): Promise<{ success: boolean; sdiId?: string; error?: string }> {
  try {
    // TODO: chiamare endpoint /api/sdi/invia che farà POST a fattura-elettronica-api.it
    // Per ora: simulazione + update stato
    const sdiId = `IT12345678901_${Date.now().toString().slice(-5)}`;
    const { error } = await supabase.from('fatture').update({
      stato: 'inviata',
      sdi_identificativo: sdiId,
      sdi_data_invio: new Date().toISOString(),
      sdi_messaggio: 'Fattura inviata correttamente a SDI - in attesa di esito',
    }).eq('id', fatturaId);
    if (error) return { success: false, error: error.message };

    // Simulo esito SDI dopo 2 secondi (in produzione lo riceveremo via webhook)
    setTimeout(async () => {
      await supabase.from('fatture').update({
        stato: 'consegnata',
        sdi_data_consegna: new Date().toISOString(),
        sdi_messaggio: 'Notifica di consegna ricevuta da SDI',
      }).eq('id', fatturaId);
    }, 3000);

    return { success: true, sdiId };
  } catch (e: any) {
    return { success: false, error: e?.message || 'errore invio' };
  }
}

// Marca fattura come pronta (validata, pronta per SDI)
export async function marcaPronta(fatturaId: string): Promise<boolean> {
  const { error } = await supabase.from('fatture').update({
    stato: 'pronta',
  }).eq('id', fatturaId);
  return !error;
}

// Marca pagata
export async function marcaPagata(fatturaId: string): Promise<boolean> {
  const { error } = await supabase.from('fatture').update({
    pagata: true,
    pagata_at: new Date().toISOString(),
  }).eq('id', fatturaId);
  return !error;
}

// Genera XML FatturaPA preview (placeholder semplificato)
export function generaXmlPreview(f: Fattura): string {
  const datEmiss = f.data_emissione;
  const righe = (f.righe || []).map((r: any, i: number) => `
    <DettaglioLinee>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descrizione>${escapeXml(r.descrizione || '')}</Descrizione>
      <Quantita>${Number(r.qta || 1).toFixed(2)}</Quantita>
      <PrezzoUnitario>${Number(r.prezzo_unit || 0).toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${(Number(r.qta || 1) * Number(r.prezzo_unit || 0)).toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${Number(r.iva_pct || 22).toFixed(2)}</AliquotaIVA>
    </DettaglioLinee>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>WALTERCOZZA</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${f.numero}</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${f.cliente_codice_destinatario || '0000000'}</CodiceDestinatario>
      ${f.cliente_pec ? `<PECDestinatario>${f.cliente_pec}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${f.cliente_cf ? `<CodiceFiscale>${f.cliente_cf}</CodiceFiscale>` : ''}
        <Anagrafica><Denominazione>${escapeXml(f.cliente_denominazione)}</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(f.cliente_indirizzo || '')}</Indirizzo>
        <CAP>${f.cliente_cap || ''}</CAP>
        <Comune>${escapeXml(f.cliente_comune || '')}</Comune>
        <Provincia>${f.cliente_provincia || ''}</Provincia>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${f.tipo_documento}</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${datEmiss}</Data>
        <Numero>${f.numero}</Numero>
        <ImportoTotaleDocumento>${Number(f.totale).toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>${righe}
      <DatiRiepilogo>
        <AliquotaIVA>${Number(f.iva_pct).toFixed(2)}</AliquotaIVA>
        <ImponibileImporto>${Number(f.imponibile).toFixed(2)}</ImponibileImporto>
        <Imposta>${Number(f.iva_importo).toFixed(2)}</Imposta>
      </DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>${f.modalita_pagamento}</ModalitaPagamento>
        ${f.data_scadenza ? `<DataScadenzaPagamento>${f.data_scadenza}</DataScadenzaPagamento>` : ''}
        <ImportoPagamento>${Number(f.totale).toFixed(2)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
