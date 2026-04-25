"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export interface TuOperatore {
  id?: string;
  user_id?: string;
  azienda_id?: string;
  nome?: string | null;
  cognome?: string | null;
  ruolo?: string | null;
  telefono?: string | null;
  avatar_url?: string | null;
}

export interface TuAzienda {
  id?: string;
  nome?: string | null;
  partita_iva?: string | null;
  sede?: string | null;
  sdi?: string | null;
  logo_url?: string | null;
}

export interface TuAbbonamento {
  id?: string;
  piano: string;
  stato: string;
  prezzo_mensile_cents?: number;
  trial_fine?: string | null;
  prossimo_addebito?: string | null;
  stripe_customer_id?: string | null;
}

export interface TuDati {
  email: string;
  operatore: TuOperatore;
  azienda: TuAzienda;
  abbonamento: TuAbbonamento;
}

export interface TuPreferenze {
  user_id?: string;
  notif_mail_clienti?: boolean;
  notif_vocali_whatsapp?: boolean;
  notif_risposte_preventivi?: boolean;
  notif_listini_fornitori?: boolean;
  notif_recensioni_google?: boolean;
  notif_eventi_calendario?: boolean;
  ndd_inizio?: string;
  ndd_fine?: string;
  ndd_attivo?: boolean;
}

export type ServizioInt = "whatsapp" | "gmail" | "gcal" | "greviews" | "stripe";

export interface TuIntegrazione {
  id: string;
  servizio: ServizioInt;
  stato: "connesso" | "disconnesso" | "errore";
  account_label?: string | null;
  ultima_sync?: string | null;
  errore_msg?: string | null;
}

interface UseTuResult {
  loading: boolean;
  dati: TuDati | null;
  refetch: () => Promise<void>;
  aggiornaProfilo: (input: { nome?: string; cognome?: string; telefono?: string; ruolo?: string }) => Promise<boolean>;
  aggiornaAzienda: (input: { nome?: string; partita_iva?: string; sede?: string; sdi?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  preferenze: TuPreferenze | null;
  integrazioni: TuIntegrazione[];
  togglePreferenza: (key: keyof TuPreferenze, value: boolean | string) => Promise<void>;
  toggleIntegrazione: (servizio: ServizioInt) => Promise<void>;
  cambiaPassword: (email: string) => Promise<boolean>;
  esportaGDPR: () => Promise<string | null>;
  richiediCancellazione: (motivo?: string) => Promise<boolean>;
}

export function useTu(): UseTuResult {
  const [loading, setLoading] = useState(true);
  const [dati, setDati] = useState<TuDati | null>(null);
  const [preferenze, setPreferenze] = useState<TuPreferenze | null>(null);
  const [integrazioni, setIntegrazioni] = useState<TuIntegrazione[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) { setDati(null); setLoading(false); return; }
      const { data, error } = await supabase.rpc("tu_dati", { p_user_id: user.id });
      if (error) console.error("[tu_dati]", error);
      setDati(data as TuDati ?? null);

      // preferenze + integrazioni
      const pi = await supabase.rpc("tu_preferenze_integrazioni", { p_user_id: user.id });
      if (pi.error) console.error("[tu_pref_int]", pi.error);
      const piData = (pi.data ?? {}) as { preferenze?: TuPreferenze; integrazioni?: TuIntegrazione[] };
      setPreferenze(piData.preferenze ?? null);
      setIntegrazioni(piData.integrazioni ?? []);
    } catch (e) {
      console.error("[useTu] fetch", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const aggiornaProfilo = useCallback(async (input: { nome?: string; cognome?: string; telefono?: string; ruolo?: string }): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("tu_aggiorna_profilo", {
        p_nome: input.nome ?? null,
        p_cognome: input.cognome ?? null,
        p_telefono: input.telefono ?? null,
        p_ruolo: input.ruolo ?? null,
      });
      if (error) { console.error("[aggiornaProfilo]", error); return false; }
      fetchAll();
      return (data as any)?.ok === true;
    } catch (e) { console.error("[aggiornaProfilo] catch", e); return false; }
  }, [fetchAll]);

  const aggiornaAzienda = useCallback(async (input: { nome?: string; partita_iva?: string; sede?: string; sdi?: string }): Promise<boolean> => {
    try {
      if (!dati?.azienda?.id) return false;
      const updates: Record<string, any> = {};
      if (input.nome !== undefined) updates.nome = input.nome;
      if (input.partita_iva !== undefined) updates.partita_iva = input.partita_iva;
      if (input.sede !== undefined) updates.sede = input.sede;
      if (input.sdi !== undefined) updates.sdi = input.sdi;
      const { error } = await supabase.from("aziende").update(updates).eq("id", dati.azienda.id);
      if (error) { console.error("[aggiornaAzienda]", error); return false; }
      fetchAll();
      return true;
    } catch (e) { console.error("[aggiornaAzienda] catch", e); return false; }
  }, [dati, fetchAll]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const togglePreferenza = useCallback(async (key: keyof TuPreferenze, value: boolean | string) => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return;
      // upsert
      const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
      const azienda_id = opRes.data?.azienda_id;
      const existing = await supabase.from("user_preferenze").select("user_id").eq("user_id", user.id).maybeSingle();
      if (existing.data) {
        await supabase.from("user_preferenze").update({ [key]: value, updated_at: new Date().toISOString() }).eq("user_id", user.id);
      } else {
        await supabase.from("user_preferenze").insert({ user_id: user.id, azienda_id, [key]: value });
      }
      fetchAll();
    } catch (e) { console.error("[togglePreferenza]", e); }
  }, [fetchAll]);

