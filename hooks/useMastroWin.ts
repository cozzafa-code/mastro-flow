// hooks/useMastroWin.ts
// Hook centrale: legge e modifica ferramenta_articoli, ferramenta_cremonesi,
// catalogo_ferramenta, catalogo_ferramenta_dimensioni, catalogo_ferramenta_portate.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  FerramentaArticolo,
  FerramentaCremonese,
  CatalogoFerramenta,
  CatalogoFerramentaDimensione,
  CatalogoFerramentaPortata,
} from '@/lib/types/mastro-win';

interface UseMastroWinReturn {
  // Articoli
  articoli: FerramentaArticolo[];
  loadingArticoli: boolean;
  reloadArticoli: () => Promise<void>;
  saveArticolo: (a: Partial<FerramentaArticolo>) => Promise<{ ok: boolean; error?: string }>;
  deleteArticolo: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Cremonesi
  cremonesi: FerramentaCremonese[];
  loadingCremonesi: boolean;
  reloadCremonesi: () => Promise<void>;
  saveCremonese: (c: Partial<FerramentaCremonese>) => Promise<{ ok: boolean; error?: string }>;
  deleteCremonese: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Catalogo ferramenta (azienda)
  catalogo: CatalogoFerramenta[];
  loadingCatalogo: boolean;
  reloadCatalogo: () => Promise<void>;
  saveCatalogo: (
    c: Partial<CatalogoFerramenta>
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteCatalogo: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Dimensioni / Portate (sotto-tabelle del catalogo)
  dimensioni: CatalogoFerramentaDimensione[];
  portate: CatalogoFerramentaPortata[];
  reloadDimensioniPortate: (ferramenta_id?: string) => Promise<void>;
  saveDimensione: (
    d: Partial<CatalogoFerramentaDimensione>
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteDimensione: (id: string) => Promise<{ ok: boolean; error?: string }>;
  savePortata: (
    p: Partial<CatalogoFerramentaPortata>
  ) => Promise<{ ok: boolean; error?: string }>;
  deletePortata: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useMastroWin(azienda_id: string): UseMastroWinReturn {
  const [articoli, setArticoli] = useState<FerramentaArticolo[]>([]);
  const [loadingArticoli, setLoadingArticoli] = useState(false);

  const [cremonesi, setCremonesi] = useState<FerramentaCremonese[]>([]);
  const [loadingCremonesi, setLoadingCremonesi] = useState(false);

  const [catalogo, setCatalogo] = useState<CatalogoFerramenta[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  const [dimensioni, setDimensioni] = useState<CatalogoFerramentaDimensione[]>([]);
  const [portate, setPortate] = useState<CatalogoFerramentaPortata[]>([]);

  // -------- ARTICOLI --------
  const reloadArticoli = useCallback(async () => {
    setLoadingArticoli(true);
    const { data } = await supabase
      .from('ferramenta_articoli')
      .select('*')
      .order('fornitore')
      .order('sistema')
      .order('categoria')
      .order('codice');
    setArticoli((data ?? []) as FerramentaArticolo[]);
    setLoadingArticoli(false);
  }, []);

  const saveArticolo = useCallback(
    async (a: Partial<FerramentaArticolo>) => {
      const { id, ...rest } = a;
      const op = id
        ? supabase.from('ferramenta_articoli').update(rest).eq('id', id)
        : supabase.from('ferramenta_articoli').insert(rest);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reloadArticoli();
      return { ok: true };
    },
    [reloadArticoli]
  );

  const deleteArticolo = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('ferramenta_articoli')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reloadArticoli();
      return { ok: true };
    },
    [reloadArticoli]
  );

  // -------- CREMONESI --------
  const reloadCremonesi = useCallback(async () => {
    setLoadingCremonesi(true);
    const { data } = await supabase
      .from('ferramenta_cremonesi')
      .select('*')
      .order('fornitore')
      .order('sistema')
      .order('hbb_da');
    setCremonesi((data ?? []) as FerramentaCremonese[]);
    setLoadingCremonesi(false);
  }, []);

  const saveCremonese = useCallback(
    async (c: Partial<FerramentaCremonese>) => {
      const { id, ...rest } = c;
      const op = id
        ? supabase.from('ferramenta_cremonesi').update(rest).eq('id', id)
        : supabase.from('ferramenta_cremonesi').insert(rest);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reloadCremonesi();
      return { ok: true };
    },
    [reloadCremonesi]
  );

  const deleteCremonese = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('ferramenta_cremonesi')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reloadCremonesi();
      return { ok: true };
    },
    [reloadCremonesi]
  );

