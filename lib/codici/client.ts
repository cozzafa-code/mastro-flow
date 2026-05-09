import { createClient } from '@supabase/supabase-js';
import type { NextAction, DeviceInfo, Ruolo } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const codiciClient = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: false }
});

export async function risolviNextAction(
  short: string,
  ruolo: Ruolo,
  geo?: { lat: number; lng: number }
): Promise<NextAction> {
  const { data, error } = await codiciClient.rpc('risolvi_next_action', {
    p_short: short,
    p_ruolo: ruolo,
    p_geo_lat: geo?.lat ?? null,
    p_geo_lng: geo?.lng ?? null,
  });
  if (error) throw error;
  return data as NextAction;
}

export async function registraEvento(params: {
  short: string;
  tipo_evento: string;
  ruolo: Ruolo;
  device?: DeviceInfo;
  geo?: { lat: number; lng: number; accuracy?: number };
  payload?: Record<string, any>;
}) {
  const { data, error } = await codiciClient.rpc('registra_evento', {
    p_short: params.short,
    p_tipo_evento: params.tipo_evento,
    p_ruolo: params.ruolo,
    p_device: params.device ?? {},
    p_geo_lat: params.geo?.lat ?? null,
    p_geo_lng: params.geo?.lng ?? null,
    p_geo_accuracy: params.geo?.accuracy ?? null,
    p_payload: params.payload ?? {},
  });
  if (error) throw error;
  return data;
}