  const toggleIntegrazione = useCallback(async (servizio: ServizioInt) => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return;
      const cur = integrazioni.find((i) => i.servizio === servizio);
      const nuovoStato = cur?.stato === "connesso" ? "disconnesso" : "connesso";
      // segno OAuth come "in arrivo" · per ora solo flip stato (fake connect)
      if (cur) {
        await supabase.from("user_integrazioni").update({
          stato: nuovoStato,
          account_label: nuovoStato === "connesso" ? "test@example.com" : null,
          ultima_sync: nuovoStato === "connesso" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq("id", cur.id);
      } else {
        const opRes = await supabase.from("operatori").select("azienda_id").eq("user_id", user.id).maybeSingle();
        await supabase.from("user_integrazioni").insert({
          user_id: user.id, azienda_id: opRes.data?.azienda_id,
          servizio, stato: nuovoStato,
        });
      }
      fetchAll();
    } catch (e) { console.error("[toggleIntegrazione]", e); }
  }, [integrazioni, fetchAll]);

  const cambiaPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      if (error) { console.error("[cambiaPassword]", error); return false; }
      return true;
    } catch (e) { console.error("[cambiaPassword] catch", e); return false; }
  }, []);

  const esportaGDPR = useCallback(async (): Promise<string | null> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return null;
      const { data, error } = await supabase.rpc("tu_export_gdpr", { p_user_id: user.id });
      if (error) { console.error("[esportaGDPR]", error); return null; }
      return JSON.stringify(data, null, 2);
    } catch (e) { console.error("[esportaGDPR] catch", e); return null; }
  }, []);

  const richiediCancellazione = useCallback(async (motivo?: string): Promise<boolean> => {
    try {
      const userRes = await supabase.auth.getUser();
      const user = userRes.data.user;
      if (!user) return false;
      const { error } = await supabase.from("account_deletion_requests").insert({
        user_id: user.id, email: user.email, motivo: motivo ?? null,
      });
      if (error) { console.error("[richiediCancellazione]", error); return false; }
      return true;
    } catch (e) { console.error("[richiediCancellazione] catch", e); return false; }
  }, []);

  return { loading, dati, preferenze, integrazioni, refetch: fetchAll, aggiornaProfilo, aggiornaAzienda, signOut, togglePreferenza, toggleIntegrazione, cambiaPassword, esportaGDPR, richiediCancellazione };
}