  // -------- CATALOGO FERRAMENTA --------
  const reloadCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    const { data } = await supabase
      .from('catalogo_ferramenta')
      .select('*')
      .eq('azienda_id', azienda_id)
      .order('codice');
    setCatalogo((data ?? []) as CatalogoFerramenta[]);
    setLoadingCatalogo(false);
  }, [azienda_id]);

  const saveCatalogo = useCallback(
    async (c: Partial<CatalogoFerramenta>) => {
      const { id, ...rest } = c;
      const payload = { ...rest, azienda_id };
      const op = id
        ? supabase.from('catalogo_ferramenta').update(payload).eq('id', id)
        : supabase.from('catalogo_ferramenta').insert(payload);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reloadCatalogo();
      return { ok: true };
    },
    [azienda_id, reloadCatalogo]
  );

  const deleteCatalogo = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('catalogo_ferramenta')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reloadCatalogo();
      return { ok: true };
    },
    [reloadCatalogo]
  );

  // -------- DIMENSIONI / PORTATE --------
  const reloadDimensioniPortate = useCallback(async (ferramenta_id?: string) => {
    let qd = supabase.from('catalogo_ferramenta_dimensioni').select('*');
    let qp = supabase.from('catalogo_ferramenta_portate').select('*');
    if (ferramenta_id) {
      qd = qd.eq('ferramenta_id', ferramenta_id);
      qp = qp.eq('ferramenta_id', ferramenta_id);
    }
    const [{ data: dd }, { data: pp }] = await Promise.all([qd, qp]);
    setDimensioni((dd ?? []) as CatalogoFerramentaDimensione[]);
    setPortate((pp ?? []) as CatalogoFerramentaPortata[]);
  }, []);

  const saveDimensione = useCallback(
    async (d: Partial<CatalogoFerramentaDimensione>) => {
      const { id, ...rest } = d;
      const op = id
        ? supabase
            .from('catalogo_ferramenta_dimensioni')
            .update(rest)
            .eq('id', id)
        : supabase.from('catalogo_ferramenta_dimensioni').insert(rest);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reloadDimensioniPortate(d.ferramenta_id);
      return { ok: true };
    },
    [reloadDimensioniPortate]
  );

  const deleteDimensione = useCallback(
    async (id: string) => {
      const target = dimensioni.find((x) => x.id === id);
      const { error } = await supabase
        .from('catalogo_ferramenta_dimensioni')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reloadDimensioniPortate(target?.ferramenta_id);
      return { ok: true };
    },
    [dimensioni, reloadDimensioniPortate]
  );

  const savePortata = useCallback(
    async (p: Partial<CatalogoFerramentaPortata>) => {
      const { id, ...rest } = p;
      const op = id
        ? supabase.from('catalogo_ferramenta_portate').update(rest).eq('id', id)
        : supabase.from('catalogo_ferramenta_portate').insert(rest);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reloadDimensioniPortate(p.ferramenta_id);
      return { ok: true };
    },
    [reloadDimensioniPortate]
  );

  const deletePortata = useCallback(
    async (id: string) => {
      const target = portate.find((x) => x.id === id);
      const { error } = await supabase
        .from('catalogo_ferramenta_portate')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reloadDimensioniPortate(target?.ferramenta_id);
      return { ok: true };
    },
    [portate, reloadDimensioniPortate]
  );

  // -------- BOOT --------
  useEffect(() => {
    reloadArticoli();
    reloadCremonesi();
    reloadCatalogo();
  }, [reloadArticoli, reloadCremonesi, reloadCatalogo]);

  return {
    articoli,
    loadingArticoli,
    reloadArticoli,
    saveArticolo,
    deleteArticolo,
    cremonesi,
    loadingCremonesi,
    reloadCremonesi,
    saveCremonese,
    deleteCremonese,
    catalogo,
    loadingCatalogo,
    reloadCatalogo,
    saveCatalogo,
    deleteCatalogo,
    dimensioni,
    portate,
    reloadDimensioniPortate,
    saveDimensione,
    deleteDimensione,
    savePortata,
    deletePortata,
  };
}
