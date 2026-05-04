// hooks/useCatalogoBoxDoccia.ts
// Hook centralizzato per CRUD del catalogo Box Doccia
'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  Fornitore, Serie, Modello, Finitura, Cristallo, Componente,
} from '@/lib/types/boxdoccia';

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29';

type Tabella =
  | 'boxdoccia_catalogo_fornitore'
  | 'boxdoccia_catalogo_serie'
  | 'boxdoccia_catalogo_modello'
  | 'boxdoccia_catalogo_finitura'
  | 'boxdoccia_catalogo_cristallo'
  | 'boxdoccia_componente';

export function useCatalogoBoxDoccia() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async <T,>(tabella: Tabella, filtri: Record<string, any> = {}): Promise<T[]> => {
    setLoading(true);
    setError(null);
    let q = supabase.from(tabella).select('*').eq('azienda_id', AZIENDA_ID);
    for (const [k, v] of Object.entries(filtri)) q = q.eq(k, v);
    const { data, error } = await q.order('created_at', { ascending: false });
    setLoading(false);
    if (error) { setError(error.message); return []; }
    return (data || []) as T[];
  }, [supabase]);

  const insert = useCallback(async <T,>(tabella: Tabella, payload: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(tabella)
      .insert({ ...payload, azienda_id: AZIENDA_ID })
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return data as T;
  }, [supabase]);

  const update = useCallback(async <T,>(tabella: Tabella, id: string, payload: Partial<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(tabella)
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    setLoading(false);
    if (error) { setError(error.message); return null; }
    return data as T;
  }, [supabase]);

  const remove = useCallback(async (tabella: Tabella, id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.from(tabella).delete().eq('id', id);
    setLoading(false);
    if (error) { setError(error.message); return false; }
    return true;
  }, [supabase]);

  const toggle = useCallback(async (tabella: Tabella, id: string, attivo: boolean): Promise<boolean> => {
    const { error } = await supabase.from(tabella).update({ attivo }).eq('id', id);
    if (error) { setError(error.message); return false; }
    return true;
  }, [supabase]);

  return { loading, error, list, insert, update, remove, toggle };
}

export function useFornitori() {
  const { list, insert, update, remove, toggle, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Fornitore[]>([]);

  const reload = useCallback(async () => {
    const data = await list<Fornitore>('boxdoccia_catalogo_fornitore');
    setItems(data);
  }, [list]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Fornitore>) => { const r = await insert<Fornitore>('boxdoccia_catalogo_fornitore', p); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Fornitore>) => { const r = await update<Fornitore>('boxdoccia_catalogo_fornitore', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_catalogo_fornitore', id); if (ok) reload(); return ok; },
    toggleAttivo: async (id: string, attivo: boolean) => { const ok = await toggle('boxdoccia_catalogo_fornitore', id, attivo); if (ok) reload(); return ok; },
  };
}

export function useSerie(fornitoreId: string | null) {
  const { list, insert, update, remove, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Serie[]>([]);

  const reload = useCallback(async () => {
    if (!fornitoreId) { setItems([]); return; }
    const data = await list<Serie>('boxdoccia_catalogo_serie', { fornitore_id: fornitoreId });
    setItems(data);
  }, [list, fornitoreId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Serie>) => { const r = await insert<Serie>('boxdoccia_catalogo_serie', { ...p, fornitore_id: fornitoreId }); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Serie>) => { const r = await update<Serie>('boxdoccia_catalogo_serie', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_catalogo_serie', id); if (ok) reload(); return ok; },
  };
}

export function useModelli(serieId: string | null) {
  const { list, insert, update, remove, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Modello[]>([]);

  const reload = useCallback(async () => {
    if (!serieId) { setItems([]); return; }
    const data = await list<Modello>('boxdoccia_catalogo_modello', { serie_id: serieId });
    setItems(data);
  }, [list, serieId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Modello>) => { const r = await insert<Modello>('boxdoccia_catalogo_modello', { ...p, serie_id: serieId }); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Modello>) => { const r = await update<Modello>('boxdoccia_catalogo_modello', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_catalogo_modello', id); if (ok) reload(); return ok; },
  };
}

export function useFiniture(fornitoreId: string | null) {
  const { list, insert, update, remove, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Finitura[]>([]);

  const reload = useCallback(async () => {
    if (!fornitoreId) { setItems([]); return; }
    const data = await list<Finitura>('boxdoccia_catalogo_finitura', { fornitore_id: fornitoreId });
    setItems(data);
  }, [list, fornitoreId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Finitura>) => { const r = await insert<Finitura>('boxdoccia_catalogo_finitura', { ...p, fornitore_id: fornitoreId }); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Finitura>) => { const r = await update<Finitura>('boxdoccia_catalogo_finitura', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_catalogo_finitura', id); if (ok) reload(); return ok; },
  };
}

export function useCristalli(fornitoreId: string | null) {
  const { list, insert, update, remove, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Cristallo[]>([]);

  const reload = useCallback(async () => {
    if (!fornitoreId) { setItems([]); return; }
    const data = await list<Cristallo>('boxdoccia_catalogo_cristallo', { fornitore_id: fornitoreId });
    setItems(data);
  }, [list, fornitoreId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Cristallo>) => { const r = await insert<Cristallo>('boxdoccia_catalogo_cristallo', { ...p, fornitore_id: fornitoreId }); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Cristallo>) => { const r = await update<Cristallo>('boxdoccia_catalogo_cristallo', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_catalogo_cristallo', id); if (ok) reload(); return ok; },
  };
}

export function useComponenti(fornitoreId: string | null) {
  const { list, insert, update, remove, loading, error } = useCatalogoBoxDoccia();
  const [items, setItems] = useState<Componente[]>([]);

  const reload = useCallback(async () => {
    const filtri = fornitoreId ? { fornitore_id: fornitoreId } : {};
    const data = await list<Componente>('boxdoccia_componente', filtri);
    setItems(data);
  }, [list, fornitoreId]);

  useEffect(() => { reload(); }, [reload]);

  return {
    items, loading, error, reload,
    create: async (p: Partial<Componente>) => { const r = await insert<Componente>('boxdoccia_componente', { ...p, fornitore_id: fornitoreId }); if (r) reload(); return r; },
    update: async (id: string, p: Partial<Componente>) => { const r = await update<Componente>('boxdoccia_componente', id, p); if (r) reload(); return r; },
    delete: async (id: string) => { const ok = await remove('boxdoccia_componente', id); if (ok) reload(); return ok; },
  };
}
