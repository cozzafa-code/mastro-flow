"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP - useRealtimeCommessa (v1)
// Sottoscrive Supabase Realtime per ricevere aggiornamenti
// in tempo reale su una commessa specifica.
// 
// QUANDO TRIGGERA: cliente firma da link pubblico, fattura segnata
// pagata da contabilita', cambio fase da trigger DB, qualsiasi
// UPDATE sulla commessa.
//
// USO:
//   useRealtimeCommessa(commessaId, (commessaAggiornata) => {
//     setSelectedCM(commessaAggiornata)
//   })
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

type Callback = (commessa: any) => void;

export function useRealtimeCommessa(commessaId: string | null | undefined, onUpdate: Callback) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!commessaId || !supabaseUrl || !supabaseKey) return;

    const sb = getClient();
    const channelName = `commessa:${commessaId}`;
    console.log("[useRealtimeCommessa] subscribe", channelName);

    const channel = sb
      .channel(channelName)
      // 1. Update diretti sulla commessa (fase, firma, fatture pagate)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commesse",
          filter: `id=eq.${commessaId}`,
        },
        (payload: any) => {
          console.log("[useRealtimeCommessa] commessa UPDATE", payload.new);
          callbackRef.current(payload.new);
        }
      )
      // 2. Nuova firma_token firmata (cliente firma da link pubblico)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "firma_tokens",
          filter: `commessa_id=eq.${commessaId}`,
        },
        async (payload: any) => {
          if (payload.new?.stato === "firmato") {
            console.log("[useRealtimeCommessa] firma_token firmato → rilettura commessa");
            // Rilegge commessa per avere lo stato post-trigger
            const { data } = await sb.from("commesse").select("*").eq("id", commessaId).maybeSingle();
            if (data) callbackRef.current(data);
          }
        }
      )
      // 3. Fatture pagate (segna pagata da contabilita')
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fin_fatture_emesse",
          filter: `commessa_id=eq.${commessaId}`,
        },
        async (payload: any) => {
          console.log("[useRealtimeCommessa] fattura change", payload.new?.stato);
          const { data } = await sb.from("commesse").select("*").eq("id", commessaId).maybeSingle();
          if (data) callbackRef.current(data);
        }
      )
      .subscribe((status: string) => {
        console.log("[useRealtimeCommessa] status:", status);
      });

    return () => {
      console.log("[useRealtimeCommessa] unsubscribe", channelName);
      try { sb.removeChannel(channel); } catch {}
    };
  }, [commessaId]);
}
