"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP - useRealtimeCommessa (v2)
// Sottoscrive Supabase Realtime + mappa snake_case (DB) a camelCase (UI)
// 
// FIX v2: il DB usa totale_preventivo/totale_finale ma l'UI legge
// totalePreventivo/totaleFinale. Senza mapping, la UI restava a 0.
// ================================================================
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

let sharedClient: any = null;
function getClient() {
  if (!sharedClient) {
    sharedClient = createClient(supabaseUrl, supabaseKey, {
      realtime: { params: { eventsPerSecond: 10 } }
    });
  }
  return sharedClient;
}

// [v2] Mappa record DB (snake_case) a forma UI (camelCase)
function mapDbToUi(row: any): any {
  if (!row) return row;
  return {
    ...row,
    totalePreventivo: row.totale_preventivo ?? row.totalePreventivo,
    totaleFinale: row.totale_finale ?? row.totaleFinale,
    scontoPerc: row.sconto_perc ?? row.scontoPerc,
    preventivoInviatoAt: row.preventivo_inviato_at ?? row.preventivoInviatoAt,
    preventivoInviato: !!(row.preventivo_inviato_at || row.preventivoInviato),
    confermaOrdineInviataAt: row.conferma_ordine_inviata_at ?? row.confermaOrdineInviataAt,
    confermaOrdineFirmataAt: row.conferma_ordine_firmata_at ?? row.confermaOrdineFirmataAt,
    fatturaAccontoPagataAt: row.fattura_acconto_pagata_at ?? row.fatturaAccontoPagataAt,
    materialeOrdinatoAt: row.materiale_ordinato_at ?? row.materialeOrdinatoAt,
    materiale_ordinato_at: row.materiale_ordinato_at ?? row.materialeOrdinatoAt,
    materialeArrivatoAt: row.materiale_arrivato_at ?? row.materialeArrivatoAt,
    materiale_arrivato_at: row.materiale_arrivato_at ?? row.materialeArrivatoAt,
    produzioneCompletataAt: row.produzione_completata_at ?? row.produzioneCompletataAt,
    montaggioCompletatoAt: row.montaggio_completato_at ?? row.montaggioCompletatoAt,
    fatturaSaldoPagataAt: row.fattura_saldo_pagata_at ?? row.fatturaSaldoPagataAt,
    faseStart: row.fase_start ?? row.faseStart,
    firmaCliente: row.firma_cliente ?? row.firmaCliente,
    firmaData: row.firma_data ?? row.firmaData,
    pianoEdificio: row.piano_edificio ?? row.pianoEdificio,
    motivoFerma: row.motivo_ferma ?? row.motivoFerma,
  };
}

type Callback = (commessa: any) => void;

export function useRealtimeCommessa(commessaId: string | null | undefined, onUpdate: Callback) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!commessaId || !supabaseUrl || !supabaseKey) return;

    const sb = getClient();
    const channelName = `commessa:${commessaId}`;
    console.log("[useRealtimeCommessa v2] subscribe", channelName);

    const channel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commesse", filter: `id=eq.${commessaId}` },
        (payload: any) => {
          const mapped = mapDbToUi(payload.new);
          console.log("[useRealtimeCommessa v2] commessa UPDATE", {
            totale_finale: payload.new?.totale_finale,
            totalePreventivo: mapped.totalePreventivo,
            fase: mapped.fase,
          });
          callbackRef.current(mapped);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "firma_tokens", filter: `commessa_id=eq.${commessaId}` },
        async (payload: any) => {
          if (payload.new?.stato === "firmato") {
            console.log("[useRealtimeCommessa v2] firma_token firmato → rilettura commessa");
            const { data } = await sb.from("commesse").select("*").eq("id", commessaId).maybeSingle();
            if (data) callbackRef.current(mapDbToUi(data));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fin_fatture_emesse", filter: `commessa_id=eq.${commessaId}` },
        async (payload: any) => {
          console.log("[useRealtimeCommessa v2] fattura change", payload.new?.stato);
          const { data } = await sb.from("commesse").select("*").eq("id", commessaId).maybeSingle();
          if (data) callbackRef.current(mapDbToUi(data));
        }
      )
      .subscribe((status: string) => {
        console.log("[useRealtimeCommessa v2] status:", status);
      });

    return () => {
      console.log("[useRealtimeCommessa v2] unsubscribe", channelName);
      try { sb.removeChannel(channel); } catch {}
    };
  }, [commessaId]);
}
